import type { OrderStatus } from '@/lib/types';

/** Rs. 1,250 — the format Sri Lankan shoppers expect. */
export function formatPrice(amount: number, currency = 'Rs.'): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const hasCents = rounded % 1 !== 0;
  return `${currency} ${rounded.toLocaleString('en-LK', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${formatDate(iso)}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/** Tailwind classes per status, used by the badge in the admin order tables. */
export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  new: 'bg-brand-redSoft text-brand-redDark ring-brand-red/20',
  confirmed: 'bg-brand-blueSoft text-brand-blueDark ring-brand-blue/20',
  preparing: 'bg-amber-50 text-amber-700 ring-amber-200',
  ready: 'bg-violet-50 text-violet-700 ring-violet-200',
  out_for_delivery: 'bg-sky-50 text-sky-700 ring-sky-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-gray-100 text-gray-600 ring-gray-200',
};

/**
 * Normalises a Sri Lankan phone number to international form for wa.me links.
 * 0771234567 -> 94771234567 ; +94 77 123 4567 -> 94771234567
 */
export function toWhatsAppNumber(input: string): string {
  const digits = (input || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('94')) return digits;
  if (digits.startsWith('0')) return `94${digits.slice(1)}`;
  if (digits.length === 9) return `94${digits}`;
  return digits;
}

/** Accepts 07XXXXXXXX, +947XXXXXXXX, 947XXXXXXXX and a few landline forms. */
export function isValidSriLankanPhone(input: string): boolean {
  const digits = (input || '').replace(/\D/g, '');
  if (digits.startsWith('94')) return /^94[1-9]\d{8}$/.test(digits);
  if (digits.startsWith('0')) return /^0[1-9]\d{8}$/.test(digits);
  return /^[1-9]\d{8}$/.test(digits);
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.trim());
}

/**
 * Constant-time string comparison for secrets.
 *
 * A plain `===` returns as soon as two strings differ, which leaks how much of
 * a token was guessed correctly. Both sides are hashed first so the comparison
 * is over equal-length buffers regardless of input length.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  if (!a || !b) return false;
  // Web Crypto is not available synchronously in every runtime this file is
  // bundled into, so fold the strings to fixed-length values by hand.
  const fold = (s: string) => {
    const out = new Uint32Array(8);
    for (let i = 0; i < s.length; i++) {
      const slot = i % 8;
      out[slot] = (Math.imul(out[slot] ^ s.charCodeAt(i), 16777619) >>> 0) ^ (i + 1);
    }
    return out;
  };
  const fa = fold(a);
  const fb = fold(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < 8; i++) diff |= fa[i] ^ fb[i];
  return diff === 0;
}

/** Small helper for conditional class names. */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

/** Stable, colourful placeholder background derived from a product name. */
export function placeholderTint(seed: string): { bg: string; fg: string } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return { bg: `hsl(${h} 62% 95%)`, fg: `hsl(${h} 45% 42%)` };
}

/** First letters of a product name, used inside the image placeholder. */
export function initials(name: string): string {
  return name
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
