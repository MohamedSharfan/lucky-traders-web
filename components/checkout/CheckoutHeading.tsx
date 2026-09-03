'use client';

import { useI18n } from '@/lib/i18n/LanguageProvider';

export function CheckoutHeading() {
  const { t } = useI18n();
  return (
    <header className="mb-4">
      <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{t('checkout.title')}</h1>
      <p className="mt-0.5 text-[13px] text-muted">{t('checkout.guestNote')}</p>
    </header>
  );
}
