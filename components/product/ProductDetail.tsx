'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useCart } from '@/lib/cart/CartProvider';
import { useI18n } from '@/lib/i18n/LanguageProvider';
import { useStore } from '@/components/StoreProvider';
import { useToast } from '@/components/ui/Toast';
import { cn, formatPrice } from '@/lib/format';
import type { ProductView } from '@/lib/types';
import { ProductImage } from '@/components/ProductImage';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { CartIcon, CheckCircleIcon, ChevronRightIcon, TruckIcon, WalletIcon } from '@/components/ui/Icon';

/**
 * Product detail view.
 *
 * Handles the gallery, quantity selection, add-to-cart and buy-now. A sticky
 * action bar appears on phones so the buy buttons are always reachable while
 * reading the description.
 */
export function ProductDetail({ product }: { product: ProductView }) {
  const { t, ln } = useI18n();
  const { settings } = useStore();
  const { add } = useCart();
  const toast = useToast();
  const router = useRouter();

  const gallery = [product.image_url, ...(product.gallery ?? [])].filter(Boolean) as string[];
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const soldOut = product.stock <= 0;
  const name = ln(product);

  const addToCart = () => {
    add(product, quantity);
    toast.success(`${name} — ${t('product.added')}`);
  };

  const buyNow = () => {
    add(product, quantity);
    router.push('/checkout');
  };

  return (
    <>
      <div className="container-app py-4">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-[13px] text-muted">
          <Link href="/" className="hover:text-brand-blue">{t('nav.home')}</Link>
          <ChevronRightIcon size={13} />
          <Link href="/products" className="hover:text-brand-blue">{t('nav.allProducts')}</Link>
          {product.category_slug && product.category_name && (
            <>
              <ChevronRightIcon size={13} />
              <Link href={`/products?category=${product.category_slug}`} className="hover:text-brand-blue">
                {product.category_name}
              </Link>
            </>
          )}
          <ChevronRightIcon size={13} />
          <span className="truncate text-ink">{name}</span>
        </nav>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,440px)_1fr]">
          {/* Gallery */}
          <div>
            <div className="relative overflow-hidden rounded-card border border-line bg-white shadow-card">
              <ProductImage
                src={gallery[activeImage] ?? null}
                alt={product.name}
                categorySlug={product.category_slug}
                subcategorySlug={product.subcategory_slug}
                unit={product.unit}
                priority
                rounded="rounded-card"
                sizes="(max-width: 1024px) 100vw, 440px"
              />
              {product.on_sale && (
                <span className="absolute left-3 top-3 badge-sale text-xs">
                  {product.discount_percent}% {t('product.off')}
                </span>
              )}
              {soldOut && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/72">
                  <span className="rounded-full bg-ink/85 px-4 py-1.5 text-sm font-bold uppercase text-white">
                    {t('product.outOfStock')}
                  </span>
                </div>
              )}
            </div>

            {gallery.length > 1 && (
              <ul className="mt-2.5 flex gap-2 overflow-x-auto pb-1">
                {gallery.map((src, i) => (
                  <li key={src}>
                    <button
                      type="button"
                      onClick={() => setActiveImage(i)}
                      aria-label={`View image ${i + 1}`}
                      aria-current={i === activeImage}
                      className={cn(
                        'block h-16 w-16 overflow-hidden rounded-lg border-2 bg-white transition-colors',
                        i === activeImage ? 'border-brand-red' : 'border-line hover:border-brand-blue',
                      )}
                    >
                      <ProductImage src={src} alt="" rounded="rounded-md" sizes="64px" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Details */}
          <div>
            {product.brand_name && (
              <Link
                href={`/products?brands=${encodeURIComponent(product.brand_name)}`}
                className="text-[13px] font-semibold uppercase tracking-wide text-brand-blue hover:underline"
              >
                {product.brand_name}
              </Link>
            )}

            <h1 className="mt-1 text-xl font-extrabold leading-snug tracking-tight text-ink sm:text-2xl">
              {name}
            </h1>

            {/* Alternate-language names help bilingual households find the item. */}
            {(product.name_si || product.name_ta) && (
              <p className="mt-1 text-sm text-muted">
                {[product.name_si, product.name_ta].filter(Boolean).join(' · ')}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span
                className={cn(
                  'text-2xl font-extrabold tracking-tight sm:text-3xl',
                  product.on_sale ? 'text-brand-red' : 'text-ink',
                )}
              >
                {formatPrice(product.effective_price, settings.currency)}
              </span>
              {product.on_sale && (
                <>
                  <span className="text-base text-muted line-through">
                    {formatPrice(product.price, settings.currency)}
                  </span>
                  <span className="badge-sale">
                    {product.discount_percent}% {t('product.off')}
                  </span>
                </>
              )}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13.5px] sm:max-w-md">
              <div>
                <dt className="text-muted">{t('product.unit')}</dt>
                <dd className="font-semibold text-ink">{product.unit}</dd>
              </div>
              <div>
                <dt className="text-muted">{t('product.availability')}</dt>
                <dd
                  className={cn(
                    'font-semibold',
                    soldOut ? 'text-brand-red' : product.stock_status === 'low_stock' ? 'text-amber-600' : 'text-emerald-600',
                  )}
                >
                  {soldOut
                    ? t('product.outOfStock')
                    : product.stock_status === 'low_stock'
                      ? `${t('product.lowStock')} (${product.stock})`
                      : t('product.inStock')}
                </dd>
              </div>
              {product.category_name && (
                <div>
                  <dt className="text-muted">{t('product.category')}</dt>
                  <dd className="font-semibold text-ink">
                    {product.subcategory_name ?? product.category_name}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-muted">{t('product.sku')}</dt>
                <dd className="font-mono text-[12.5px] font-semibold text-ink">{product.sku}</dd>
              </div>
            </dl>

            {/* Buy box */}
            <div className="mt-5 rounded-card border border-line bg-white p-4 shadow-card">
              {soldOut ? (
                <p className="text-sm font-semibold text-brand-red">{t('product.unavailable')}</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-ink">{t('product.quantity')}</span>
                    <QuantityStepper
                      value={quantity}
                      onChange={setQuantity}
                      max={product.stock}
                      label={t('product.quantity')}
                    />
                    <span className="text-[13px] text-muted">
                      {formatPrice(product.effective_price * quantity, settings.currency)}
                    </span>
                  </div>

                  <div className="mt-4 hidden gap-2.5 sm:flex">
                    <button type="button" onClick={addToCart} className="btn-primary btn-lg flex-1">
                      <CartIcon size={18} />
                      {t('product.addToCart')}
                    </button>
                    <button type="button" onClick={buyNow} className="btn-secondary btn-lg flex-1">
                      {t('product.buyNow')}
                    </button>
                  </div>
                </>
              )}

              <ul className="mt-4 space-y-1.5 text-[13px] text-muted">
                {settings.delivery_enabled && settings.free_delivery_threshold > 0 && (
                  <li className="flex items-center gap-2">
                    <TruckIcon size={16} className="text-brand-blue" />
                    Free delivery on orders above{' '}
                    {formatPrice(settings.free_delivery_threshold, settings.currency)}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <WalletIcon size={16} className="text-brand-blue" />
                  Cash on delivery or pay at the store
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-brand-blue" />
                  Order confirmed on WhatsApp
                </li>
              </ul>
            </div>

            {product.description && (
              <section className="mt-6">
                <h2 className="mb-2 text-base font-bold text-ink">{t('product.description')}</h2>
                <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-muted">
                  {product.description}
                </p>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Sticky mobile action bar */}
      {!soldOut && (
        <div
          className="fixed inset-x-0 bottom-14 z-30 flex gap-2 border-t border-line bg-white p-2.5 sm:hidden"
          style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}
        >
          <button type="button" onClick={addToCart} className="btn-primary flex-1">
            <CartIcon size={17} />
            {t('product.addToCart')}
          </button>
          <button type="button" onClick={buyNow} className="btn-secondary flex-1">
            {t('product.buyNow')}
          </button>
        </div>
      )}
    </>
  );
}
