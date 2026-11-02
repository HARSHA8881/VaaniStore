-- Production hardening. Safe to run more than once.

-- Cap stored profile size (the app limits fields too; this protects the DB if the
-- API is bypassed with the public anon key + a user session).
alter table public.shops drop constraint if exists shops_profile_size;
alter table public.shops add constraint shops_profile_size
  check (pg_column_size(profile) < 200000);

-- A published shop must have a name, so public pages never render empty.
alter table public.shops drop constraint if exists shops_published_has_name;
alter table public.shops add constraint shops_published_has_name
  check (not published or coalesce(length(profile ->> 'name'), 0) > 0);

-- Speeds up the public page lookup and the sitemap.
create index if not exists shops_published_updated_idx
  on public.shops (updated_at desc) where published;
