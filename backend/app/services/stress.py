"""
Stress calculation service.
Orchestrates terrain classification + IEC 61400-1 True Age (see utils.calculators).
"""

from typing import Optional, Tuple

from app.services.terrain import TerrainClass, classify_terrain
from app.utils.calculators import compute_true_age as _compute_true_age


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
