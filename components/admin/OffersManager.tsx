'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiFetch } from '@/lib/client-api';
import { cn, formatPrice } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';
import type { Category, ProductView, Settings } from '@/lib/types';
import { ProductImage } from '@/components/ProductImage';
import { EmptyState } from '@/components/ui/EmptyState';
import { TagIcon } from '@/components/ui/Icon';

/**
 * Offers.
 *
 * Running a promotion is one form: pick a category (or the whole shop), choose
 * a percentage or a fixed amount, apply. Everything on sale is listed below and
 * can be cleared individually or all at once.
 */
export function OffersManager({
  onSale,
  categories,
  settings,
}: {
  onSale: ProductView[];
  categories: Category[];
  settings: Settings;
}) {
  const router = useRouter();
  const toast = useToast();

  const [scope, setScope] = useState('');
  const [mode, setMode] = useState<'percent' | 'fixed'>('percent');
  const [amount, setAmount] = useState('10');
  const [busy, setBusy] = useState(false);
  const [clearingId, setClearingId] = useState<string | null>(null);

  const roots = categories.filter((c) => !c.parent_id);
  const scopeLabel = scope ? roots.find((c) => c.slug === scope)?.name ?? scope : 'the whole shop';

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Enter a discount greater than zero.');
      return;
    }
    if (mode === 'percent' && value >= 100) {
      toast.error('A percentage discount must be below 100.');
      return;
    }
    if (
      !window.confirm(
        `Apply ${mode === 'percent' ? `${value}%` : formatPrice(value, settings.currency)} off across ${scopeLabel}?`,
      )
    ) {
      return;
    }

    setBusy(true);
    try {
      const result = await apiFetch<{ updated: number; considered: number }>('/api/products/bulk', {
        method: 'POST',
        json: {
          action: mode === 'percent' ? 'discount_percent' : 'discount_fixed',
          category: scope || undefined,
          // No category selected means every product in the shop.
          all: !scope,
          percent: mode === 'percent' ? value : undefined,
          amount: mode === 'fixed' ? value : undefined,
        },
      });
      toast.success(`${result.updated} of ${result.considered} products are now on sale.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not apply the offer.');
    } finally {
      setBusy(false);
    }
  }

  async function clearOne(product: ProductView) {
    setClearingId(product.id);
    try {
      await apiFetch(`/api/products/${product.id}`, { method: 'PATCH', json: { sale_price: null } });
      toast.success(`${product.name} is back to its regular price.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not clear the discount.');
    } finally {
      setClearingId(null);
    }
  }

  async function clearAll() {
    if (!window.confirm(`Remove the discount from all ${onSale.length} products on sale?`)) return;

    setBusy(true);
    try {
      const result = await apiFetch<{ updated: number }>('/api/products/bulk', {
        method: 'POST',
        json: { action: 'clear_discount', product_ids: onSale.map((p) => p.id) },
      });
      toast.success(`${result.updated} discounts removed.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not clear the discounts.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Create a promotion */}
      <section className="card p-4 sm:p-5">
        <h2 className="mb-1 text-base font-bold text-ink">Run a promotion</h2>
        <p className="mb-4 text-[13px] text-muted">
          Sale prices show on the shop straight away, with the discount badge calculated for you.
        </p>

        <form onSubmit={apply} className="grid gap-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
          <div>
            <label htmlFor="offer-scope" className="label">Apply to</label>
            <select
              id="offer-scope"
              className="input"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              <option value="">Every product in the shop</option>
              {roots.map((cat) => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="offer-mode" className="label">Discount type</label>
            <select
              id="offer-mode"
              className="input"
              value={mode}
              onChange={(e) => setMode(e.target.value as 'percent' | 'fixed')}
            >
              <option value="percent">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>

          <div>
            <label htmlFor="offer-amount" className="label">
              {mode === 'percent' ? 'Percent off' : `Amount off (${settings.currency})`}
            </label>
            <input
              id="offer-amount"
              type="number"
              inputMode="decimal"
              min={1}
              max={mode === 'percent' ? 99 : undefined}
              className="input sm:w-32"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <button type="submit" disabled={busy} className="btn-primary btn-lg">
            {busy ? 'Applying…' : 'Apply offer'}
          </button>
        </form>

        <p className="mt-3 rounded-lg bg-brand-blueSoft px-3 py-2 text-[12.5px] text-brand-blueDark">
          Percentage discounts are rounded to the nearest {settings.currency} 5, the way shelf prices are
          written. Products already discounted are re-priced from their regular price.
        </p>
      </section>

      {/* Currently on sale */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-4">
          <div>
            <h2 className="text-base font-bold text-ink">Currently on sale</h2>
            <p className="text-[13px] text-muted">
              {onSale.length} product{onSale.length === 1 ? '' : 's'} showing a discount badge.
            </p>
          </div>
          {onSale.length > 0 && (
            <button type="button" onClick={clearAll} disabled={busy} className="btn-danger btn-sm">
              Clear all discounts
            </button>
          )}
        </div>

        {onSale.length === 0 ? (
          <EmptyState
            icon={<TagIcon size={26} />}
            title="Nothing is on sale"
            body="Use the form above to start a promotion, or set a sale price on an individual product."
          />
        ) : (
          <ul className="divide-y divide-line">
            {onSale.map((product) => (
              <li
                key={product.id}
                className={cn('flex items-center gap-3 p-3', clearingId === product.id && 'opacity-60')}
              >
                <div className="w-12 shrink-0">
                  <ProductImage
                    src={product.image_url}
                    alt={product.name}
                    categorySlug={product.category_slug}
                    subcategorySlug={product.subcategory_slug}
                    unit={product.unit}
                    rounded="rounded-md"
                    sizes="48px"
                    className="border border-line"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="clamp-2 text-[13.5px] font-semibold text-ink hover:text-brand-blue"
                  >
                    {product.name}
                  </Link>
                  <p className="text-[12px] text-muted">{product.category_name}</p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[12px] text-muted line-through">
                    {formatPrice(product.price, settings.currency)}
                  </p>
                  <p className="text-[14px] font-extrabold text-brand-red">
                    {formatPrice(product.effective_price, settings.currency)}
                  </p>
                </div>

                <span className="badge-sale shrink-0">−{product.discount_percent}%</span>

                <button
                  type="button"
                  onClick={() => clearOne(product)}
                  disabled={clearingId === product.id}
                  className="btn-ghost btn-sm shrink-0"
                >
                  Clear
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
