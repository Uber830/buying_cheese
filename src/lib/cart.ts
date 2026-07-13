import type { CartSnapshot } from '@/types/cart';
import type { Product, UnitLabel } from '@/types/product';

const STORAGE_KEY = 'lacolina:cart:v1';
const EVENT = 'lacolina:cart:update';

const EMPTY_SNAPSHOT: CartSnapshot = Object.freeze([]);

let memory: CartItem[] = [];
let hydrated = false;

type CartItem = {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string;
  category: string;
  unit_label: UnitLabel;
  stock: number | null;
  quantity: number;
};

const listeners = new Set<() => void>();

function readStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i) =>
        i &&
        typeof i.id === 'string' &&
        typeof i.name === 'string' &&
        typeof i.quantity === 'number' &&
        i.quantity > 0,
    );
  } catch {
    return [];
  }
}

function writeStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* noop */
  }
}

function emit() {
  for (const l of listeners) l();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT));
  }
}

function ensureHydrated() {
  if (hydrated || typeof window === 'undefined') return;
  memory = readStorage();
  hydrated = true;
}

function setState(next: CartItem[]) {
  memory = next;
  writeStorage(memory);
  emit();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): CartSnapshot {
  ensureHydrated();
  return memory.length === 0 ? EMPTY_SNAPSHOT : memory;
}

export function getServerSnapshot(): CartSnapshot {
  return EMPTY_SNAPSHOT;
}

export function addProduct(product: Product): CartItem[] {
  ensureHydrated();
  const next = [...memory];
  const idx = next.findIndex((i) => i.id === product.id);
  if (idx >= 0) {
    next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
  } else {
    next.push({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image_url: product.image_url,
      category: product.category,
      unit_label: product.unit_label,
      stock: product.stock,
      quantity: 1,
    });
  }
  setState(next);
  return next;
}

export function incrementItem(id: string) {
  ensureHydrated();
  const next = memory.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
  setState(next);
}

export function updateQuantity(id: string, quantity: number) {
  ensureHydrated();
  if (quantity <= 0) {
    setState(memory.filter((i) => i.id !== id));
    return;
  }
  setState(memory.map((i) => (i.id === id ? { ...i, quantity } : i)));
}

export function removeItem(id: string) {
  ensureHydrated();
  setState(memory.filter((i) => i.id !== id));
}

export function clearCart() {
  setState([]);
}

export function totalItems(items: CartSnapshot): number {
  return items.reduce((acc, i) => acc + i.quantity, 0);
}

export function totalPrice(items: CartSnapshot): number {
  return items.reduce((acc, i) => acc + (i.price ?? 0) * i.quantity, 0);
}

export const CART_EVENT = EVENT;
