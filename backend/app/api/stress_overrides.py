"""
P2: Recalibrate stress multipliers from ground truth.
GET /stress-multiplier-overrides — list overrides (terrain_class + turbine_model -> multiplier).
PUT /stress-multiplier-overrides — set override (body: terrain_class, turbine_model, multiplier).
"""

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException

from app.db import get_supabase
from app.models.schemas import StressMultiplierOverride, StressMultiplierOverrideSet

router = APIRouter(prefix="/stress-multiplier-overrides", tags=["stress-overrides"])


@router.get("", response_model=List[StressMultiplierOverride])
def list_stress_overrides():
    """P2: List all stress multiplier overrides (recalibration from ground truth)."""
    supabase = get_supabase()
    result = supabase.table("stress_multiplier_overrides").select("*").execute()
    return result.data or []


@router.put("", response_model=StressMultiplierOverride)
def set_stress_override(body: StressMultiplierOverrideSet):
    """P2: Set or update stress multiplier for a terrain_class + turbine_model. Use turbine_model='' for class-wide."""
    supabase = get_supabase()
    terrain_class = body.terrain_class or ""
    turbine_model = body.turbine_model if body.turbine_model is not None else ""
    if not terrain_class:
        raise HTTPException(status_code=400, detail="terrain_class required")
    if body.multiplier <= 0:
        raise HTTPException(status_code=400, detail="multiplier must be > 0")
    updated = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    existing = (
        supabase.table("stress_multiplier_overrides")
        .select("*")
        .eq("terrain_class", terrain_class)
        .eq("turbine_model", turbine_model)
        .execute()
    )
    if existing.data and len(existing.data) > 0:
        result = (
            supabase.table("stress_multiplier_overrides")
            .update({"multiplier": body.multiplier, "updated_at": updated})
            .eq("terrain_class", terrain_class)
            .eq("turbine_model", turbine_model)
            .execute()
        )
    else:
        result = (
            supabase.table("stress_multiplier_overrides")
            .insert({
                "terrain_class": terrain_class,
                "turbine_model": turbine_model,
                "multiplier": body.multiplier,
                "updated_at": updated,
            })
            .execute()
        )
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to save override")
    return result.data[0]
