# P2 Backend Scope

Branch: `backend/p2`

## Done

- **Model review flags** — When inspection submitted with `prediction_match` = partial/not_found, create `model_review_flags` row. `GET /model-review-flags`, `PATCH /model-review-flags/{id}`.
- **Unstructured repair notes** — `repair_notes` table. `GET /turbines/{id}/repair-notes`, `POST /turbines/{id}/repair-notes` (body: notes, reported_at?).
- **Repair recommendation + cost in inspection report** — PDF includes "Repair recommendation" and "Estimated cost" (from severity 1–5 or stored `inspection_repair_recommendations`). `GET/PUT /inspections/{id}/repair-recommendation`.
- **Track recommended repairs completed** — `repair_completions` table. `GET /inspections/{id}/repair-completions`, `POST /inspections/{id}/repair-completions`.
- **Historical weather stub** — `GET /fleets/{id}/weather-events`, `GET /turbines/{id}/weather-events` return stub event list (no real API yet).
- **Stress multiplier overrides (recalibration)** — `stress_multiplier_overrides` table. `GET /stress-multiplier-overrides`, `PUT /stress-multiplier-overrides` (body: terrain_class, turbine_model, multiplier).
- **Import maintenance history** — `POST /fleets/{id}/import-maintenance-history` (CSV upload). Columns: case_id (or turbine_id), date, notes. Inserts into `repair_notes` with source=import.

## Migrations

- `006_model_review_flags_p2.sql` (after 005)
- `007_p2_repair_weather_recalibrate.sql` (after 006): repair_notes, inspection_repair_recommendations, repair_completions, stress_multiplier_overrides

Run in Supabase SQL Editor in order.
