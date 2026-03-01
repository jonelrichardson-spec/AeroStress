"""
Stress calculation service.
True Age = Calendar Age × Terrain Stress Multiplier (per IEC 61400-1 baseline).
"""

from typing import Optional, Tuple

from app.services.terrain import TerrainClass, classify_terrain, get_stress_multiplier


def compute_true_age(
    calendar_age_years: float,
    terrain_class: Optional[TerrainClass] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
) -> Tuple[TerrainClass, float, float]:
    """
    Compute terrain-adjusted "True Age" for a turbine.

    Returns:
        (terrain_class, stress_multiplier, true_age_years)
    """
    if terrain_class is None:
        if latitude is not None and longitude is not None:
            terrain_class = classify_terrain(latitude, longitude)
        else:
            terrain_class = "flat"

    multiplier = get_stress_multiplier(terrain_class)
    true_age = round(calendar_age_years * multiplier, 2)

    return terrain_class, multiplier, true_age
