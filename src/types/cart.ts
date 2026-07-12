import type { Product, UnitLabel } from './product';

export type CartItem = {
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

export type CartSnapshot = ReadonlyArray<CartItem>;

export type CartStore = {
  add: (product: Product) => void;
  update: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  totalItems: (items: CartSnapshot) => number;
  totalPrice: (items: CartSnapshot) => number;
};
