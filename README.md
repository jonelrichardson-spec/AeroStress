# AeroStress

Predictive maintenance platform for wind turbines in complex terrain. Calculates terrain-adjusted "True Age" to identify high-stress assets and prioritize inspections.

See [prd.md](./prd.md) for full product requirements.

## Project Structure

```
├── backend/     # API, terrain classification, stress calculations
├── frontend/    # Dashboard, asset mapping, inspection reports
└── prd.md       # Product requirements document
```

**Ownership:** Backend and frontend are maintained separately. Backend devs own `backend/`; frontend devs own `frontend/`.

## Setup

See `backend/README.md` for backend setup. Frontend setup is owned by the frontend team.
