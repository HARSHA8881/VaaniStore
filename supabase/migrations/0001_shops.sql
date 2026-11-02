-- VaaniStore schema: one shop per owner, public read for published shops.
-- Run in Supabase: Dashboard → SQL Editor → paste → Run (or `supabase db push`).

create table if not exists public.shops (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null unique references auth.users (id) on delete cascade, -- MVP: 1 shop per owner
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  profile     jsonb not null,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Keep updated_at honest without trusting the client.
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shops_set_updated_at on public.shops;
create trigger shops_set_updated_at before update on public.shops
for each row execute function public.set_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────
-- Without RLS, the public anon key could read/write every row.
alter table public.shops enable row level security;

drop policy if exists "Anyone can read published shops" on public.shops;
create policy "Anyone can read published shops" on public.shops
  for select using (published = true);

drop policy if exists "Owners can read their shop" on public.shops;
create policy "Owners can read their shop" on public.shops
  for select to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists "Owners can create their shop" on public.shops;
create policy "Owners can create their shop" on public.shops
  for insert to authenticated with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can update their shop" on public.shops;
create policy "Owners can update their shop" on public.shops
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can delete their shop" on public.shops;
create policy "Owners can delete their shop" on public.shops
  for delete to authenticated using ((select auth.uid()) = owner_id);

-- RLS hides other owners' unpublished rows, so a normal query can't tell whether a
-- slug is taken. This function checks ALL rows but only returns true/false.
create or replace function public.is_slug_available(p_slug text) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (
    select 1 from public.shops
    where slug = p_slug and owner_id is distinct from (select auth.uid())
  );
$$;
revoke all on function public.is_slug_available(text) from public;
revoke all on function public.is_slug_available(text) from anon;
grant execute on function public.is_slug_available(text) to authenticated;

-- ── Storage: product photos ─────────────────────────────────────────
-- Public bucket (photos appear on public pages). 500 KB cap; the client compresses to <300 KB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 512000, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Owners may only write inside their own folder: product-images/<user id>/...
drop policy if exists "Owners upload own product images" on storage.objects;
create policy "Owners upload own product images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Owners update own product images" on storage.objects;
create policy "Owners update own product images" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Owners delete own product images" on storage.objects;
create policy "Owners delete own product images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
