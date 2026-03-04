# API handoff for frontend

**Base URL:** `http://localhost:8000`  
**CORS:** `localhost:3000`, `127.0.0.1:3000`

---

## Auth

- **Supabase JWT only.** Get `access_token` from `supabase.auth.getSession()` (or sign-in).
- **Header:** `Authorization: Bearer <access_token>`
- **Only these need the header:** `GET /profile`, `PATCH /profile`. Everything else is unauthenticated.

---

## Endpoints

**Profile (need Bearer)**  
- `GET /profile` → `{ id, user_id, role, fleet_id, created_at, updated_at }`  
- `PATCH /profile` → body `{ role?, fleet_id? }` → same as GET

**Turbines (no auth)**  
- `GET /turbines?limit=500&offset=0` → array of turbines  
- `GET /turbines/{id}` → one turbine (same shape). **Live.** Overrides applied (P2).  
- `GET /turbines/{id}/stress-explanation` → `{ turbine_id, explanation }`  
- `GET /turbines/{id}/failure-predictions` → `{ turbine_id, predictions: [{ component, condition }] }`  
- `GET /turbines/{id}/inspections` → inspections array  
- `POST /turbines/{id}/inspections` → body `{ conducted_at?, inspector_name?, component_inspected?, condition_found?, severity_rating?, notes? }` → inspection  
- **P2:** `GET /turbines/{id}/repair-notes` → array of `{ id, turbine_id, notes, reported_at, source, created_at }`  
- **P2:** `POST /turbines/{id}/repair-notes` → body `{ notes, reported_at? }` → repair note  
- **P2:** `GET /turbines/{id}/weather-events` → `{ turbine_id, events: [{ date, event_type, description }], note }` (stub)

**Turbine shape** (list + single): `id`, `latitude`, `longitude`, `model`, `manufacturer`, `capacity_kw`, `year_operational`, `calendar_age_years`, `true_age_years`, `terrain_class`, **`stress_multiplier`**, `project_name`, `state`, `case_id`.  
**Recalibration (P2):** If `stress_multiplier_overrides` has an entry for (terrain_class, model) or (terrain_class, ""), `true_age_years` and `stress_multiplier` in responses use that override.

**Inspections (no auth)**  
- `GET /inspections/{id}` → one inspection  
- `GET /inspections/{id}/report` → PDF (P2: includes repair recommendation + cost when set)  
- `PATCH /inspections/{id}` → body `{ status?, component_inspected?, condition_found?, severity_rating?, notes?, prediction_match?, attachment_url? }` → inspection  
- `POST /inspections/{id}/attachment` → multipart file → inspection (with `attachment_url`)  
- **P2:** `GET /inspections/{id}/repair-recommendation` → `{ id, inspection_id, recommended_action, estimated_cost_low, estimated_cost_high, created_at }` or null  
- **P2:** `PUT /inspections/{id}/repair-recommendation` → body `{ recommended_action?, estimated_cost_low?, estimated_cost_high? }` → repair recommendation  
- **P2:** `GET /inspections/{id}/repair-completions` → array of `{ id, inspection_id, completed_at, notes, created_at }`  
- **P2:** `POST /inspections/{id}/repair-completions` → body `{ completed_at?, notes? }` → repair completion

**Inspection:** `id`, `turbine_id`, `conducted_at`, `inspector_name`, `status`, `component_inspected`, `condition_found`, `severity_rating`, `notes`, `submitted_at`, `prediction_match`, `attachment_url`, `created_at`, `updated_at`.

**Fleets (no auth)**  
- `POST /fleets` → body `{ name }` → fleet  
- `GET /fleets/{id}` → fleet  
- `GET /fleets/{id}/turbines?sort=stress` → turbine array (overrides applied)  
- `GET /fleets/{id}/critical-action?top_percent=5` → turbine array (overrides applied)  
- `GET /fleets/{id}/critical-action/report?top_percent=5` → PDF  
- `GET /fleets/{id}/projected-savings?annual_om_per_turbine=50000` → `{ fleet_id, annual_om_per_turbine, total_turbines, high_risk_turbines_top_20pct, recommended_reallocation_percent, message }` (uses overrides)  
- `GET /fleets/{id}/blind-spots?high_stress_percent=20` → turbine array (overrides applied)  
- **P2:** `GET /fleets/{id}/weather-events` → `{ fleet_id, events, note }` (stub)  
- **P2:** `POST /fleets/{id}/import-maintenance-history` → multipart CSV (columns: case_id or turbine_id, date, notes) → `{ imported, errors }`

**Stress overrides (P2, no auth)**  
- `GET /stress-multiplier-overrides` → array of `{ terrain_class, turbine_model, multiplier, updated_at }`  
- `PUT /stress-multiplier-overrides` → body `{ terrain_class, turbine_model?, multiplier }` (turbine_model default "") → override

**Model review flags (P2, no auth)**  
- `GET /model-review-flags?resolved=false` → array of `{ id, inspection_id, turbine_id, terrain_class, turbine_model, prediction_match, created_at, resolved_at, notes }`  
- `PATCH /model-review-flags/{id}` → body `{ notes? }` → flag (sets resolved_at)

---

## Quick answers

- **GET /turbines/{id}?** Yes, live. Same shape as list item. Recalibration overrides applied when set.  
- **stress_multiplier in turbine responses?** Yes.  
- **Auth?** Supabase JWT; send `Authorization: Bearer <token>` only for `/profile`.
