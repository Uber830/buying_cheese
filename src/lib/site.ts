const SUPABASE_STORAGE =
  'https://aadvjqgohwqoiwvezawh.supabase.co/storage/v1/object/public/products';

// Fuente única de verdad de la dirección. Todo el sitio se deriva de aquí.
const ADDRESS_STREET = 'Carrera 6 #7-48';
const ADDRESS_CITY = 'Funza';
const ADDRESS_REGION = 'Cundinamarca';
const ADDRESS = `${ADDRESS_STREET}, ${ADDRESS_CITY}, ${ADDRESS_REGION}`;
const ADDRESS_QUERY = encodeURIComponent(`${ADDRESS}, Colombia`);

export const SITE = {
  name: 'Lácteos La Colina',
  shortName: 'La Colina',
  alternateName: 'Quesos La Colina',
  tagline: 'Quesos frescos y lácteos en Mosquera, Cundinamarca',
  description:
    'Lácteos La Colina en Mosquera, Cundinamarca: quesos frescos, yogur, kéfir y cuajada de la sabana bogotana. Empresa familiar con marcas locales y nacionales, sin conservantes.',
  keywords: [
    'lácteos la colina',
    'quesos la colina',
    'quesos Mosquera',
    'quesos Cundinamarca',
    'quesos frescos',
    'yogurt',
    'kéfir',
    'lácteos Mosquera',
    'quesos sabana de Bogotá',
    'queso campesino',
    'queso pera',
    'mozzarella',
  ],
  url: import.meta.env.PUBLIC_SITE_URL || 'https://lacteoslacolina.com',
  locale: 'es_CO',
  phoneDisplay: '+57 322 782 4054',
  phoneRaw: '+573227824054',
  phone2Display: '+57 312 435 2828',
  phone2Raw: '+573124352828',
  email: 'lacteoslacolina23@gmail.com',
  address: `${ADDRESS} \u2013 Colombia`,
  addressShort: ADDRESS,
  streetAddress: ADDRESS_STREET,
  city: ADDRESS_CITY,
  region: ADDRESS_REGION,
  geo: { latitude: 4.7059, longitude: -74.2306 },
  openingHours: [
    {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '07:00',
      closes: '19:00',
    },
    {
      days: ['Sunday'],
      opens: '08:00',
      closes: '13:00',
    },
  ],
  priceRange: '$',
  areaServed: [
    { type: 'City', name: 'Mosquera' },
    { type: 'City', name: 'Madrid' },
    { type: 'City', name: 'Funza' },
    { type: 'City', name: 'Bogotá' },
    { type: 'State', name: 'Cundinamarca' },
  ],
  freeShippingFromCop: 80000,
  currency: 'COP',
  logoUrl: `${SUPABASE_STORAGE}/logo-gpt-new.webp`,
  mapsEmbedUrl: `https://www.google.com/maps?q=${ADDRESS_QUERY}&output=embed`,
  mapsLink: `https://www.google.com/maps/search/?api=1&query=${ADDRESS_QUERY}`,
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
