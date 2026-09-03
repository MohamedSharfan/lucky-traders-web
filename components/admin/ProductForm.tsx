'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { apiFetch } from '@/lib/client-api';
import { cn, formatPrice } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';
import type { Brand, Category, Product, Settings } from '@/lib/types';
import { GalleryUploader } from './GalleryUploader';
import { ImageUploader } from './ImageUploader';
import { AlertIcon, TrashIcon } from '@/components/ui/Icon';

/**
 * Add / edit product.
 *
 * This is the screen the brief cares most about: the owner uploads an image,
 * types a name, price and stock, picks a category and saves — and the customer
 * site reflects it immediately, because every storefront page is rendered per
 * request from the same database.
 */

const UNITS = [
  '100g', '250g', '400g', '500g', '750g', '1kg', '2kg', '5kg', '10kg',
  '100ml', '200ml', '250ml', '350ml', '500ml', '750ml', '1L', '1.5L', '2L', '5L',
  '1 pack', '5 pack', '10 pack', '1 bottle', '1 box', '1 piece', '1 bunch', '1 set',
];

interface Props {
  product?: Product | null;
  categories: Category[];
  brands: Brand[];
  settings: Settings;
}

export function ProductForm({ product, categories, brands, settings }: Props) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(product);

  const roots = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);

  const [form, setForm] = useState({
    name: product?.name ?? '',
    name_si: product?.name_si ?? '',
    name_ta: product?.name_ta ?? '',
    description: product?.description ?? '',
    category_id: product?.category_id ?? roots[0]?.id ?? '',
    subcategory_id: product?.subcategory_id ?? '',
    brand_id: product?.brand_id ?? '',
    sku: product?.sku ?? '',
    price: product ? String(product.price) : '',
    sale_price: product?.sale_price != null ? String(product.sale_price) : '',
    stock: product ? String(product.stock) : '0',
    low_stock_threshold: String(product?.low_stock_threshold ?? 10),
    unit: product?.unit ?? '1kg',
    weight: product?.weight ?? '',
    image_url: product?.image_url ?? null,
    gallery: product?.gallery ?? [],
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
    is_new: product?.is_new ?? !isEdit,
    is_best_seller: product?.is_best_seller ?? false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const subcategories = categories.filter((c) => c.parent_id === form.category_id);

  const price = Number(form.price) || 0;
  const salePrice = form.sale_price ? Number(form.sale_price) : null;
  const discount = salePrice && salePrice > 0 && salePrice < price
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = 'Enter a product name.';
    if (!form.category_id) next.category_id = 'Choose a category.';
    if (!(Number(form.price) > 0)) next.price = 'Enter a price greater than zero.';
    if (form.sale_price && Number(form.sale_price) >= Number(form.price)) {
      next.sale_price = 'The sale price must be lower than the regular price.';
    }
    if (form.sale_price && Number(form.sale_price) < 0) next.sale_price = 'Enter a valid sale price.';
    if (Number(form.stock) < 0 || !Number.isFinite(Number(form.stock))) {
      next.stock = 'Enter a stock quantity of zero or more.';
    }
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0])?.focus();
      return false;
    }
    return true;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !validate()) return;

    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        name_si: form.name_si.trim() || null,
        name_ta: form.name_ta.trim() || null,
        description: form.description.trim() || null,
        category_id: form.category_id,
        subcategory_id: form.subcategory_id || null,
        brand_id: form.brand_id || null,
        sku: form.sku.trim(),
        price: Number(form.price),
        sale_price: form.sale_price ? Number(form.sale_price) : null,
        stock: Number(form.stock),
        low_stock_threshold: Number(form.low_stock_threshold) || 10,
        unit: form.unit,
        weight: form.weight.trim() || form.unit,
        image_url: form.image_url,
        gallery: form.gallery,
        is_active: form.is_active,
        is_featured: form.is_featured,
        is_new: form.is_new,
        is_best_seller: form.is_best_seller,
      };

      if (isEdit && product) {
        await apiFetch(`/api/products/${product.id}`, { method: 'PATCH', json: payload });
        toast.success('Product updated. The shop now shows the new details.');
      } else {
        await apiFetch('/api/products', { method: 'POST', json: payload });
        toast.success('Product added and live on the shop.');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the product.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!product) return;
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      await apiFetch(`/api/products/${product.id}`, { method: 'DELETE' });
      toast.success('Product deleted.');
      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete the product.');
    } finally {
      setDeleting(false);
    }
  }

  const field = (key: string) => cn('input', errors[key] && 'input-error');

  return (
    <form onSubmit={save} noValidate className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {/* Basics */}
        <section className="card p-4 sm:p-5">
          <h2 className="mb-4 text-base font-bold text-ink">Product details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="label">
                Product name (English) <span className="text-brand-red">*</span>
              </label>
              <input
                id="name"
                className={field('name')}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Nadu Rice 5kg"
              />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="name_si" className="label">Sinhala name</label>
              <input
                id="name_si"
                className="input"
                value={form.name_si}
                onChange={(e) => set('name_si', e.target.value)}
                placeholder="නාඩු හාල් 5kg"
              />
              <p className="hint">Shown when a customer switches to Sinhala.</p>
            </div>

            <div>
              <label htmlFor="name_ta" className="label">Tamil name</label>
              <input
                id="name_ta"
                className="input"
                value={form.name_ta}
                onChange={(e) => set('name_ta', e.target.value)}
                placeholder="நாடு அரிசி 5kg"
              />
              <p className="hint">Shown when a customer switches to Tamil.</p>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="label">Description</label>
              <textarea
                id="description"
                rows={3}
                className="input resize-y"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="A short, honest description customers will find useful."
              />
            </div>
          </div>
        </section>

        {/* Organisation */}
        <section className="card p-4 sm:p-5">
          <h2 className="mb-4 text-base font-bold text-ink">Category & brand</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category_id" className="label">
                Category <span className="text-brand-red">*</span>
              </label>
              <select
                id="category_id"
                className={field('category_id')}
                value={form.category_id}
                onChange={(e) => {
                  set('category_id', e.target.value);
                  set('subcategory_id', '');
                }}
              >
                <option value="">Choose a category…</option>
                {roots.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.category_id && <p className="field-error">{errors.category_id}</p>}
            </div>

            <div>
              <label htmlFor="subcategory_id" className="label">Subcategory</label>
              <select
                id="subcategory_id"
                className="input"
                value={form.subcategory_id}
                onChange={(e) => set('subcategory_id', e.target.value)}
                disabled={!subcategories.length}
              >
                <option value="">
                  {subcategories.length ? 'None' : 'No subcategories for this category'}
                </option>
                {subcategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="brand_id" className="label">Brand</label>
              <select
                id="brand_id"
                className="input"
                value={form.brand_id}
                onChange={(e) => set('brand_id', e.target.value)}
              >
                <option value="">No brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sku" className="label">SKU</label>
              <input
                id="sku"
                className="input font-mono text-[13px]"
                value={form.sku}
                onChange={(e) => set('sku', e.target.value)}
                placeholder="Generated automatically if left blank"
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="card p-4 sm:p-5">
          <h2 className="mb-4 text-base font-bold text-ink">Pricing & stock</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="label">
                Regular price ({settings.currency}) <span className="text-brand-red">*</span>
              </label>
              <input
                id="price"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                className={field('price')}
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
              />
              {errors.price && <p className="field-error">{errors.price}</p>}
            </div>

            <div>
              <label htmlFor="sale_price" className="label">Sale price ({settings.currency})</label>
              <input
                id="sale_price"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                className={field('sale_price')}
                value={form.sale_price}
                onChange={(e) => set('sale_price', e.target.value)}
                placeholder="Leave blank for no discount"
              />
              {errors.sale_price ? (
                <p className="field-error">{errors.sale_price}</p>
              ) : discount > 0 ? (
                <p className="hint text-brand-red">
                  Customers see {discount}% OFF — {formatPrice(salePrice!, settings.currency)} instead of{' '}
                  {formatPrice(price, settings.currency)}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="stock" className="label">
                Stock quantity <span className="text-brand-red">*</span>
              </label>
              <input
                id="stock"
                type="number"
                inputMode="numeric"
                min={0}
                className={field('stock')}
                value={form.stock}
                onChange={(e) => set('stock', e.target.value)}
              />
              {errors.stock ? (
                <p className="field-error">{errors.stock}</p>
              ) : Number(form.stock) === 0 ? (
                <p className="hint text-brand-red">
                  At zero the product shows as “Out of Stock” and cannot be ordered.
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="low_stock_threshold" className="label">Low-stock warning at</label>
              <input
                id="low_stock_threshold"
                type="number"
                inputMode="numeric"
                min={0}
                className="input"
                value={form.low_stock_threshold}
                onChange={(e) => set('low_stock_threshold', e.target.value)}
              />
              <p className="hint">Flags the product on the Inventory page below this level.</p>
            </div>

            <div>
              <label htmlFor="unit" className="label">Pack size / unit</label>
              <input
                id="unit"
                list="unit-options"
                className="input"
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
              />
              <datalist id="unit-options">
                {UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="weight" className="label">Weight / volume</label>
              <input
                id="weight"
                className="input"
                value={form.weight}
                onChange={(e) => set('weight', e.target.value)}
                placeholder="Defaults to the pack size"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <aside className="space-y-4">
        <section className="card space-y-4 p-4">
          <div>
            <ImageUploader
              value={form.image_url}
              onChange={(url) => set('image_url', url)}
              label="Main product image"
            />
            {!form.image_url && (
              <p className="mt-2 flex items-start gap-1.5 text-[12px] text-muted">
                <AlertIcon size={14} className="mt-px shrink-0" />
                Without an image the shop shows a clean placeholder with the product initials.
              </p>
            )}
          </div>

          <GalleryUploader value={form.gallery} onChange={(urls) => set('gallery', urls)} />
        </section>

        <section className="card p-4">
          <h2 className="mb-3 text-sm font-bold text-ink">Visibility</h2>
          <div className="space-y-2.5">
            <Toggle
              label="Active"
              hint="Uncheck to hide from the shop without deleting."
              checked={form.is_active}
              onChange={(v) => set('is_active', v)}
            />
            <Toggle
              label="Featured"
              hint="Shows in the Featured Products row."
              checked={form.is_featured}
              onChange={(v) => set('is_featured', v)}
            />
            <Toggle
              label="New arrival"
              hint="Shows in New Arrivals and carries a NEW badge."
              checked={form.is_new}
              onChange={(v) => set('is_new', v)}
            />
            <Toggle
              label="Best seller"
              hint="Shows in the Best Sellers row."
              checked={form.is_best_seller}
              onChange={(v) => set('is_best_seller', v)}
            />
          </div>
        </section>

        <section className="card space-y-2 p-4">
          <button type="submit" disabled={busy} className="btn-primary btn-lg w-full">
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Save product'}
          </button>
          <Link href="/admin/products" className="btn-outline w-full">
            Cancel
          </Link>
          {isEdit && (
            <button
              type="button"
              onClick={remove}
              disabled={deleting}
              className="btn-danger w-full"
            >
              <TrashIcon size={16} />
              {deleting ? 'Deleting…' : 'Delete product'}
            </button>
          )}
        </section>
      </aside>
    </form>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-brand-red focus:ring-brand-blue"
      />
      <span>
        <span className="block text-[13.5px] font-semibold text-ink">{label}</span>
        <span className="block text-[12px] leading-snug text-muted">{hint}</span>
      </span>
    </label>
  );
}
