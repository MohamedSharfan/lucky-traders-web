'use client';

import { useI18n } from '@/lib/i18n/LanguageProvider';
import { useStore } from '@/components/StoreProvider';
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

/** Contact page: every value comes from Admin → Store Settings. */
export function ContactDetails() {
  const { settings } = useStore();
  const { t } = useI18n();

  return (
    <div className="container-app py-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-5">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {t('contact.title')}
          </h1>
          <p className="mt-1.5 text-[15px] text-muted">
            We are happy to help — call us, message us on WhatsApp, or drop in.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-3">
            <InfoCard icon={<MapPinIcon size={20} />} title={t('contact.address')}>
              <p className="whitespace-pre-line">{settings.address}</p>
              {settings.maps_url && (
                <a
                  href={settings.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-semibold text-brand-blue hover:underline"
                >
                  Open in Google Maps →
                </a>
              )}
            </InfoCard>

            <InfoCard icon={<PhoneIcon size={20} />} title={t('contact.phone')}>
              <a href={`tel:${settings.phone}`} className="hover:text-brand-blue">
                {settings.phone}
              </a>
            </InfoCard>

            {settings.whatsapp && (
              <InfoCard icon={<WhatsAppIcon size={20} />} title="WhatsApp">
                <p>{settings.whatsapp}</p>
                <a
                  href={inquiryLink(settings)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn mt-3 w-full bg-[#25D366] text-white hover:bg-[#1da851] sm:w-auto"
                >
                  <WhatsAppIcon size={17} />
                  {t('contact.chatWhatsapp')}
                </a>
              </InfoCard>
            )}

            {settings.email && (
              <InfoCard icon={<MailIcon size={20} />} title={t('contact.email')}>
                <a href={`mailto:${settings.email}`} className="break-all hover:text-brand-blue">
                  {settings.email}
                </a>
              </InfoCard>
            )}

            {settings.opening_hours && (
              <InfoCard icon={<ClockIcon size={20} />} title={t('contact.hours')}>
                <p className="whitespace-pre-line">{settings.opening_hours}</p>
              </InfoCard>
            )}

            {(settings.facebook || settings.instagram) && (
              <div className="card p-4">
                <h2 className="mb-3 text-sm font-bold text-ink">{t('footer.followUs')}</h2>
                <div className="flex gap-2">
                  {settings.facebook && (
                    <a
                      href={settings.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline btn-sm"
                    >
                      <FacebookIcon size={16} />
                      Facebook
                    </a>
                  )}
                  {settings.instagram && (
                    <a
                      href={settings.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline btn-sm"
                    >
                      <InstagramIcon size={16} />
                      Instagram
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {settings.maps_embed_url && (
            <div className="card overflow-hidden">
              <h2 className="border-b border-line px-4 py-3 text-sm font-bold text-ink">
                {t('contact.findUs')}
              </h2>
              <iframe
                src={settings.maps_embed_url}
                title={`Map showing ${settings.shop_name}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[380px] w-full border-0 lg:h-full lg:min-h-[520px]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-4">
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-blueSoft text-brand-blue">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          <div className="mt-1 text-[14px] leading-relaxed text-muted">{children}</div>
        </div>
      </div>
    </section>
  );
}
