'use client';

import { usePathname } from 'next/navigation';

import { useStore } from '@/components/StoreProvider';
import { inquiryLink } from '@/lib/whatsapp';
import { WhatsAppIcon } from '@/components/ui/Icon';

/**
 * Floating WhatsApp button.
 *
 * Sits above the mobile bottom navigation so it never covers the cart tab, and
 * is hidden on the cart, checkout and confirmation screens - there it would
 * overlap the order totals and compete with the primary action, which is
 * already a WhatsApp button of its own.
 *
 * The number and greeting come from Admin -> WhatsApp Settings.
 */
const HIDDEN_ON = ['/cart', '/checkout', '/order'];

export function FloatingWhatsApp() {
  const { settings } = useStore();
  const pathname = usePathname();

  if (!settings.whatsapp) return null;
  if (HIDDEN_ON.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return null;

  return (
    <a
      href={inquiryLink(settings)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${settings.shop_name} on WhatsApp`}
      className="fixed bottom-[5.25rem] right-4 z-40 flex h-13 w-13 items-center justify-center rounded-full
                 bg-[#25D366] text-white shadow-pop transition-transform hover:scale-105 active:scale-95
                 lg:bottom-6 lg:right-6"
      style={{ height: '3.25rem', width: '3.25rem' }}
    >
      <WhatsAppIcon size={28} />
    </a>
  );
}
