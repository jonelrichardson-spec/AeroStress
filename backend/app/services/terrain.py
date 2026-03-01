"""
Terrain classification service.
Maps turbine GPS locations to IEC 61400-1 terrain classes.
MVP: Uses elevation-based heuristics. Future: integrate USGS elevation data.
"""

from typing import Dict, Literal

TerrainClass = Literal["flat", "moderate", "complex", "coastal"]

# IEC 61400-1 turbulence class stress multipliers (relative to flat/Class C baseline)
TERRAIN_MULTIPLIERS: Dict[TerrainClass, float] = {
    "flat": 1.0,
    "moderate": 1.2,
    "complex": 1.5,
    "coastal": 1.35,
}


def classify_terrain(latitude: float, longitude: float) -> TerrainClass:
    """
    Classify terrain from GPS coordinates.
    MVP: Placeholder using latitude-based heuristic (coastal = near water, complex = high elevation).
    Production: Integrate USGS elevation API, fetch DEM data for ridges/cliffs/gaps.
    """
    # Placeholder: use latitude bands as proxy (US-centric)
    # Replace with real USGS/elevation lookup
    if abs(latitude) > 45:
        return "complex"
    if 36 <= abs(latitude) <= 42 and -125 <= longitude <= -114:
        return "coastal"
    if 38 <= abs(latitude) <= 45:
        return "moderate"
    return "flat"


def get_stress_multiplier(terrain_class: TerrainClass) -> float:
    return TERRAIN_MULTIPLIERS.get(terrain_class, 1.0)
