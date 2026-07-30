import { useState } from 'react';
import { signInWithGoogle } from '@/lib/admin';

type Props = {
  redirectTo: string;
  status: 'unauthenticated' | 'forbidden';
  email?: string;
  onSignOut: () => void;
};

export default function LoginPanel({ redirectTo, status, email, onSignOut }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
      setBusy(false);
    }
  };

  if (status === 'forbidden') {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-red-200 bg-red-50 p-8 text-center shadow-card">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-100 text-2xl">
          🔒
        </div>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-red-800">
          Acceso no autorizado
        </h1>
        <p className="mt-2 text-sm text-red-700">
          {email ? (
            <>
              El correo <strong>{email}</strong> no está en la lista de administradores. Si crees
              que es un error, contacta al propietario.
            </>
          ) : (
            <>Tu cuenta no está autorizada para acceder al panel.</>
          )}
        </p>
        <button type="button" onClick={onSignOut} className="btn-secondary mt-6">
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-card ring-1 ring-espresso-900/5">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-cream-100 shadow-card">
        <span aria-hidden className="text-3xl">
          🧀
        </span>
      </div>
      <h1 className="mt-5 font-display text-3xl font-extrabold text-espresso-900">
        Panel de administración
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-espresso-700">
        Inicia sesión con tu cuenta de Google autorizada para gestionar los productos del catálogo.
      </p>

      <button
        type="button"
        onClick={handleLogin}
        disabled={busy}
        className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full border-2 border-espresso-900/15 bg-white px-6 py-3 font-semibold text-espresso-900 shadow-card transition hover:border-cheddar hover:bg-cream-50 disabled:opacity-60"
      >
        <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.9 6.1 29.2 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.3-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.9 6.1 29.2 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.1 0 9.8-2 13.3-5.2l-6.1-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.1 5.2C40.9 36 44 30.4 44 24c0-1.2-.1-2.3-.4-3.5z"
          />
        </svg>
        {busy ? 'Abriendo Google…' : 'Continuar con Google'}
      </button>

      {error && (
        <p className="mt-4 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <p className="mt-6 text-xs text-espresso-700/70">
        Solo correos autorizados pueden acceder. Si no puedes entrar, contacta al administrador del
        sitio.
      </p>
    </div>
  );
}
