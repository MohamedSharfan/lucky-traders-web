'use client';

import type { ProductView } from '@/lib/types';
import { useI18n } from '@/lib/i18n/LanguageProvider';
import { ProductCard } from '@/components/ProductCard';

/** "You might also need" row shown under the product detail. */
export function RelatedProducts({ products }: { products: ProductView[] }) {
  const { t } = useI18n();
  if (!products.length) return null;

  return (
    <section className="container-app mt-8 pb-4">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink">
        <span aria-hidden="true" className="inline-block h-5 w-1.5 rounded-full bg-brand-blue" />
        {t('product.related')}
      </h2>

      <ul className="no-scrollbar -mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1 md:hidden">
        {products.map((product) => (
          <li key={product.id} className="w-[46%] min-w-[150px] shrink-0">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>

      <div className="hidden gap-3 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.slice(0, 10).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
