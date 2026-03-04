# AeroStress

Predictive maintenance platform for wind turbines in complex terrain. Calculates terrain-adjusted "True Age" to identify high-stress assets and prioritize inspections.

See [prd.md](./prd.md) for full product requirements.

## Project Structure

```
├── app/           # Next.js App Router (dashboard, turbines, pages)
├── components/    # React UI and map components
├── lib/           # API client, types, constants
├── backend/       # FastAPI API, terrain classification, stress calculations
├── public/        # Static assets
└── prd.md         # Product requirements document
```

The Next.js app (dashboard, asset mapping, inspection reports) lives at the repo root. Run from the repo root: `npm run dev` (see [Setup](#setup)).

**Ownership:** Backend and frontend are maintained separately. Backend devs own `backend/`; frontend devs own the root Next.js app.

## Setup

- **Backend:** See `backend/README.md` for API and DB setup.
- **Frontend:** From repo root run `npm install` then `npm run dev`. Open http://127.0.0.1:3000 (or the port shown).
