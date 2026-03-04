"""
Backend E2E tests: full API flows via TestClient.
Run with: pytest tests/e2e/ -v
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

from .conftest import SAMPLE_FLEET_ID, SAMPLE_TURBINE_ID

client = TestClient(app)


class TestHealthE2E:
    def test_health_returns_200(self):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json() == {"status": "ok"}


class TestTurbinesE2E:
    def test_list_turbines_200(self):
        r = client.get("/turbines?limit=10")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        t = data[0]
        assert "id" in t and "latitude" in t and "terrain_class" in t and "true_age_years" in t

    def test_get_turbine_by_id_200(self):
        r = client.get(f"/turbines/{SAMPLE_TURBINE_ID}")
        assert r.status_code == 200
        t = r.json()
        assert t["id"] == SAMPLE_TURBINE_ID
        assert "true_age_years" in t
        assert "stress_multiplier" in t

    def test_get_turbine_404(self):
        r = client.get("/turbines/00000000-0000-0000-0000-000000000000")
        assert r.status_code == 404

    def test_stress_explanation_200(self):
        r = client.get(f"/turbines/{SAMPLE_TURBINE_ID}/stress-explanation")
        assert r.status_code == 200
        data = r.json()
        assert "explanation" in data

    def test_failure_predictions_200(self):
        r = client.get(f"/turbines/{SAMPLE_TURBINE_ID}/failure-predictions")
        assert r.status_code == 200
        data = r.json()
        assert "predictions" in data

    def test_weather_events_stub_200(self):
        r = client.get(f"/turbines/{SAMPLE_TURBINE_ID}/weather-events")
        assert r.status_code == 200
        data = r.json()
        assert "events" in data

    def test_repair_notes_list_200(self):
        r = client.get(f"/turbines/{SAMPLE_TURBINE_ID}/repair-notes")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_turbine_inspections_list_200(self):
        r = client.get(f"/turbines/{SAMPLE_TURBINE_ID}/inspections")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestFleetsE2E:
    def test_create_fleet_201(self):
        r = client.post("/fleets", json={"name": "E2E Test Fleet"})
        assert r.status_code in (200, 201)
        data = r.json()
        assert "id" in data
        assert data["name"] == "E2E Test Fleet"

    def test_get_fleet_200(self):
        r = client.get(f"/fleets/{SAMPLE_FLEET_ID}")
        assert r.status_code == 200
        assert r.json()["id"] == SAMPLE_FLEET_ID

    def test_fleet_turbines_200(self):
        r = client.get(f"/fleets/{SAMPLE_FLEET_ID}/turbines?sort=stress")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_critical_action_200(self):
        r = client.get(f"/fleets/{SAMPLE_FLEET_ID}/critical-action?top_percent=5")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_critical_action_report_pdf_200(self):
        r = client.get(f"/fleets/{SAMPLE_FLEET_ID}/critical-action/report?top_percent=5")
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("application/pdf")

    def test_projected_savings_200(self):
        r = client.get(f"/fleets/{SAMPLE_FLEET_ID}/projected-savings?annual_om_per_turbine=50000")
        assert r.status_code == 200
        data = r.json()
        assert "message" in data
        assert "total_turbines" in data

    def test_blind_spots_200(self):
        r = client.get(f"/fleets/{SAMPLE_FLEET_ID}/blind-spots?high_stress_percent=20")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_weather_events_stub_200(self):
        r = client.get(f"/fleets/{SAMPLE_FLEET_ID}/weather-events")
        assert r.status_code == 200
        data = r.json()
        assert "events" in data


class TestStressOverridesE2E:
    def test_list_overrides_200(self):
        r = client.get("/stress-multiplier-overrides")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_put_override_200(self):
        r = client.put(
            "/stress-multiplier-overrides",
            json={"terrain_class": "flat", "turbine_model": "", "multiplier": 1.1},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["terrain_class"] == "flat"
        assert data["multiplier"] == 1.1


class TestModelReviewFlagsE2E:
    def test_list_flags_200(self):
        r = client.get("/model-review-flags")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_list_flags_unresolved_200(self):
        r = client.get("/model-review-flags?resolved=false")
        assert r.status_code == 200
