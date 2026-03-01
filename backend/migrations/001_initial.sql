-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query

-- Fleets: groups of turbines per operator
create table if not exists public.fleets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Turbines: individual units with GPS, model, and stress data
create table if not exists public.turbines (
  id uuid primary key default gen_random_uuid(),
  fleet_id uuid not null references public.fleets(id) on delete cascade,
  identifier text,
  latitude double precision not null,
  longitude double precision not null,
  model text,
  calendar_age_years double precision not null,
  terrain_class text check (terrain_class in ('flat', 'moderate', 'complex', 'coastal')),
  stress_multiplier double precision default 1.0,
  true_age_years double precision,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_turbines_fleet_id on public.turbines(fleet_id);
create index if not exists idx_turbines_true_age on public.turbines(true_age_years desc);

-- Enable RLS (optional; service_role bypasses it)
alter table public.fleets enable row level security;
alter table public.turbines enable row level security;

-- Allow service role full access
create policy "Service role full access on fleets"
  on public.fleets for all
  using (true)
  with check (true);

create policy "Service role full access on turbines"
  on public.turbines for all
  using (true)
  with check (true);
