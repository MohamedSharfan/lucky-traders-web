'use client';

import Link from 'next/link';

import { useI18n } from '@/lib/i18n/LanguageProvider';
import { useStore } from '@/components/StoreProvider';
import { formatPrice } from '@/lib/format';
import { inquiryLink } from '@/lib/whatsapp';
import { ClockIcon, MapPinIcon, StoreIcon, TruckIcon, WhatsAppIcon } from '@/components/ui/Icon';

/** Delivery information block — fees and areas come straight from settings. */
export function DeliveryInfo() {
  const { settings } = useStore();
  const { t } = useI18n();

  const activeAreas = (settings.delivery_areas ?? []).filter((a) => a.is_active);

  return (
    <section className="container-app mt-10">
      <h2 className="mb-3 text-lg font-extrabold tracking-tight text-ink sm:text-xl">
        {t('home.deliveryInfo')}
      </h2>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-redSoft text-brand-red">
            <TruckIcon size={20} />
          </span>
          <h3 className="text-sm font-bold text-ink">Home Delivery</h3>
          {settings.delivery_enabled ? (
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              {settings.free_delivery_threshold > 0 ? (
                <>
                  Orders above{' '}
                  <strong className="text-brand-red">
                    {formatPrice(settings.free_delivery_threshold, settings.currency)}
                  </strong>{' '}
                  are delivered free. Below that, a flat{' '}
                  {formatPrice(settings.delivery_fee, settings.currency)} applies.
                </>
              ) : (
                <>A flat {formatPrice(settings.delivery_fee, settings.currency)} delivery fee applies.</>
              )}
            </p>
          ) : (
            <p className="mt-1 text-[13px] text-muted">Delivery is currently paused — pickup is available.</p>
          )}
        </div>

        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blueSoft text-brand-blue">
            <StoreIcon size={20} />
          </span>
          <h3 className="text-sm font-bold text-ink">Store Pickup</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            {settings.pickup_enabled
              ? 'Order online and collect from the shop — no delivery fee.'
              : 'Store pickup is currently unavailable.'}
          </p>
          {settings.opening_hours && (
            <p className="mt-2 flex items-start gap-1.5 whitespace-pre-line text-[12.5px] text-muted">
              <ClockIcon size={14} className="mt-0.5 shrink-0" />
              {settings.opening_hours}
            </p>
          )}
        </div>

        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blueSoft text-brand-blue">
            <MapPinIcon size={20} />
          </span>
          <h3 className="text-sm font-bold text-ink">Delivery Areas</h3>
          {activeAreas.length ? (
            <ul className="mt-2 space-y-1 text-[13px] text-muted">
              {activeAreas.map((area) => (
                <li key={area.id} className="flex items-center justify-between gap-3">
                  <span>{area.name}</span>
                  <span className="font-semibold text-ink">
                    {formatPrice(area.fee, settings.currency)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[13px] text-muted">Contact us to check whether we deliver to your area.</p>
          )}
        </div>
      </div>
    </section>
  );
}

/** Full-width WhatsApp call to action above the footer. */
export function WhatsAppCta() {
  const { settings } = useStore();
  const { t } = useI18n();
  if (!settings.whatsapp) return null;

  return (
    <section className="container-app mt-10">
      <div className="flex flex-col items-center gap-4 rounded-card bg-brand-blueDark px-6 py-8 text-center text-white sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h2 className="text-lg font-extrabold sm:text-xl">{t('home.whatsappCtaTitle')}</h2>
          <p className="mt-1 text-sm text-white/80">{t('home.whatsappCtaBody')}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          <a
            href={inquiryLink(settings)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-lg bg-[#25D366] text-white hover:bg-[#1da851]"
          >
            <WhatsAppIcon size={18} />
            {t('contact.chatWhatsapp')}
          </a>
          <Link href="/products" className="btn btn-lg bg-white text-brand-blueDark hover:bg-white/90">
            {t('home.shopNow')}
          </Link>
        </div>
      </div>
    </section>
  );
}
