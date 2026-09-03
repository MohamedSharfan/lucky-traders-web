'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useCart } from '@/lib/cart/CartProvider';
import { useI18n } from '@/lib/i18n/LanguageProvider';
import { cn } from '@/lib/format';
import { CartIcon, GridIcon, HomeIcon, SearchIcon, UserIcon } from '@/components/ui/Icon';

/**
 * Bottom navigation for phones: Home | Categories | Search | Cart | Account.
 * Each target is a 56px tall tap area, comfortably above the 44px minimum.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const { t } = useI18n();

  const items = [
    { href: '/', label: t('nav.home'), icon: HomeIcon, match: (p: string) => p === '/' },
    { href: '/categories', label: t('nav.categories'), icon: GridIcon, match: (p: string) => p.startsWith('/categories') },
    { href: '/products', label: t('nav.search'), icon: SearchIcon, match: (p: string) => p.startsWith('/products') },
    { href: '/cart', label: t('nav.cart'), icon: CartIcon, match: (p: string) => p.startsWith('/cart') },
    { href: '/admin', label: t('nav.account'), icon: UserIcon, match: (p: string) => p.startsWith('/admin') },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          const showBadge = href === '/cart' && ready && count > 0;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium transition-colors',
                  active ? 'text-brand-red' : 'text-muted',
                )}
              >
                <span className="relative">
                  <Icon size={21} />
                  {showBadge && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-brand-red px-1 text-[9.5px] font-bold text-white">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
