from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from app.db import get_supabase
from app.models.schemas import Fleet, FleetCreate, TurbineListItem
from app.services.pdf_reports import build_critical_action_pdf

router = APIRouter(prefix="/fleets", tags=["fleets"])


@router.post("", response_model=Fleet)
def create_fleet(body: FleetCreate):
    supabase = get_supabase()
    result = (
        supabase.table("fleets")
        .insert({"name": body.name})
        .execute()
    )
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create fleet")
    row = dict(result.data[0])
    # Normalize: some DB schemas omit updated_at
    if row.get("updated_at") is None and row.get("created_at") is not None:
        row["updated_at"] = row["created_at"]
    return row


@router.get("/{fleet_id}", response_model=Fleet)
def get_fleet(fleet_id: UUID):
    supabase = get_supabase()
    result = (
        supabase.table("fleets")
        .select("*")
        .eq("id", str(fleet_id))
        .execute()
    )
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="Fleet not found")
    row = dict(result.data[0])
    if row.get("updated_at") is None and row.get("created_at") is not None:
        row["updated_at"] = row["created_at"]
    return row


@router.get("/{fleet_id}/critical-action", response_model=List[TurbineListItem])
def get_critical_action(
    fleet_id: UUID,
    top_percent: float = Query(default=5.0, ge=1, le=50, description="Top N% by risk (true age)"),
):
    """
    Turbines in the top N% by risk (true_age_years) for this fleet.
    Used for Critical Action Report (e.g. top 5% at risk of catastrophic failure).
    """
    supabase = get_supabase()
    result = (
        supabase.table("turbines")
        .select("id, case_id, latitude, longitude, model, manufacturer, capacity_kw, "
                "year_operational, calendar_age_years, project_name, state")
        .eq("fleet_id", str(fleet_id))
        .execute()
    )
    turbines = result.data or []
    if not turbines:
        return []
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
    turbines.sort(key=lambda x: x.get("true_age_years") or 0, reverse=True)
    n = max(1, int(len(turbines) * (top_percent / 100.0)))
    return turbines[:n]


@router.get("/{fleet_id}/critical-action/report")
def get_critical_action_report_pdf(
    fleet_id: UUID,
    top_percent: float = Query(default=5.0, ge=1, le=50),
):
    """Download Critical Action Report as PDF (top N% at-risk turbines)."""
    supabase = get_supabase()
    fleet_res = supabase.table("fleets").select("name").eq("id", str(fleet_id)).execute()
    if not fleet_res.data or len(fleet_res.data) == 0:
        raise HTTPException(status_code=404, detail="Fleet not found")
    fleet_name = fleet_res.data[0].get("name") or "Fleet"
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
        turbines.sort(key=lambda x: x.get("true_age_years") or 0, reverse=True)
        n = max(1, int(len(turbines) * (top_percent / 100.0)))
        turbines = turbines[:n]
    pdf_buf = build_critical_action_pdf(turbines, fleet_name)
    return Response(
        content=pdf_buf.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=critical-action-report.pdf"},
    )


@router.get("/{fleet_id}/projected-savings")
def get_projected_savings(
    fleet_id: UUID,
    annual_om_per_turbine: float = Query(..., ge=0, description="Current annual O&M cost per turbine (e.g. USD)"),
):
    """
    P1: Simple projected savings / ROI message for reallocating O&M to high-risk turbines.
    Uses fleet stress distribution; no dollar guarantees (per PRD).
    """
    supabase = get_supabase()
    result = (
        supabase.table("turbines")
        .select("id")
        .eq("fleet_id", str(fleet_id))
        .execute()
    )
    turbines = result.data or []
    if not turbines:
        return {
            "fleet_id": str(fleet_id),
            "message": "No turbines in this fleet. Add turbines to see projected savings.",
            "recommended_reallocation_percent": 0,
        }
    stress_res = (
        supabase.table("stress_calculations")
        .select("turbine_id, true_age_years")
        .in_("turbine_id", [t["id"] for t in turbines])
        .execute()
    )
    stress_map = {s["turbine_id"]: s.get("true_age_years") or 0 for s in (stress_res.data or [])}
    true_ages = [stress_map.get(t["id"], 0) for t in turbines]
    true_ages.sort(reverse=True)
    n_high = max(1, int(len(true_ages) * 0.2))  # top 20%
    high_risk_count = n_high
    total_turbines = len(turbines)
    realloc_pct = min(30, max(10, 10 + (high_risk_count * 2)))  # 10–30% based on high-risk count
    return {
        "fleet_id": str(fleet_id),
        "annual_om_per_turbine": annual_om_per_turbine,
        "total_turbines": total_turbines,
        "high_risk_turbines_top_20pct": high_risk_count,
        "recommended_reallocation_percent": realloc_pct,
        "message": (
            f"Reallocating {realloc_pct}% of O&M to the top {high_risk_count} high-stress turbine(s) "
            f"(by True Age) could reduce catastrophic failure risk. "
            "Prioritize inspections and repairs on these units. Financial projections are indicative (MVP)."
        ),
    }


@router.get("/{fleet_id}/blind-spots", response_model=List[TurbineListItem])
def get_blind_spots(
    fleet_id: UUID,
    high_stress_percent: float = Query(default=20.0, ge=5, le=50, description="Consider top N% true_age as high stress"),
):
    """
    Sensor blind spots: high-stress turbines with no submitted inspection.
    High stress = in top N% by true_age OR terrain complex/coastal.
    """
    supabase = get_supabase()
    result = (
        supabase.table("turbines")
        .select("id, case_id, latitude, longitude, model, manufacturer, capacity_kw, "
                "year_operational, calendar_age_years, project_name, state")
        .eq("fleet_id", str(fleet_id))
        .execute()
    )
    turbines = result.data or []
    if not turbines:
        return []
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
    insp = (
        supabase.table("inspections")
        .select("turbine_id")
        .eq("status", "submitted")
        .in_("turbine_id", [t["id"] for t in turbines])
        .execute()
    )
    inspected_ids = {r["turbine_id"] for r in (insp.data or [])}
    turbines.sort(key=lambda x: x.get("true_age_years") or 0, reverse=True)
    n_high = max(1, int(len(turbines) * (high_stress_percent / 100.0)))
    high_stress_ids = {t["id"] for t in turbines[:n_high]}
    for t in turbines:
        if t.get("terrain_class") in ("complex", "coastal"):
            high_stress_ids.add(t["id"])
    out = [t for t in turbines if t["id"] in high_stress_ids and t["id"] not in inspected_ids]
    out.sort(key=lambda x: x.get("true_age_years") or 0, reverse=True)
    return out
