# P2 Backend Scope

Branch: `backend/p2`

## Done

- **Model review flags (P2)**  
  When an inspection is submitted with `prediction_match` = `partial` or `not_found`, the backend creates a row in `model_review_flags` (turbine_id, inspection_id, terrain_class, turbine_model) so that terrain class + model combinations can be reviewed.
  - Migration: `006_model_review_flags_p2.sql`
  - `GET /model-review-flags` — list flags; `?resolved=false` for open only
  - `PATCH /model-review-flags/{id}` — resolve (set resolved_at, optional notes)

## Planned (P2 backend)

- Unstructured repair notes (maintenance events not initiated by AeroStress)
- Repair recommendation + estimated cost in inspection report PDF
- Track recommended repairs completed
- Historical weather / storm events API (stub or integration)
- Recalibrate stress multipliers from ground truth (schema + stub)
- Import existing maintenance history (CSV/API)

Run migration `006_model_review_flags_p2.sql` in Supabase SQL Editor after `005_inspections_p1.sql`.
