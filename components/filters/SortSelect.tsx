'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { useI18n } from '@/lib/i18n/LanguageProvider';
import type { ProductSort } from '@/lib/types';

const OPTIONS: ProductSort[] = ['popular', 'price_asc', 'price_desc', 'newest', 'discount', 'name'];

/** Sort control. Like the filters, the choice is stored in the URL. */
export function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();

  const current = (params.get('sort') as ProductSort) ?? 'popular';

  return (
    <label className="flex items-center gap-2 text-[13px] text-muted">
      <span className="hidden sm:inline">{t('sort.label')}</span>
      <select
        value={current}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          e.target.value === 'popular' ? next.delete('sort') : next.set('sort', e.target.value);
          next.delete('page');
          router.push(`/products${next.toString() ? `?${next}` : ''}`, { scroll: false });
        }}
        className="h-9 rounded-lg border border-line bg-white px-2 text-[13px] font-medium text-ink focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
      >
        {OPTIONS.map((option) => (
          <option key={option} value={option}>
            {t(`sort.${option}` as const)}
          </option>
        ))}
      </select>
    </label>
  );
}
