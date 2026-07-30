-- =====================================================
-- Quesos La Colina – Módulo administrativo
-- =====================================================
-- Crea el sistema de acceso restringido para administradores:
--   1. Tabla admin_users (allowlist por correo)
--   2. Función is_admin() consultada por RLS
--   3. Políticas RLS para CRUD admin en products
--   4. Políticas Storage (products bucket) para admin
--   5. Before User Created Hook (rechaza correos no autorizados)
--
-- Tras aplicar esta migración debes:
--   a) Habilitar Google OAuth en Authentication > Providers.
--   b) Authentication > Hooks > "Before User Created" > seleccionar
--      public.before_user_created_hook.
--   c) Insertar los correos autorizados en public.admin_users.

-- =====================================================
-- 1. Tabla de administradores (allowlist por correo)
-- =====================================================
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null check (char_length(email) between 3 and 254),
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_users_email_idx
  on public.admin_users (lower(email))
  where is_active = true;

alter table public.admin_users enable row level security;

drop policy if exists "admin_users_self_read" on public.admin_users;
create policy "admin_users_self_read"
  on public.admin_users
  for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

revoke insert, update, delete on public.admin_users from authenticated, anon;

-- =====================================================
-- 2. Función is_admin() – chequea si el usuario actual es admin
-- =====================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select is_active
    from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    limit 1
  ), false);
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- Trigger updated_at para admin_users
drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

-- =====================================================
-- 3. RLS para products: lectura pública + CRUD admin
-- =====================================================
drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_select"
  on public.products
  for select
  to authenticated
  using (public.is_admin());

create policy "products_admin_insert"
  on public.products
  for insert
  to authenticated
  with check (public.is_admin());

create policy "products_admin_update"
  on public.products
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "products_admin_delete"
  on public.products
  for delete
  to authenticated
  using (public.is_admin());

-- =====================================================
-- 4. Storage: CRUD admin sobre el bucket "products"
-- =====================================================
drop policy if exists "products_bucket_admin_insert" on storage.objects;
create policy "products_bucket_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'products'
    and public.is_admin()
  );

drop policy if exists "products_bucket_admin_update" on storage.objects;
create policy "products_bucket_admin_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'products'
    and public.is_admin()
  )
  with check (
    bucket_id = 'products'
    and public.is_admin()
  );

drop policy if exists "products_bucket_admin_delete" on storage.objects;
create policy "products_bucket_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'products'
    and public.is_admin()
  );

-- =====================================================
-- 5. Before User Created Hook (allowlist de correos)
-- =====================================================
-- El hook se ejecuta antes de crear el usuario en auth.users.
-- Devuelve '{}' para permitir o { error: { http_code, message } } para rechazar.
create or replace function public.before_user_created_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  user_email text;
  provider text;
  is_allowed boolean;
begin
  user_email := lower(coalesce(event -> 'user' ->> 'email', ''));
  provider := lower(coalesce(event -> 'user' -> 'app_metadata' ->> 'provider', ''));

  if user_email = '' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 422,
        'message', 'No se proporcionó un correo para validar el acceso.'
      )
    );
  end if;

  select exists (
    select 1
    from public.admin_users
    where lower(email) = user_email
      and is_active = true
  ) into is_allowed;

  if not is_allowed then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Este correo no está autorizado para acceder al panel de administración.'
      )
    );
  end if;

  -- Permitir registro
  raise log '[before_user_created_hook] allowed % via %', user_email, provider;
  return '{}'::jsonb;
end;
$$;

grant execute on function public.before_user_created_hook to supabase_auth_admin;
revoke execute on function public.before_user_created_hook from authenticated, anon, public;

-- supabase_auth_admin necesita poder leer admin_users para el hook
grant usage on schema public to supabase_auth_admin;
grant select on public.admin_users to supabase_auth_admin;
