# Quesos La Colina — Sitio web

Sitio institucional de **Quesos La Colina**, fábrica artesanal de quesos y yogur ubicada
en Mosquera, Cundinamarca. Construido con **Astro** + **Supabase**, optimizado para
rendimiento, accesibilidad y SEO.

![Astro](https://img.shields.io/badge/Astro-7-FF5D01?logo=astro&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)
![Deploy](https://img.shields.io/badge/Deploy-GitHub%20Pages-222?logo=githubpages&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

Sitio en producción: **<https://uber830.github.io/buying_cheese/>**

## Estructura del proyecto

```
.
├── .github/workflows/deploy.yml   # Build + deploy a GitHub Pages
├── public/
│   ├── favicon.ico
│   ├── favicon.svg
│   └── og-image.svg               # Imagen para Open Graph / redes sociales
├── src/
│   ├── components/
│   │   ├── cart/                  # FAB y drawer del pedido (isla React)
│   │   ├── hero/                  # Productos destacados del Hero
│   │   ├── layout/                # Navbar + Footer
│   │   ├── products/              # ProductCard, ProductModal, CategoryFilter
│   │   ├── sections/              # Hero, About, Services, Catalog, Contact
│   │   └── ui/                    # Container, SectionTitle
│   ├── layouts/
│   │   └── BaseLayout.astro       # SEO, JSON-LD, Navbar + Footer
│   ├── lib/
│   │   ├── cart.ts                # Estado del pedido (localStorage)
│   │   ├── products.ts            # getActiveProducts / getFeaturedProducts
│   │   ├── site.ts                # Constantes del sitio y helpers
│   │   ├── supabase.ts            # Cliente Supabase (singleton)
│   │   └── whatsapp.ts            # Mensaje + URL para pedidos por WhatsApp
│   ├── pages/
│   │   └── index.astro            # Página única del sitio
│   ├── scripts/
│   │   └── reveal.ts              # Reveal on scroll, contadores y navbar
│   ├── styles/
│   │   └── global.css             # Tailwind v4 + tokens del tema
│   └── types/                     # Tipos compartidos (product, cart)
├── supabase/
│   └── schema.sql                 # Tabla products, RLS, triggers
├── .editorconfig
├── .env.example
├── .gitignore
├── .nvmrc
├── .prettierrc
├── .prettierignore
├── AGENTS.md                      # Notas para asistentes / IDE
└── CLAUDE.md -> AGENTS.md
```

## Inicio rápido

```bash
nvm use            # usa la versión de Node definida en .nvmrc (>= 22.12)
npm install
cp .env.example .env
# editar .env con PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY
npm run dev        # http://localhost:4321/buying_cheese (base path por defecto)
```

> El `base` por defecto apunta a `/buying_cheese` para que el build funcione
> directamente en GitHub Pages. Para desarrollo en otra ruta, exporta
> `PUBLIC_BASE_PATH=''` antes de `npm run dev`.

## Variables de entorno

Copia `.env.example` a `.env` y completa:

```
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_BASE_PATH=/buying_cheese
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

o pegando `supabase/schema.sql` en el editor SQL del dashboard. Tabla principal:

- **`products`** — catálogo público (solo lectura para `anon` cuando `is_active = true`).

Incluye:

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

El sitio se publica automáticamente en **GitHub Pages** cada `push` a `main`
gracias al workflow `.github/workflows/deploy.yml` (Astro build → `actions/deploy-pages`).

### Configuración inicial del repositorio

1. **Settings → Pages → Build and deployment**: source = *GitHub Actions*.
2. **Settings → Secrets and variables → Actions**: crea las claves que el workflow
   consume (si faltan, el build usa placeholders y el catálogo sale vacío):
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`

El sitio queda disponible en `https://<owner>.github.io/buying_cheese/`.

> El sitio es 100 % estático, así que también funciona tal cual en Vercel, Netlify
> o Cloudflare Pages: basta con apuntar el comando de build a `npm run build` y
> el directorio de salida a `dist`.

## Licencia

[MIT](./LICENSE) © 2026 Uber Cardoso.
