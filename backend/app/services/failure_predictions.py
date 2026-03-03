"""
Static, rules-based failure-mode predictions per turbine (P0).
Based on terrain class and age; no ML yet.
"""

from typing import List

# Rules: (terrain_classes, min_true_age_years, message)
# terrain_classes: list of classes that trigger this, or None = all
RULES = [
    (["complex", "coastal"], 10.0, "Check main bearing for pitting and wear."),
    (["complex", "coastal"], 12.0, "Look for leading-edge erosion on blades."),
    (["moderate", "complex", "coastal"], 15.0, "Inspect tower base and bolted connections for fatigue."),
    (["complex"], 8.0, "High turbulence: verify pitch and yaw system response."),
    (None, 18.0, "Aging asset: recommend full structural and electrical inspection."),
]


def get_failure_predictions(
    terrain_class: str,
    true_age_years: float,
    calendar_age_years: float,
) -> List[str]:
    """
    Return list of plain-language failure-mode suggestions for a turbine.
    """
    suggestions = []
    age = true_age_years or 0
    for classes, min_age, message in RULES:
        if age < min_age:
            continue
        if classes is not None and (not terrain_class or terrain_class not in classes):
            continue
        suggestions.append(message)
    return suggestions
