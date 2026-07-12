# Quesos La Colina — Sitio web

Sitio institucional de **Quesos La Colina**, fábrica artesanal de quesos y yogur ubicada
en Mosquera, Cundinamarca. Construido con **Astro** + **Supabase**, optimizado para
rendimiento, accesibilidad y SEO.

![Astro](https://img.shields.io/badge/Astro-7-FF5D01?logo=astro&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## Contenido

- [Stack](#stack)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Inicio rápido](#inicio-rápido)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos](#base-de-datos)
- [Gestión del catálogo](#gestión-del-catálogo)
- [Formulario de contacto](#formulario-de-contacto)
- [Scripts disponibles](#scripts-disponibles)
- [Despliegue](#despliegue)
- [Licencia](#licencia)

## Stack

- **[Astro 7](https://astro.build/)** — generador estático con islas React selectivas.
- **[TypeScript](https://www.typescriptlang.org/)** en modo estricto (`astro/tsconfigs/strict`).
- **[Tailwind CSS v4](https://tailwindcss.com/)** vía `@tailwindcss/vite` (sin `tailwind.config.js`).
- **[React 19](https://react.dev/)** solo donde aporta valor (filtro del catálogo y formulario).
- **[Supabase](https://supabase.com/)** como backend (Postgres + Storage + RLS).
- **[React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)** para validación.
- **[Prettier](https://prettier.io/)** + `prettier-plugin-astro` para formato consistente.

## Estructura del proyecto

```
.
├── public/
│   ├── favicon.ico
│   ├── favicon.svg
│   └── og-image.svg            # Imagen para Open Graph / redes sociales
├── src/
│   ├── components/
│   │   ├── cart/               # FAB y drawer del pedido (isla React)
│   │   ├── contact/            # Formulario (isla React)
│   │   ├── hero/               # Productos destacados del Hero
│   │   ├── layout/             # Navbar + Footer
│   │   ├── products/           # ProductCard, ProductModal, CategoryFilter
│   │   ├── sections/           # Hero, About, Services, Catalog, Contact
│   │   └── ui/                 # Container, SectionTitle
│   ├── layouts/
│   │   └── BaseLayout.astro    # SEO, JSON-LD, Navbar + Footer
│   ├── lib/
│   │   ├── cart.ts             # Estado del pedido (localStorage)
│   │   ├── contact.ts          # submitContact con honeypot + timing
│   │   ├── products.ts         # getActiveProducts / getFeaturedProducts
│   │   ├── site.ts             # Constantes del sitio y helpers
│   │   ├── supabase.ts         # Cliente Supabase (singleton)
│   │   ├── validation/         # Esquema Zod del formulario
│   │   └── whatsapp.ts         # Mensaje + URL para pedidos por WhatsApp
│   ├── pages/
│   │   └── index.astro         # Página única del sitio
│   ├── scripts/
│   │   └── reveal.ts           # Reveal on scroll, contadores y navbar
│   ├── styles/
│   │   └── global.css          # Tailwind v4 + tokens del tema
│   └── types/                  # Tipos compartidos (product, cart, contact)
├── supabase/
│   ├── schema.sql              # Tablas products + contact_submissions, RLS, triggers
│   └── seed.sql                # Productos de ejemplo
├── .editorconfig
├── .env.example
├── .gitignore
├── .nvmrc
├── .prettierrc
├── .prettierignore
├── AGENTS.md                   # Notas para asistentes / IDE
└── CLAUDE.md -> AGENTS.md
```

## Inicio rápido

```bash
nvm use            # usa la versión de Node definida en .nvmrc (>= 22.12)
npm install
cp .env.example .env
# editar .env con PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY
npm run dev        # http://localhost:4321
```

## Variables de entorno

Copia `.env.example` a `.env` y completa:

```
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Estas variables **se incrustan en el build** (prefijo `PUBLIC_`), por lo que el sitio
sigue siendo 100 % estático en producción.

## Base de datos

Aplica el esquema con la [CLI de Supabase](https://supabase.com/docs/guides/cli):

```bash
supabase db push
```

o pegando `supabase/schema.sql` en el editor SQL del dashboard. Tablas principales:

- **`products`** — catálogo público (solo lectura para `anon` cuando `is_active = true`).
- **`contact_submissions`** — mensajes del formulario (insert público + rate-limit + honeypot).

Incluye:

- Función `check_submission_rate(ip_hash)` para limitar envíos por IP.
- Trigger `set_updated_at()` para mantener la marca de actualización.
- Bucket público `products` en Storage.

## Gestión del catálogo

Para añadir o actualizar productos solo necesitas insertarlos en Supabase:

```sql
insert into public.products (
  name, slug, short_description, image_url, category, price, display_order
) values (
  'Queso Nuevo',
  'queso-nuevo',
  'Descripción corta (10–280 caracteres).',
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/products/queso-nuevo.webp',
  'Quesos',
  15000,
  10
);
```

Si quieres imágenes alojadas en Supabase Storage, súbelas al bucket `products` y
guarda la URL pública en `image_url`. El sitio hace `select('*')` ordenado por
`display_order` y `name`.

## Formulario de contacto

- **Validación**: cliente (Zod + RHF) y servidor (`CHECK` + `check_submission_rate`).
- **Anti-spam**: honeypot (`hp_field`) + trampa de tiempo (mínimo 3 s) + rate-limit por IP.
- **Notificaciones**: con un trigger o Edge Function puedes reenviar cada nuevo registro
  por correo o WhatsApp.

## Scripts disponibles

| Script                 | Acción                                                                 |
| ---------------------- | ---------------------------------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo con HMR ([http://localhost:4321](http://localhost:4321)) |
| `npm run start`        | Alias de `dev`                                                         |
| `npm run build`        | Build de producción a `dist/`                                          |
| `npm run preview`      | Servir el build localmente                                             |
| `npm run format`       | Formatea todo el código con Prettier                                   |
| `npm run format:check` | Comprueba el formato sin escribir                                      |
| `npm run astro`        | Acceso directo al CLI de Astro                                         |

## Despliegue

El sitio es **100 % estático**. Funciona tal cual en:

- [Vercel](https://vercel.com/), [Netlify](https://www.netlify.com/), [Cloudflare Pages](https://pages.cloudflare.com/).
- [GitHub Pages](https://pages.github.com/) con un workflow que ejecute `npm run build`
  y publique `dist/`.

Solo necesitas configurar las variables `PUBLIC_*`; el sitio se regenera en cada build.

## Licencia

[MIT](./LICENSE) © 2026 Uber Cardoso.
