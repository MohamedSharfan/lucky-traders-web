import type { NextRequest } from 'next/server';

import { assertAdmin, fail, handle } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { timingSafeEqualString } from '@/lib/format';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

/**
 * Reads one order.
 *
 * Order numbers are sequential, so the number alone is not a credential - an
 * order holds the customer's name, phone and home address. A customer must
 * present the `token` from their confirmation link; the shop's own staff are
 * recognised by their admin session instead.
 *
 * Responds 404 rather than 403 for a wrong token, so the endpoint cannot be
 * used to discover which order numbers exist.
 */
export async function GET(request: NextRequest, { params }: Params) {
  const db = await getDb();
  const order = await db.getOrder(params.id);
  if (!order) return fail('Order not found', 404);

  const isAdmin = Boolean(getSession());
  const token = request.nextUrl.searchParams.get('token') ?? '';
  if (!isAdmin && !timingSafeEqualString(token, order.access_token)) {
    return fail('Order not found', 404);
  }

  return handle(async () => order);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return handle(async () => {
    assertAdmin();
    const body = await request.json();
    const status = body?.status as OrderStatus;
    if (!ORDER_STATUSES.includes(status)) throw new Error('Unknown order status');
    const db = await getDb();
    return db.updateOrderStatus(params.id, status);
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return handle(async () => {
    assertAdmin();
    const db = await getDb();
    await db.deleteOrder(params.id);
    return { deleted: true };
  });
}
