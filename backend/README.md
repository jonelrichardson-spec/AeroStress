# AeroStress Backend

API, terrain classification, and stress calculation services.

## Structure

```
backend/
├── app/
│   ├── api/         # Route handlers (fleets, turbines)
│   ├── models/      # Pydantic schemas
│   ├── services/    # Terrain classification, stress scoring
│   ├── config.py    # Env loading
│   ├── db.py        # Supabase client
│   └── main.py      # FastAPI app
├── migrations/      # SQL to run in Supabase
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

3. **Install and run**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate   # or `venv\Scripts\activate` on Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| **GET** | **`/turbines`** | **List all turbines with coordinates (Day 1)** |
| POST | `/fleets` | Create fleet |
| GET | `/fleets/{id}` | Get fleet |
| POST | `/fleets/{id}/turbines` | Add turbine (auto-computes terrain & stress) |
| GET | `/fleets/{id}/turbines?sort=stress` | List fleet turbines, sorted by True Age |
