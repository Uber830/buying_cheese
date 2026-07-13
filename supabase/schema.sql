-- =====================================================
-- Quesos La Colina – Schema (idempotente)
-- =====================================================
-- Aplica con: supabase db push
-- o pegando este archivo en el SQL editor del dashboard.
--
-- Como los cambios de catálogo se gestionan directamente desde Supabase,
-- este script es idempotente: crea tablas/columnas/políticas/índices que
-- falten sin tirar datos existentes.

create extension if not exists "pgcrypto";

-- =====================================================
-- Tabla: products
-- =====================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text unique not null,
  short_description text not null check (char_length(short_description) between 10 and 280),
  description text,
  image_url text not null,
  category text not null,
  price numeric(10, 2),
  stock integer default null,
  unit_label text not null default 'unidad',
  is_active boolean not null default true,
  display_order integer not null default 0,
  is_featured boolean not null default false,
  featured_order integer default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Columnas añadidas por gestión directa en el dashboard (idempotente)
alter table public.products
  add column if not exists stock integer default null,
  add column if not exists unit_label text not null default 'unidad',
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_order integer default null;

create index if not exists products_active_order_idx
  on public.products (is_active, display_order, name);

create index if not exists products_category_idx
  on public.products (category);

create index if not exists products_featured_idx
  on public.products (is_featured, featured_order)
  where is_featured = true;

-- =====================================================
-- RLS
-- =====================================================
alter table public.products enable row level security;

drop policy if exists "products_public_read" on public.products;
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

drop policy if exists "products_bucket_public_read" on storage.objects;
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

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();
