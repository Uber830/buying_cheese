import { useEffect, useRef } from 'react';
import type { Product } from '@/types/product';
import { SITE, stockState } from '@/lib/site';
import { addProduct, CART_EVENT } from '@/lib/cart';

type Props = {
  product: Product;
  open: boolean;
  onClose: () => void;
};

function formatPrice(value: number | null): string {
  if (value == null) return '';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: SITE.currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function unitPhrase(unit: Product['unit_label']): string {
  return unit === 'kg' ? 'por kilogramo' : unit === 'lb' ? 'por libra' : 'por unidad';
}

function stockBadge(stock: number | null, unit: Product['unit_label']) {
  const state = stockState(stock);
  if (state === 'out') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-red-700">
        <span aria-hidden>×</span> Agotado
      </span>
    );
  }
  if (state === 'unknown') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-espresso-700">
        Consultar disponibilidad
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-meadow-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-meadow-700">
      {stock} {unit === 'kg' ? 'kg' : unit === 'lb' ? 'lb' : 'disponibles'} · {unitPhrase(unit)}
    </span>
  );
}

export default function ProductModal({ product, open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const state = stockState(product.stock);
  const isOut = state === 'out';

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;

    if (open && !dlg.open) {
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open, product.id]);

  const handleAdd = () => {
    if (isOut) return;
    addProduct(product);
    window.dispatchEvent(new CustomEvent(CART_EVENT));
    onClose();
  };

  const longDescription =
    product.description && product.description.length > 10
      ? product.description
      : `${product.short_description} Elaborado de forma artesanal en nuestra planta de Mosquera, con leche fresca de productores locales y bajo estrictos controles de calidad.`;

  const benefits = isOut
    ? ['Producción diaria', 'Sin conservantes', 'Frescura garantizada']
    : ['Producción diaria', 'Sin conservantes', 'Frescura garantizada'];

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      aria-labelledby="product-modal-title"
      className="w-[min(56rem,92vw)] max-w-3xl overflow-hidden rounded-3xl bg-white p-0 shadow-cheese backdrop:bg-espresso-900/55"
    >
      <div className="grid max-h-[90vh] grid-rows-[auto_1fr] overflow-hidden md:max-h-[85vh] md:grid-cols-[1.1fr_1fr] md:grid-rows-1">
        <div className="relative aspect-[5/4] bg-cream-100 md:aspect-auto md:h-full">
          <img
            src={product.image_url}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-espresso-900 backdrop-blur">
            {product.category}
          </span>
          {product.price != null && (
            <span className="absolute right-4 top-4 rounded-full bg-cheddar px-3 py-1 text-sm font-bold text-cream-50 shadow-card">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-meadow-600">
                Quesos La Colina
              </p>
              <h2
                id="product-modal-title"
                className="mt-1 font-display text-3xl font-extrabold leading-tight text-espresso-900 sm:text-4xl"
              >
                {product.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream-100 text-espresso-900 transition hover:bg-cheese-100"
            >
              <span aria-hidden>✕</span>
            </button>
          </div>

          {product.price != null && (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-cheddar">
                {formatPrice(product.price)}
              </span>
              <span className="text-sm text-espresso-700">{unitPhrase(product.unit_label)}</span>
            </div>
          )}

          <div>{stockBadge(product.stock, product.unit_label)}</div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-espresso-700">
              Descripción
            </h3>
            <p className="mt-2 text-base leading-relaxed text-espresso-900">
              {longDescription}
            </p>
          </div>

          <ul className="grid gap-2 sm:grid-cols-2">
            {benefits.map((b) => (
              <li
                key={b}
                className="flex items-center gap-2 rounded-2xl bg-meadow-50 px-3 py-2 text-sm text-meadow-700"
              >
                <span aria-hidden className="text-meadow-500">
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={handleAdd}
              disabled={isOut}
              aria-disabled={isOut}
              className={[
                'btn-primary flex-1',
                isOut ? 'cursor-not-allowed bg-cream-200 text-espresso-500 shadow-none hover:scale-100' : '',
              ].join(' ')}
            >
              <span aria-hidden>+</span>
              {isOut ? 'Agotado por hoy' : 'Añadir al pedido'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cerrar
            </button>
          </div>

          <p className="text-xs text-espresso-700">
            {isOut
              ? 'Este producto no está disponible ahora. Tu pedido se enviará por WhatsApp y confirmaremos disponibilidad.'
              : 'Tu pedido se enviará por WhatsApp. Podrás agregar más productos antes de enviar.'}
          </p>
        </div>
      </div>
    </dialog>
  );
}