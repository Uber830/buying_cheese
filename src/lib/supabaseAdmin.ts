import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '[supabaseAdmin] Faltan variables PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY.',
  );
}

let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('[supabaseAdmin] Solo se puede usar en el navegador.');
  }
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'lacolina-admin-auth',
        storage: window.localStorage,
        flowType: 'pkce',
        detectSessionInUrl: true,
      },
      global: { headers: { 'X-Client-Info': 'quesos-la-colina-admin' } },
    });
  }
  return _client;
}
