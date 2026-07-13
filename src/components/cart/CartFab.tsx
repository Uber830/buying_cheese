import { useMemo, useState, useSyncExternalStore } from 'react';
import {
  clearCart,
  getServerSnapshot,
  getSnapshot,
  incrementItem,
  removeItem,
  subscribe,
  totalItems,
  totalPrice,
  updateQuantity,
} from '@/lib/cart';
import { SITE } from '@/lib/site';
import { buildWhatsAppCartUrl } from '@/lib/whatsapp';

export default function CartFab() {
  const [open, setOpen] = useState(false);
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const count = totalItems(items);
  const total = totalPrice(items);
  const whatsappUrl = useMemo(() => buildWhatsAppCartUrl(items), [items]);

  if (count === 0 && !open) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ver pedido (${count} ${count === 1 ? 'producto' : 'productos'})`}
        className="fixed bottom-5 right-5 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-espresso-900 pr-4 pl-3 text-sm font-bold text-cream-50 shadow-fab transition hover:scale-105 hover:bg-espresso-700"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-cheese-500 text-espresso-900">
          <span aria-hidden="true">🛒</span>
        </span>
        <span>
          <span className="block text-[10px] uppercase tracking-[0.2em] text-cream-200/70">
            Tu pedido
          </span>
          <span>
            {count} {count === 1 ? 'producto' : 'productos'}
          </span>
        </span>
        {total > 0 && (
          <span className="ml-1 rounded-full bg-meadow-500 px-2.5 py-1 text-xs font-extrabold text-white">
            {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: SITE.currency,
              maximumFractionDigits: 0,
            }).format(total)}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Tu pedido"
          aria-modal="true"
          className="fixed inset-0 z-50 flex"
        >
          <button
            type="button"
            aria-label="Cerrar pedido"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-espresso-900/55 backdrop-blur-sm"
          />

          <aside className="drawer-slide relative ml-auto flex h-full w-full max-w-md flex-col bg-cream-50 shadow-cheese">
            <header className="flex items-center justify-between border-b border-espresso-900/10 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-meadow-600">
                  Tu pedido
                </p>
                <h2 className="font-display text-2xl font-extrabold text-espresso-900">
                  {count} {count === 1 ? 'producto' : 'productos'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="grid h-10 w-10 place-items-center rounded-full bg-cream-100 text-espresso-900 transition hover:bg-cheese-100"
              >
                <span aria-hidden>✕</span>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="grid place-items-center gap-4 py-16 text-center">
                  <span aria-hidden className="text-5xl">
                    🧺
                  </span>
                  <p className="text-espresso-700">Aún no has agregado productos.</p>
                  <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                    Explorar el catálogo
                  </button>
                </div>
              ) : (
                <ul className="grid gap-3">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card"
                    >
                      <img
                        src={item.image_url}
                        alt={item.name}
                        width={64}
                        height={64}
                        loading="lazy"
                        className="h-16 w-16 shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 font-display text-sm font-extrabold text-espresso-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-espresso-700">
                          {item.price != null
                            ? `${new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: SITE.currency,
                                maximumFractionDigits: 0,
                              }).format(
                                item.price,
                              )} / ${item.unit_label === 'kg' ? 'kg' : item.unit_label === 'lb' ? 'lb' : 'und'}`
                            : 'A convenir'}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label={`Quitar uno de ${item.name}`}
                            className="grid h-7 w-7 place-items-center rounded-full bg-cream-100 text-espresso-900 hover:bg-cheese-100"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-bold">
                            {item.quantity}
                            <span className="ml-1 text-[10px] font-medium text-espresso-500">
                              {item.unit_label === 'kg'
                                ? 'kg'
                                : item.unit_label === 'lb'
                                  ? 'lb'
                                  : 'und'}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => incrementItem(item.id)}
                            aria-label={`Agregar uno más de ${item.name}`}
                            className="grid h-7 w-7 place-items-center rounded-full bg-meadow-500 text-white hover:bg-meadow-600"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="ml-auto text-xs text-espresso-700 underline-offset-4 hover:underline"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <footer className="border-t border-espresso-900/10 bg-white px-5 py-4">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-sm font-medium text-espresso-700">Total estimado</span>
                <span className="font-display text-2xl font-extrabold text-cheddar">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: SITE.currency,
                    maximumFractionDigits: 0,
                  }).format(total)}
                </span>
              </div>
              <p className="mb-3 text-xs text-espresso-700">
                Envío gratis en pedidos superiores a{' '}
                {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: SITE.currency,
                  maximumFractionDigits: 0,
                }).format(SITE.freeShippingFromCop)}{' '}
                COP.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={items.length === 0}
                onClick={(e) => {
                  if (items.length === 0) e.preventDefault();
                }}
                className={[
                  'btn-primary w-full',
                  items.length === 0 ? 'pointer-events-none opacity-60' : '',
                ].join(' ')}
              >
                <span aria-hidden>💬</span>
                Comprar por WhatsApp
              </a>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Vaciar el pedido?')) clearCart();
                  }}
                  className="mt-2 block w-full text-center text-xs text-espresso-700/70 underline-offset-4 hover:underline"
                >
                  Vaciar pedido
                </button>
              )}
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
