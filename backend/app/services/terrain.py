"""
Terrain classification service.
Maps turbine GPS locations to IEC 61400-1 terrain classes.
Uses USGS Elevation API when available; falls back to latitude heuristic.
"""

from typing import Dict, Literal

from app.utils.calculators import TERRAIN_MULTIPLIERS, get_stress_multiplier

TerrainClass = Literal["flat", "moderate", "complex", "coastal"]


def _classify_from_elevation_meters(elevation_m: float) -> TerrainClass:
    """Map elevation (m) to terrain class. High elevation = complex turbulence."""
    if elevation_m >= 1500:
        return "complex"
    if elevation_m >= 600:
        return "moderate"
    return "flat"


def _classify_from_latitude_heuristic(latitude: float, longitude: float) -> TerrainClass:
    """Fallback when USGS is unavailable. US-centric heuristic."""
    if abs(latitude) > 45:
        return "complex"
    if 36 <= abs(latitude) <= 42 and -125 <= longitude <= -114:
        return "coastal"
    if 38 <= abs(latitude) <= 45:
        return "moderate"
    return "flat"


def get_elevation_m(latitude: float, longitude: float) -> float:
    """
    Fetch elevation in meters from USGS EPQS.
    Returns elevation or 0.0 on failure (caller can fall back to heuristic).
    """
    try:
        import httpx
        resp = httpx.get(
            "https://epqs.nationalmap.gov/v1/json",
            params={"x": longitude, "y": latitude, "units": "Meters"},
            timeout=5.0,
        )
        if resp.status_code != 200:
            return 0.0
        data = resp.json()
        # Response: {"value": 1234.5} or similar
        value = data.get("value")
        if value is not None:
            return float(value)
        return 0.0
    except Exception:
        return 0.0


def classify_terrain(
    latitude: float,
    longitude: float,
    use_usgs: bool = True,
) -> TerrainClass:
    """
    Classify terrain from GPS coordinates.
    If use_usgs=True, calls USGS Elevation API and maps elevation to class.
    Otherwise (or on API failure) uses latitude-based heuristic.
    """
    if use_usgs:
        elev = get_elevation_m(latitude, longitude)
        if elev > 0:
            return _classify_from_elevation_meters(elev)
    return _classify_from_latitude_heuristic(latitude, longitude)
