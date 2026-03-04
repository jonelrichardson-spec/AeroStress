import csv
import io
from typing import List
from uuid import UUID

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from app.db import get_supabase
from app.models.schemas import CsvImportResult, TurbineCreate, TurbineListItem
from app.services.stress import apply_stress_overrides, compute_true_age

router = APIRouter(prefix="/fleets/{fleet_id}/turbines", tags=["fleet-turbines"])


@router.post("", response_model=TurbineListItem)
def create_turbine(fleet_id: UUID, body: TurbineCreate):
    """Add a turbine to a fleet (user-created turbines, not USWTDB seed)."""
    supabase = get_supabase()
    calendar_age = body.get_calendar_age_years()
    terrain_class, multiplier, true_age = compute_true_age(
        calendar_age,
        latitude=body.latitude,
        longitude=body.longitude,
    )
    row = {
        "fleet_id": str(fleet_id),
        "latitude": body.latitude,
        "longitude": body.longitude,
        "model": body.model,
        "calendar_age_years": calendar_age,
    }
    result = supabase.table("turbines").insert(row).execute()
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create turbine")
    turbine = result.data[0]
    # Insert stress_calculations
    tc_res = supabase.table("terrain_classifications").select("id").eq("class_name", terrain_class).execute()
    tc_id = tc_res.data[0]["id"] if tc_res.data else None
    supabase.table("stress_calculations").insert({
        "turbine_id": turbine["id"],
        "terrain_classification_id": tc_id,
        "terrain_class": terrain_class,
        "stress_multiplier": multiplier,
        "calendar_age_years": calendar_age,
        "true_age_years": true_age,
    }).execute()
    turbine["true_age_years"] = true_age
    turbine["terrain_class"] = terrain_class
    turbine["stress_multiplier"] = multiplier
    return turbine


@router.get("", response_model=List[TurbineListItem])
def list_fleet_turbines(
    fleet_id: UUID,
    sort: str = Query(default="stress", description="stress | calendar | id"),
):
    """List turbines in a fleet, sorted by stress (true_age) by default."""
    supabase = get_supabase()
    result = (
        supabase.table("turbines")
        .select("id, case_id, latitude, longitude, model, manufacturer, capacity_kw, "
                "year_operational, calendar_age_years, project_name, state")
        .eq("fleet_id", str(fleet_id))
        .execute()
    )
    turbines = result.data or []
    if turbines:
        stress_res = (
            supabase.table("stress_calculations")
            .select("turbine_id, true_age_years, terrain_class, stress_multiplier")
            .in_("turbine_id", [t["id"] for t in turbines])
            .execute()
        )
        stress_map = {s["turbine_id"]: s for s in (stress_res.data or [])}
        for t in turbines:
            s = stress_map.get(t["id"], {})
            t["true_age_years"] = s.get("true_age_years")
            t["terrain_class"] = s.get("terrain_class")
            t["stress_multiplier"] = s.get("stress_multiplier")
        apply_stress_overrides(supabase, turbines)
    if sort == "stress":
        turbines.sort(key=lambda x: x.get("true_age_years") or 0, reverse=True)
    elif sort == "calendar":
        turbines.sort(key=lambda x: x.get("calendar_age_years") or 0, reverse=True)
    return turbines


@router.post("/import-csv", response_model=CsvImportResult)
def import_turbines_csv(fleet_id: UUID, file: UploadFile = File(...)):
    """
    Import turbines from CSV. Required columns: latitude, longitude; and either
    year_operational or calendar_age_years. Optional: model.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a CSV file")
    content = file.file.read()
    try:
        text = content.decode("utf-8")
    except Exception:
        raise HTTPException(status_code=400, detail="CSV must be UTF-8")
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV must have a header row")
    # Normalize column names (strip, lower)
    fieldnames = [f.strip().lower().replace(" ", "_") for f in reader.fieldnames]
    created = 0
    failed = 0
    errors = []
    turbines_out = []
    supabase = get_supabase()
    for i, row in enumerate(reader):
        if not row or not any(str(v).strip() for v in row.values()):
            continue
        d = {fieldnames[j]: (v.strip() if isinstance(v, str) else v) for j, v in enumerate(row.values())}
        try:
            lat = float(d.get("latitude", d.get("lat", "")))
            lon = float(d.get("longitude", d.get("lon", d.get("lng", ""))))
        except (TypeError, ValueError):
            errors.append(f"Row {i + 2}: invalid latitude/longitude")
            failed += 1
            continue
        year_op = d.get("year_operational") or d.get("year")
        if year_op is not None and year_op != "":
            try:
                year_op = int(float(year_op))
            except (TypeError, ValueError):
                year_op = None
        cal_age = d.get("calendar_age_years")
        if cal_age is not None and cal_age != "":
            try:
                cal_age = float(cal_age)
            except (TypeError, ValueError):
                cal_age = None
        if year_op is None and cal_age is None:
            errors.append(f"Row {i + 2}: provide year_operational or calendar_age_years")
            failed += 1
            continue
        if cal_age is None and year_op is not None:
            cal_age = max(0.0, 2025 - year_op)
        model = d.get("model") or None
        if model == "":
            model = None
        try:
            terrain_class, multiplier, true_age = compute_true_age(
                cal_age, latitude=lat, longitude=lon
            )
        except Exception as e:
            errors.append(f"Row {i + 2}: {str(e)}")
            failed += 1
            continue
        row_insert = {
            "fleet_id": str(fleet_id),
            "latitude": lat,
            "longitude": lon,
            "model": model,
            "calendar_age_years": cal_age,
        }
        if year_op is not None:
            row_insert["year_operational"] = year_op
        result = supabase.table("turbines").insert(row_insert).execute()
        if not result.data or len(result.data) == 0:
            errors.append(f"Row {i + 2}: insert failed")
            failed += 1
            continue
        turbine = result.data[0]
        tc_res = supabase.table("terrain_classifications").select("id").eq("class_name", terrain_class).execute()
        tc_id = tc_res.data[0]["id"] if tc_res.data else None
        supabase.table("stress_calculations").insert({
            "turbine_id": turbine["id"],
            "terrain_classification_id": tc_id,
            "terrain_class": terrain_class,
            "stress_multiplier": multiplier,
            "calendar_age_years": cal_age,
            "true_age_years": true_age,
        }).execute()
        turbine["true_age_years"] = true_age
        turbine["terrain_class"] = terrain_class
        turbine["stress_multiplier"] = multiplier
        turbines_out.append(turbine)
        created += 1
    return CsvImportResult(created=created, failed=failed, errors=errors, turbines=turbines_out)
