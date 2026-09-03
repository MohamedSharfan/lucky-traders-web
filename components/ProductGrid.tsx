'use client';

import type { ProductView } from '@/lib/types';
import { ProductCard, ProductCardSkeleton } from './ProductCard';

/**
 * Responsive product grid.
 * 2 columns on phones, 3 on tablets, 4-5 on desktop - as specified.
 *
 * Carries its own visually-hidden heading: product names are `h3`, so without
 * an `h2` above them a screen reader would hear the outline jump straight from
 * the page title to h3.
 */
export function ProductGrid({
  products,
  priorityCount = 0,
  label = 'Products',
}: {
  products: ProductView[];
  priorityCount?: number;
  label?: string;
}) {
  return (
    <section aria-label={label}>
      <h2 className="sr-only">{label}</h2>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} priority={i < priorityCount} />
        ))}
      </div>
    </section>
  );
}

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
