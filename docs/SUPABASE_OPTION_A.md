# Option A: Supabase-Only Setup (RLS + Data)

Use this when the frontend loads turbine data directly from Supabase (no FastAPI backend). Follow both sections below.

---

## 1. RLS: Allow frontend (anon) to read turbines and stress

The frontend uses the **anon** key. If RLS is enabled, the anon role must be allowed to `SELECT` from `turbines` and `stress_calculations`.

### Steps

1. Open **Supabase Dashboard** → your project.
2. Go to **SQL Editor** → **New query**.
3. Paste and run the SQL below.

```sql
-- Allow anonymous (frontend) read access for Option A
-- Run in Supabase Dashboard → SQL Editor

-- Drop existing "service role" style policies if you want anon-only read (optional).
-- Or just add the anon policies below; they grant SELECT to anon.

-- Turbines: anon can SELECT
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'turbines' and policyname = 'Allow anon read turbines'
  ) then
    create policy "Allow anon read turbines"
      on public.turbines for select
      to anon
      using (true);
  end if;
end $$;

-- Stress calculations: anon can SELECT
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'stress_calculations' and policyname = 'Allow anon read stress_calculations'
  ) then
    create policy "Allow anon read stress_calculations"
      on public.stress_calculations for select
      to anon
      using (true);
  end if;
end $$;
```

4. Click **Run**. You should see “Success. No rows returned.”

If your existing policies already allow all roles (e.g. `for all using (true)` with no `to`), the frontend may already work. Adding the above makes anon read access explicit and is safe.

---

## 2. Data: Seed turbines and stress_calculations

Pape’s seed script fetches turbines from the USWTDB API and inserts them into `turbines` and `stress_calculations`.

### Prerequisites

- Python 3 with the backend dependencies (e.g. `pip install -r backend/requirements.txt`).
- In the **project root** `.env.local` (or `.env`), set:
  - `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL.
  - `SUPABASE_SERVICE_ROLE_KEY` — **service role** key (Dashboard → Settings → API → `service_role`). Do not use the anon key here; the script needs service role to insert.

### Run the seed script

From the **project root** (AeroStress):

```bash
cd backend
python -m scripts.seed_uswtdb
```

- **Full run:** Fetches 500 turbines from USWTDB and may call USGS (slower).
- **Fast run (no USGS):** Seeds 50 turbines in seconds:

```bash
cd backend
python -m scripts.seed_uswtdb --fast
```

The script skips work if you already have enough turbines. Check in Supabase: **Table Editor** → `turbines` and `stress_calculations` should have rows.

### If the script fails

- **“Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY”**  
  Add both to `.env.local` at the project root and run again.

- **“relation turbines does not exist”**  
  Run the backend migrations first in Supabase SQL Editor (in order):  
  `001_initial.sql`, then `002_day1_schema.sql` (see `backend/migrations/`).

- **Duplicate key / 23505**  
  Normal for re-runs; the script skips duplicates and continues.

---

## Checklist

- [ ] RLS: Ran the anon `SELECT` policy SQL in Supabase SQL Editor.
- [ ] Env: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in project root `.env.local`.
- [ ] Migrations: `001_initial.sql` and `002_day1_schema.sql` applied if tables didn’t exist.
- [ ] Seed: Ran `python -m scripts.seed_uswtdb --fast` (or without `--fast`) from `backend/`.
- [ ] Tables: `turbines` and `stress_calculations` have rows in Table Editor.
- [ ] Vercel: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set; `NEXT_PUBLIC_API_BASE_URL` **not** set; redeploy.

After that, the Vercel app (Option A) should load data from Supabase.
