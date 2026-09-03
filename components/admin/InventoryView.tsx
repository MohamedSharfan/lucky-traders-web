'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiFetch } from '@/lib/client-api';
import { cn, formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';
import type { ProductView } from '@/lib/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { AlertIcon, BoxIcon, CheckIcon, SearchIcon } from '@/components/ui/Icon';

/**
 * Inventory.
 *
 * Purpose-built for a restock session: search, type the new count, press Enter,
 * move on. Rows are colour-coded so out-of-stock lines are impossible to miss.
 */
export function InventoryView({
  items,
  total,
  page,
  totalPages,
  query,
  summary,
}: {
  items: ProductView[];
  total: number;
  page: number;
  totalPages: number;
  query: { q: string; filter: string };
  summary: { inStock: number; low: number; out: number };
}) {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState(query.q);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const buildHref = (overrides: Partial<typeof query> & { page?: number }) => {
    const params = new URLSearchParams();
    const merged = { ...query, ...overrides };
    if (merged.q) params.set('q', merged.q);
    if (merged.filter) params.set('filter', merged.filter);
    if (overrides.page && overrides.page > 1) params.set('page', String(overrides.page));
    return `/admin/inventory${params.toString() ? `?${params}` : ''}`;
  };

  async function save(product: ProductView) {
    const raw = drafts[product.id];
    if (raw === undefined) return;

    const next = Math.max(0, Math.floor(Number(raw)));
    if (!Number.isFinite(next)) {
      toast.error('Enter a whole number of units.');
      return;
    }
    if (next === product.stock) {
      setDrafts((prev) => {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      });
      return;
    }

    setSaving(product.id);
    try {
      await apiFetch(`/api/products/${product.id}`, { method: 'PATCH', json: { stock: next } });
      setDrafts((prev) => {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      });
      setSavedId(product.id);
      setTimeout(() => setSavedId((id) => (id === product.id ? null : id)), 1800);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update the stock.');
    } finally {
      setSaving(null);
    }
  }

  const filters = [
    { value: '', label: 'All', count: summary.inStock + summary.low + summary.out },
    { value: 'low', label: 'Low stock', count: summary.low },
    { value: 'out', label: 'Out of stock', count: summary.out },
  ];

  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-3 gap-2.5">
        <SummaryCard label="In stock" value={summary.inStock} tone="emerald" />
        <SummaryCard label="Low stock" value={summary.low} tone="amber" />
        <SummaryCard label="Out of stock" value={summary.out} tone="red" />
      </ul>

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
            placeholder="Search by product name or SKU…"
            className="input h-9 pl-9 text-[13.5px]"
            aria-label="Search inventory"
          />
        </form>

        <div className="flex gap-1.5">
          {filters.map((filter) => (
            <button
              key={filter.value || 'all'}
              type="button"
              onClick={() => router.push(buildHref({ filter: filter.value, page: 1 }))}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors',
                query.filter === filter.value
                  ? 'border-brand-red bg-brand-red text-white'
                  : 'border-line bg-white text-ink hover:border-brand-blue hover:text-brand-blue',
              )}
            >
              {filter.label}
              <span className={cn('ml-1.5 text-[11.5px]', query.filter === filter.value ? 'text-white/80' : 'text-muted')}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<BoxIcon size={26} />}
            title="Nothing to show"
            body="No products match this search or filter."
          />
        </div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13.5px]">
              <thead className="border-b border-line bg-canvas text-[12px] uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-bold">Product</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">SKU</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Status</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Last updated</th>
                  <th scope="col" className="px-4 py-2.5 font-bold">Current stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((product) => {
                  const draft = drafts[product.id];
                  const dirty = draft !== undefined && Number(draft) !== product.stock;
                  return (
                    <tr
                      key={product.id}
                      className={cn(
                        product.stock <= 0 && 'bg-brand-redSoft/40',
                        product.stock > 0 && product.stock_status === 'low_stock' && 'bg-amber-50/50',
                        saving === product.id && 'opacity-60',
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="clamp-2 font-semibold text-ink hover:text-brand-blue"
                        >
                          {product.name}
                        </Link>
                        <p className="text-[12px] text-muted">
                          {product.brand_name ? `${product.brand_name} · ` : ''}
                          {product.category_name}
                        </p>
                      </td>

                      <td className="px-3 py-2.5 font-mono text-[12.5px] text-muted">{product.sku}</td>

                      <td className="px-3 py-2.5">
                        {product.stock <= 0 ? (
                          <span className="status-pill bg-brand-redSoft text-brand-redDark ring-brand-red/20">
                            Out of Stock
                          </span>
                        ) : product.stock_status === 'low_stock' ? (
                          <span className="status-pill bg-amber-50 text-amber-700 ring-amber-200">Low Stock</span>
                        ) : (
                          <span className="status-pill bg-emerald-50 text-emerald-700 ring-emerald-200">In Stock</span>
                        )}
                      </td>

                      <td className="px-3 py-2.5 text-[12.5px] text-muted">{formatDate(product.updated_at)}</td>

                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={draft ?? String(product.stock)}
                            aria-label={`Stock for ${product.name}`}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [product.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                save(product);
                              }
                            }}
                            onBlur={() => dirty && save(product)}
                            className="w-24 rounded-md border border-line bg-white px-2 py-1.5 text-[13.5px] font-semibold text-ink focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                          />
                          {dirty ? (
                            <button type="button" onClick={() => save(product)} className="btn-primary btn-sm">
                              Save
                            </button>
                          ) : savedId === product.id ? (
                            <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-emerald-600">
                              <CheckIcon size={14} /> Saved
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[12.5px] text-muted">
            Showing {items.length} of {total.toLocaleString()} products. Type a new number and press Enter to save.
          </p>

          <Pagination page={page} totalPages={totalPages} basePath="/admin/inventory" params={query} />
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'emerald' | 'amber' | 'red';
}) {
  const styles = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    red: 'border-brand-red/20 bg-brand-redSoft text-brand-redDark',
  };
  return (
    <li className={cn('rounded-card border p-3.5', styles[tone])}>
      <p className="flex items-center gap-1.5 text-[12px] font-semibold">
        {tone !== 'emerald' && <AlertIcon size={14} />}
        {label}
      </p>
      <p className="mt-0.5 text-xl font-extrabold tracking-tight">{value.toLocaleString()}</p>
    </li>
  );
}
