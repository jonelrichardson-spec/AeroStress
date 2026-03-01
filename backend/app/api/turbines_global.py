"""
GET /turbines - returns all turbines with coordinates for dashboard.
"""

from typing import List

from fastapi import APIRouter, Query

from app.db import get_supabase
from app.models.schemas import TurbineListItem

router = APIRouter(prefix="/turbines", tags=["turbines"])


@router.get("", response_model=List[TurbineListItem])
def list_turbines(
    limit: int = Query(default=500, le=1000, description="Max turbines to return"),
    offset: int = Query(default=0, ge=0),
):
    """
    List turbines with GPS coordinates and model specs.
    For dashboard display and map visualization.
    """
    supabase = get_supabase()
    result = (
        supabase.table("turbines")
        .select(
            "id, case_id, latitude, longitude, model, manufacturer, capacity_kw, "
            "year_operational, calendar_age_years, project_name, state"
        )
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    turbines = result.data or []

    # Join stress_calculations for true_age and terrain_class
    if turbines:
        ids = [t["id"] for t in turbines]
        stress_res = (
            supabase.table("stress_calculations")
            .select("turbine_id, true_age_years, terrain_class")
            .in_("turbine_id", ids)
            .execute()
        )
        stress_map = {(s["turbine_id"]): s for s in (stress_res.data or [])}
        for t in turbines:
            s = stress_map.get(t["id"], {})
            t["true_age_years"] = s.get("true_age_years")
            t["terrain_class"] = s.get("terrain_class")

    return turbines
