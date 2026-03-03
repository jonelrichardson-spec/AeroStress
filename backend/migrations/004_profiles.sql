-- P0: Profiles and roles (asset_manager | technician)
-- Run in Supabase SQL Editor after 003_inspections.sql
-- user_id matches Supabase auth.users.id (UUID)

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null,
  role text not null default 'asset_manager' check (role in ('asset_manager', 'technician')),
  fleet_id uuid references public.fleets(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_profiles_user_id on public.profiles(user_id);
create index idx_profiles_fleet_id on public.profiles(fleet_id);

alter table public.profiles enable row level security;
create policy "Service role full access on profiles"
  on public.profiles for all using (true) with check (true);

-- Optional: trigger to create profile on first sign-up (requires Supabase Auth trigger)
-- For now, profiles are created/updated via API when user first hits GET /profile.
