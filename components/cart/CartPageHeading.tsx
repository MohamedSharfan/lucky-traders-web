'use client';

import { useCart } from '@/lib/cart/CartProvider';
import { useI18n } from '@/lib/i18n/LanguageProvider';

export function CartPageHeading() {
  const { count, ready } = useCart();
  const { t } = useI18n();

  return (
    <header className="mb-4">
      <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{t('cart.title')}</h1>
      {ready && count > 0 && (
        <p className="mt-0.5 text-[13px] text-muted">{t('cart.itemsCount', { count })}</p>
      )}
    </header>
  );
}
