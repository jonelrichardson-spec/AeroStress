"""Unit tests for terrain classification."""
import pytest
from app.services.terrain import (
    classify_terrain,
    _classify_from_elevation_meters,
    _classify_from_latitude_heuristic,
)


def test_elevation_to_class():
    assert _classify_from_elevation_meters(0) == "flat"
    assert _classify_from_elevation_meters(500) == "flat"
    assert _classify_from_elevation_meters(600) == "moderate"
    assert _classify_from_elevation_meters(1000) == "moderate"
    assert _classify_from_elevation_meters(1500) == "complex"
    assert _classify_from_elevation_meters(2000) == "complex"


def test_heuristic_flat():
    # Central US flat
    assert _classify_from_latitude_heuristic(35.0, -100.0) == "flat"


def test_heuristic_coastal():
    # West coast
    assert _classify_from_latitude_heuristic(38.0, -120.0) == "coastal"


def test_heuristic_complex():
    # High latitude
    assert _classify_from_latitude_heuristic(46.0, -100.0) == "complex"


def test_classify_terrain_without_usgs():
    # Deterministic when use_usgs=False
    c = classify_terrain(35.0, -101.0, use_usgs=False)
    assert c in ("flat", "moderate", "complex", "coastal")
