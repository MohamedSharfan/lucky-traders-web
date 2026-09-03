import type { Order, Settings } from '@/lib/types';
import { formatPrice, toWhatsAppNumber } from '@/lib/format';

/**
 * WhatsApp click-to-chat helpers.
 *
 * We deliberately use the free wa.me deep link rather than the paid Business
 * API: the customer's own WhatsApp opens with the order pre-typed, and they
 * press send. The destination number always comes from store settings, never
 * from a hard-coded constant.
 */

export function whatsappLink(number: string, message: string): string {
  const to = toWhatsAppNumber(number);
  const text = encodeURIComponent(message);
  return to ? `https://wa.me/${to}?text=${text}` : `https://wa.me/?text=${text}`;
}

/** The "I have a question" link behind the floating button and header CTA. */
export function inquiryLink(settings: Pick<Settings, 'whatsapp' | 'whatsapp_greeting' | 'shop_name'>): string {
  const greeting =
    settings.whatsapp_greeting?.trim() ||
    `Hello ${settings.shop_name}, I would like to inquire about your products.`;
  return whatsappLink(settings.whatsapp, greeting);
}

/**
 * Builds the order message the shop owner receives. Plain text only - WhatsApp
 * renders *bold* but nothing else reliably, so the layout does the work.
 */
export function buildOrderMessage(order: Order, settings: Settings): string {
  const currency = settings.currency || 'Rs.';
  const lines: string[] = [];

  lines.push(`*NEW ORDER - ${settings.shop_name.toUpperCase()}*`);
  lines.push(`Order No: ${order.order_number}`);
  lines.push('');
  lines.push(`*Customer:* ${order.customer_name}`);
  lines.push(`*Phone:* ${order.phone}`);
  if (order.whatsapp && order.whatsapp !== order.phone) lines.push(`*WhatsApp:* ${order.whatsapp}`);
  if (order.email) lines.push(`*Email:* ${order.email}`);
  lines.push('');

  if (order.delivery_method === 'delivery') {
    const address = [order.address_line, order.street, order.area, order.city, order.district]
      .filter((p) => p && p.trim())
      .join(', ');
    lines.push('*Delivery Address:*');
    lines.push(address || '(not provided)');
  } else {
    lines.push('*Store Pickup* - customer will collect from the shop.');
  }
  if (order.notes) {
    lines.push('');
    lines.push(`*Note:* ${order.notes}`);
  }

  lines.push('');
  lines.push('*Items:*');
  order.items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.product_name} x ${item.quantity}`);
    lines.push(`   ${formatPrice(item.unit_price, currency)} each = ${formatPrice(item.total, currency)}`);
  });

  lines.push('');
  lines.push(`Subtotal: ${formatPrice(order.subtotal, currency)}`);
  if (order.delivery_method === 'delivery') {
    lines.push(`Delivery: ${order.delivery_fee > 0 ? formatPrice(order.delivery_fee, currency) : 'FREE'}`);
  }
  if (order.discount > 0) lines.push(`Discount: -${formatPrice(order.discount, currency)}`);
  lines.push(`*TOTAL: ${formatPrice(order.total, currency)}*`);
  lines.push('');
  lines.push(`Payment: ${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Pay at Store'}`);
  lines.push('');
  lines.push('Please confirm this order.');

  return lines.join('\n');
}

export function orderWhatsappLink(order: Order, settings: Settings): string {
  return whatsappLink(settings.whatsapp, buildOrderMessage(order, settings));
}
