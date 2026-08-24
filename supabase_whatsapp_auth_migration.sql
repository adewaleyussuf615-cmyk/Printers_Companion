-- Printers Companion production WhatsApp authentication improvements

create extension if not exists pgcrypto;

create or replace function public.normalize_ng_phone(input text)
returns text language plpgsql immutable as $$
declare n text := regexp_replace(coalesce(input, ''), '\D', '', 'g');
begin
 if n = '' then raise exception 'A WhatsApp number is required'; end if;
 if left(n,1)='0' then n := '234' || substring(n from 2); end if;
 if left(n,3) <> '234' then n := '234' || n; end if;
 if length(n) <> 13 then raise exception 'Invalid Nigerian WhatsApp number'; end if;
 return '+' || n;
end; $$;

alter table public.profiles
	add column if not exists whatsapp_number text,
	add column if not exists whatsapp_verified boolean not null default false;

alter table public.merchants
	add column if not exists business_phone text;

create table if not exists public.whatsapp_verifications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete cascade,
 token text unique not null,
 status text not null default 'pending',
 whatsapp_number text,
 expires_at timestamptz not null,
 verified_at timestamptz,
 created_at timestamptz default now(),
 attempts integer not null default 0
);

alter table public.whatsapp_verifications enable row level security;

drop policy if exists "users see own whatsapp verification" on public.whatsapp_verifications;
create policy "users see own whatsapp verification" on public.whatsapp_verifications
for select using (
	auth.uid() = user_id
	or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop function if exists public.create_whatsapp_verification();
drop function if exists public.approve_whatsapp_verification(uuid, text);
drop function if exists public.reject_whatsapp_verification(uuid);

create or replace function public.create_whatsapp_verification()
returns public.whatsapp_verifications
language plpgsql security definer set search_path = public as $$
declare rec public.whatsapp_verifications;
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 if exists (
	 select 1 from public.profiles
	 where id = auth.uid() and coalesce(whatsapp_verified, false)
 ) then raise exception 'WhatsApp is already verified'; end if;
 if exists (
	 select 1 from public.whatsapp_verifications
	 where user_id = auth.uid() and status = 'pending' and expires_at > now()
 ) then raise exception 'A WhatsApp verification is already pending'; end if;
 update public.whatsapp_verifications set status='expired' where user_id=auth.uid() and status='pending';
 insert into public.whatsapp_verifications(user_id,token,status,expires_at)
 values(auth.uid(),'PWZ-'||upper(substr(md5(random()::text),1,8)),'pending',now()+interval '30 minutes')
 returning * into rec;
 return rec;
end; $$;

create or replace function public.approve_whatsapp_verification(
	p_verification_id uuid,
	p_whatsapp_number text
)
returns public.whatsapp_verifications
language plpgsql security definer set search_path = public as $$
declare rec public.whatsapp_verifications;
declare normalized_number text;
begin
 if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
	 raise exception 'Administrator access required';
 end if;
 normalized_number := public.normalize_ng_phone(p_whatsapp_number);
 select * into rec from public.whatsapp_verifications
 where id = p_verification_id for update;
 if rec.id is null then raise exception 'Verification request not found'; end if;
 if rec.status <> 'pending' then raise exception 'Verification request is no longer pending'; end if;
 if rec.expires_at <= now() then
	 update public.whatsapp_verifications set status = 'expired' where id = rec.id;
	 raise exception 'Verification request has expired';
 end if;
 update public.whatsapp_verifications
 set status = 'verified', whatsapp_number = normalized_number, verified_at = now()
 where id = rec.id
 returning * into rec;
 update public.profiles
 set whatsapp_number = normalized_number, whatsapp_verified = true
 where id = rec.user_id;
 return rec;
end; $$;

create or replace function public.reject_whatsapp_verification(p_verification_id uuid)
returns public.whatsapp_verifications
language plpgsql security definer set search_path = public as $$
declare rec public.whatsapp_verifications;
begin
 if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
	 raise exception 'Administrator access required';
 end if;
 update public.whatsapp_verifications
 set status = 'rejected'
 where id = p_verification_id and status = 'pending'
 returning * into rec;
 if rec.id is null then raise exception 'Verification request is no longer pending'; end if;
 return rec;
end; $$;

revoke all on function public.approve_whatsapp_verification(uuid, text) from public;
revoke all on function public.reject_whatsapp_verification(uuid) from public;
grant execute on function public.approve_whatsapp_verification(uuid, text) to authenticated;
grant execute on function public.reject_whatsapp_verification(uuid) to authenticated;

-- Checkout can enforce this flag before transactions
-- profiles.whatsapp_verified boolean should be added if missing
-- merchants.phone remains business contact; profiles.phone is account contact

create index if not exists idx_whatsapp_verifications_token on public.whatsapp_verifications(token);
create index if not exists idx_whatsapp_verifications_user on public.whatsapp_verifications(user_id);

update public.whatsapp_verifications w
set status = 'expired'
where w.status = 'pending'
	and exists (
		select 1
		from public.whatsapp_verifications newer
		where newer.user_id = w.user_id
			and newer.status = 'pending'
			and newer.created_at > w.created_at
	);

create unique index if not exists idx_one_pending_whatsapp_verification
	on public.whatsapp_verifications(user_id)
	where status = 'pending';
