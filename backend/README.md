# AeroStress Backend

API, terrain classification, and stress calculation services.

## Structure

```
backend/
├── app/
│   ├── api/         # Route handlers (fleets, turbines)
│   ├── models/      # Pydantic schemas
│   ├── services/    # Terrain classification, stress scoring
│   ├── utils/       # IEC 61400-1 calculators (multipliers, True Age)
│   ├── config.py    # Env loading
│   ├── db.py        # Supabase client
│   └── main.py      # FastAPI app
├── migrations/      # SQL to run in Supabase
├── scripts/         # seed_uswtdb, test_import_10_turbines
├── tests/
└── requirements.txt
```

## Setup

1. **Run migrations**: In Supabase Dashboard → SQL Editor, run in order:
   - `migrations/001_initial.sql`
   - `migrations/002_day1_schema.sql`

2. **Seed USWTDB data** (500 turbines):
   ```bash
   cd backend && python -m scripts.seed_uswtdb
   ```

3. **Env vars** (in project root `.env.local`):
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Install and run**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate   # or `venv\Scripts\activate` on Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

## Tests

```bash
cd backend && .venv/bin/python -m pytest tests/ -v
```

Test import (10 turbines, different locations → different True Ages):

```bash
# Start API first: uvicorn app.main:app --reload
cd backend && .venv/bin/python -m scripts.test_import_10_turbines
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| **GET** | **`/turbines`** | **List all turbines with coordinates (Day 1)** |
| POST | `/fleets` | Create fleet |
| GET | `/fleets/{id}` | Get fleet |
| POST | `/fleets/{id}/turbines` | Add turbine (True Age auto on import; accepts `year_operational` or `calendar_age_years`) |
| GET | `/fleets/{id}/turbines?sort=stress` | List fleet turbines, sorted by True Age |
