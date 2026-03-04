"""
P1: Plain-language stress explanation per turbine.
e.g. "This turbine has the structural wear of a 16-year-old unit and is operating in IEC Class A terrain."
"""

from typing import Optional

# IEC 61400-1 class labels for display
TERRAIN_LABELS = {
    "flat": "IEC Class C (flat terrain)",
    "moderate": "IEC Class B (moderate turbulence)",
    "complex": "IEC Class A (complex/high turbulence)",
    "coastal": "coastal/marine conditions",
}


def get_stress_explanation(
    true_age_years: float,
    calendar_age_years: float,
    terrain_class: Optional[str] = None,
) -> str:
    """
    Return a plain-language sentence explaining the stress score.
    No dollar estimates (per PRD: financial projections out of scope for MVP).
    """
    terrain_label = TERRAIN_LABELS.get(terrain_class or "flat", "unknown terrain")
    true_int = int(round(true_age_years))
    cal_int = int(round(calendar_age_years))
    if true_int <= 0:
        return f"This turbine is in {terrain_label}. True Age is not yet calculated."
    return (
        f"This turbine has the structural wear of a {true_int}-year-old unit "
        f"and is operating in {terrain_label}."
    )
