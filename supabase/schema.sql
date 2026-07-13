-- =====================================================
-- Quesos La Colina – Schema inicial
-- =====================================================

create extension if not exists "pgcrypto";

drop table if exists public.products cascade;

-- =====================================================
-- Tabla: products
-- =====================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text unique not null,
  short_description text not null check (char_length(short_description) between 10 and 280),
  description text,
  image_url text not null,
  category text not null,
  price numeric(10, 2),
  stock integer default null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_active_order_idx
  on public.products (is_active, display_order, name);

create index products_category_idx
  on public.products (category);

-- =====================================================
-- RLS
-- =====================================================
alter table public.products enable row level security;

create policy "products_public_read"
  on public.products
  for select
  to anon, authenticated
  using (is_active = true);

-- =====================================================
-- Bucket público de imágenes
-- =====================================================
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

create policy "products_bucket_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'products');

-- =====================================================
-- Trigger: updated_at automático
-- =====================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();
