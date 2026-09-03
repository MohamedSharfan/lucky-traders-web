'use client';

import type { ProductView } from '@/lib/types';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import { useI18n } from '@/lib/i18n/LanguageProvider';
import { ProductCard } from '@/components/ProductCard';
import { SectionHeader } from './SectionHeader';

/**
 * A homepage product row.
 *
 * Horizontally scrollable on phones (thumb-friendly, no wasted vertical space)
 * and a normal grid from tablet up.
 */
export function ProductRow({
  titleKey,
  subtitle,
  href,
  products,
  accent,
  priority = false,
}: {
  /** Translated through the dictionary so rows follow the language switcher. */
  titleKey: TranslationKey;
  subtitle?: string;
  href?: string;
  products: ProductView[];
  accent?: 'red' | 'blue';
  priority?: boolean;
}) {
  const { t } = useI18n();
  if (!products.length) return null;

  return (
    <section className="container-app mt-8">
      <SectionHeader title={t(titleKey)} subtitle={subtitle} href={href} accent={accent} />

      {/* Mobile: scroller */}
      <ul className="no-scrollbar -mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1 md:hidden">
        {products.slice(0, 12).map((product, i) => (
          <li key={product.id} className="w-[46%] min-w-[150px] shrink-0">
            <ProductCard product={product} priority={priority && i < 2} />
          </li>
        ))}
      </ul>

      {/* Tablet and up: grid */}
      <div className="hidden gap-3 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.slice(0, 10).map((product, i) => (
          <ProductCard key={product.id} product={product} priority={priority && i < 5} />
        ))}
      </div>
    </section>
  );
}
