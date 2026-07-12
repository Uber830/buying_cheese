export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  hp_field: string | null;
  render_time_ms: number | null;
  ip_hash: string | null;
  created_at: string;
};

export type ContactInput = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export type ContactInsertPayload = ContactInput & {
  hp_field: string | null;
  render_time_ms: number;
  ip_hash: string;
};

export type ContactResult =
  | { ok: true }
  | { ok: false; reason: 'validation' | 'rate_limit' | 'network' | 'unknown'; message: string };
