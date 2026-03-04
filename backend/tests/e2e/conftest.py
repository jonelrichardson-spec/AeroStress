"""Shared fixtures for backend E2E tests. Mocks Supabase so tests run without a real DB."""
import uuid
from unittest.mock import MagicMock, patch

import pytest


# Sample data for E2E
SAMPLE_FLEET_ID = str(uuid.uuid4())
SAMPLE_TURBINE_ID = str(uuid.uuid4())
SAMPLE_TURBINE = {
    "id": SAMPLE_TURBINE_ID,
    "case_id": 3003108,
    "latitude": 35.41,
    "longitude": -101.23,
    "model": "GE1.85-87",
    "manufacturer": "GE Wind",
    "capacity_kw": 1850,
    "year_operational": 2014,
    "calendar_age_years": 11.0,
    "project_name": "Panhandle Wind 1",
    "state": "TX",
}
SAMPLE_STRESS = {
    "turbine_id": SAMPLE_TURBINE_ID,
    "true_age_years": 11.0,
    "terrain_class": "flat",
    "stress_multiplier": 1.0,
}


def _res(data):
    return type("R", (), {"data": data})()


def _make_supabase_mock():
    mock = MagicMock()
    fleet_row = {
        "id": SAMPLE_FLEET_ID,
        "name": "E2E Fleet",
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z",
    }

    def table(name):
        t = MagicMock()
        if name == "turbines":
            t.select.return_value.order.return_value.range.return_value.execute.return_value = (
                _res([SAMPLE_TURBINE])
            )
            def eq_side_effect(col, val):
                m = MagicMock()
                if col == "id":
                    m.execute.return_value = _res([SAMPLE_TURBINE]) if val == SAMPLE_TURBINE_ID else _res([])
                else:
                    m.execute.return_value = _res([])
                return m
            t.select.return_value.eq.side_effect = eq_side_effect
        elif name == "stress_calculations":
            t.select.return_value.in_.return_value.execute.return_value = _res([SAMPLE_STRESS])
            t.select.return_value.eq.return_value.execute.return_value = _res([SAMPLE_STRESS])
        elif name == "stress_multiplier_overrides":
            t.select.return_value.execute.return_value = _res([])
            t.select.return_value.eq.return_value.eq.return_value.execute.return_value = _res([])
            t.insert.return_value.execute.return_value = _res([{
                "terrain_class": "flat", "turbine_model": "", "multiplier": 1.1,
                "updated_at": "2025-01-01T00:00:00Z",
            }])
            t.update.return_value.eq.return_value.eq.return_value.execute.return_value = _res([{
                "terrain_class": "flat", "turbine_model": "", "multiplier": 1.1,
                "updated_at": "2025-01-01T00:00:00Z",
            }])
        elif name == "fleets":
            t.insert.return_value.execute.return_value = _res([{**fleet_row, "name": "E2E Test Fleet"}])
            t.select.return_value.eq.return_value.execute.return_value = _res([fleet_row])
        elif name == "model_review_flags":
            t.select.return_value.order.return_value.execute.return_value = _res([])
            t.select.return_value.order.return_value.not_.is_.return_value.execute.return_value = _res([])
            t.select.return_value.order.return_value.is_.return_value.execute.return_value = _res([])
            t.select.return_value.execute.return_value = _res([])
        elif name == "inspections":
            t.select.return_value.eq.return_value.execute.return_value = _res([])
        else:
            t.select.return_value.execute.return_value = _res([])
            t.select.return_value.eq.return_value.execute.return_value = _res([])
        return t

    mock.table.side_effect = table
    return mock


# Patch get_supabase in every module that uses it (they import it at load time).
_SUPABASE_PATCH_TARGETS = [
    "app.api.turbines_global.get_supabase",
    "app.api.fleets.get_supabase",
    "app.api.turbines.get_supabase",
    "app.api.inspections.get_supabase",
    "app.api.model_review.get_supabase",
    "app.api.stress_overrides.get_supabase",
    "app.api.profile.get_supabase",
]


@pytest.fixture(autouse=True)
def mock_supabase():
    """Patch get_supabase in all API modules so E2E tests run without real Supabase."""
    mock = _make_supabase_mock()
    patchers = [patch(target, return_value=mock) for target in _SUPABASE_PATCH_TARGETS]
    for p in patchers:
        p.start()
    try:
        yield mock
    finally:
        for p in patchers:
            p.stop()
