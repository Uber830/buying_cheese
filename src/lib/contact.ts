import { getSupabase } from '@/lib/supabase';
import type { ContactResult, ContactInsertPayload } from '@/types/contact';

async function hashIp(ip: string): Promise<string | null> {
  if (!ip) return null;
  const enc = new TextEncoder().encode(ip);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export type SubmitContactInput = {
  name: string;
  email: string;
  phone: string;
  message: string;
  hp_field?: string | null;
  render_time_ms: number;
};

export async function submitContact(input: SubmitContactInput): Promise<ContactResult> {
  // Honeypot silencioso: si viene lleno, simulamos éxito para no alertar al bot.
  if (input.hp_field && input.hp_field.trim().length > 0) {
    return { ok: true };
  }

  // Trampa de tiempo: si el form se envió demasiado rápido, simulamos éxito silencioso.
  if (input.render_time_ms < 3000) {
    return { ok: true };
  }

  const ipHash = await hashIp('').catch(() => null);

  const payload: ContactInsertPayload = {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    message: input.message.trim(),
    hp_field: null,
    render_time_ms: input.render_time_ms,
    ip_hash: ipHash ?? '',
  };

  try {
    const { error } = await getSupabase()
      .from('contact_submissions')
      .insert(payload);

    if (!error) return { ok: true };

    const msg = error.message.toLowerCase();
    if (msg.includes('check_submission_rate') || msg.includes('row-level security')) {
      return {
        ok: false,
        reason: 'rate_limit',
        message:
          'Hemos recibido muchos mensajes recientemente. Por favor intenta en unos minutos.',
      };
    }
    if (msg.includes('check constraint') || msg.includes('violates check')) {
      return {
        ok: false,
        reason: 'validation',
        message: 'Revisa los datos ingresados, alguno no es válido.',
      };
    }
    return { ok: false, reason: 'unknown', message: 'No pudimos enviar el mensaje. Inténtalo de nuevo.' };
  } catch {
    return {
      ok: false,
      reason: 'network',
      message: 'Sin conexión. Verifica tu internet e inténtalo de nuevo.',
    };
  }
}
