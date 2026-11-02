-- Anonymous shop analytics: visits, taps and orders. No IPs, no cookies, no names.

create table if not exists public.shop_events (
  id          bigint generated always as identity primary key,
  shop_id     uuid not null references public.shops (id) on delete cascade,
  type        text not null check (type in ('view', 'call', 'whatsapp', 'directions', 'order', 'upi')),
  -- Orders only: [{"n": "Parle-G", "q": 2}, ...] (product name + quantity, nothing about the customer)
  items       jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists shop_events_shop_time_idx
  on public.shop_events (shop_id, created_at desc);

alter table public.shop_events enable row level security;

-- Owners can read their own shop's events. Nobody can insert/update/delete directly.
drop policy if exists "Owners read their shop events" on public.shop_events;
create policy "Owners read their shop events" on public.shop_events
  for select to authenticated
  using (exists (
    select 1 from public.shops s
    where s.id = shop_events.shop_id and s.owner_id = (select auth.uid())
  ));

-- The only way to record an event. Checks the shop is published, cleans the input,
-- and caps each shop at 120 events/minute so nobody can flood a shop's numbers.
create or replace function public.track_event(p_slug text, p_type text, p_items jsonb default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_shop uuid;
begin
  if p_type not in ('view', 'call', 'whatsapp', 'directions', 'order', 'upi') then
    return;
  end if;

  select id into v_shop from public.shops where slug = p_slug and published;
  if v_shop is null then
    return;
  end if;

  if (select count(*) from public.shop_events
      where shop_id = v_shop and created_at > now() - interval '1 minute') >= 120 then
    return;
  end if;

  if p_type <> 'order' or p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) > 50 or pg_column_size(p_items) > 4000 then
    p_items := null;
  end if;

  insert into public.shop_events (shop_id, type, items) values (v_shop, p_type, p_items);
end;
$$;

revoke all on function public.track_event(text, text, jsonb) from public;
grant execute on function public.track_event(text, text, jsonb) to anon, authenticated;
