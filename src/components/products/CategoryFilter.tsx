import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/types/product';
import { getSupabase } from '@/lib/supabase';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';

type Props = {
  initialProducts?: Product[];
  initialCategories?: string[];
};

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; products: Product[]; categories: string[]; updatedAt: number }
  | { status: 'error'; message: string };

const REFRESH_MS = 60_000;

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await getSupabase()
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

function deriveCategories(products: Product[]): string[] {
  const set = new Set<string>();
  for (const p of products) set.add(p.category);
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
}

export default function CategoryFilter({ initialProducts = [], initialCategories = [] }: Props) {
  const [active, setActive] = useState<string>('Todos');
  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>(() =>
    initialProducts.length > 0
      ? {
          status: 'ready',
          products: initialProducts,
          categories:
            initialCategories.length > 0 ? initialCategories : deriveCategories(initialProducts),
          updatedAt: Date.now(),
        }
      : { status: 'loading' },
  );

  const load = useCallback(async () => {
    try {
      const products = await fetchProducts();
      setState({
        status: 'ready',
        products,
        categories: deriveCategories(products),
        updatedAt: Date.now(),
      });
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Error desconocido',
      });
    }
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (detail?.id) setOpenProductId(detail.id);
    };
    window.addEventListener('lacolina:open-product', onOpen as EventListener);
    return () => {
      window.removeEventListener('lacolina:open-product', onOpen as EventListener);
    };
  }, []);

  const products = state.status === 'ready' ? state.products : [];
  const categories = state.status === 'ready' ? state.categories : [];

  const visible = useMemo(() => {
    if (active === 'Todos') return products;
    return products.filter((p) => p.category === active);
  }, [products, active]);

  const openProduct = useMemo(
    () => products.find((p) => p.id === openProductId) ?? null,
    [products, openProductId],
  );

  useEffect(() => {
    if (openProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [openProduct]);

  const isLoading = state.status === 'loading';
  const hasError = state.status === 'error';

  return (
    <div data-product-filter>
      <div
        role="tablist"
        aria-label="Filtrar por categoría"
        className="-mx-2 flex flex-wrap items-center gap-2 px-2 pb-1"
      >
        {['Todos', ...categories].map((cat) => {
          const isActive = active === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(cat)}
              className={[
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                isActive
                  ? 'bg-espresso-900 text-cream-50 shadow-card'
                  : 'bg-white text-espresso-700 hover:bg-cheese-100',
              ].join(' ')}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {hasError && (
        <p className="mt-8 rounded-3xl border border-dashed border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          No pudimos cargar el catálogo. Intenta recargar la página.
        </p>
      )}

      {isLoading && visible.length === 0 && (
        <ul
          aria-busy="true"
          aria-label="Cargando catálogo"
          className="mt-10 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="h-72 animate-pulse rounded-3xl bg-cream-200/60" />
          ))}
        </ul>
      )}

      <ul className="mt-10 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((product, i) => (
          <li
            key={product.id}
            data-reveal="fade-up"
            style={{ ['--reveal-delay' as string]: `${(i % 6) * 70}ms` }}
            className="h-full"
          >
            <ProductCard product={product} onOpen={setOpenProductId} />
          </li>
        ))}
      </ul>

      {!isLoading && visible.length === 0 && !hasError && (
        <p className="mt-12 rounded-3xl border border-dashed border-espresso-900/15 bg-cream-50 p-8 text-center text-espresso-700">
          No hay productos en esta categoría por ahora.
        </p>
      )}

      {openProduct && (
        <ProductModal product={openProduct} open={true} onClose={() => setOpenProductId(null)} />
      )}
    </div>
  );
}
