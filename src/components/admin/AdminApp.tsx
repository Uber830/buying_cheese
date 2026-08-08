import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Product, ProductInsert } from '@/types/product';
import {
  createProduct,
  deleteImageByUrl,
  deleteProduct,
  fetchCurrentUser,
  listAllProducts,
  signOut,
  updateProduct,
} from '@/lib/admin';
import LoginPanel from './LoginPanel';
import ProductEditor from './ProductEditor';
import ConfirmDialog from './ConfirmDialog';

type View = { kind: 'list' } | { kind: 'create' } | { kind: 'edit'; product: Product };

type Toast = { kind: 'success' | 'error'; message: string };

const REFRESH_MS = 30_000;

export default function AdminApp() {
  const [auth, setAuth] = useState<
    | { status: 'loading' }
    | { status: 'unauthenticated' }
    | { status: 'forbidden'; email: string }
    | { status: 'authorized'; email: string; name: string }
  >({ status: 'loading' });

  const [view, setView] = useState<View>({ kind: 'list' });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);

  const redirectTo = useMemo(() => {
    if (typeof window === 'undefined') return '/admin/';
    const raw = import.meta.env.BASE_URL || '/';
    const base = raw === '/' ? '' : raw.endsWith('/') ? raw : `${raw}/`;
    return `${window.location.origin}${base}admin/`;
  }, []);

  const refreshAuth = useCallback(async () => {
    const result = await fetchCurrentUser();
    if (!result) {
      setAuth({ status: 'unauthenticated' });
      return;
    }
    if (!result.isAdmin) {
      setAuth({ status: 'forbidden', email: result.email });
      return;
    }
    setAuth({ status: 'authorized', email: result.email, name: result.name });
  }, []);

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    setProductsError(null);
    try {
      const data = await listAllProducts();
      setProducts(data);
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    if (auth.status !== 'authorized') return;
    void refreshProducts();
    const id = window.setInterval(refreshProducts, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [auth.status, refreshProducts]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const handleSave = async (data: ProductInsert) => {
    setSaving(true);
    try {
      if (view.kind === 'create') {
        const created = await createProduct(data);
        setProducts((prev) => [...prev, created].sort(sortProducts));
        setView({ kind: 'list' });
        setToast({ kind: 'success', message: `“${created.name}” creado correctamente.` });
      } else if (view.kind === 'edit') {
        const updated = await updateProduct(view.product.id, data);
        setProducts((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p)).sort(sortProducts),
        );
        setView({ kind: 'list' });
        setToast({ kind: 'success', message: `“${updated.name}” actualizado.` });
      }
    } catch (err) {
      setToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'No se pudo guardar el producto.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (product: Product) => {
    setPendingDelete(product);
  };

  const handleConfirmDelete = async () => {
    const product = pendingDelete;
    if (!product) return;
    setPendingDelete(null);
    setDeletingId(product.id);
    try {
      await deleteProduct(product.id);
      await deleteImageByUrl(product.image_url).catch(() => undefined);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setToast({ kind: 'success', message: `“${product.name}” eliminado.` });
    } catch (err) {
      setToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'No se pudo eliminar.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut().catch(() => undefined);
    setAuth({ status: 'unauthenticated' });
  };

  if (auth.status === 'loading') {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-sm text-espresso-700">Cargando…</div>
      </div>
    );
  }

  if (auth.status === 'unauthenticated' || auth.status === 'forbidden') {
    return (
      <div className="grid min-h-[60vh] place-items-center p-4">
        <LoginPanel
          redirectTo={redirectTo}
          status={auth.status}
          email={auth.status === 'forbidden' ? auth.email : undefined}
          onSignOut={handleSignOut}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3 rounded-3xl bg-white p-5 shadow-card ring-1 ring-espresso-900/5 sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-meadow-600">
            Sesión activa
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-espresso-900 sm:text-3xl">
            Hola, {auth.name}
          </h1>
          <p className="text-sm text-espresso-700">{auth.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={import.meta.env.BASE_URL} className="btn-ghost text-sm">
            Ver sitio
          </a>
          <button type="button" onClick={handleSignOut} className="btn-secondary text-sm">
            Cerrar sesión
          </button>
        </div>
      </header>

      {view.kind === 'list' ? (
        <section className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-espresso-900/5 sm:p-6">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cheddar">Catálogo</p>
              <h2 className="mt-1 font-display text-2xl font-extrabold text-espresso-900">
                Productos ({products.length})
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                placeholder="Buscar…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="rounded-full border border-espresso-900/15 bg-cream-50 px-4 py-2 text-sm focus:border-cheese-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setView({ kind: 'create' })}
                className="btn-primary"
              >
                + Nuevo producto
              </button>
            </div>
          </header>

          {productsError && (
            <p className="mb-4 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {productsError}
            </p>
          )}

          {loading && products.length === 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="h-32 animate-pulse rounded-2xl bg-cream-100" />
              ))}
            </ul>
          ) : (
            <ProductList
              products={products}
              query={query}
              onEdit={(p) => setView({ kind: 'edit', product: p })}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          )}
        </section>
      ) : (
        <ProductEditor
          mode={
            view.kind === 'create' ? { kind: 'create' } : { kind: 'edit', product: view.product }
          }
          busy={saving}
          onCancel={() => setView({ kind: 'list' })}
          onSave={handleSave}
        />
      )}

      {toast && (
        <div
          role="status"
          className="toast-in fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-bold shadow-cheese"
          style={{
            background: toast.kind === 'success' ? '#6e8846' : '#b94a4a',
            color: 'white',
          }}
        >
          {toast.message}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar producto"
        description={
          pendingDelete ? (
            <>
              ¿Estás seguro de eliminar{' '}
              <strong className="font-bold text-espresso-900">"{pendingDelete.name}"</strong>? Esta
              acción no se puede deshacer y también eliminará la imagen del almacenamiento.
            </>
          ) : null
        }
        confirmLabel="Eliminar definitivamente"
        cancelLabel="Cancelar"
        busy={deletingId !== null}
        tone="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function sortProducts(a: Product, b: Product): number {
  if (a.display_order !== b.display_order) return a.display_order - b.display_order;
  return a.name.localeCompare(b.name, 'es');
}

function ProductList({
  products,
  query,
  onEdit,
  onDelete,
  deletingId,
}: {
  products: Product[];
  query: string;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  deletingId: string | null;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [products, query]);

  if (filtered.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-espresso-900/15 bg-cream-50 p-8 text-center text-espresso-700">
        {products.length === 0
          ? 'Aún no hay productos. Crea el primero con el botón superior.'
          : 'No encontramos productos con ese filtro.'}
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((p) => (
        <li
          key={p.id}
          className="overflow-hidden rounded-2xl border border-espresso-900/10 bg-cream-50"
        >
          <div className="relative aspect-4/3 bg-cream-100">
            <img
              src={p.image_url}
              alt={p.name}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-espresso-900">
              {p.category}
            </span>
            {!p.is_active && (
              <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                Oculto
              </span>
            )}
            {p.is_featured && (
              <span className="absolute right-2 top-9 rounded-full bg-cheddar px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-espresso-900">
                Destacado
              </span>
            )}
          </div>
          <div className="p-3">
            <h3 className="line-clamp-1 font-display text-base font-extrabold text-espresso-900">
              {p.name}
            </h3>
            <p className="line-clamp-2 text-xs text-espresso-700">{p.short_description}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-espresso-700/80">
              <span>
                {p.price != null
                  ? new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      maximumFractionDigits: 0,
                    }).format(p.price)
                  : 'A convenir'}
              </span>
              <span>stock: {p.stock ?? '—'}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(p)}
                className="flex-1 rounded-full bg-espresso-900 px-3 py-1.5 text-xs font-bold text-cream-50 hover:bg-espresso-700"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => onDelete(p)}
                disabled={deletingId === p.id}
                className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {deletingId === p.id ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
