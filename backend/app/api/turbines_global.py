"""
GET /turbines - returns all turbines with coordinates for dashboard.
GET /turbines/{id} - returns a single turbine by ID.
GET /turbines/{id}/failure-predictions - static failure-mode suggestions.
GET /turbines/{id}/inspections - list inspections for turbine.
POST /turbines/{id}/inspections - create inspection (draft).
"""

from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.db import get_supabase
from app.models.schemas import Inspection, InspectionCreate, TurbineListItem
from app.services.failure_predictions import get_failure_predictions
from app.services.stress_explanation import get_stress_explanation

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

    # Join stress_calculations for true_age, terrain_class, stress_multiplier
    if turbines:
        ids = [t["id"] for t in turbines]
        stress_res = (
            supabase.table("stress_calculations")
            .select("turbine_id, true_age_years, terrain_class, stress_multiplier")
            .in_("turbine_id", ids)
            .execute()
        )
        stress_map = {(s["turbine_id"]): s for s in (stress_res.data or [])}
        for t in turbines:
            s = stress_map.get(t["id"], {})
            t["true_age_years"] = s.get("true_age_years")
            t["terrain_class"] = s.get("terrain_class")
            t["stress_multiplier"] = s.get("stress_multiplier")

    return turbines


@router.get("/{turbine_id}", response_model=TurbineListItem)
def get_turbine(turbine_id: UUID):
    """Return a single turbine by ID with stress/terrain data. 404 if not found."""
    supabase = get_supabase()
    result = (
        supabase.table("turbines")
        .select(
            "id, case_id, latitude, longitude, model, manufacturer, capacity_kw, "
            "year_operational, calendar_age_years, project_name, state"
        )
        .eq("id", str(turbine_id))
        .execute()
    )
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="Turbine not found")
    turbine = dict(result.data[0])
    stress_res = (
        supabase.table("stress_calculations")
        .select("true_age_years, terrain_class, stress_multiplier")
        .eq("turbine_id", str(turbine_id))
        .execute()
    )
    if stress_res.data and len(stress_res.data) > 0:
        s = stress_res.data[0]
        turbine["true_age_years"] = s.get("true_age_years")
        turbine["terrain_class"] = s.get("terrain_class")
        turbine["stress_multiplier"] = s.get("stress_multiplier")
    return turbine


@router.get("/{turbine_id}/stress-explanation")
def get_turbine_stress_explanation(turbine_id: UUID):
    """P1: Plain-language explanation of stress (e.g. structural wear of X-year-old unit in IEC class)."""
    supabase = get_supabase()
    t_res = (
        supabase.table("turbines")
        .select("id, calendar_age_years")
        .eq("id", str(turbine_id))
        .execute()
    )
    if not t_res.data or len(t_res.data) == 0:
        raise HTTPException(status_code=404, detail="Turbine not found")
    turbine = t_res.data[0]
    s_res = (
        supabase.table("stress_calculations")
        .select("true_age_years, terrain_class")
        .eq("turbine_id", str(turbine_id))
        .execute()
    )
    true_age = None
    terrain_class = None
    if s_res.data and len(s_res.data) > 0:
        true_age = s_res.data[0].get("true_age_years")
        terrain_class = s_res.data[0].get("terrain_class")
    cal_age = turbine.get("calendar_age_years") or 0
    explanation = get_stress_explanation(
        true_age or cal_age,
        cal_age,
        terrain_class,
    )
    return {"turbine_id": str(turbine_id), "explanation": explanation}


@router.get("/{turbine_id}/failure-predictions")
def list_failure_predictions(turbine_id: UUID):
    """Static, rules-based failure-mode suggestions for this turbine (P0)."""
    supabase = get_supabase()
    t_res = (
        supabase.table("turbines")
        .select("id, calendar_age_years")
        .eq("id", str(turbine_id))
        .execute()
    )
    if not t_res.data or len(t_res.data) == 0:
        raise HTTPException(status_code=404, detail="Turbine not found")
    turbine = t_res.data[0]
    s_res = (
        supabase.table("stress_calculations")
        .select("true_age_years, terrain_class")
        .eq("turbine_id", str(turbine_id))
        .execute()
    )
    true_age = None
    terrain_class = None
    if s_res.data and len(s_res.data) > 0:
        true_age = s_res.data[0].get("true_age_years")
        terrain_class = s_res.data[0].get("terrain_class")
    cal_age = turbine.get("calendar_age_years") or 0
    predictions = get_failure_predictions(
        terrain_class or "flat",
        true_age or cal_age,
        cal_age,
    )
    return {"turbine_id": str(turbine_id), "predictions": predictions}


@router.get("/{turbine_id}/inspections", response_model=List[Inspection])
def list_turbine_inspections(turbine_id: UUID):
    """List inspections for this turbine (newest first)."""
    supabase = get_supabase()
    # Verify turbine exists
    t_res = supabase.table("turbines").select("id").eq("id", str(turbine_id)).execute()
    if not t_res.data or len(t_res.data) == 0:
        raise HTTPException(status_code=404, detail="Turbine not found")
    result = (
        supabase.table("inspections")
        .select("*")
        .eq("turbine_id", str(turbine_id))
        .order("conducted_at", desc=True)
        .execute()
    )
    rows = result.data or []
    for r in rows:
        if r.get("updated_at") is None and r.get("created_at") is not None:
            r["updated_at"] = r["created_at"]
    return rows


@router.post("/{turbine_id}/inspections", response_model=Inspection)
def create_inspection(turbine_id: UUID, body: InspectionCreate):
    """Create a draft inspection for this turbine."""
    supabase = get_supabase()
    t_res = supabase.table("turbines").select("id").eq("id", str(turbine_id)).execute()
    if not t_res.data or len(t_res.data) == 0:
        raise HTTPException(status_code=404, detail="Turbine not found")
    row = {
        "turbine_id": str(turbine_id),
        "inspector_name": body.inspector_name,
        "status": "draft",
        "component_inspected": body.component_inspected,
        "condition_found": body.condition_found,
        "severity_rating": body.severity_rating,
        "notes": body.notes,
    }
    if body.conducted_at is not None:
        row["conducted_at"] = body.conducted_at.isoformat()
    result = supabase.table("inspections").insert(row).execute()
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create inspection")
    r = dict(result.data[0])
    if r.get("updated_at") is None and r.get("created_at") is not None:
        r["updated_at"] = r["created_at"]
    return r
