-- Run this in the Supabase SQL editor to set up the registrations table.

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  admission_number text not null,
  ip_address text,
  created_at timestamptz not null default now()
);

alter table registrations enable row level security;

-- Public inserts are NOT allowed directly. All writes go through the
-- "register" Edge Function (which uses the service role key), so it can
-- enforce IP rate limiting and CAPTCHA verification before writing.
drop policy if exists "Allow public insert" on registrations;

-- Prevent duplicate registrations by email.
create unique index if not exists registrations_email_key on registrations (email);

-- Speeds up the per-IP rate limit lookup in the Edge Function.
create index if not exists registrations_ip_created_idx on registrations (ip_address, created_at);
