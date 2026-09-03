'use client';

import { useI18n } from '@/lib/i18n/LanguageProvider';
import { ShieldIcon, TagIcon, TruckIcon, WhatsAppIcon } from '@/components/ui/Icon';

/** The four trust cards. Blue is used here deliberately: this is information. */
export function WhyShop() {
  const { t } = useI18n();

  const items = [
    { icon: ShieldIcon, title: t('why.quality'), body: t('why.qualityBody') },
    { icon: TagIcon, title: t('why.prices'), body: t('why.pricesBody') },
    { icon: WhatsAppIcon, title: t('why.ordering'), body: t('why.orderingBody') },
    { icon: TruckIcon, title: t('why.delivery'), body: t('why.deliveryBody') },
  ];

  return (
    <section className="container-app mt-10">
      <h2 className="mb-3 text-lg font-extrabold tracking-tight text-ink sm:text-xl">{t('home.whyShop')}</h2>
      <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, body }) => (
          <li key={title} className="rounded-card border border-line bg-white p-4 shadow-card">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blueSoft text-brand-blue">
              <Icon size={20} />
            </span>
            <h3 className="text-sm font-bold text-ink">{title}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
