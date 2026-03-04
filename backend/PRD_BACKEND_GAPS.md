# Backend vs PRD — What’s Missing

Compared to `prd.md`, the backend is in good shape for P0/P1 and most of P2. Gaps and doc updates below.

---

## 1. Recalibration not applied (P2) — **DONE**

**Implemented:** `apply_stress_overrides()` in `app/services/stress.py`; used in turbine list/single, stress-explanation, failure-predictions, fleet turbines, critical-action, blind-spots, projected-savings.

**PRD (reference):** “System uses accumulated ground truth data to recalibrate stress multipliers over time.”

---

## 2. Historical weather is stub-only (P2)

**PRD:** “User can toggle Historical Weather Overlays” / “See how specific storm events in the last decade accelerated wear.”

**Current state:**  
`GET /fleets/{fleet_id}/weather-events` and `GET /turbines/{turbine_id}/weather-events` return stub/sample data with a note that production should integrate a real weather API.

**Missing:** Integration with a real historical weather/storm API (e.g. NOAA, commercial provider) to return real events and, if desired, link them to wear/risk. Backend wiring (endpoints, schemas) is in place; only the data source is missing.

---

## 3. API handoff doc is incomplete — **DONE**

**File:** `backend/API_HANDOFF_FOR_FRONTEND.md`

**Done:** Handoff doc now includes all P2 endpoints (repair-recommendation, repair-completions, repair-notes, weather-events, import-maintenance-history, stress-multiplier-overrides, model-review-flags) and a note that turbine/fleet responses apply recalibration overrides when set.

---

## 4. Optional / out-of-scope

- **P1 “User can invite team members”** — Handled by Supabase Auth/invites or product logic; no backend API required for MVP.
- **P2 “3D Stress Models”** — PRD describes “3D Stress Models of the turbine structure.” That is a frontend/visualization concern; no backend gap.
- **P0 onboarding “Initial terrain classification and USWTDB data seeding will be handled by the AeroStress team”** — Backend supports fleet create, add turbines, and CSV import; no additional backend work required for that note.

---

## Summary

| Gap | Priority | Status |
|-----|----------|--------|
| Apply stress multiplier overrides when returning turbines | P2 | **Done** |
| Historical weather real API integration | P2 | Stub only; real API is external (out of backend scope for this pass) |
| Document P2 endpoints in API_HANDOFF_FOR_FRONTEND.md | Doc | **Done** |

Everything else in the PRD that touches the backend (terrain audit, stress heatmap, True Age, blind spots, critical action report, climb list, failure predictions, inspections, attachments, prediction match, repair recommendation/cost in report, repair completions, unstructured repair notes, import maintenance history, notification webhook) is implemented or stubbed as intended.
