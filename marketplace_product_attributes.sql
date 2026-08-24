-- Run this migration in Supabase before publishing products from the merchant dashboard.

alter table public.products
  add column if not exists description text,
  add column if not exists image_url text,
  add column if not exists category text,
  add column if not exists paper_stock text,
  add column if not exists paper_weight text,
  add column if not exists print_use_case text,
  add column if not exists printing_type text,
  add column if not exists color_option text,
  add column if not exists minimum_quantity integer,
  add column if not exists production_time text,
  add column if not exists price numeric,
  add column if not exists currency text default 'NGN',
  add column if not exists price_unit text;

alter table public.products
  add column if not exists paper_family text,
  add column if not exists paper_sub_type text,
  add column if not exists paper_weight_gsm integer,
  add column if not exists finish text,
  add column if not exists paper_size text;

alter table public.inventory
  add column if not exists minimum_order_quantity integer default 1;

create index if not exists idx_products_marketplace_attributes
  on public.products (paper_family, paper_weight_gsm, finish, print_use_case, paper_size);

create table if not exists public.paper_types (
  id uuid primary key default gen_random_uuid(),
  paper_family text not null unique,
  sub_types text[] not null default '{}',
  weight_options integer[] not null default '{}',
  finish_options text[] not null default '{}',
  size_options text[] not null default '{}',
  print_use_cases text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.paper_types enable row level security;
drop policy if exists "anyone can read paper types" on public.paper_types;
create policy "anyone can read paper types" on public.paper_types for select using (true);

insert into public.paper_types (paper_family, sub_types, weight_options, finish_options, size_options, print_use_cases)
values
  ('Uncoated Offset', '{Natural,Smooth,Textured}', '{70,80,100,115,150,200}', '{Uncoated,Textured}', '{A4,A3,"27.6 x 39.4 inches"}', '{Books,Brochures,Flyers,Magazines,Documents}'),
  ('Coated Art', '{Gloss,Matte,Silk}', '{115,150,200,250,300,350}', '{Matte,Gloss,Silk,Soft-touch}', '{A4,A3,"27.6 x 39.4 inches","33.1 x 46.8 inches"}', '{Brochures,Flyers,Magazines,Catalogs,Wedding Invitations}'),
  ('Specialty Paper', '{Kraft,NCR,Textured}', '{80,100,120,150,200,250}', '{Textured,Uncoated}', '{A4,A3}', '{Certificates,Packaging,Documents}'),
  ('Board & Packaging', '{Cardstock,"Folding Box Board",Corrugated}', '{200,250,300,350}', '{Matte,Gloss,Textured}', '{A3,"27.6 x 39.4 inches","33.1 x 46.8 inches"}', '{Packaging,Labels,Certificates}'),
  ('Photo Paper', '{Gloss,Matte,Lustre}', '{180,200,250}', '{Gloss,Matte,Soft-touch}', '{A4,A3}', '{Photos}'),
  ('Label Paper', '{Gloss,Matte,Clear}', '{80,100,150,200}', '{Gloss,Matte,Uncoated}', '{A4,A3}', '{Labels,Stickers,Packaging}'),
  ('Synthetic Paper', '{PP,PET}', '{100,150,200}', '{Matte,Gloss,Soft-touch}', '{A4,A3}', '{Labels,Packaging}')
on conflict (paper_family) do nothing;

-- Keep the existing buyer query's use_cases array compatible with the new single
-- marketplace use-case field used by the controlled merchant form.
update public.products
set use_cases = array[print_use_case]
where print_use_case is not null
  and (use_cases is null or cardinality(use_cases) = 0);