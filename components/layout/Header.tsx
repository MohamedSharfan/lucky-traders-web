'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useCart } from '@/lib/cart/CartProvider';
import { useI18n } from '@/lib/i18n/LanguageProvider';
import { useStore } from '@/components/StoreProvider';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { cn } from '@/lib/format';
import { inquiryLink } from '@/lib/whatsapp';
import {
  CartIcon,
  ChevronDownIcon,
  CloseIcon,
  GridIcon,
  MenuIcon,
  PhoneIcon,
  UserIcon,
  WhatsAppIcon,
} from '@/components/ui/Icon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SearchBar } from './SearchBar';

/**
 * Site header.
 *
 * Desktop: announcement strip, brand + search + actions, then a nav row with a
 * categories mega-menu. Mobile: a compact sticky bar (brand, search, cart) plus
 * a slide-in drawer — the bottom navigation carries the rest.
 */
export function Header() {
  const { settings, rootCategories, childrenOf } = useStore();
  const { t, ln } = useI18n();
  const { count, ready } = useCart();
  const pathname = usePathname();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useFocusTrap<HTMLDivElement>(drawerOpen, () => setDrawerOpen(false));
  const [megaOpen, setMegaOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Close overlays whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  // Lock body scroll behind the mobile drawer.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setMegaOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/categories', label: t('nav.categories') },
    { href: '/offers', label: t('nav.offers') },
    { href: '/new-arrivals', label: t('nav.newArrivals') },
    { href: '/about', label: t('nav.about') },
    { href: '/contact', label: t('nav.contact') },
  ];

  const cartBadge = ready && count > 0 ? (count > 99 ? '99+' : String(count)) : null;

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Announcement + utility strip (desktop) */}
      {settings.announcement && (
        <div className="hidden bg-brand-blueDark text-white lg:block">
          <div className="container-app flex h-9 items-center justify-between text-[13px]">
            <p className="truncate">{settings.announcement}</p>
            <div className="flex items-center gap-4">
              <a href={`tel:${settings.phone}`} className="inline-flex items-center gap-1.5 hover:underline">
                <PhoneIcon size={14} />
                {settings.phone}
              </a>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}

      {/* Main bar */}
      <div className="border-b border-line bg-white">
        <div className="container-app">
          {/* ---------------- desktop ---------------- */}
          <div className="hidden h-[72px] items-center gap-6 lg:flex">
            <BrandMark settings={settings} />

            <div className="min-w-0 flex-1">
              <SearchBar />
            </div>

            <div className="flex items-center gap-1">
              <a
                href={inquiryLink(settings)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm mr-1 bg-[#25D366] text-white hover:bg-[#1da851]"
              >
                <WhatsAppIcon size={16} />
                {t('nav.orderOnWhatsapp')}
              </a>

              <Link
                href="/admin"
                className="flex flex-col items-center rounded-lg px-3 py-1.5 text-muted transition-colors hover:bg-canvas hover:text-brand-blue"
              >
                <UserIcon size={20} />
                <span className="text-[11px] font-medium">{t('nav.account')}</span>
              </Link>

              <Link
                href="/cart"
                className="relative flex flex-col items-center rounded-lg px-3 py-1.5 text-muted transition-colors hover:bg-canvas hover:text-brand-red"
              >
                <span className="relative">
                  <CartIcon size={20} />
                  {cartBadge && <CartBadge value={cartBadge} />}
                </span>
                <span className="text-[11px] font-medium">{t('nav.cart')}</span>
              </Link>
            </div>
          </div>

          {/* ---------------- mobile ---------------- */}
          <div className="lg:hidden">
            <div className="flex h-14 items-center gap-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="-ml-1 rounded-lg p-2 text-ink hover:bg-canvas"
                aria-label={t('nav.menu')}
              >
                <MenuIcon size={22} />
              </button>

              <BrandMark settings={settings} compact />

              <div className="ml-auto flex items-center gap-1">
                <LanguageSwitcher variant="light" />
                <Link
                  href="/cart"
                  className="relative rounded-lg p-2 text-ink hover:bg-canvas"
                  aria-label={`${t('nav.cart')}${cartBadge ? ` (${cartBadge})` : ''}`}
                >
                  <CartIcon size={22} />
                  {cartBadge && <CartBadge value={cartBadge} />}
                </Link>
              </div>
            </div>

            <div className="pb-2.5">
              <SearchBar />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop nav row with categories mega-menu */}
      <div className="hidden border-b border-line bg-white lg:block">
        <div className="container-app flex h-11 items-center gap-1">
          <div
            className="relative"
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => setMegaOpen(false)}
          >
            <button
              type="button"
              onClick={() => setMegaOpen((v) => !v)}
              aria-expanded={megaOpen}
              className="inline-flex h-11 items-center gap-2 rounded-t-md bg-brand-red px-4 text-sm font-semibold text-white"
            >
              <GridIcon size={16} />
              {t('nav.categories')}
              <ChevronDownIcon size={14} />
            </button>

            {megaOpen && (
              <div className="absolute left-0 top-11 z-50 w-[860px] rounded-b-xl border border-line bg-white p-5 shadow-pop animate-fade-in">
                <div className="grid max-h-[70vh] grid-cols-3 gap-x-6 gap-y-4 overflow-y-auto">
                  {rootCategories.map((cat) => (
                    <div key={cat.id}>
                      <Link
                        href={`/products?category=${cat.slug}`}
                        className="flex items-center gap-2 text-sm font-bold text-ink hover:text-brand-blue"
                      >
                        <span aria-hidden="true">{cat.icon}</span>
                        {ln(cat)}
                      </Link>
                      <ul className="mt-1 space-y-0.5">
                        {childrenOf(cat.id).slice(0, 5).map((sub) => (
                          <li key={sub.id}>
                            <Link
                              href={`/products?category=${sub.slug}`}
                              className="block truncate text-[13px] text-muted hover:text-brand-blue"
                            >
                              {ln(sub)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <Link
                  href="/categories"
                  className="mt-4 inline-block text-sm font-semibold text-brand-blue hover:underline"
                >
                  {t('home.viewAll')} →
                </Link>
              </div>
            )}
          </div>

          <nav className="flex items-center" aria-label="Main">
            {navLinks.map((link) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3.5 py-2 text-sm font-medium transition-colors',
                    active ? 'text-brand-red' : 'text-ink hover:text-brand-blue',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/45 animate-fade-in"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.menu')}
            className="absolute inset-y-0 left-0 flex w-[86%] max-w-[340px] flex-col bg-white shadow-pop"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <BrandMark settings={settings} compact />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-ink hover:bg-canvas"
                aria-label={t('nav.close')}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Mobile">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-canvas"
                >
                  {link.label}
                </Link>
              ))}

              <p className="mt-4 px-3 text-[11px] font-bold uppercase tracking-wide text-muted">
                {t('nav.categories')}
              </p>
              <ul className="mt-1">
                {rootCategories.map((cat) => {
                  const subs = childrenOf(cat.id);
                  const isOpen = expanded === cat.id;
                  return (
                    <li key={cat.id}>
                      <div className="flex items-center">
                        <Link
                          href={`/products?category=${cat.slug}`}
                          className="flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] text-ink hover:bg-canvas"
                        >
                          <span aria-hidden="true">{cat.icon}</span>
                          {ln(cat)}
                        </Link>
                        {subs.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : cat.id)}
                            aria-expanded={isOpen}
                            aria-label={`Show ${cat.name} subcategories`}
                            className="rounded-lg p-2 text-muted hover:bg-canvas"
                          >
                            <ChevronDownIcon
                              size={16}
                              className={cn('transition-transform', isOpen && 'rotate-180')}
                            />
                          </button>
                        )}
                      </div>
                      {isOpen && (
                        <ul className="mb-1 ml-6 border-l border-line pl-2">
                          {subs.map((sub) => (
                            <li key={sub.id}>
                              <Link
                                href={`/products?category=${sub.slug}`}
                                className="block rounded-lg px-3 py-2 text-sm text-muted hover:bg-canvas hover:text-brand-blue"
                              >
                                {ln(sub)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="border-t border-line p-3">
              <a
                href={inquiryLink(settings)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn w-full bg-[#25D366] text-white hover:bg-[#1da851]"
              >
                <WhatsAppIcon size={18} />
                {t('nav.orderOnWhatsapp')}
              </a>
              <a
                href={`tel:${settings.phone}`}
                className="mt-2 flex items-center justify-center gap-2 text-sm font-medium text-muted"
              >
                <PhoneIcon size={15} />
                {settings.phone}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function CartBadge({ value }: { value: string }) {
  return (
    <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
      {value}
    </span>
  );
}

function BrandMark({
  settings,
  compact = false,
}: {
  settings: { shop_name: string; shop_subtitle: string; logo_url: string | null };
  compact?: boolean;
}) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={settings.shop_name}>
      {settings.logo_url ? (
        // Owner-uploaded logos vary wildly in aspect ratio, so this stays a plain
        // img with a height cap rather than a fixed-size next/image box.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={settings.logo_url}
          alt=""
          className={cn('w-auto object-contain', compact ? 'h-8' : 'h-11')}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo.svg"
          alt=""
          className={cn('w-auto object-contain', compact ? 'h-9' : 'h-11')}
        />
      )}
      <span className="min-w-0">
        <span
          className={cn(
            'block truncate font-extrabold leading-tight tracking-tight text-ink',
            compact ? 'text-[15px]' : 'text-lg',
          )}
        >
          {settings.shop_name}
        </span>
        <span
          className={cn(
            'block truncate font-medium leading-tight text-brand-blue',
            compact ? 'text-[10.5px]' : 'text-[12px]',
          )}
        >
          {settings.shop_subtitle}
        </span>
      </span>
    </Link>
  );
}
