// Validación end-to-end del módulo admin
// Ejecutar con: node scripts/validate-admin.mjs
//
// Las políticas RLS de Supabase devuelven `data: []` o `data: null` (no error)
// cuando bloquean una operación para evitar filtrar existencia de filas.
// Por eso validamos el resultado de la operación, no el campo `error`.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envFile = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
const env = Object.fromEntries(
  envFile
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const SUPABASE_URL = env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Faltan variables en .env');
  process.exit(1);
}

const BASE = 'http://localhost:4322/buying_cheese';

let pass = 0;
let fail = 0;
const failures = [];

function check(name, ok, details = '') {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    failures.push({ name, details });
    console.log(`  ✗ ${name}${details ? ` — ${details}` : ''}`);
  }
}

async function step(title, fn) {
  console.log(`\n▶ ${title}`);
  await fn();
}

function anonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// =====================================================
// 1. RLS público (lectura)
// =====================================================
async function testPublicRls() {
  const anon = anonClient();
  const { data, error } = await anon
    .from('products')
    .select('id, name, is_active')
    .eq('is_active', true)
    .limit(1);
  check(
    'Anon puede leer productos activos',
    !error && Array.isArray(data) && data.length > 0,
    error?.message,
  );
}

// =====================================================
// 2. RLS denegación: anon NO puede escribir ni leer admin_users
//    Supabase devuelve [] o null (no error) cuando RLS bloquea.
// =====================================================
async function testAnonWriteDenied() {
  const anon = anonClient();

  // INSERT sin auth debe fallar
  const { error: insErr } = await anon.from('products').insert({
    name: 'Hack',
    slug: `hack-${Date.now()}`,
    short_description: 'No debería poder',
    image_url: 'https://example.com/x.jpg',
    category: 'Otros',
  });
  check('Anon NO puede insertar (error devuelto)', !!insErr, insErr?.message ?? 'POLÍTICA ROTA');

  // UPDATE sin auth: data debe ser [] o null
  const { data: any } = await anon.from('products').select('id').limit(1);
  const someId = any?.[0]?.id;
  if (someId) {
    const before = await anon.from('products').select('display_order').eq('id', someId).single();
    const { data: upData, error: upErr } = await anon
      .from('products')
      .update({ display_order: 9999 })
      .eq('id', someId)
      .select();
    const after = await anon.from('products').select('display_order').eq('id', someId).single();
    const blocked =
      (!upData || (Array.isArray(upData) && upData.length === 0)) &&
      before.data?.display_order === after.data?.display_order;
    check(
      'Anon NO puede actualizar (sin filas afectadas)',
      blocked,
      `upData=${JSON.stringify(upData)} err=${upErr?.message} before=${before.data?.display_order} after=${after.data?.display_order}`,
    );

    // DELETE sin auth
    const { error: delErr } = await anon.from('products').delete().eq('id', someId);
    const stillThere = await anon.from('products').select('id').eq('id', someId).single();
    check(
      'Anon NO puede eliminar (la fila sigue ahí)',
      !stillThere.error && stillThere.data,
      delErr?.message ?? 'POLÍTICA ROTA',
    );
  } else {
    check('Hay al menos un producto para testear', false, 'tabla vacía');
  }

  // admin_users: anon no debe ver nada
  const { data: adData, error: adErr } = await anon.from('admin_users').select('email').limit(5);
  check(
    'Anon NO ve admin_users (lista vacía)',
    !adErr && Array.isArray(adData) && adData.length === 0,
    adErr?.message ?? `leyó ${JSON.stringify(adData)}`,
  );
}

// =====================================================
// 3. CRUD con service_role + admin (smoke test)
// =====================================================
async function testAdminCrud() {
  if (!SERVICE_KEY) {
    check(
      'SERVICE_ROLE_KEY presente',
      false,
      'export SUPABASE_SERVICE_ROLE_KEY=... para validar CRUD',
    );
    return;
  }
  const svc = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const TEST_EMAIL = `validate-${Date.now()}@admin-test.local`;

  const { error: insAdErr } = await svc
    .from('admin_users')
    .insert({ email: TEST_EMAIL, display_name: 'Validation' });
  check('Inserta admin temporal', !insAdErr, insAdErr?.message);

  const { data: created, error: createErr } = await svc.auth.admin.createUser({
    email: TEST_EMAIL,
    email_confirm: true,
    user_metadata: { full_name: 'Validation Bot' },
  });
  if (createErr || !created?.user) {
    check('Crea usuario de prueba', false, createErr?.message);
    await svc.from('admin_users').delete().eq('email', TEST_EMAIL);
    return;
  }
  check('Crea usuario de prueba', true);

  // Generar magic link
  const { data: imp, error: impErr } = await svc.auth.admin.generateLink({
    type: 'magiclink',
    email: TEST_EMAIL,
  });
  if (impErr || !imp) {
    check('Genera magic link', false, impErr?.message);
    await svc.auth.admin.deleteUser(created.user.id);
    await svc.from('admin_users').delete().eq('email', TEST_EMAIL);
    return;
  }

  // Verificar OTP para tener sesión
  const tmp = anonClient();
  const tokenHash =
    imp.properties.email_otp ?? imp.properties.action_link?.split('token=')[1]?.split('&')[0] ?? '';
  const { data: vr, error: vErr } = await tmp.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'email',
  });
  if (vErr || !vr?.session) {
    check('Verifica OTP y obtiene sesión', false, vErr?.message ?? 'sin sesión');
    await svc.auth.admin.deleteUser(created.user.id);
    await svc.from('admin_users').delete().eq('email', TEST_EMAIL);
    return;
  }

  const authed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await authed.auth.setSession({
    access_token: vr.session.access_token,
    refresh_token: vr.session.refresh_token,
  });

  const { data: isAdminData } = await authed.rpc('is_admin');
  check('is_admin() = true para admin en lista', isAdminData === true, `result=${isAdminData}`);

  // CRUD en products
  const { data: all } = await authed.from('products').select('id, name, is_active').limit(20);
  check('Admin lista productos (incluye inactivos)', all && all.length > 0, `len=${all?.length}`);

  const slug = `validate-test-${Date.now()}`;
  const { data: inserted, error: insPErr } = await authed
    .from('products')
    .insert({
      name: 'Queso de prueba',
      slug,
      short_description: 'Producto temporal de validación',
      image_url: 'https://placehold.co/600x450/orange/white?text=Test',
      category: 'Quesos',
      price: 1000,
      is_active: false,
    })
    .select('*')
    .single();
  check('Admin crea producto', !insPErr && !!inserted, insPErr?.message);
  if (inserted) {
    const { error: upErr } = await authed
      .from('products')
      .update({ display_order: 999 })
      .eq('id', inserted.id);
    check('Admin actualiza producto', !upErr, upErr?.message);

    const { error: delErr } = await authed.from('products').delete().eq('id', inserted.id);
    check('Admin elimina producto', !delErr, delErr?.message);
  }

  // Storage
  const fakeFile = new Blob(['test'], { type: 'image/webp' });
  const path = `validate/${Date.now()}.webp`;
  const { error: upStorErr } = await authed.storage
    .from('products')
    .upload(path, fakeFile, { contentType: 'image/webp' });
  check('Admin sube imagen al bucket products', !upStorErr, upStorErr?.message);
  if (!upStorErr) await authed.storage.from('products').remove([path]);

  // Cleanup
  await svc.auth.admin.deleteUser(created.user.id);
  await svc.from('admin_users').delete().eq('email', TEST_EMAIL);
}

// =====================================================
// 4. UI: render del panel admin
// =====================================================
async function testAdminUi() {
  const res = await fetch(`${BASE}/admin`);
  const html = await res.text();
  check('GET /admin devuelve 200', res.status === 200, `status=${res.status}`);
  check('HTML contiene el título admin', html.includes('Panel de administración'));
  check('HTML incluye meta noindex', html.includes('noindex,nofollow'));
  check(
    'HTML carga el bundle del admin',
    html.includes('AdminApp') || html.includes('astro-island') || html.includes('client:only'),
  );
  check('HTML no expone service_role', !html.includes('service_role'));
}

// =====================================================
// 5. Catálogo público sigue funcionando
// =====================================================
async function testCatalog() {
  const res = await fetch(BASE);
  const html = await res.text();
  check('GET / devuelve 200', res.status === 200, `status=${res.status}`);
  check(
    'Catálogo público contiene productos',
    html.includes('Catálogo') && html.includes('productos'),
  );
  check('Hero "Más vendidos" presente', html.includes('featured') || html.includes('destacado'));
}

// =====================================================
// MAIN
// =====================================================
(async () => {
  console.log('══════════════════════════════════════════');
  console.log(' Validación módulo admin — Quesos La Colina');
  console.log('══════════════════════════════════════════');

  await step('1. RLS público (lectura)', testPublicRls);
  await step('2. RLS deniega escritura a anon', testAnonWriteDenied);
  await step('3. CRUD + Storage con admin real', testAdminCrud);
  await step('4. Render UI /admin', testAdminUi);
  await step('5. Catálogo público intacto', testCatalog);

  console.log('\n══════════════════════════════════════════');
  console.log(` Resultado: ${pass} OK · ${fail} FAIL`);
  console.log('══════════════════════════════════════════');

  if (fail > 0) {
    console.log('\nFallas:');
    failures.forEach((f) => console.log(`  • ${f.name}${f.details ? ` — ${f.details}` : ''}`));
  }

  process.exit(fail > 0 ? 1 : 0);
})();
