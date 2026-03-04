"""API tests. Health always works; turbine tests use mocked Supabase so they pass without network."""
import uuid
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

# Sample turbine + stress for mock
_SAMPLE_ID = str(uuid.uuid4())
_SAMPLE_TURBINES = [
    {
        "id": _SAMPLE_ID,
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
]
_SAMPLE_STRESS = [
    {"turbine_id": _SAMPLE_ID, "true_age_years": 11.0, "terrain_class": "flat"}
]


def _make_mock_supabase():
    mock = MagicMock()
    # table("turbines").select().order().range().execute()
    turbines_chain = MagicMock()
    turbines_chain.select.return_value.order.return_value.range.return_value.execute.return_value = (
        type("Res", (), {"data": _SAMPLE_TURBINES})()
    )
    # table("stress_calculations").select().in_().execute()
    stress_chain = MagicMock()
    stress_chain.select.return_value.in_.return_value.execute.return_value = (
        type("Res", (), {"data": _SAMPLE_STRESS})()
    )
    mock.table.side_effect = lambda name: turbines_chain if name == "turbines" else stress_chain
    return mock


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


@patch("app.api.turbines_global.get_supabase", side_effect=lambda: _make_mock_supabase())
def test_turbines_list_returns_200(_mock_get_supabase):
    r = client.get("/turbines?limit=1")
    assert r.status_code == 200


@patch("app.api.turbines_global.get_supabase", side_effect=lambda: _make_mock_supabase())
def test_turbines_list_shape(_mock_get_supabase):
    r = client.get("/turbines?limit=1")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 1
    t = data[0]
    assert "id" in t
    assert "latitude" in t
    assert "longitude" in t
    assert "terrain_class" in t
    assert "true_age_years" in t
    assert t["terrain_class"] == "flat"
    assert t["true_age_years"] == 11.0
