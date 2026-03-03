from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.db import get_supabase
from app.models.schemas import TurbineCreate, TurbineListItem
from app.services.stress import compute_true_age

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
            .select("turbine_id, true_age_years, terrain_class")
            .in_("turbine_id", [t["id"] for t in turbines])
            .execute()
        )
        stress_map = {s["turbine_id"]: s for s in (stress_res.data or [])}
        for t in turbines:
            s = stress_map.get(t["id"], {})
            t["true_age_years"] = s.get("true_age_years")
            t["terrain_class"] = s.get("terrain_class")
    if sort == "stress":
        turbines.sort(key=lambda x: x.get("true_age_years") or 0, reverse=True)
    elif sort == "calendar":
        turbines.sort(key=lambda x: x.get("calendar_age_years") or 0, reverse=True)
    return turbines
