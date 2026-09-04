'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/format';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import {
  BoxIcon,
  ChartIcon,
  CloseIcon,
  GridIcon,
  ImageIcon,
  ListIcon,
  LogoutIcon,
  MenuIcon,
  SettingsIcon,
  ShieldIcon,
  StoreIcon,
  TagIcon,
  TruckIcon,
  UsersIcon,
  WhatsAppIcon,
} from '@/components/ui/Icon';

/**
 * Admin chrome: a fixed sidebar on desktop, a slide-in drawer on mobile.
 *
 * The shop owner is expected to run the store from a phone as often as from a
 * laptop, so every admin screen is fully responsive rather than desktop-only.
 */

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: SettingsIcon, exact: true },
  { href: '/admin/products', label: 'Products', icon: BoxIcon },
  { href: '/admin/categories', label: 'Categories', icon: GridIcon },
  { href: '/admin/orders', label: 'Orders', icon: ListIcon },
  { href: '/admin/customers', label: 'Customers', icon: UsersIcon },
  { href: '/admin/offers', label: 'Offers', icon: TagIcon },
  { href: '/admin/inventory', label: 'Inventory', icon: BoxIcon },
  { href: '/admin/images', label: 'Product Photos', icon: ImageIcon },
  { href: '/admin/delivery', label: 'Delivery Settings', icon: TruckIcon },
  { href: '/admin/settings', label: 'Store Settings', icon: StoreIcon },
  { href: '/admin/whatsapp', label: 'WhatsApp Settings', icon: WhatsAppIcon },
  { href: '/admin/users', label: 'Admin Users', icon: ShieldIcon },
  { href: '/admin/reports', label: 'Reports', icon: ChartIcon },
];

export function AdminShell({
  children,
  adminName,
  shopName,
  storeKind,
}: {
  children: React.ReactNode;
  adminName: string;
  shopName: string;
  storeKind: 'supabase';
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const drawerRef = useFocusTrap<HTMLDivElement>(open, () => setOpen(false));

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  async function signOut() {
    setSigningOut(true);
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const sidebar = (
    <div className="flex h-full flex-col bg-brand-blueDark text-white">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" className="h-10 w-10 rounded-lg bg-white object-contain p-0.5" />
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-bold leading-tight">{shopName}</span>
          <span className="block text-[11px] text-white/60">Admin Panel</span>
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="ml-auto rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
          aria-label="Close menu"
        >
          <CloseIcon size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2.5" aria-label="Admin">
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors',
                    active ? 'bg-brand-red text-white' : 'text-white/75 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-2.5">
        <p className="px-3 pb-2 text-[12px] text-white/60">
          Signed in as <span className="font-semibold text-white">{adminName}</span>
        </p>
        <p className="mb-2 px-3 text-[11px] text-white/45">
          Data source: Supabase
        </p>
        <Link
          href="/"
          className="mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
        >
          <StoreIcon size={18} />
          View shop
        </Link>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogoutIcon size={18} />
          {signingOut ? 'Signing out…' : 'Logout'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50 animate-fade-in" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
            className="absolute inset-y-0 left-0 w-[80%] max-w-[280px] shadow-pop"
          >
            {sidebar}
          </div>
        </div>
      )}

      <div className="lg:pl-[248px]">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white px-3 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-ink hover:bg-canvas"
            aria-label="Open menu"
          >
            <MenuIcon size={22} />
          </button>
          <span className="text-[15px] font-bold text-ink">Admin</span>
          <Link href="/" className="ml-auto text-[13px] font-semibold text-brand-blue">
            View shop
          </Link>
        </div>

        <main className="p-3 sm:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
