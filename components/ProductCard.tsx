'use client';

import Link from 'next/link';

import { useCart } from '@/lib/cart/CartProvider';
import { useI18n } from '@/lib/i18n/LanguageProvider';
import { useStore } from '@/components/StoreProvider';
import { useToast } from '@/components/ui/Toast';
import { cn, formatPrice } from '@/lib/format';
import type { ProductView } from '@/lib/types';
import { ProductImage } from './ProductImage';
import { CartIcon } from './ui/Icon';

/**
 * The product tile used on the homepage rows and the listing grid.
 *
 * Fixed internal heights (clamped name, reserved price row) keep the grid tidy
 * whether a name is two words or twelve, and whether the price is Rs. 45 or
 * Rs. 12,500.
 */
export function ProductCard({ product, priority = false }: { product: ProductView; priority?: boolean }) {
  const { t, ln } = useI18n();
  const { settings } = useStore();
  const { add } = useCart();
  const toast = useToast();

  const soldOut = product.stock <= 0;
  const name = ln(product);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-card transition-shadow duration-150 hover:shadow-pop">
      {/* Badges */}
      <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
        {product.on_sale && (
          <span className="badge-sale">
            {product.discount_percent}% {t('product.off')}
          </span>
        )}
        {product.is_new && !product.on_sale && <span className="badge-new">{t('product.new')}</span>}
        {product.is_best_seller && !product.on_sale && !product.is_new && (
          <span className="badge-best">{t('product.bestSeller')}</span>
        )}
      </div>

      <Link
        href={`/product/${product.slug}`}
        className="block focus-visible:ring-inset"
        aria-label={name}
      >
        <div className="relative">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            categorySlug={product.category_slug}
            subcategorySlug={product.subcategory_slug}
            unit={product.unit}
            priority={priority}
          />
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center rounded-t-card bg-white/72">
              <span className="rounded-full bg-ink/85 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                {t('product.outOfStock')}
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3">
        {product.brand_name && (
          <p className="mb-0.5 truncate text-[11px] font-semibold uppercase tracking-wide text-brand-blue">
            {product.brand_name}
          </p>
        )}

        <Link href={`/product/${product.slug}`} className="mb-1 block">
          <h3 className="clamp-2 min-h-[2.5rem] text-[13.5px] font-semibold leading-tight text-ink hover:text-brand-blue sm:text-sm">
            {name}
          </h3>
        </Link>

        <p className="mb-2 text-[12px] text-muted">{product.unit}</p>

        {/* Price block: reserved height so cards with and without a strike-through align. */}
        <div className="mt-auto">
          <div className="flex min-h-[1.1rem] items-center gap-2">
            {product.on_sale && (
              <span className="text-[12px] text-muted line-through">
                {formatPrice(product.price, settings.currency)}
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={cn(
                'text-[15px] font-extrabold tracking-tight sm:text-base',
                product.on_sale ? 'text-brand-red' : 'text-ink',
              )}
            >
              {formatPrice(product.effective_price, settings.currency)}
            </span>
          </div>

          {product.stock_status === 'low_stock' && (
            <p className="mt-1 text-[11.5px] font-medium text-amber-600">{t('product.lowStock')}</p>
          )}
        </div>

        <button
          type="button"
          disabled={soldOut}
          onClick={() => {
            add(product, 1);
            toast.success(`${name} — ${t('product.added')}`);
          }}
          className={cn(
            'btn btn-sm mt-3 w-full',
            soldOut
              ? 'cursor-not-allowed border border-line bg-canvas text-muted'
              : 'bg-brand-red text-white hover:bg-brand-redDark',
          )}
        >
          {soldOut ? (
            t('product.unavailable')
          ) : (
            <>
              <CartIcon size={16} />
              <span className="truncate">{t('product.addToCart')}</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}

/** Matching skeleton so the grid does not jump while products load. */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
      <div className="skeleton aspect-square w-full rounded-none" />
      <div className="space-y-2 p-3">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-3.5 w-full" />
        <div className="skeleton h-3.5 w-2/3" />
        <div className="skeleton h-5 w-1/2" />
        <div className="skeleton h-9 w-full" />
      </div>
    </div>
  );
}
