import { useState } from 'react';
import type { Product } from '@/types/product';
import { SITE, stockState } from '@/lib/site';
import { addProduct, CART_EVENT } from '@/lib/cart';

type Props = {
  product: Product;
  onOpen: (id: string) => void;
};

function formatPrice(value: number | null): string {
  if (value == null) return '';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: SITE.currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function unitSuffix(unit: Product['unit_label']): string {
  return unit === 'kg' ? 'por kg' : unit === 'lb' ? 'por lb' : 'por unidad';
}

function stockBadge(stock: number | null, unit: Product['unit_label']) {
  const state = stockState(stock);
  if (state === 'out') {
    return (
      <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-red-700">
        Agotado
      </span>
    );
  }
  if (state === 'unknown') {
    return (
      <span className="rounded-full bg-cream-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-espresso-700">
        Consultar disponibilidad
      </span>
    );
  }
  return (
    <span className="rounded-full bg-meadow-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-meadow-700">
      {stock} {unit === 'kg' ? 'kg' : unit === 'lb' ? 'lb' : 'disp.'} · {unitSuffix(unit)}
    </span>
  );
}

export default function ProductCard({ product, onOpen }: Props) {
  const [justAdded, setJustAdded] = useState(false);
  const formattedPrice = formatPrice(product.price);
  const state = stockState(product.stock);
  const isOut = state === 'out';

  const handleQuickAdd = (e: React.MouseEvent) => {
    if (isOut) return;
    e.stopPropagation();
    addProduct(product);
    setJustAdded(true);
    window.dispatchEvent(new CustomEvent(CART_EVENT));
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <article className={`card-product group ${isOut ? 'opacity-70' : ''}`}>
      <button
        type="button"
        onClick={() => onOpen(product.id)}
        className="relative aspect-[4/3] overflow-hidden bg-cream-100 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cheese-500"
        aria-label={`Ver detalles de ${product.name}`}
      >
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width={600}
          height={450}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-espresso-900 backdrop-blur">
          {product.category}
        </span>
        {formattedPrice && (
          <span className="absolute right-4 top-4 rounded-full bg-cheddar px-3 py-1 text-xs font-bold text-cream-50 shadow-card">
            {formattedPrice}
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-xl font-extrabold text-espresso-900">
          <button
            type="button"
            onClick={() => onOpen(product.id)}
            className="hover:text-cheddar focus:outline-none focus-visible:underline"
          >
            {product.name}
          </button>
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-espresso-700">
          {product.short_description}
        </p>
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-xs font-medium text-espresso-700">
            {unitSuffix(product.unit_label)}
          </span>
          {stockBadge(product.stock, product.unit_label)}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <button
            type="button"
            onClick={() => onOpen(product.id)}
            className="text-sm font-bold text-cheddar underline-offset-4 hover:underline"
          >
            Ver detalle
          </button>
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isOut}
            aria-disabled={isOut}
            aria-label={isOut ? `${product.name} agotado` : `A\u00f1adir ${product.name} al pedido`}
            className={[
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-card transition',
              isOut
                ? 'cursor-not-allowed bg-cream-200 text-espresso-500'
                : justAdded
                ? 'bg-meadow-500 text-white'
                : 'bg-meadow-500 text-white hover:bg-meadow-600',
            ].join(' ')}
          >
            <span aria-hidden>{isOut ? '\u00d7' : justAdded ? '\u2713' : '+'}</span>{' '}
            {isOut ? 'Agotado' : justAdded ? '\u00a1Listo!' : 'A\u00f1adir'}
          </button>
        </div>
      </div>
    </article>
  );
}