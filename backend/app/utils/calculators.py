"""
IEC 61400-1 stress multiplier logic and True Age calculation.
Single source of truth for terrain → stress multiplier mapping.
"""

from typing import Dict, Literal, Tuple

TerrainClass = Literal["flat", "moderate", "complex", "coastal"]

# IEC 61400-1 turbulence class stress multipliers (relative to flat/Class C baseline)
# Class C = 1.0 (flat), Class B = moderate, Class A = complex/high turbulence
TERRAIN_MULTIPLIERS: Dict[TerrainClass, float] = {
    "flat": 1.0,
    "moderate": 1.2,
    "complex": 1.5,
    "coastal": 1.35,
}


def get_stress_multiplier(terrain_class: TerrainClass) -> float:
    """Return IEC 61400-1 stress multiplier for a terrain class."""
    return TERRAIN_MULTIPLIERS.get(terrain_class, 1.0)


def compute_true_age(
    calendar_age_years: float,
    terrain_class: TerrainClass,
) -> Tuple[float, float]:
    """
    True Age = Calendar Age × Terrain Stress Multiplier (IEC 61400-1).

    Returns:
        (stress_multiplier, true_age_years)
    """
    multiplier = get_stress_multiplier(terrain_class)
    true_age = round(calendar_age_years * multiplier, 2)
    return multiplier, true_age
