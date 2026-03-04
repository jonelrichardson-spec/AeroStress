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
- `GET /turbines/{id}` → one turbine (same shape). **Live.**  
- `GET /turbines/{id}/stress-explanation` → `{ explanation: string }`  
- `GET /turbines/{id}/failure-predictions` → `{ predictions: [{ component, condition }] }`  
- `GET /turbines/{id}/inspections` → inspections array  
- `POST /turbines/{id}/inspections` → body `{ conducted_at?, inspector_name?, component_inspected?, condition_found?, severity_rating?, notes? }` → inspection

**Turbine shape** (list + single): `id`, `latitude`, `longitude`, `model`, `manufacturer`, `capacity_kw`, `year_operational`, `calendar_age_years`, `true_age_years`, `terrain_class`, **`stress_multiplier`**, `project_name`, `state`, `case_id`.

**Inspections (no auth)**  
- `GET /inspections/{id}` → one inspection  
- `GET /inspections/{id}/report` → PDF  
- `PATCH /inspections/{id}` → body `{ status?, component_inspected?, condition_found?, severity_rating?, notes?, prediction_match?, attachment_url? }` → inspection  
- `POST /inspections/{id}/attachment` → multipart file → inspection (with `attachment_url`)

**Inspection:** `id`, `turbine_id`, `conducted_at`, `inspector_name`, `status`, `component_inspected`, `condition_found`, `severity_rating`, `notes`, `submitted_at`, `prediction_match`, `attachment_url`, `created_at`, `updated_at`.

**Fleets (no auth)**  
- `POST /fleets` → body `{ name }` → fleet  
- `GET /fleets/{id}` → fleet  
- `GET /fleets/{id}/turbines?sort=stress` → turbine array  
- `GET /fleets/{id}/critical-action` → turbine array  
- `GET /fleets/{id}/critical-action/report` → PDF  
- `GET /fleets/{id}/projected-savings?annual_om_per_turbine=50000` → `{ fleet_id, annual_om_per_turbine, total_turbines, high_risk_turbines_top_20pct, recommended_reallocation_percent, message }`  
- `GET /fleets/{id}/blind-spots?high_stress_percent=20` → turbine array

---

## Quick answers

- **GET /turbines/{id}?** Yes, live. Same shape as list item.  
- **stress_multiplier in turbine responses?** Yes.  
- **Auth?** Supabase JWT; send `Authorization: Bearer <token>` only for `/profile`.
