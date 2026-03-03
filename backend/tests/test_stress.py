"""Unit tests for stress calculation service."""
import pytest
from app.services.stress import compute_true_age


def test_compute_true_age_with_terrain():
    tc, mult, true_age = compute_true_age(10.0, terrain_class="flat")
    assert tc == "flat"
    assert mult == 1.0
    assert true_age == 10.0


def test_compute_true_age_with_coords_no_usgs():
    tc, mult, true_age = compute_true_age(
        10.0,
        latitude=35.0,
        longitude=-101.0,
        use_usgs=False,
    )
    assert tc in ("flat", "moderate", "complex", "coastal")
    assert mult >= 1.0
    assert true_age == round(10.0 * mult, 2)


def test_compute_true_age_default_flat():
    tc, mult, true_age = compute_true_age(5.0)  # no coords
    assert tc == "flat"
    assert mult == 1.0
    assert true_age == 5.0
