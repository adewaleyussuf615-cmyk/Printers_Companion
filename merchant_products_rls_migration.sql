-- Allow authenticated merchants to create marketplace product specifications.
-- Products remain protected by RLS and are not writable by anonymous users.

alter table public.products enable row level security;

create or replace function public.is_authenticated_merchant()
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'merchant'
    or coalesce(auth.jwt() ->> 'role', '') = 'merchant';
$$;

revoke all on function public.is_authenticated_merchant() from public;
grant execute on function public.is_authenticated_merchant() to authenticated;

drop policy if exists "Merchants can create products" on public.products;

create policy "Merchants can create products"
on public.products
for insert
to authenticated
with check (public.is_authenticated_merchant());

create or replace function public.ensure_merchant_profile(business_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  current_user_id uuid := auth.uid();
  merchant_uuid uuid;
  requested_name text := nullif(trim(business_name), '');
begin
  if current_user_id is null or not public.is_authenticated_merchant() then
    raise exception 'Only authenticated merchants can create a merchant profile';
  end if;

  select id into merchant_uuid
  from public.merchants
  where owner_id = current_user_id
  order by created_at asc nulls last
  limit 1;

  if merchant_uuid is null and requested_name is not null then
    insert into public.merchants (owner_id, business_name, is_active)
    values (current_user_id, requested_name, true)
    returning id into merchant_uuid;
  end if;

  return merchant_uuid;
end;
$$;

revoke all on function public.ensure_merchant_profile(text) from public;
grant execute on function public.ensure_merchant_profile(text) to authenticated;

alter table public.merchants enable row level security;

drop policy if exists "Users can create their own merchant profile" on public.merchants;

create policy "Users can create their own merchant profile"
on public.merchants
for insert
to authenticated
with check (owner_id = auth.uid());
