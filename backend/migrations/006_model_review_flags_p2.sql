-- P2: Flag when a submitted inspection finding significantly deviates from prediction
-- (triggers model review for that terrain class + turbine model combination).
-- Run after 005_inspections_p1.sql.

create table if not exists public.model_review_flags (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  turbine_id uuid not null references public.turbines(id) on delete cascade,
  terrain_class text,
  turbine_model text,
  prediction_match text not null check (prediction_match in ('partial', 'not_found')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  notes text
);

create index idx_model_review_flags_turbine_id on public.model_review_flags(turbine_id);
create index idx_model_review_flags_created_at on public.model_review_flags(created_at desc);
create index idx_model_review_flags_resolved on public.model_review_flags(resolved_at) where resolved_at is null;

comment on table public.model_review_flags is 'P2: Flags for model review when inspection finding deviates from AeroStress prediction';

alter table public.model_review_flags enable row level security;
create policy "Service role full access on model_review_flags"
  on public.model_review_flags for all using (true) with check (true);
