import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { timingSafeEqualString } from '@/lib/format';
import { buildOrderMessage } from '@/lib/whatsapp';
import { OrderConfirmation } from '@/components/checkout/OrderConfirmation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order Received',
  robots: { index: false, follow: false },
};

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: { number: string };
  searchParams: { t?: string };
}) {
  const db = await getDb();
  const order = await db.getOrder(decodeURIComponent(params.number));
  if (!order) notFound();

  // The order number is sequential and therefore guessable, so it is not on its
  // own enough to see someone's name, phone and address. The link the customer
  // receives carries a secret token; shop staff are recognised by their session.
  const isAdmin = Boolean(getSession());
  if (!isAdmin && !timingSafeEqualString(searchParams.t ?? '', order.access_token)) {
    notFound();
  }

  const settings = await db.getSettings();

  return (
    <OrderConfirmation
      order={order}
      whatsappNumber={settings.whatsapp}
      whatsappMessage={buildOrderMessage(order, settings)}
    />
  );
}
