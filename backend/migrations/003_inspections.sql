-- P0: Inspections for technician reports and blind-spot tracking
-- Run in Supabase SQL Editor after 002_day1_schema.sql

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  turbine_id uuid not null references public.turbines(id) on delete cascade,
  conducted_at timestamptz not null default now(),
  inspector_name text,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  -- Findings: component, condition, severity (1-5), notes (flexible for future fields)
  component_inspected text,
  condition_found text,
  severity_rating integer check (severity_rating is null or (severity_rating >= 1 and severity_rating <= 5)),
  notes text,
  submitted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_inspections_turbine_id on public.inspections(turbine_id);
create index idx_inspections_status on public.inspections(status);
create index idx_inspections_conducted_at on public.inspections(conducted_at desc);

alter table public.inspections enable row level security;
create policy "Service role full access on inspections"
  on public.inspections for all using (true) with check (true);
