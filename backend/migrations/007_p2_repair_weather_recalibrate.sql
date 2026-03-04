-- P2: Unstructured repair notes, repair recommendations + completions, stress overrides, maintenance import
-- Run after 006_model_review_flags_p2.sql

-- Unstructured repair notes (tech noticed something during a routine visit, not AeroStress-initiated)
create table if not exists public.repair_notes (
  id uuid primary key default gen_random_uuid(),
  turbine_id uuid not null references public.turbines(id) on delete cascade,
  notes text not null,
  reported_at timestamptz not null default now(),
  source text not null default 'unstructured' check (source in ('unstructured', 'import')),
  created_at timestamptz not null default now()
);
create index idx_repair_notes_turbine_id on public.repair_notes(turbine_id);
create index idx_repair_notes_reported_at on public.repair_notes(reported_at desc);
alter table public.repair_notes enable row level security;
create policy "Service role full access on repair_notes" on public.repair_notes for all using (true) with check (true);

-- Repair recommendation per inspection (P2: report includes recommendation + cost)
create table if not exists public.inspection_repair_recommendations (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade unique,
  recommended_action text,
  estimated_cost_low integer,
  estimated_cost_high integer,
  created_at timestamptz not null default now()
);
create index idx_inspection_repair_rec_inspection on public.inspection_repair_recommendations(inspection_id);
alter table public.inspection_repair_recommendations enable row level security;
create policy "Service role full access on inspection_repair_recommendations" on public.inspection_repair_recommendations for all using (true) with check (true);

-- Track when a recommended repair was completed (P2: close the loop)
create table if not exists public.repair_completions (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  completed_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);
create index idx_repair_completions_inspection on public.repair_completions(inspection_id);
alter table public.repair_completions enable row level security;
create policy "Service role full access on repair_completions" on public.repair_completions for all using (true) with check (true);

-- Recalibrate stress multipliers from ground truth (P2: override by terrain + model)
create table if not exists public.stress_multiplier_overrides (
  terrain_class text not null,
  turbine_model text not null default '',
  multiplier double precision not null check (multiplier > 0),
  updated_at timestamptz not null default now(),
  primary key (terrain_class, turbine_model)
);
comment on table public.stress_multiplier_overrides is 'P2: Override stress multiplier by terrain_class + turbine_model (empty string = class-wide)';
alter table public.stress_multiplier_overrides enable row level security;
create policy "Service role full access on stress_multiplier_overrides" on public.stress_multiplier_overrides for all using (true) with check (true);
