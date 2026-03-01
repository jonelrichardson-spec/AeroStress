# Migrations

Run these SQL files in Supabase **SQL Editor** (Dashboard → SQL Editor → New query).

Execute in order:
1. `001_initial.sql` — creates `fleets` and `turbines` tables
2. `002_day1_schema.sql` — enables PostGIS, adds `terrain_classifications` and `stress_calculations`, updates `turbines` for USWTDB
