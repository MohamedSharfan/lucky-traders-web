'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiFetch } from '@/lib/client-api';
import { cn, formatPrice } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';
import type { Category, Paginated, ProductView, Settings } from '@/lib/types';
import { ProductImage } from '@/components/ProductImage';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { BoxIcon, SearchIcon, TrashIcon } from '@/components/ui/Icon';

/**
 * Product list.
 *
 * Price and stock are editable inline — the two things a shop owner changes
 * every day should not require opening a form. Everything else lives behind
 * the Edit link.
 */
export function ProductsTable({
  result,
  categories,
  settings,
  query,
}: {
  result: Paginated<ProductView>;
  categories: Category[];
  settings: Settings;
  query: { q: string; category: string; status: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState(query.q);
  const [busyId, setBusyId] = useState<string | null>(null);

  const roots = categories.filter((c) => !c.parent_id);

  const buildHref = (overrides: Partial<typeof query> & { page?: number }) => {
    const params = new URLSearchParams();
    const merged = { ...query, ...overrides };
    if (merged.q) params.set('q', merged.q);
    if (merged.category) params.set('category', merged.category);
    if (merged.status) params.set('status', merged.status);
    if (overrides.page && overrides.page > 1) params.set('page', String(overrides.page));
    return `/admin/products${params.toString() ? `?${params}` : ''}`;
  };

  async function patch(id: string, body: Record<string, unknown>, message: string) {
    setBusyId(id);
    try {
      await apiFetch(`/api/products/${id}`, { method: 'PATCH', json: body });
      toast.success(message);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save that change.');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(product: ProductView) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setBusyId(product.id);
    try {
      await apiFetch(`/api/products/${product.id}`, { method: 'DELETE' });
      toast.success('Product deleted.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete the product.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <form
          className="relative min-w-[200px] flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(buildHref({ q: search, page: 1 }));
          }}
        >
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, brand or SKU…"
            className="input h-9 pl-9 text-[13.5px]"
            aria-label="Search products"
          />
        </form>

        <select
          value={query.category}
          onChange={(e) => router.push(buildHref({ category: e.target.value, page: 1 }))}
          className="input h-9 w-auto text-[13.5px]"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {roots.map((cat) => (
            <option key={cat.id} value={cat.slug}>{cat.name}</option>
          ))}
        </select>

        <select
          value={query.status}
          onChange={(e) => router.push(buildHref({ status: e.target.value, page: 1 }))}
          className="input h-9 w-auto text-[13.5px]"
          aria-label="Filter by status"
        >
          <option value="">All products</option>
          <option value="active">Active only</option>
          <option value="hidden">Hidden only</option>
          <option value="sale">On sale</option>
          <option value="out">Out of stock</option>
          <option value="low">Low stock</option>
        </select>

        <span className="ml-auto text-[13px] text-muted">
          {result.total.toLocaleString()} product{result.total === 1 ? '' : 's'}
        </span>
      </div>

      {result.items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<BoxIcon size={26} />}
            title="No products match"
            body="Try a different search or filter, or add your first product."
            actionLabel="Add Product"
            actionHref="/admin/products/new"
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden overflow-hidden lg:block">
            <table className="w-full text-left text-[13.5px]">
              <thead className="border-b border-line bg-canvas text-[12px] uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-bold">Product</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Category</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Price</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Sale price</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Stock</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Status</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.items.map((product) => (
                  <tr key={product.id} className={cn('align-middle', busyId === product.id && 'opacity-60')}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 shrink-0">
                          <ProductImage
                            src={product.image_url}
                            alt={product.name}
                            categorySlug={product.category_slug}
                            subcategorySlug={product.subcategory_slug}
                            unit={product.unit}
                            rounded="rounded-md"
                            sizes="44px"
                            className="border border-line"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="clamp-2 font-semibold text-ink hover:text-brand-blue"
                          >
                            {product.name}
                          </Link>
                          <p className="text-[12px] text-muted">
                            {product.brand_name ? `${product.brand_name} · ` : ''}
                            <span className="font-mono">{product.sku}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-muted">
                      {product.subcategory_name ?? product.category_name ?? '—'}
                    </td>

                    <td className="px-3 py-2.5">
                      <InlineNumber
                        value={product.price}
                        prefix={settings.currency}
                        onSave={(value) => patch(product.id, { price: value }, 'Price updated.')}
                        ariaLabel={`Price of ${product.name}`}
                      />
                    </td>

                    <td className="px-3 py-2.5">
                      <InlineNumber
                        value={product.sale_price}
                        prefix={settings.currency}
                        allowEmpty
                        onSave={(value) => patch(product.id, { sale_price: value }, 'Sale price updated.')}
                        ariaLabel={`Sale price of ${product.name}`}
                      />
                      {product.on_sale && (
                        <span className="ml-1 text-[11px] font-bold text-brand-red">
                          −{product.discount_percent}%
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2.5">
                      <InlineNumber
                        value={product.stock}
                        integer
                        onSave={(value) => patch(product.id, { stock: value }, 'Stock updated.')}
                        ariaLabel={`Stock of ${product.name}`}
                      />
                    </td>

                    <td className="px-3 py-2.5">
                      <StatusBadge product={product} />
                    </td>

                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/products/${product.id}`} className="btn-outline btn-sm">
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            patch(
                              product.id,
                              { is_active: !product.is_active },
                              product.is_active ? 'Product hidden from the shop.' : 'Product is live again.',
                            )
                          }
                          className="btn-ghost btn-sm"
                        >
                          {product.is_active ? 'Hide' : 'Show'}
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(product)}
                          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-brand-redSoft hover:text-brand-red"
                          aria-label={`Delete ${product.name}`}
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-2.5 lg:hidden">
            {result.items.map((product) => (
              <li key={product.id} className={cn('card p-3', busyId === product.id && 'opacity-60')}>
                <div className="flex gap-3">
                  <div className="w-16 shrink-0">
                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                      categorySlug={product.category_slug}
                      subcategorySlug={product.subcategory_slug}
                      unit={product.unit}
                      rounded="rounded-lg"
                      sizes="64px"
                      className="border border-line"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="clamp-2 text-[14px] font-semibold text-ink"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {product.category_name} · <span className="font-mono">{product.sku}</span>
                    </p>
                    <div className="mt-1.5">
                      <StatusBadge product={product} />
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <label className="text-[11.5px] font-medium text-muted">
                    Price
                    <InlineNumber
                      value={product.price}
                      prefix={settings.currency}
                      block
                      onSave={(value) => patch(product.id, { price: value }, 'Price updated.')}
                      ariaLabel={`Price of ${product.name}`}
                    />
                  </label>
                  <label className="text-[11.5px] font-medium text-muted">
                    Sale
                    <InlineNumber
                      value={product.sale_price}
                      prefix={settings.currency}
                      allowEmpty
                      block
                      onSave={(value) => patch(product.id, { sale_price: value }, 'Sale price updated.')}
                      ariaLabel={`Sale price of ${product.name}`}
                    />
                  </label>
                  <label className="text-[11.5px] font-medium text-muted">
                    Stock
                    <InlineNumber
                      value={product.stock}
                      integer
                      block
                      onSave={(value) => patch(product.id, { stock: value }, 'Stock updated.')}
                      ariaLabel={`Stock of ${product.name}`}
                    />
                  </label>
                </div>

                <div className="mt-3 flex gap-2">
                  <Link href={`/admin/products/${product.id}`} className="btn-outline btn-sm flex-1">
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      patch(
                        product.id,
                        { is_active: !product.is_active },
                        product.is_active ? 'Product hidden.' : 'Product is live again.',
                      )
                    }
                    className="btn-ghost btn-sm flex-1"
                  >
                    {product.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button type="button" onClick={() => remove(product)} className="btn-danger btn-sm">
                    <TrashIcon size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath="/admin/products"
            params={query}
          />
        </>
      )}
    </div>
  );
}

function StatusBadge({ product }: { product: ProductView }) {
  if (!product.is_active) {
    return <span className="status-pill bg-gray-100 text-gray-600 ring-gray-200">Hidden</span>;
  }
  if (product.stock <= 0) {
    return <span className="status-pill bg-brand-redSoft text-brand-redDark ring-brand-red/20">Out of stock</span>;
  }
  if (product.stock_status === 'low_stock') {
    return <span className="status-pill bg-amber-50 text-amber-700 ring-amber-200">Low stock</span>;
  }
  return <span className="status-pill bg-emerald-50 text-emerald-700 ring-emerald-200">In stock</span>;
}

/**
 * Inline editable number. Commits on blur or Enter, reverts on Escape, and only
 * calls the server when the value actually changed.
 */
function InlineNumber({
  value,
  onSave,
  prefix,
  integer = false,
  allowEmpty = false,
  block = false,
  ariaLabel,
}: {
  value: number | null;
  onSave: (value: number | null) => void;
  prefix?: string;
  integer?: boolean;
  allowEmpty?: boolean;
  block?: boolean;
  ariaLabel: string;
}) {
  const [draft, setDraft] = useState(value == null ? '' : String(value));

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed === '') {
      if (!allowEmpty) {
        setDraft(value == null ? '' : String(value));
        return;
      }
      if (value != null) onSave(null);
      return;
    }
    const next = integer ? Math.max(0, Math.floor(Number(trimmed))) : Number(trimmed);
    if (!Number.isFinite(next) || next < 0) {
      setDraft(value == null ? '' : String(value));
      return;
    }
    if (next !== value) onSave(next);
  };

  return (
    <span className={cn('inline-flex items-center gap-1', block && 'mt-0.5 flex w-full')}>
      {prefix && !block && <span className="text-[12px] text-muted">{prefix}</span>}
      <input
        type="number"
        inputMode={integer ? 'numeric' : 'decimal'}
        min={0}
        step={integer ? 1 : 0.01}
        value={draft}
        aria-label={ariaLabel}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
          if (e.key === 'Escape') {
            setDraft(value == null ? '' : String(value));
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder={allowEmpty ? '—' : undefined}
        className={cn(
          'rounded-md border border-line bg-white px-2 py-1 text-[13px] font-semibold text-ink',
          'focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20',
          block ? 'w-full' : 'w-[86px]',
        )}
      />
    </span>
  );
}
