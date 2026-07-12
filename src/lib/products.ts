import { getSupabase } from '@/lib/supabase';
import type { Product } from '@/types/product';

const PRODUCTS_TABLE = 'products';

export async function getActiveProducts(): Promise<Product[]> {
  try {
    const { data, error } = await getSupabase()
      .from(PRODUCTS_TABLE)
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('[products] Error al consultar Supabase:', error.message);
      return [];
    }

    return (data ?? []) as Product[];
  } catch (err) {
    console.error('[products] Excepción al obtener productos:', err);
    return [];
  }
}

export async function getFeaturedProducts(limit = 3): Promise<Product[]> {
  try {
    const { data, error } = await getSupabase()
      .from(PRODUCTS_TABLE)
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('featured_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[products] Error al consultar destacados:', error.message);
      return [];
    }

    return (data ?? []) as Product[];
  } catch (err) {
    console.error('[products] Excepción al obtener destacados:', err);
    return [];
  }
}

export function getCategories(products: Product[]): string[] {
  const set = new Set<string>();
  for (const p of products) set.add(p.category);
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
}

export function formatPrice(value: number | null, currency = 'COP'): string {
  if (value == null) return '';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
