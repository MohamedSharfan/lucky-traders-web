'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { useI18n } from '@/lib/i18n/LanguageProvider';
import { useStore } from '@/components/StoreProvider';
import { CloseIcon } from '@/components/ui/Icon';

/** Removable chips summarising what is currently filtered. */
export function ActiveFilterChips() {
  const router = useRouter();
  const params = useSearchParams();
  const { t, ln } = useI18n();
  const { categories } = useStore();

  const chips: { label: string; clear: (p: URLSearchParams) => void }[] = [];

  const category = params.get('category');
  if (category) {
    const cat = categories.find((c) => c.slug === category);
    chips.push({ label: cat ? ln(cat) : category, clear: (p) => p.delete('category') });
  }

  for (const brand of (params.get('brands') ?? '').split(',').filter(Boolean)) {
    chips.push({
      label: brand,
      clear: (p) => {
        const rest = (params.get('brands') ?? '').split(',').filter((b) => b && b !== brand);
        rest.length ? p.set('brands', rest.join(',')) : p.delete('brands');
      },
    });
  }

  const min = params.get('min');
  const max = params.get('max');
  if (min || max) {
    chips.push({
      label: `${min || '0'} – ${max || '∞'}`,
      clear: (p) => {
        p.delete('min');
        p.delete('max');
      },
    });
  }

  const flags: [string, string][] = [
    ['inStock', t('filters.inStockOnly')],
    ['sale', t('filters.onSale')],
    ['new', t('filters.newArrivals')],
  ];
  for (const [key, label] of flags) {
    if (params.get(key) === 'true') chips.push({ label, clear: (p) => p.delete(key) });
  }

  if (!chips.length) return null;

  return (
    <ul className="mb-3 flex flex-wrap gap-2">
      {chips.map((chip, i) => (
        <li key={`${chip.label}-${i}`}>
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(params.toString());
              chip.clear(next);
              next.delete('page');
              router.push(`/products${next.toString() ? `?${next}` : ''}`, { scroll: false });
            }}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-[12.5px] font-medium text-ink hover:border-brand-red hover:text-brand-red"
          >
            {chip.label}
            <CloseIcon size={13} />
          </button>
        </li>
      ))}
    </ul>
  );
}
