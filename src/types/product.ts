export type UnitLabel = 'unidad' | 'kg' | 'lb';

export type Product = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string | null;
  image_url: string;
  category: string;
  price: number | null;
  stock: number | null;
  unit_label: UnitLabel;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ProductInsert = {
  name: string;
  slug: string;
  short_description: string;
  description?: string | null;
  image_url: string;
  category: string;
  price?: number | null;
  stock?: number | null;
  unit_label?: UnitLabel;
  is_active?: boolean;
  display_order?: number;
};

export type ProductUpdate = Partial<ProductInsert>;
