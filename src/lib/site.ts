const SUPABASE_STORAGE =
  'https://aadvjqgohwqoiwvezawh.supabase.co/storage/v1/object/public/products';

export const SITE = {
  name: 'Quesos La Colina',
  shortName: 'La Colina',
  tagline: 'Quesos frescos de la sabana',
  description:
    'F\u00e1brica artesanal de quesos y yogures ubicada en Mosquera, Cundinamarca. Tradici\u00f3n lechera de la sabana con productos frescos del altiplano cundinamarqu\u00e9s.',
  url: import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321',
  locale: 'es_CO',
  phoneDisplay: '+57 312 435 2828',
  phoneRaw: '+573124352828',
  email: 'contacto@quesoslacolina.com',
  address: 'Calle 6a #3a-36, Funza, Cundinamarca \u2013 Colombia',
  addressShort: 'Calle 6a #3a-36, Funza',
  freeShippingFromCop: 80000,
  currency: 'COP',
  logoUrl: `${SUPABASE_STORAGE}/logo-gpt-new.webp`,
  mapsEmbedUrl:
    'https://www.google.com/maps?q=Calle+6a+%233a-36+Funza+Cundinamarca+Colombia&output=embed',
  mapsLink:
    'https://www.google.com/maps/search/?api=1&query=Calle+6a+%233a-36+Funza+Cundinamarca+Colombia',
  social: {
    facebook: 'https://www.facebook.com/',
    instagram: 'https://www.instagram.com/',
  },
} as const;

export const UNIT_LABELS = {
  unidad: 'por unidad',
  kg: 'por kg',
  lb: 'por lb',
} as const;

export type UnitLabel = keyof typeof UNIT_LABELS;

export function unitLabel(unit: string | null | undefined): string {
  if (unit && unit in UNIT_LABELS) {
    return UNIT_LABELS[unit as UnitLabel];
  }
  return UNIT_LABELS.unidad;
}

export type StockState = 'available' | 'out' | 'unknown';

export function stockState(stock: number | null | undefined): StockState {
  if (stock == null) return 'unknown';
  if (stock <= 0) return 'out';
  return 'available';
}

export function stockLabel(
  stock: number | null | undefined,
  unit: string | null | undefined,
): string {
  const state = stockState(stock);
  if (state === 'out') return 'Agotado';
  if (state === 'unknown') return 'Consultar disponibilidad';
  const u = unitLabel(unit);
  return `${stock} disponibles \u00b7 ${u}`;
}
