# Quesos La Colina — Sitio web

Sitio de **Quesos La Colina**, empresa familiar comercializadora de productos lácteos
ubicada en Mosquera, Cundinamarca. Construido con **Astro** + **Supabase**, optimizado para
rendimiento, accesibilidad y SEO.

![Astro](https://img.shields.io/badge/Astro-7-FF5D01?logo=astro&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

Sitio en producción: **<https://buying-cheese.pages.dev>**

---

## Funcionalidades

- **Catálogo público** con filtros por categoría, modal de detalle, pedido por WhatsApp.
- **Hero con productos destacados** que se actualiza en vivo desde Supabase.
- **Panel de administración** (`/admin`) con acceso **exclusivamente por Google OAuth** y allowlist de correos:
  - CRUD de productos (crear, editar, eliminar) con upload de imágenes a Supabase Storage.
  - Toggle de destacado (Hero) y visibilidad por producto.
  - Slug autogenerado a partir del nombre, categorías con autocompletar.
  - Confirmaciones destructivas vía modal a medida.
  - Sesión persistente en `localStorage` (PKCE).
- **Pedido por WhatsApp** con resumen del carrito.
- **100 % estático** — Astro `output: 'static'`, sin SSR.

---

## Inicio rápido

```bash
nvm use            # usa la versión de Node definida en .nvmrc
npm install
cp .env.example .env
# editar .env con PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY
npm run dev        # http://localhost:4321/
```

---

## Variables de entorno

Copia `.env.example` a `.env` y completa:

```
PUBLIC_SITE_URL=http://localhost:4322
PUBLIC_BASE_PATH=/buying_cheese
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

> En **Cloudflare Pages** (producción) `PUBLIC_BASE_PATH` debe ser `/` para que
> los assets se sirvan desde la raíz. El valor `/buying_cheese` es solo para
> `npm run dev` local.

Estas variables **se incrustan en el build** (prefijo `PUBLIC_`), por lo que el sitio
sigue siendo 100 % estático en producción.

---

## Base de datos

Aplica el esquema con la [CLI de Supabase](https://supabase.com/docs/guides/cli):

```bash
supabase db push
```

Tablas principales:

- **`products`** — catálogo público.
  Incluye trigger `set_updated_at()`, columnas `is_featured` y `featured_order`
  (productos del Hero), y bucket público `products` en Storage.
- **`admin_users`** — allowlist de correos autorizados para el panel.
  Insertar aquí los correos de cada administrador.

Hooks y seguridad:

- **`before_user_created_hook`** — rechaza el alta de cualquier correo que no
  esté en `admin_users` (`is_active = true`). La función ya está creada en la
  base de datos; falta activarla en _Authentication → Hooks_ del dashboard.
- **`is_admin()`** — valida la allowlist en el servidor: sin una fila activa en
  `admin_users` no hay escrituras, aunque se acceda directamente a la API.
- **El panel (navegador)** — además de la allowlist, exige que la sesión se
  haya iniciado con Google (`app_metadata.provider = 'google'`).
- **RLS en `storage.objects`** (bucket `products`): INSERT/UPDATE/DELETE solo
  para administradores.

### Acceso al panel: Google + allowlist

El panel `/admin` **solo** admite cuentas de Google que estén en la allowlist.
Hay dos capas: el hook de Supabase bloquea el alta de usuarios no autorizados
y las políticas RLS rechazan cualquier escritura que no venga de un
administrador. El panel en el navegador también exige que la sesión sea de
Google.

Configuración en el Dashboard de Supabase (una sola vez):

1. **Authentication → Hooks** → activa _Before User Created_ y selecciona
   `public.before_user_created_hook`.
2. **Authentication → Providers → Email** → **desactiva** el proveedor de
   correo, dejando Google como único método de acceso.
3. **Authentication → URL Configuration** → deja únicamente las URLs del sitio
   (por ejemplo `https://lacteoslacolina.com/admin/`).
4. **Database → Table Editor → `admin_users`** → inserta los correos
   autorizados (`is_active = true`).

---

## Scripts disponibles

| Script                 | Acción                                                                          |
| ---------------------- | ------------------------------------------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo con HMR ([http://localhost:4322](http://localhost:4322)) |
| `npm run start`        | Alias de `dev`                                                                  |
| `npm run build`        | Build de producción a `dist/`                                                   |
| `npm run preview`      | Servir el build localmente                                                      |
| `npm run check`        | `astro check` — TypeScript estricto en `.ts/.tsx/.astro`                        |
| `npm run format`       | Formatea todo el código con Prettier                                            |
| `npm run format:check` | Comprueba el formato sin escribir                                               |
| `npm run astro`        | Acceso directo al CLI de Astro                                                  |

---

## Despliegue

El sitio se publica en **Cloudflare Pages** desde `main`.

### Configuración del proyecto en Cloudflare Pages

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node version:** 22 o superior (compatible con `engines`)

### Variables de entorno

Define estas en _Settings → Environment variables_ (Production y Preview):

| Variable                   | Valor                                                 |
| -------------------------- | ----------------------------------------------------- |
| `PUBLIC_SITE_URL`          | URL del sitio (ej. `https://buying-cheese.pages.dev`) |
| `PUBLIC_BASE_PATH`         | `/` (raíz, no uses subpath)                           |
| `PUBLIC_SUPABASE_URL`      | URL de tu proyecto Supabase                           |
| `PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase                                  |

> Si en el build faltan las claves de Supabase, el catálogo sale vacío.

---

## Licencia

[MIT](./LICENSE) © 2026 Uber Cardoso.
