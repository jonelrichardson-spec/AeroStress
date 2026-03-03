-- P1: prediction_match (confirmed/partial/not_found) and attachment_url for inspections
-- Run after 003_inspections.sql

alter table public.inspections
  add column if not exists prediction_match text check (prediction_match in ('confirmed', 'partial', 'not_found')),
  add column if not exists attachment_url text;

comment on column public.inspections.prediction_match is 'P1: Whether technician finding matched AeroStress prediction';
comment on column public.inspections.attachment_url is 'P1: URL of attached photo/video (e.g. Supabase Storage)';

-- Create Storage bucket "inspection-attachments" in Supabase Dashboard (Storage) for POST /inspections/{id}/attachment.
