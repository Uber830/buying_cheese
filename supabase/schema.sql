-- =====================================================
-- Quesos La Colina – Schema inicial
-- =====================================================

create extension if not exists "pgcrypto";

drop table if exists public.contact_submissions cascade;
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
-- Tabla: contact_submissions
-- =====================================================
create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null
    check (email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'),
  phone text not null
    check (phone ~ '^[+0-9 ()\-]{7,20}$'),
  message text not null check (char_length(message) between 10 and 2000),
  hp_field text,
  render_time_ms integer,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index contact_ip_hash_created_idx
  on public.contact_submissions (ip_hash, created_at desc);

-- =====================================================
-- Función anti-spam: limita submits por IP hash
-- =====================================================
create or replace function public.check_submission_rate(p_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  if p_ip_hash is null or p_ip_hash = '' then
    return true;
  end if;

  select count(*) into recent_count
  from public.contact_submissions
  where ip_hash = p_ip_hash
    and created_at > now() - interval '10 minutes';

  return recent_count < 3;
end;
$$;

-- =====================================================
-- RLS
-- =====================================================
alter table public.products enable row level security;
alter table public.contact_submissions enable row level security;

create policy "products_public_read"
  on public.products
  for select
  to anon, authenticated
  using (is_active = true);

create policy "contact_public_insert"
  on public.contact_submissions
  for insert
  to anon
  with check (
    hp_field is null
    and (render_time_ms is null or render_time_ms >= 3000)
    and check_submission_rate(ip_hash)
  );

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
