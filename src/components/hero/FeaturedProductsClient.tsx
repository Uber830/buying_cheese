import { useEffect, useState } from 'react';
import type { Product } from '@/types/product';
import { getSupabase } from '@/lib/supabase';

type Props = {
  initial: Product[];
};

type LoadState =
  | { status: 'ready'; products: Product[] }
  | { status: 'loading' }
  | { status: 'error'; message: string };

const REFRESH_MS = 60_000;

async function fetchFeatured(): Promise<Product[]> {
  const { data, error } = await getSupabase()
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('featured_order', { ascending: true })
    .limit(3);
  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

function formatPrice(value: number | null): string {
  if (value == null) return '';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

function unitPhrase(unit: Product['unit_label']): string {
  return unit === 'kg' ? 'por kg' : unit === 'lb' ? 'por lb' : 'por unidad';
}

export default function FeaturedProductsClient({ initial }: Props) {
  const [state, setState] = useState<LoadState>(() =>
    initial.length > 0 ? { status: 'ready', products: initial } : { status: 'loading' },
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const products = await fetchFeatured();
        if (!cancelled) setState({ status: 'ready', products });
      } catch (err) {
        if (!cancelled)
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Error desconocido',
          });
      }
    };
    void load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (state.status !== 'ready') {
    return state.status === 'loading' ? (
      <div
        className="grid w-full max-w-md animate-pulse gap-3 rounded-4xl bg-white p-5 shadow-cheese ring-1 ring-espresso-900/5 sm:p-6"
        aria-hidden
      >
        <div className="h-6 w-1/3 rounded-full bg-cream-200" />
        <div className="aspect-5/4 rounded-2xl bg-cream-200" />
        <div className="grid grid-cols-2 gap-2.5">
          <div className="h-24 rounded-xl bg-cream-200" />
          <div className="h-24 rounded-xl bg-cream-200" />
        </div>
      </div>
    ) : null;
  }

  if (state.products.length === 0) {
    return null;
  }

  const [primary, ...rest] = state.products;

  const handleClick = (id: string) => {
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.dispatchEvent(new CustomEvent('lacolina:open-product', { detail: { id } }));
  };

  return (
    <section
      role="region"
      aria-label="Productos más vendidos"
      data-reveal="scale"
      style={{ ['--reveal-delay' as string]: '200ms' }}
      className="relative w-full max-w-md"
    >
      <div
        aria-hidden="true"
        className="absolute -inset-4 -z-10 rounded-5xl bg-cheese-300/50 blur-2xl"
      />
      <div className="relative rounded-4xl bg-white p-5 shadow-cheese ring-1 ring-espresso-900/5 sm:p-6">
        <header className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cheddar/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-cheddar">
            <span aria-hidden>★</span> Más vendidos
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-espresso-700">
            Recién hechos
          </span>
        </header>

        <div className="mt-5">
          <FeaturedCard product={primary} variant="hero" onOpen={handleClick} />
        </div>

        {rest.length > 0 && (
          <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {rest.map((p) => (
              <li key={p.id}>
                <FeaturedCard product={p} variant="compact" onOpen={handleClick} />
              </li>
            ))}
          </ul>
        )}

        <a
          href="#productos"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-espresso-900/15 px-5 py-3 text-sm font-bold text-espresso-900 transition hover:-translate-y-0.5 hover:border-cheddar hover:bg-cheese-50 hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-cheddar focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Ver todos los productos
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            className="h-4 w-4"
          >
            <path d="M5 10h10M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </section>
  );
}

type Variant = 'hero' | 'compact';

function FeaturedCard({
  product,
  variant,
  onOpen,
}: {
  product: Product;
  variant: Variant;
  onOpen: (id: string) => void;
}) {
  const priceText = formatPrice(product.price);
  const unitText = unitPhrase(product.unit_label);
  const isHero = variant === 'hero';

  if (isHero) {
    return (
      <article className="featured-card group relative isolate overflow-hidden rounded-3xl bg-cream-100 shadow-cheese ring-1 ring-espresso-900/5">
        <button
          type="button"
          onClick={() => onOpen(product.id)}
          className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cheddar focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          aria-label={`Ver ${product.name}`}
        >
          <div className="relative aspect-5/4 overflow-hidden bg-cream-200">
            <img
              src={product.image_url}
              alt={product.name}
              loading="eager"
              decoding="async"
              width={800}
              height={640}
              className="featured-card-image absolute inset-0 h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-espresso-900/90 via-espresso-900/40 to-transparent"
            />
            <div className="absolute left-4 top-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cheddar/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-espresso-900">
                <span aria-hidden>★</span> Más vendido
              </span>
            </div>
            <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-cream-50">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cheese-300">
                  {product.category}
                </p>
                <h3 className="mt-1 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                  {product.name}
                </h3>
                {priceText && (
                  <p className="mt-1.5 text-base font-bold text-cheddar">
                    {priceText}{' '}
                    <span className="text-xs font-medium text-cream-200/80">{unitText}</span>
                  </p>
                )}
              </div>
              <span
                aria-hidden="true"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream-50 text-espresso-900 transition group-hover:translate-x-0.5"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  className="h-4 w-4"
                >
                  <path d="M5 10h10M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </div>
        </button>
      </article>
    );
  }

  return (
    <article className="featured-card group relative overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-espresso-900/5 shadow-card">
      <button
        type="button"
        onClick={() => onOpen(product.id)}
        className="flex w-full items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cheddar focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50"
        aria-label={`Ver ${product.name}`}
      >
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-100">
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            decoding="async"
            width={160}
            height={160}
            className="featured-card-image absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-cheddar/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-espresso-900">
            Top
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-espresso-500">
            {product.category}
          </p>
          <h3 className="mt-0.5 truncate font-display text-sm font-extrabold text-espresso-900">
            {product.name}
          </h3>
          {priceText && (
            <p className="mt-1 text-xs font-bold text-cheddar">
              {priceText}
              <span className="ml-1 text-[10px] font-medium text-espresso-700">{unitText}</span>
            </p>
          )}
        </div>
        <span
          aria-hidden="true"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream-100 text-espresso-900 transition group-hover:bg-cheddar group-hover:translate-x-0.5"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            className="h-3.5 w-3.5"
          >
            <path d="M5 10h10M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
    </article>
  );
}
