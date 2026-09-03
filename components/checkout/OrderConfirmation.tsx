'use client';

import Link from 'next/link';

import { useI18n } from '@/lib/i18n/LanguageProvider';
import { useStore } from '@/components/StoreProvider';
import { formatDateTime, formatPrice } from '@/lib/format';
import { inquiryLink, whatsappLink } from '@/lib/whatsapp';
import type { Order } from '@/lib/types';
import { CheckCircleIcon, StoreIcon, TruckIcon, WhatsAppIcon } from '@/components/ui/Icon';

/**
 * Order confirmation.
 *
 * WhatsApp is opened from the checkout submit handler; some browsers block that
 * popup, so the same link is repeated here as an explicit button.
 */
export function OrderConfirmation({
  order,
  whatsappNumber,
  whatsappMessage,
}: {
  order: Order;
  whatsappNumber: string;
  whatsappMessage: string;
}) {
  const { t } = useI18n();
  const { settings } = useStore();

  return (
    <div className="container-app py-6">
      <div className="mx-auto max-w-2xl">
        <div className="card overflow-hidden">
          <div className="flex flex-col items-center border-b border-line bg-emerald-50 px-6 py-8 text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckCircleIcon size={30} />
            </span>
            <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
              {t('confirm.title')}
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{t('confirm.body', { shop: settings.shop_name })}</p>

            <p className="mt-4 rounded-lg bg-white px-4 py-2 text-sm">
              <span className="text-muted">{t('confirm.orderId')}: </span>
              <span className="font-mono text-base font-extrabold text-brand-red">#{order.order_number}</span>
            </p>
          </div>

          <div className="p-5">
            <p className="mb-4 rounded-lg bg-brand-blueSoft px-3 py-2 text-[13px] text-brand-blueDark">
              {t('confirm.notOpened')}
            </p>

            <a
              href={whatsappLink(whatsappNumber, whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-lg w-full bg-[#25D366] text-white hover:bg-[#1da851]"
            >
              <WhatsAppIcon size={18} />
              {t('confirm.resend')}
            </a>

            {/* Order summary */}
            <dl className="mt-5 grid grid-cols-2 gap-y-2 text-[13.5px]">
              <dt className="text-muted">Placed</dt>
              <dd className="text-right font-medium text-ink">{formatDateTime(order.created_at)}</dd>

              <dt className="text-muted">Customer</dt>
              <dd className="text-right font-medium text-ink">{order.customer_name}</dd>

              <dt className="text-muted">Phone</dt>
              <dd className="text-right font-medium text-ink">{order.phone}</dd>

              <dt className="text-muted">Method</dt>
              <dd className="flex items-center justify-end gap-1.5 text-right font-medium text-ink">
                {order.delivery_method === 'delivery' ? (
                  <>
                    <TruckIcon size={15} className="text-brand-blue" />
                    {t('checkout.homeDelivery')}
                  </>
                ) : (
                  <>
                    <StoreIcon size={15} className="text-brand-blue" />
                    {t('checkout.storePickup')}
                  </>
                )}
              </dd>

              <dt className="text-muted">Payment</dt>
              <dd className="text-right font-medium text-ink">
                {order.payment_method === 'cod' ? t('checkout.cod') : t('checkout.payAtStore')}
              </dd>

              {order.delivery_method === 'delivery' && (
                <>
                  <dt className="text-muted">Address</dt>
                  <dd className="text-right font-medium text-ink">
                    {[order.address_line, order.street, order.area, order.city, order.district]
                      .filter(Boolean)
                      .join(', ')}
                  </dd>
                </>
              )}
            </dl>

            <ul className="mt-5 divide-y divide-line border-y border-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 py-2.5 text-[13.5px]">
                  <span className="min-w-0">
                    <span className="block font-medium text-ink">{item.product_name}</span>
                    <span className="text-muted">
                      {formatPrice(item.unit_price, settings.currency)} × {item.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold text-ink">
                    {formatPrice(item.total, settings.currency)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">{t('cart.subtotal')}</dt>
                <dd className="font-semibold text-ink">{formatPrice(order.subtotal, settings.currency)}</dd>
              </div>
              {order.delivery_method === 'delivery' && (
                <div className="flex justify-between">
                  <dt className="text-muted">{t('cart.deliveryFee')}</dt>
                  <dd className="font-semibold text-ink">
                    {order.delivery_fee === 0 ? t('cart.freeDelivery') : formatPrice(order.delivery_fee, settings.currency)}
                  </dd>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">{t('cart.discount')}</dt>
                  <dd className="font-semibold text-emerald-600">
                    −{formatPrice(order.discount, settings.currency)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-2 text-base">
                <dt className="font-bold text-ink">{t('cart.grandTotal')}</dt>
                <dd className="font-extrabold text-brand-red">{formatPrice(order.total, settings.currency)}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <Link href="/products" className="btn-primary flex-1">
                {t('confirm.continueShopping')}
              </Link>
              <a
                href={inquiryLink(settings)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline flex-1"
              >
                <WhatsAppIcon size={17} />
                {t('confirm.contactWhatsapp')}
              </a>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[12.5px] leading-relaxed text-muted">
          Bookmark this page to check your order again later. The link is private
          to you — anyone who only knows the order number cannot open it.
        </p>
      </div>
    </div>
  );
}
