# Frontend Handoff — Answers for Your Pair

## 1. Supabase Project

| Question | Answer |
|----------|--------|
| **Supabase project URL** | Share from Supabase Dashboard → Settings → API. Format: `https://YOUR_PROJECT.supabase.co` |
| **Anon key** | Supabase Dashboard → Settings → API → `anon` `public` key. Safe for frontend. |
| **RLS enabled?** | **Built.** RLS is enabled on `fleets`, `turbines`, `terrain_classifications`, `stress_calculations`. |
| **RLS policies** | **Built.** Policy: `using (true) with check (true)` — allows all operations (for now). |
| **Supabase Auth** | **Built (P0).** Frontend uses Supabase Auth (email/password or OAuth). Backend verifies JWT with `SUPABASE_JWT_SECRET` (Dashboard → API → JWT Secret). |

---

## 2. Database Schema

**Full schema:** See `backend/migrations/001_initial.sql`, `002_day1_schema.sql`, `003_inspections.sql`, and `004_profiles.sql` (profiles: user_id, role, fleet_id).

### Tables
- **`fleets`** — Fleet name, timestamps
- **`turbines`** — Main turbine data
- **`terrain_classifications`** — Lookup: flat, moderate, complex, coastal + multipliers
- **`stress_calculations`** — Per-turbine stress (terrain_class, stress_multiplier, true_age_years)

### `turbines` columns
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| case_id | bigint | USWTDB ID |
| latitude | double | |
| longitude | double | |
| geometry | geometry(Point, 4326) | PostGIS, auto-filled from lat/lon |
| model | text | Was `t_model` |
| manufacturer | text | Was `t_manu` |
| capacity_kw | integer | Was `t_cap` |
| year_operational | integer | Was `p_year` |
| calendar_age_years | double | 2025 - year_operational |
| project_name | text | Was `p_name` |
| state | text | Was `t_state` |
| county | text | Was `t_county` |
| fleet_id | uuid (nullable) | FK to fleets. Null for USWTDB seed. |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**USWTDB naming:** Renamed: `t_manu` → manufacturer, `t_model` → model, `p_name` → project_name, `t_cap` → capacity_kw, `p_year` → year_operational, `t_state` → state, `t_county` → county.

**Farms:** `fleets` = operator fleets. `turbines.fleet_id` links to a fleet (nullable). `project_name` is USWTDB project. Seed turbines have `fleet_id = null`.

**profiles/users table:** **Not yet.** No extra tables beyond Auth (and Auth not set up).

**inspections table:** **Built.** Migration `003_inspections.sql`. Fields: turbine_id, conducted_at, inspector_name, status (draft | submitted), component_inspected, condition_found, severity_rating (1–5), notes, submitted_at.

**terrain_class:** In `stress_calculations`, not on `turbines`. API joins and returns it in the response.

**stress_multiplier:** Stored in `stress_calculations` per turbine. API returns it in turbine list and single-turbine responses.

**true_age:** Stored in `stress_calculations.true_age_years`. API returns it.

---

## 3. Data Seeding

| Question | Answer |
|----------|--------|
| **How many turbines** | **Built.** 500 (subset). |
| **USWTDB version** | Live API; current is ~V8.2. |
| **Terrain classified?** | **Built.** USGS Elevation API at turbine lat/lon; fallback latitude heuristic if USGS fails. |
| **USGS elevation integrated?** | **Built.** Used for terrain class (flat/moderate/complex/coastal). |

---

## 4. API Architecture

**Option B — FastAPI (Python) backend, called via `fetch()`**

- No direct Supabase from frontend for turbine data; use this API.
- Base URL: `http://localhost:8000` (dev). Production URL TBD.
- CORS: Allowed for `http://localhost:3000` and `http://127.0.0.1:3000`.

---

## 5. Endpoints

### Sprint 1

| Need | Endpoint | Status |
|------|----------|--------|
| All turbines (lat/lng, terrain, stress) | `GET /turbines?limit=500&offset=0` | **Built** |
| Turbines for a fleet | `GET /fleets/{fleet_id}/turbines?sort=stress` | **Built** |
| Single turbine by ID | `GET /turbines/{id}` | **Built** |
| CSV import turbines | `POST /fleets/{fleet_id}/turbines/import-csv` (file upload) | **Built** |
| Critical Action (top % at risk) | `GET /fleets/{fleet_id}/critical-action?top_percent=5` | **Built** |
| Blind spots (high stress, no inspection) | `GET /fleets/{fleet_id}/blind-spots?high_stress_percent=20` | **Built** |
| Failure-mode predictions | `GET /turbines/{id}/failure-predictions` | **Built** |
| Create inspection | `POST /turbines/{id}/inspections` | **Built** |
| List inspections for turbine | `GET /turbines/{id}/inspections` | **Built** |
| Submit inspection | `PATCH /inspections/{id}` (body: `{"status": "submitted"}`) | **Built** |
| Critical Action Report PDF | `GET /fleets/{id}/critical-action/report?top_percent=5` | **Built** (P0) |
| Inspection Report PDF | `GET /inspections/{id}/report` | **Built** (P0) |
| Auth (JWT) | Bearer token from Supabase Auth; backend verifies with `SUPABASE_JWT_SECRET` | **Built** (P0) |
| Profile (role) | `GET /profile`, `PATCH /profile` (require Bearer); roles: asset_manager, technician | **Built** (P0) |
| Stress explanation (plain language) | `GET /turbines/{id}/stress-explanation` | **Built** (P1) |
| Inspection prediction match | `PATCH /inspections/{id}` body: `prediction_match`: `confirmed` \| `partial` \| `not_found` | **Built** (P1) |
| Inspection attachment | `POST /inspections/{id}/attachment` (file upload); or set `attachment_url` via PATCH | **Built** (P1) — create bucket `inspection-attachments` in Supabase Storage |
| Notification on submit | Set `INSPECTION_SUBMITTED_WEBHOOK_URL` in env; backend POSTs to it when inspection submitted | **Built** (P1) |
| Projected savings / O&M | `GET /fleets/{id}/projected-savings?annual_om_per_turbine=50000` | **Built** (P1) |

### Sprint 2

| Need | Status |
|------|--------|
| True Age per turbine | **Built** — returned as `true_age_years` |
| Heatmap data | Use `GET /turbines` — frontend can map lat/lng |
| Inspection submission | **Built** — POST inspection, PATCH to submit |
| Inspection history per turbine | **Built** — GET /turbines/{id}/inspections |

---

## 6. API Response Shape

**`GET /turbines`** returns JSON array:

```json
[
  {
    "id": "uuid",
    "case_id": 3003108,
    "latitude": 35.41319,
    "longitude": -101.23229,
    "model": "GE1.85-87",
    "manufacturer": "GE Wind",
    "capacity_kw": 1850,
    "year_operational": 2014,
    "calendar_age_years": 11.0,
    "true_age_years": 11.0,
    "terrain_class": "flat",
    "project_name": "Panhandle Wind 1",
    "state": "TX"
  }
]
```

| Question | Answer |
|----------|--------|
| **GeoJSON?** | **No.** Regular JSON; frontend converts for Mapbox if needed. |
| **Date format** | ISO 8601 strings (e.g. `created_at`, `updated_at` when returned). |
| **IDs** | UUIDs. |

---

## 7. Storage

| Question | Answer |
|----------|--------|
| Storage bucket for inspection photos | **Not yet** |
| Bucket name | — |
| Public/private | — |
| Max file size | — |

---

## 8. Auth & Roles

| Question | Answer |
|----------|--------|
| How role is assigned on signup | **Not yet** |
| Role stored in metadata vs profiles | **Not yet** |
| Asset manager: all farms vs assigned | **Not yet** |
| Technician: full dashboard vs climb list only | **Not yet** |

---

## Quick Reference: Built vs Not Yet

| Feature | Status |
|---------|--------|
| Supabase URL + anon key | You share from Dashboard |
| RLS + permissive policies | Built |
| Supabase Auth | Frontend uses Supabase Auth; backend verifies JWT with SUPABASE_JWT_SECRET (P0) |
| Schema (fleets, turbines, terrain_classifications, stress_calculations, inspections) | Built — run `003_inspections.sql` for inspections |
| profiles (role, fleet_id) | Built — run `004_profiles.sql`; GET/PATCH /profile with Bearer (P0) |
| inspections table + APIs | Built |
| 500 turbines seeded | Built |
| Terrain classified (USGS + fallback) | Built |
| USGS elevation for terrain | Built |
| FastAPI backend | Built |
| GET /turbines | Built |
| GET /fleets/{id}/turbines | Built |
| POST /fleets, POST /fleets/{id}/turbines | Built |
| GET /turbines/{id} | Built |
| POST /fleets/{id}/turbines/import-csv | Built |
| GET /fleets/{id}/critical-action | Built |
| GET /fleets/{id}/blind-spots | Built |
| GET /turbines/{id}/failure-predictions | Built |
| Inspections (create, list, submit) | Built |
| Auth + roles | Not yet |
| Storage for photos | Not yet |
