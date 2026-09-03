'use client';

import Link from 'next/link';

import { useI18n } from '@/lib/i18n/LanguageProvider';
import { useStore } from '@/components/StoreProvider';
import { formatPrice } from '@/lib/format';
import { ChevronRightIcon, GridIcon, TruckIcon, WalletIcon } from '@/components/ui/Icon';

/**
 * Homepage hero.
 *
 * Deliberately compact (about 300px on desktop) so products appear above the
 * fold — the brief asks for browsing, not a landing page.
 */
export function HeroSection() {
  const { t } = useI18n();
  const { settings } = useStore();

  return (
    <section className="container-app pt-4 sm:pt-6">
      <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
        <div className="grid items-stretch gap-0 md:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-redSoft px-3 py-1 text-[12px] font-bold text-brand-redDark">
              {settings.shop_subtitle}
            </span>

            <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink sm:text-4xl lg:text-[42px]">
              {t('home.heroTitle')}
            </h1>

            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted sm:text-base">
              {t('home.heroSubtitle')}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary btn-lg">
                {t('home.shopNow')}
                <ChevronRightIcon size={18} />
              </Link>
              <Link href="/categories" className="btn-outline btn-lg">
                <GridIcon size={18} />
                {t('home.viewCategories')}
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
              {settings.delivery_enabled && settings.free_delivery_threshold > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <TruckIcon size={16} className="text-brand-blue" />
                  Free delivery over {formatPrice(settings.free_delivery_threshold, settings.currency)}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <WalletIcon size={16} className="text-brand-blue" />
                Cash on delivery
              </span>
            </div>
          </div>

          {/* Illustration: pure CSS + emoji, so it costs nothing to download. */}
          <div className="relative hidden min-h-[260px] items-center justify-center overflow-hidden bg-gradient-to-br from-brand-blueSoft via-white to-brand-redSoft md:flex">
            <div className="grid grid-cols-3 gap-3 p-8" aria-hidden="true">
              {['🌾', '🫘', '🥥', '🍵', '🧴', '🥛', '🌶️', '🍪', '🥬'].map((emoji, i) => (
                <span
                  key={i}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-card lg:h-[72px] lg:w-[72px] lg:text-4xl"
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
