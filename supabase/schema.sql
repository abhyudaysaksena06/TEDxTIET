-- Run this in the Supabase SQL editor to set up the registrations table.

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  roll_number text not null,
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

-- Admin portal. The "admin" Edge Function is the only thing that touches
-- these: row level security is on and there are deliberately no policies.
-- Credentials are never committed: add the admin_users row by hand, with a
-- PBKDF2-SHA256 hash.
create table if not exists admin_users (
  username text primary key,
  password_hash text not null,
  salt text not null,
  iterations integer not null
);

create table if not exists admin_sessions (
  token_hash text primary key,
  expires_at timestamptz not null
);

create table if not exists admin_login_failures (
  id bigint generated always as identity primary key,
  ip_address text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_login_failures_created_idx on admin_login_failures (created_at);

alter table admin_users enable row level security;
alter table admin_sessions enable row level security;
alter table admin_login_failures enable row level security;
