"""
Stress calculation service.
Orchestrates terrain classification + IEC 61400-1 True Age (see utils.calculators).
P2: Applies stress_multiplier_overrides (recalibration from ground truth) when present.
"""

from typing import Any, Dict, List, Optional, Tuple

from app.services.terrain import TerrainClass, classify_terrain
from app.utils.calculators import compute_true_age as _compute_true_age


def apply_stress_overrides(supabase_client: Any, turbines: List[Dict[str, Any]]) -> None:
    """
    P2: Recalibration — if stress_multiplier_overrides has an entry for (terrain_class, turbine_model)
    or (terrain_class, ''), overwrite stress_multiplier and true_age_years on each turbine in place.
    """
    if not turbines:
        return
    res = supabase_client.table("stress_multiplier_overrides").select("terrain_class, turbine_model, multiplier").execute()
    rows = res.data or []
    overrides: Dict[Tuple[str, str], float] = {}
    for r in rows:
        terrain = (r.get("terrain_class") or "").strip()
        model = (r.get("turbine_model") or "").strip()
        mult = r.get("multiplier")
        if terrain and mult is not None:
            overrides[(terrain, model)] = float(mult)
    for t in turbines:
        terrain = t.get("terrain_class")
        model = (t.get("model") or "").strip()
        cal = t.get("calendar_age_years")
        if terrain is None or cal is None:
            continue
        mult = overrides.get((terrain, model)) or overrides.get((terrain, ""))
        if mult is not None:
            t["stress_multiplier"] = mult
            t["true_age_years"] = round(float(cal) * mult, 2)


def compute_true_age(
    calendar_age_years: float,
    terrain_class: Optional[TerrainClass] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    use_usgs: bool = True,
) -> Tuple[TerrainClass, float, float]:
    """
    Compute terrain-adjusted "True Age" for a turbine.
    Classifies terrain (USGS elevation or heuristic), then applies IEC multiplier.

    Returns:
        (terrain_class, stress_multiplier, true_age_years)
    """
    if terrain_class is None:
        if latitude is not None and longitude is not None:
            terrain_class = classify_terrain(latitude, longitude, use_usgs=use_usgs)
        else:
            terrain_class = "flat"

    multiplier, true_age = _compute_true_age(calendar_age_years, terrain_class)
    return terrain_class, multiplier, true_age
