'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useI18n } from '@/lib/i18n/LanguageProvider';
import { useStore } from '@/components/StoreProvider';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { cn } from '@/lib/format';
import type { Brand } from '@/lib/types';
import { CloseIcon, FilterIcon } from '@/components/ui/Icon';

/**
 * Product filters.
 *
 * State lives entirely in the URL, so a filtered view is shareable, works with
 * the back button, and is rendered on the server (fast on a weak connection).
 * On phones the same panel opens as a bottom sheet.
 */

interface Props {
  brands: Brand[];
  minPrice: number;
  maxPrice: number;
  totalResults: number;
}

/** Desktop: always-visible sidebar. */
export function FilterSidebar(props: Props) {
  return (
    <aside className="hidden w-[240px] shrink-0 lg:block" aria-label="Filters">
      {/* The filter groups below are h3; this keeps the outline continuous. */}
      <h2 className="sr-only">Filters</h2>
      <div className="sticky top-[132px] max-h-[calc(100vh-150px)] overflow-y-auto pr-1">
        <FilterBody {...props} />
      </div>
    </aside>
  );
}

/** Mobile: a button that opens the same filters as a bottom sheet. */
export function FilterSheet(props: Props) {
  const [open, setOpen] = useState(false);
  const sheetRef = useFocusTrap<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div className="lg:hidden">
      <button type="button" onClick={() => setOpen(true)} className="btn-outline btn-sm" aria-expanded={open}>
        <FilterIcon size={16} />
        Filters
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink/45 animate-fade-in"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-pop animate-slide-up"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-ink">Filters</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-muted hover:bg-canvas"
                aria-label="Close filters"
              >
                <CloseIcon size={20} />
              </button>
            </div>
            <FilterBody {...props} onApplied={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterBody({
  brands,
  minPrice,
  maxPrice,
  totalResults,
  onApplied,
}: Props & { onApplied?: () => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const { t, ln } = useI18n();
  const { rootCategories, categories } = useStore();

  const [min, setMin] = useState(params.get('min') ?? '');
  const [max, setMax] = useState(params.get('max') ?? '');

  useEffect(() => {
    setMin(params.get('min') ?? '');
    setMax(params.get('max') ?? '');
  }, [params]);

  /** Rewrites one search param and resets to page 1. */
  const update = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete('page');
    router.push(`/products${next.toString() ? `?${next}` : ''}`, { scroll: false });
    onApplied?.();
  };

  const toggleFlag = (key: string) => {
    update((p) => (p.get(key) === 'true' ? p.delete(key) : p.set(key, 'true')));
  };

  const selectedCategory = params.get('category') ?? '';
  const selectedBrands = (params.get('brands') ?? '').split(',').filter(Boolean);

  const hasFilters =
    Boolean(selectedCategory) ||
    selectedBrands.length > 0 ||
    ['min', 'max', 'inStock', 'sale', 'new'].some((k) => params.get(k));

  const checkbox = 'h-4 w-4 rounded border-line text-brand-red focus:ring-brand-blue';

  return (
    <div className="space-y-5">
      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            const next = new URLSearchParams();
            const q = params.get('q');
            if (q) next.set('q', q);
            router.push(`/products${next.toString() ? `?${next}` : ''}`, { scroll: false });
            onApplied?.();
          }}
          className="btn-outline btn-sm w-full"
        >
          {t('filters.clear')}
        </button>
      )}

      {/* Categories */}
      <section>
        <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-muted">
          {t('filters.category')}
        </h3>
        <ul className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
          <li>
            <button
              type="button"
              onClick={() => update((p) => p.delete('category'))}
              className={cn(
                'w-full rounded-md px-2 py-1.5 text-left text-[13.5px] transition-colors hover:bg-canvas',
                !selectedCategory ? 'font-semibold text-brand-red' : 'text-ink',
              )}
            >
              {t('common.all')}
            </button>
          </li>
          {rootCategories.map((cat) => {
            const subs = categories.filter((c) => c.parent_id === cat.id);
            const active = selectedCategory === cat.slug;
            const childActive = subs.some((s) => s.slug === selectedCategory);
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => update((p) => p.set('category', cat.slug))}
                  className={cn(
                    'flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[13.5px] transition-colors hover:bg-canvas',
                    active ? 'font-semibold text-brand-red' : 'text-ink',
                  )}
                >
                  <span aria-hidden="true">{cat.icon}</span>
                  <span className="truncate">{ln(cat)}</span>
                </button>
                {(active || childActive) && subs.length > 0 && (
                  <ul className="ml-4 border-l border-line pl-2">
                    {subs.map((sub) => (
                      <li key={sub.id}>
                        <button
                          type="button"
                          onClick={() => update((p) => p.set('category', sub.slug))}
                          className={cn(
                            'w-full truncate rounded-md px-2 py-1 text-left text-[13px] transition-colors hover:bg-canvas',
                            selectedCategory === sub.slug ? 'font-semibold text-brand-red' : 'text-muted',
                          )}
                        >
                          {ln(sub)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Price */}
      <section>
        <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-muted">
          {t('filters.priceRange')}
        </h3>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update((p) => {
              min ? p.set('min', min) : p.delete('min');
              max ? p.set('max', max) : p.delete('max');
            });
          }}
        >
          <input
            type="number"
            inputMode="numeric"
            value={min}
            min={0}
            onChange={(e) => setMin(e.target.value)}
            placeholder={String(minPrice)}
            aria-label={t('filters.min')}
            className="input h-9 px-2 py-1 text-sm"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            inputMode="numeric"
            value={max}
            min={0}
            onChange={(e) => setMax(e.target.value)}
            placeholder={String(maxPrice)}
            aria-label={t('filters.max')}
            className="input h-9 px-2 py-1 text-sm"
          />
          <button type="submit" className="btn-secondary btn-sm shrink-0">
            Go
          </button>
        </form>
      </section>

      {/* Brands */}
      {brands.length > 0 && (
        <section>
          <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-muted">
            {t('filters.brand')}
          </h3>
          <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {brands.map((brand) => {
              const checked = selectedBrands.includes(brand.name);
              return (
                <li key={brand.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-[13.5px] text-ink hover:bg-canvas">
                    <input
                      type="checkbox"
                      className={checkbox}
                      checked={checked}
                      onChange={() =>
                        update((p) => {
                          const next = checked
                            ? selectedBrands.filter((b) => b !== brand.name)
                            : [...selectedBrands, brand.name];
                          next.length ? p.set('brands', next.join(',')) : p.delete('brands');
                        })
                      }
                    />
                    <span className="truncate">{brand.name}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Flags */}
      <section>
        <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-muted">
          {t('filters.availability')}
        </h3>
        <ul className="space-y-1">
          {[
            { key: 'inStock', label: t('filters.inStockOnly') },
            { key: 'sale', label: t('filters.onSale') },
            { key: 'new', label: t('filters.newArrivals') },
          ].map(({ key, label }) => (
            <li key={key}>
              <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-[13.5px] text-ink hover:bg-canvas">
                <input
                  type="checkbox"
                  className={checkbox}
                  checked={params.get(key) === 'true'}
                  onChange={() => toggleFlag(key)}
                />
                {label}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-[12.5px] text-muted">{t('listing.results', { count: totalResults })}</p>
    </div>
  );
}
