-- Day 1 milestone: PostGIS + terrain_classifications + stress_calculations
-- Run in Supabase SQL Editor after 001_initial.sql
-- If you need a clean slate, run: DROP TABLE IF EXISTS stress_calculations, terrain_classifications, turbines CASCADE;

-- Enable PostGIS for geospatial queries
create extension if not exists postgis;

-- Terrain classifications lookup (IEC 61400-1 baseline)
create table if not exists public.terrain_classifications (
  id uuid primary key default gen_random_uuid(),
  class_name text unique not null check (class_name in ('flat', 'moderate', 'complex', 'coastal')),
  stress_multiplier double precision not null,
  description text,
  created_at timestamptz default now()
);

insert into public.terrain_classifications (class_name, stress_multiplier, description) values
  ('flat', 1.0, 'Class C - flat terrain baseline'),
  ('moderate', 1.2, 'Class B - moderate turbulence'),
  ('complex', 1.5, 'Class A - complex/high turbulence'),
  ('coastal', 1.35, 'Coastal/marine conditions')
on conflict (class_name) do nothing;

-- Drop and recreate turbines for Day 1 schema (USWTDB seed)
drop table if exists public.stress_calculations;
drop table if exists public.turbines;

create table public.turbines (
  id uuid primary key default gen_random_uuid(),
  case_id bigint unique,
  latitude double precision not null,
  longitude double precision not null,
  geometry geometry(point, 4326),
  model text,
  manufacturer text,
  capacity_kw integer,
  year_operational integer,
  calendar_age_years double precision not null,
  project_name text,
  state text,
  county text,
  fleet_id uuid references public.fleets(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_turbines_geometry on public.turbines using gist(geometry);
create index idx_turbines_coords on public.turbines(latitude, longitude);
create index idx_turbines_case_id on public.turbines(case_id);

-- Populate geometry from lat/lon
create or replace function turbines_set_geometry()
returns trigger as $$
begin
  new.geometry := st_setsrid(st_makepoint(new.longitude, new.latitude), 4326);
  return new;
end;
$$ language plpgsql;

create trigger turbines_geometry_trigger
  before insert or update on public.turbines
  for each row execute procedure turbines_set_geometry();

-- Stress calculations: per-turbine True Age computation
create table public.stress_calculations (
  id uuid primary key default gen_random_uuid(),
  turbine_id uuid not null references public.turbines(id) on delete cascade,
  terrain_classification_id uuid references public.terrain_classifications(id),
  terrain_class text not null,
  stress_multiplier double precision not null,
  calendar_age_years double precision not null,
  true_age_years double precision not null,
  calculated_at timestamptz default now()
);

create unique index idx_stress_calculations_turbine on public.stress_calculations(turbine_id);
create index idx_stress_calculations_true_age on public.stress_calculations(true_age_years desc);

-- RLS
alter table public.terrain_classifications enable row level security;
alter table public.turbines enable row level security;
alter table public.stress_calculations enable row level security;

create policy "Service role full access on terrain_classifications"
  on public.terrain_classifications for all using (true) with check (true);
create policy "Service role full access on turbines"
  on public.turbines for all using (true) with check (true);
create policy "Service role full access on stress_calculations"
  on public.stress_calculations for all using (true) with check (true);
