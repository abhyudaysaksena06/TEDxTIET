-- Run this ONLY if you already created the registrations table earlier
-- (from the original schema.sql) and now need to add rate-limiting support.
-- If you're setting up fresh, just run schema.sql instead — it already
-- includes these changes.

alter table registrations add column if not exists ip_address text;

drop policy if exists "Allow public insert" on registrations;

create index if not exists registrations_ip_created_idx on registrations (ip_address, created_at);
