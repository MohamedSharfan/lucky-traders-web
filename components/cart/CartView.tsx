'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useCart, type CartLine } from '@/lib/cart/CartProvider';
import { useI18n } from '@/lib/i18n/LanguageProvider';
import { useStore } from '@/components/StoreProvider';
import { useToast } from '@/components/ui/Toast';
import { cn, formatPrice } from '@/lib/format';
import { ProductImage } from '@/components/ProductImage';
import { EmptyState } from '@/components/ui/EmptyState';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { CartIcon, TrashIcon, TruckIcon } from '@/components/ui/Icon';

/**
 * Cart page.
 *
 * On mount the cart is re-validated against the live catalog: prices refresh,
 * quantities are capped to current stock and removed products are dropped with
 * an explanation. Nothing is silently changed without telling the customer.
 */
export function CartView() {
  const { lines, subtotal, ready, increment, decrement, setQuantity, remove, clear, replaceAll } = useCart();
  const { settings } = useStore();
  const { t, ln } = useI18n();
  const toast = useToast();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!ready || checked || lines.length === 0) {
      if (ready && lines.length === 0) setChecked(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/cart/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: lines.map((l) => l.product_id) }),
        });
        const json = await res.json();
        if (cancelled || !json.ok) return;

        const fresh = new Map<string, any>(json.data.products.map((p: any) => [p.id, p]));
        let removed = 0;
        let adjusted = 0;

        const next: CartLine[] = [];
        for (const line of lines) {
          const product = fresh.get(line.product_id);
          if (!product) {
            removed += 1;
            continue;
          }
          const quantity = product.stock > 0 ? Math.min(line.quantity, product.stock) : 0;
          if (quantity === 0) {
            removed += 1;
            continue;
          }
          if (quantity !== line.quantity) adjusted += 1;
          next.push({
            ...line,
            name: product.name,
            name_si: product.name_si,
            name_ta: product.name_ta,
            unit: product.unit,
            price: product.price,
            image_url: product.image_url,
            category_slug: product.category_slug ?? line.category_slug ?? null,
            subcategory_slug: product.subcategory_slug ?? line.subcategory_slug ?? null,
            stock: product.stock,
            quantity,
          });
        }

        replaceAll(next);
        if (removed) toast.error(`${removed} item${removed > 1 ? 's are' : ' is'} no longer available and ${removed > 1 ? 'were' : 'was'} removed.`);
        else if (adjusted) toast.error(t('cart.adjustedToStock'));
      } catch {
        // Offline or a flaky connection: keep the stored cart as-is. Checkout
        // re-validates on the server anyway, so nothing can be over-sold.
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Runs once per visit to this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready || (!checked && lines.length > 0)) return <CartSkeleton />;

  if (!lines.length) {
    return (
      <div className="card mx-auto max-w-2xl">
        <EmptyState
          icon={<CartIcon size={26} />}
          title={t('cart.empty')}
          body={t('cart.emptyBody')}
          actionLabel={t('cart.startShopping')}
          actionHref="/products"
        />
      </div>
    );
  }

  const deliveryEnabled = settings.delivery_enabled;
  const qualifiesFree =
    settings.free_delivery_threshold > 0 && subtotal >= settings.free_delivery_threshold;
  const deliveryFee = !deliveryEnabled || qualifiesFree ? 0 : settings.delivery_fee;
  const remaining = Math.max(0, settings.free_delivery_threshold - subtotal);
  const total = subtotal + deliveryFee;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      {/* Lines */}
      <div className="card overflow-hidden">
        <div className="hidden grid-cols-[1fr_120px_150px_120px] gap-3 border-b border-line px-4 py-2.5 text-[12px] font-bold uppercase tracking-wide text-muted sm:grid">
          <span>{t('cart.product')}</span>
          <span className="text-right">{t('cart.price')}</span>
          <span className="text-center">{t('cart.quantity')}</span>
          <span className="text-right">{t('cart.total')}</span>
        </div>

        <ul className="divide-y divide-line">
          {lines.map((line) => (
            <li key={line.product_id} className="p-3 sm:px-4">
              <div className="grid grid-cols-[64px_1fr] gap-3 sm:grid-cols-[1fr_120px_150px_120px] sm:items-center">
                {/* Product */}
                <div className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
                  <Link href={`/product/${line.slug}`} className="w-16 shrink-0 sm:w-[68px]">
                    <ProductImage
                      src={line.image_url}
                      alt={line.name}
                      categorySlug={line.category_slug}
                      subcategorySlug={line.subcategory_slug}
                      unit={line.unit}
                      rounded="rounded-lg"
                      sizes="68px"
                      className="border border-line"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${line.slug}`}
                      className="clamp-2 text-sm font-semibold leading-tight text-ink hover:text-brand-blue"
                    >
                      {ln(line)}
                    </Link>
                    <p className="mt-0.5 text-[12px] text-muted">{line.unit}</p>
                    {line.stock > 0 && line.stock <= 10 && (
                      <p className="mt-0.5 text-[11.5px] font-medium text-amber-600">
                        {t('product.lowStock')} ({line.stock})
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(line.product_id)}
                      className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-medium text-muted hover:text-brand-red sm:hidden"
                    >
                      <TrashIcon size={13} />
                      {t('cart.remove')}
                    </button>
                  </div>
                </div>

                {/* Unit price */}
                <div className="col-span-2 hidden text-right text-sm text-ink sm:col-span-1 sm:block">
                  {formatPrice(line.price, settings.currency)}
                </div>

                {/* Quantity */}
                <div className="col-start-2 flex items-center gap-2 sm:col-start-auto sm:justify-center">
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(next) => setQuantity(line.product_id, next)}
                    max={line.stock}
                    size="sm"
                    label={`${line.name} quantity`}
                  />
                  <button
                    type="button"
                    onClick={() => remove(line.product_id)}
                    className="hidden rounded-lg p-1.5 text-muted transition-colors hover:bg-brand-redSoft hover:text-brand-red sm:block"
                    aria-label={`${t('cart.remove')} ${line.name}`}
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>

                {/* Line total */}
                <div className="col-start-2 text-right text-sm font-bold text-ink sm:col-start-auto">
                  <span className="sm:hidden text-muted font-normal">{t('cart.total')}: </span>
                  {formatPrice(line.price * line.quantity, settings.currency)}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          <Link href="/products" className="text-sm font-semibold text-brand-blue hover:underline">
            ← {t('cart.continueShopping')}
          </Link>
          <button
            type="button"
            onClick={() => {
              clear();
              toast.success(t('cart.clear'));
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand-red"
          >
            <TrashIcon size={15} />
            {t('cart.clear')}
          </button>
        </div>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-[132px] lg:self-start">
        <div className="card p-4">
          <h2 className="mb-3 text-base font-bold text-ink">{t('checkout.orderSummary')}</h2>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{t('cart.subtotal')}</dt>
              <dd className="font-semibold text-ink">{formatPrice(subtotal, settings.currency)}</dd>
            </div>
            {deliveryEnabled && (
              <div className="flex justify-between">
                <dt className="text-muted">{t('cart.deliveryFee')}</dt>
                <dd className={cn('font-semibold', deliveryFee === 0 ? 'text-emerald-600' : 'text-ink')}>
                  {deliveryFee === 0 ? t('cart.freeDelivery') : formatPrice(deliveryFee, settings.currency)}
                </dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2.5 text-base">
              <dt className="font-bold text-ink">{t('cart.grandTotal')}</dt>
              <dd className="font-extrabold text-brand-red">{formatPrice(total, settings.currency)}</dd>
            </div>
          </dl>

          {deliveryEnabled && settings.free_delivery_threshold > 0 && (
            <p
              className={cn(
                'mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-[12.5px]',
                qualifiesFree ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-blueSoft text-brand-blueDark',
              )}
            >
              <TruckIcon size={15} className="mt-px shrink-0" />
              {qualifiesFree
                ? t('cart.freeDeliveryEarned')
                : t('cart.freeDeliveryHint', { amount: formatPrice(remaining, settings.currency) })}
            </p>
          )}

          <Link href="/checkout" className="btn-primary btn-lg mt-4 w-full">
            {t('cart.checkout')}
          </Link>

          <p className="mt-2 text-center text-[12px] text-muted">{t('checkout.guestNote')}</p>
        </div>
      </aside>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="card p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 border-b border-line py-3 last:border-0">
            <div className="skeleton h-16 w-16 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-2/3" />
              <div className="skeleton h-3 w-1/4" />
              <div className="skeleton h-8 w-28" />
            </div>
          </div>
        ))}
      </div>
      <div className="card space-y-3 p-4">
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-11 w-full" />
      </div>
    </div>
  );
}
