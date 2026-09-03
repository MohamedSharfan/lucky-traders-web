import type { NextRequest } from 'next/server';

import { assertAdmin, handle, parseNumber } from '@/lib/api';
import { getDb } from '@/lib/db';
import { isValidEmail, isValidSriLankanPhone } from '@/lib/format';
import { buildOrderMessage } from '@/lib/whatsapp';
import type { CreateOrderInput, DeliveryMethod, OrderStatus, PaymentMethod } from '@/lib/types';
import { ORDER_STATUSES, isPaymentMethodAllowed } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DELIVERY_METHODS: DeliveryMethod[] = ['delivery', 'pickup'];
const PAYMENT_METHODS: PaymentMethod[] = ['cod', 'pay_at_store'];

/**
 * Server-side validation. The checkout form validates too, but the API must
 * never trust it - prices and stock are re-read from the database here.
 */
function validate(body: any): CreateOrderInput {
  const name = String(body?.customer_name ?? '').trim();
  if (name.length < 2) throw new Error('Please enter your full name.');

  const phone = String(body?.phone ?? '').trim();
  if (!isValidSriLankanPhone(phone)) throw new Error('Please enter a valid mobile number, for example 0771234567.');

  const whatsapp = String(body?.whatsapp ?? '').trim();
  if (whatsapp && !isValidSriLankanPhone(whatsapp)) throw new Error('Please enter a valid WhatsApp number.');

  const email = String(body?.email ?? '').trim();
  if (email && !isValidEmail(email)) throw new Error('Please enter a valid email address.');

  const delivery_method = body?.delivery_method as DeliveryMethod;
  if (!DELIVERY_METHODS.includes(delivery_method)) throw new Error('Please choose delivery or pickup.');

  const payment_method = body?.payment_method as PaymentMethod;
  if (!PAYMENT_METHODS.includes(payment_method)) throw new Error('Please choose a payment method.');

  // The form only offers valid pairs, but the API must not trust it: a delivery
  // cannot be paid for at the counter, and a pickup cannot be cash-on-delivery.
  if (!isPaymentMethodAllowed(delivery_method, payment_method)) {
    throw new Error(
      delivery_method === 'delivery'
        ? 'Home delivery orders are paid in cash when the order arrives.'
        : 'Store pickup orders are paid at the counter when you collect.',
    );
  }

  if (delivery_method === 'delivery') {
    if (!String(body?.address_line ?? '').trim() && !String(body?.street ?? '').trim()) {
      throw new Error('Please enter your delivery address.');
    }
    if (!String(body?.city ?? '').trim()) throw new Error('Please enter your city.');
  }

  const rawItems = Array.isArray(body?.items) ? body.items : [];
  const items = rawItems
    .map((i: any) => ({ product_id: String(i?.product_id ?? ''), quantity: Math.floor(Number(i?.quantity ?? 0)) }))
    .filter((i: any) => i.product_id && i.quantity > 0);
  if (!items.length) throw new Error('Your cart is empty.');
  if (items.length > 200) throw new Error('That is too many items for one order. Please split it.');

  return {
    customer_name: name,
    phone,
    whatsapp: whatsapp || phone,
    email: email || null,
    address_line: String(body?.address_line ?? '').trim() || null,
    street: String(body?.street ?? '').trim() || null,
    area: String(body?.area ?? '').trim() || null,
    city: String(body?.city ?? '').trim() || null,
    district: String(body?.district ?? '').trim() || null,
    notes: String(body?.notes ?? '').trim() || null,
    delivery_method,
    payment_method,
    items,
  };
}

/** Public: places an order and returns the WhatsApp message to send. */
export async function POST(request: NextRequest) {
  return handle(async () => {
    const input = validate(await request.json());
    const db = await getDb();
    const order = await db.createOrder(input);
    const settings = await db.getSettings();
    return {
      order,
      whatsapp_number: settings.whatsapp,
      whatsapp_message: buildOrderMessage(order, settings),
    };
  });
}

/** Admin: lists orders for the dashboard. */
export async function GET(request: NextRequest) {
  return handle(async () => {
    assertAdmin();
    const params = request.nextUrl.searchParams;
    const status = params.get('status') as OrderStatus | null;
    const db = await getDb();
    return db.listOrders({
      status: status && ORDER_STATUSES.includes(status) ? status : undefined,
      search: params.get('q') ?? undefined,
      page: parseNumber(params.get('page')) ?? 1,
      pageSize: Math.min(parseNumber(params.get('pageSize')) ?? 20, 100),
    });
  });
}
