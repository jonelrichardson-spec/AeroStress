"""Unit tests for IEC 61400-1 calculators."""
import pytest
from app.utils.calculators import (
    TERRAIN_MULTIPLIERS,
    get_stress_multiplier,
    compute_true_age,
)


def test_multipliers():
    assert TERRAIN_MULTIPLIERS["flat"] == 1.0
    assert TERRAIN_MULTIPLIERS["moderate"] == 1.2
    assert TERRAIN_MULTIPLIERS["complex"] == 1.5
    assert TERRAIN_MULTIPLIERS["coastal"] == 1.35


def test_get_stress_multiplier():
    assert get_stress_multiplier("flat") == 1.0
    assert get_stress_multiplier("complex") == 1.5
    assert get_stress_multiplier("unknown") == 1.0  # default


def test_compute_true_age_flat():
    mult, true_age = compute_true_age(10.0, "flat")
    assert mult == 1.0
    assert true_age == 10.0


def test_compute_true_age_complex():
    mult, true_age = compute_true_age(10.0, "complex")
    assert mult == 1.5
    assert true_age == 15.0


def test_compute_true_age_moderate():
    mult, true_age = compute_true_age(20.0, "moderate")
    assert mult == 1.2
    assert true_age == 24.0
