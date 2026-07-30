import { useEffect, useRef, useState } from 'react';
import type { Product, ProductInsert, UnitLabel } from '@/types/product';
import { deleteImageByUrl, slugify, uploadProductImage } from '@/lib/admin';

type Mode = { kind: 'create' } | { kind: 'edit'; product: Product };

type Props = {
  mode: Mode;
  busy: boolean;
  onCancel: () => void;
  onSave: (data: ProductInsert) => Promise<void>;
};

const CATEGORIES = ['Quesos', 'Yogures', 'Lácteos', 'Otros'];
const UNITS: UnitLabel[] = ['unidad', 'kg', 'lb'];

type FormState = {
  name: string;
  short_description: string;
  description: string;
  image_url: string;
  category: string;
  price: string;
  stock: string;
  unit_label: UnitLabel;
  is_active: boolean;
  is_featured: boolean;
  featured_order: string;
  display_order: string;
};

function emptyForm(): FormState {
  return {
    name: '',
    short_description: '',
    description: '',
    image_url: '',
    category: 'Quesos',
    price: '',
    stock: '',
    unit_label: 'unidad',
    is_active: true,
    is_featured: false,
    featured_order: '',
    display_order: '0',
  };
}

function fromProduct(p: Product): FormState {
  return {
    name: p.name,
    short_description: p.short_description,
    description: p.description ?? '',
    image_url: p.image_url,
    category: p.category,
    price: p.price == null ? '' : String(p.price),
    stock: p.stock == null ? '' : String(p.stock),
    unit_label: p.unit_label,
    is_active: p.is_active,
    is_featured: p.is_featured,
    featured_order: p.featured_order == null ? '' : String(p.featured_order),
    display_order: String(p.display_order),
  };
}

function makeSlug(name: string, existing?: string): string {
  const base = slugify(name) || 'producto';
  if (existing && existing.startsWith(base)) return existing;
  const suffix = crypto.randomUUID().slice(0, 4);
  return `${base}-${suffix}`;
}

export default function ProductEditor({ mode, busy, onCancel, onSave }: Props) {
  const [form, setForm] = useState<FormState>(() =>
    mode.kind === 'edit' ? fromProduct(mode.product) : emptyForm(),
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replacingImage, setReplacingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(mode.kind === 'edit' ? fromProduct(mode.product) : emptyForm());
    setError(null);
  }, [mode.kind === 'edit' ? mode.product.id : 'new']);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const oldUrl = form.image_url;
      const url = await uploadProductImage(
        file,
        mode.kind === 'edit' ? mode.product.id : undefined,
      );
      if (oldUrl) setReplacingImage(oldUrl);
      update('image_url', url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError('El nombre es obligatorio.');
    if (!form.short_description.trim() || form.short_description.length < 10)
      return setError('La descripción corta debe tener al menos 10 caracteres.');
    if (!form.image_url) return setError('Sube una imagen para el producto.');
    if (!form.category.trim()) return setError('La categoría es obligatoria.');

    const slug =
      mode.kind === 'edit' && slugify(form.name) === slugify(mode.product.name)
        ? mode.product.slug
        : makeSlug(form.name, mode.kind === 'edit' ? mode.product.slug : undefined);

    const data: ProductInsert = {
      name: form.name.trim(),
      slug,
      short_description: form.short_description.trim(),
      description: form.description.trim() || null,
      image_url: form.image_url,
      category: form.category.trim(),
      price: form.price === '' ? null : Number(form.price),
      stock: form.stock === '' ? null : Number(form.stock),
      unit_label: form.unit_label,
      is_active: form.is_active,
      is_featured: form.is_featured,
      featured_order: form.featured_order === '' ? null : Number(form.featured_order),
      display_order: Number(form.display_order || 0),
    };

    try {
      await onSave(data);
      if (replacingImage) {
        await deleteImageByUrl(replacingImage).catch(() => undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-white shadow-card ring-1 ring-espresso-900/5"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-espresso-900/10 px-6 py-5 sm:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-meadow-600">
            {mode.kind === 'edit' ? 'Editar producto' : 'Nuevo producto'}
          </p>
          <h2 className="mt-1 font-display text-xl font-extrabold text-espresso-900">
            {mode.kind === 'edit' ? mode.product.name : 'Crear un producto'}
          </h2>
        </div>
        <button type="button" onClick={onCancel} className="btn-ghost text-sm">
          ← Volver a la lista
        </button>
      </header>

      <div className="grid grid-cols-1 gap-5 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-5">
          <Card title="Información básica" icon={<IconBox />}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  maxLength={120}
                  required
                  className="input"
                />
              </Field>
              <Field label="Categoría" required>
                <input
                  type="text"
                  list="admin-categories"
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                  required
                  className="input"
                />
                <datalist id="admin-categories">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
            </div>
            <div className="mt-4 grid gap-4">
              <Field label="Descripción corta" required hint="Entre 10 y 280 caracteres.">
                <textarea
                  value={form.short_description}
                  onChange={(e) => update('short_description', e.target.value)}
                  minLength={10}
                  maxLength={280}
                  required
                  rows={2}
                  className="input resize-y"
                />
              </Field>
              <Field label="Descripción larga" hint="Opcional, se muestra en el detalle.">
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  rows={4}
                  className="input resize-y"
                />
              </Field>
            </div>
          </Card>

          <Card title="Inventario y precios" icon={<IconCart />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Precio (COP)" hint="Déjalo vacío para 'a convenir'.">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={form.price}
                  onChange={(e) => update('price', e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Unidad" required>
                <select
                  value={form.unit_label}
                  onChange={(e) => update('unit_label', e.target.value as UnitLabel)}
                  className="input"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u === 'unidad' ? 'Por unidad' : u === 'kg' ? 'Por kilogramo' : 'Por libra'}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Stock" hint="Vacío = no mostrar.">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(e) => update('stock', e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Orden" hint="Menor = primero.">
                <input
                  type="number"
                  step="1"
                  value={form.display_order}
                  onChange={(e) => update('display_order', e.target.value)}
                  className="input"
                />
              </Field>
            </div>

            <div className="mt-4 grid gap-3 border-t border-espresso-900/5 pt-4 md:grid-cols-[1fr_auto] md:items-center">
              <ToggleRow
                label="Producto destacado (Hero)"
                description="Aparece en 'Más vendidos' de la portada."
                checked={form.is_featured}
                onChange={(v) => update('is_featured', v)}
              />
              {form.is_featured && (
                <div className="md:w-32">
                  <Field label="Orden destacado">
                    <input
                      type="number"
                      step="1"
                      value={form.featured_order}
                      onChange={(e) => update('featured_order', e.target.value)}
                      className="input"
                    />
                  </Field>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 self-start lg:sticky lg:top-4">
          <Card title="Imagen del producto" icon={<IconImage />}>
            <div className="aspect-square overflow-hidden rounded-xl bg-cream-50 ring-1 ring-espresso-900/10">
              {form.image_url ? (
                <img
                  src={form.image_url}
                  alt="Vista previa"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center px-6 text-center text-sm text-espresso-700/60">
                  Sin imagen seleccionada
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/webp,image/png,image/jpeg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || busy}
                className="btn-secondary flex-1 sm:flex-none"
              >
                {uploading ? 'Subiendo…' : form.image_url ? 'Reemplazar imagen' : 'Subir imagen'}
              </button>
              {form.image_url && (
                <button
                  type="button"
                  onClick={() => {
                    if (form.image_url) setReplacingImage(form.image_url);
                    update('image_url', '');
                  }}
                  className="text-sm font-semibold text-espresso-700 underline-offset-4 hover:text-espresso-900 hover:underline"
                >
                  Quitar
                </button>
              )}
            </div>
          </Card>

          <Card title="Consejos" icon={<IconBulb />}>
            <ul className="grid gap-3 text-[15px] leading-relaxed text-espresso-700">
              <Bullet>Fondo blanco o neutro para mejor contraste en el catálogo.</Bullet>
              <Bullet>Resolución sugerida: 800×600 px o superior (formato 4:3).</Bullet>
              <Bullet>Formatos aceptados: JPG, PNG y WEBP.</Bullet>
            </ul>
          </Card>
        </div>
      </div>

      {error && (
        <div className="mx-6 mb-2 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-8">
          <span aria-hidden="true" className="text-base">
            ⚠
          </span>
          <span>{error}</span>
        </div>
      )}

      <footer className="sticky bottom-0 -mx-px mt-6 flex flex-wrap items-center justify-end gap-3 rounded-b-3xl border-t border-espresso-900/10 bg-cream-50/95 px-6 py-4 backdrop-blur supports-backdrop-filter:bg-cream-50/80 sm:px-8">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancelar
        </button>
        <button type="submit" disabled={busy || uploading} className="btn-primary">
          {busy ? 'Guardando…' : mode.kind === 'edit' ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </footer>

      <style>{`
        .input {
          width: 100%;
          height: 2.5rem;
          border-radius: 0.625rem;
          border: 1px solid rgb(232 215 188);
          background: white;
          padding: 0 0.75rem;
          font-size: 0.9rem;
          color: var(--color-espresso-900);
          transition: border-color 150ms, box-shadow 150ms;
        }
        textarea.input {
          height: auto;
          min-height: 2.5rem;
          padding: 0.55rem 0.75rem;
          line-height: 1.4;
        }
        select.input {
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg viewBox='0 0 20 20' fill='currentColor' xmlns='http://www.w3.org/2000/svg'%3e%3cpath fill-rule='evenodd' d='M5.5 7.5 10 12l4.5-4.5z'/%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 0.6rem center;
          background-size: 1.1rem;
          padding-right: 2rem;
          appearance: none;
        }
        .input:hover {
          border-color: rgb(210 180 130);
        }
        .input:focus {
          outline: none;
          border-color: var(--color-cheese-500);
          box-shadow: 0 0 0 3px rgb(232 183 51 / 0.18);
        }
        .input::placeholder {
          color: rgb(180 160 130);
        }
      `}</style>
    </form>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-espresso-900/10 bg-cream-50/40 p-5">
      <h3 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-espresso-700">
        <span className="grid h-5 w-5 place-items-center text-espresso-500">{icon}</span>
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-espresso-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-espresso-700/70">{hint}</span>}
    </label>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-espresso-900">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-espresso-700/80">{description}</p>
      </div>
      <label className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-espresso-900/15 transition peer-checked:bg-cheese-500 peer-focus-visible:ring-2 peer-focus-visible:ring-cheese-500 peer-focus-visible:ring-offset-2"
        />
        <span
          aria-hidden="true"
          className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5"
        />
      </label>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span
        aria-hidden="true"
        className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-cheese-500"
      />
      <span>{children}</span>
    </li>
  );
}

function IconBox() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-3.5 w-3.5"
    >
      <path d="M3 7l7-4 7 4v6l-7 4-7-4V7z" strokeLinejoin="round" />
      <path d="M3 7l7 4 7-4M10 11v6" strokeLinejoin="round" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-3.5 w-3.5"
    >
      <path d="M3 4h2l2 9h9l2-7H6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="8" cy="16" r="1.2" fill="currentColor" />
      <circle cx="15" cy="16" r="1.2" fill="currentColor" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-3.5 w-3.5"
    >
      <rect x="3" y="4" width="14" height="12" rx="2" />
      <circle cx="7.5" cy="8.5" r="1.2" fill="currentColor" />
      <path d="M3 14l4-4 4 3 3-2 3 3" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function IconBulb() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-3.5 w-3.5"
    >
      <path
        d="M10 3a5 5 0 00-3.2 8.8c.6.6 1.2 1.2 1.2 2v.2h4v-.2c0-.8.6-1.4 1.2-2A5 5 0 0010 3z"
        strokeLinejoin="round"
      />
      <path d="M8 16h4M9 17h2" strokeLinecap="round" />
    </svg>
  );
}
