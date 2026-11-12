import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { Product, ProductInsert, ProductUpdate } from '@/types/product';

export type AdminAuthState = {
  status: 'loading' | 'unauthenticated' | 'forbidden' | 'authorized';
  email?: string;
  name?: string;
};

/**
 * Único proveedor de acceso al panel: Google OAuth.
 * Cualquier otra sesión (email/contraseña, magic link, etc.) queda fuera
 * aunque el correo esté en la allowlist.
 */
const ADMIN_PROVIDER = 'google';

export async function fetchCurrentUser(): Promise<{
  email: string;
  name: string;
  isAdmin: boolean;
} | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const user = data.user;
  const email = user.email ?? '';
  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    email.split('@')[0];

  // Sesión iniciada con Google (no basta con tener el mismo correo).
  const provider = user.app_metadata?.provider ?? '';
  const isGoogleSession = provider === ADMIN_PROVIDER;

  // Allowlist: el correo debe estar registrado y activo en admin_users.
  const { data: row } = await supabase
    .from('admin_users')
    .select('is_active')
    .eq('email', email)
    .maybeSingle();

  const isAdmin = isGoogleSession && !!row?.is_active;
  return { email, name, isAdmin };
}

export async function signInWithGoogle(redirectTo: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { prompt: 'select_account' },
    },
  });
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.auth.signOut();
}

/**
 * Lee el error que Supabase devuelve al terminar el flujo OAuth, por ejemplo
 * cuando el hook "Before User Created" rechaza un correo no autorizado.
 */
export function readAuthErrorFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const errorCode = search.get('error_code') ?? hash.get('error_code');
  const description = search.get('error_description') ?? hash.get('error_description');
  if (!errorCode && !description) return null;

  // Solo se limpia la URL cuando no queda un código de sesión por procesar.
  if (!search.get('code') && !hash.get('code')) {
    window.history.replaceState({}, '', window.location.pathname);
  }

  const raw = (description ?? '').replace(/\+/g, ' ').trim();
  if (raw) return raw;
  if (errorCode === 'access_denied') {
    return 'Acceso denegado: tu cuenta no está autorizada para entrar al panel.';
  }
  return 'No se pudo completar el inicio de sesión con Google.';
}

export async function listAllProducts(): Promise<Product[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

export async function createProduct(input: ProductInsert): Promise<Product> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('products').insert(input).select('*').single();
  if (error) throw new Error(error.message);
  return data as Product;
}

export async function updateProduct(id: string, patch: ProductUpdate): Promise<Product> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function uploadProductImage(file: File, productId?: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
  const safeExt = ['webp', 'jpg', 'jpeg', 'png'].includes(ext) ? ext : 'webp';
  const fileName = `${productId ?? crypto.randomUUID()}-${Date.now()}.${safeExt}`;
  const path = `products/${fileName}`;

  const { error } = await supabase.storage.from('products').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || `image/${safeExt}`,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('products').getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteImageByUrl(url: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const marker = '/storage/v1/object/public/products/';
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = decodeURIComponent(url.substring(idx + marker.length));
  await supabase.storage.from('products').remove([path]);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
