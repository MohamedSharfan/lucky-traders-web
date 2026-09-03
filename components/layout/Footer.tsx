'use client';

import Link from 'next/link';

import { useI18n } from '@/lib/i18n/LanguageProvider';
import { useStore } from '@/components/StoreProvider';
import { formatPrice } from '@/lib/format';
import { inquiryLink } from '@/lib/whatsapp';
import {
  ClockIcon,
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsAppIcon,
} from '@/components/ui/Icon';

export function Footer() {
  const { settings, rootCategories } = useStore();
  const { t, ln } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-line bg-white">
      <div className="container-app py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.logo_url ?? '/logo.svg'} alt="" className="h-11 w-auto object-contain" />
              <span>
                <span className="block text-lg font-extrabold leading-tight text-ink">{settings.shop_name}</span>
                <span className="block text-[12px] font-medium text-brand-blue">{settings.shop_subtitle}</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">{settings.tagline}</p>

            <div className="mt-4 flex gap-2">
              {settings.facebook && (
                <a
                  href={settings.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-brand-blue hover:text-brand-blue"
                >
                  <FacebookIcon size={18} />
                </a>
              )}
              {settings.instagram && (
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-brand-blue hover:text-brand-blue"
                >
                  <InstagramIcon size={18} />
                </a>
              )}
              {settings.whatsapp && (
                <a
                  href={inquiryLink(settings)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-[#25D366] hover:text-[#25D366]"
                >
                  <WhatsAppIcon size={18} />
                </a>
              )}
            </div>
          </div>

          {/* Quick links */}
          <nav aria-labelledby="footer-links">
            <h2 id="footer-links" className="mb-3 text-sm font-bold text-ink">
              {t('footer.quickLinks')}
            </h2>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/" className="hover:text-brand-blue">{t('nav.home')}</Link></li>
              <li><Link href="/categories" className="hover:text-brand-blue">{t('nav.categories')}</Link></li>
              <li><Link href="/offers" className="hover:text-brand-blue">{t('nav.offers')}</Link></li>
              <li><Link href="/new-arrivals" className="hover:text-brand-blue">{t('nav.newArrivals')}</Link></li>
              <li><Link href="/about" className="hover:text-brand-blue">{t('nav.about')}</Link></li>
              <li><Link href="/contact" className="hover:text-brand-blue">{t('nav.contact')}</Link></li>
            </ul>
          </nav>

          {/* Popular categories */}
          <nav aria-labelledby="footer-categories">
            <h2 id="footer-categories" className="mb-3 text-sm font-bold text-ink">
              {t('home.shopByCategory')}
            </h2>
            <ul className="space-y-2 text-sm text-muted">
              {rootCategories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/products?category=${cat.slug}`} className="hover:text-brand-blue">
                    {ln(cat)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Customer service */}
          <div>
            <h2 className="mb-3 text-sm font-bold text-ink">{t('footer.customerService')}</h2>
            <ul className="space-y-2.5 text-sm text-muted">
              {settings.whatsapp && (
                <li>
                  <a
                    href={inquiryLink(settings)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 hover:text-brand-blue"
                  >
                    <WhatsAppIcon size={16} className="mt-0.5 shrink-0" />
                    WhatsApp — {settings.whatsapp}
                  </a>
                </li>
              )}
              <li>
                <a href={`tel:${settings.phone}`} className="flex items-start gap-2 hover:text-brand-blue">
                  <PhoneIcon size={16} className="mt-0.5 shrink-0" />
                  {t('footer.callUs')} — {settings.phone}
                </a>
              </li>
              {settings.email && (
                <li>
                  <a href={`mailto:${settings.email}`} className="flex items-start gap-2 hover:text-brand-blue">
                    <MailIcon size={16} className="mt-0.5 shrink-0" />
                    {settings.email}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2">
                <MapPinIcon size={16} className="mt-0.5 shrink-0" />
                <span>{settings.address}</span>
              </li>
              {settings.opening_hours && (
                <li className="flex items-start gap-2">
                  <ClockIcon size={16} className="mt-0.5 shrink-0" />
                  <span className="whitespace-pre-line">{settings.opening_hours}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Delivery summary */}
        {settings.delivery_enabled && (
          <div className="mt-8 rounded-card border border-line bg-canvas px-4 py-3 text-sm text-muted">
            <span className="font-semibold text-ink">{t('footer.deliveryInformation')}: </span>
            {settings.free_delivery_threshold > 0 ? (
              <>
                Orders above {formatPrice(settings.free_delivery_threshold, settings.currency)} —{' '}
                <span className="font-semibold text-brand-red">FREE DELIVERY</span>. Below that,{' '}
                {formatPrice(settings.delivery_fee, settings.currency)} delivery fee.
              </>
            ) : (
              <>Delivery fee {formatPrice(settings.delivery_fee, settings.currency)}.</>
            )}
            {settings.pickup_enabled && ' Store pickup is always free.'}
          </div>
        )}
      </div>

      <div className="border-t border-line">
        <div className="container-app flex flex-col items-center justify-between gap-2 py-4 text-[13px] text-muted sm:flex-row">
          <p>
            © {year} {settings.shop_name} — {settings.shop_subtitle}. {t('footer.rights')}
          </p>
          <Link href="/admin" className="hover:text-brand-blue">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
