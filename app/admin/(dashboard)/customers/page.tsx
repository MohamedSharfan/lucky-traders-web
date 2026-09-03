import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { PageHeader } from '@/components/admin/PageHeader';
import { CustomersTable } from '@/components/admin/CustomersTable';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Customers', robots: { index: false } };

export default async function AdminCustomersPage() {
  const db = await getDb();
  const [orders, settings] = await Promise.all([
    db.listOrders({ page: 1, pageSize: 100000 }),
    db.getSettings(),
  ]);

  /**
   * Checkout is guest-only, so "customers" are derived from their orders and
   * keyed by phone number — the one identifier a Sri Lankan shopper always
   * gives and rarely changes.
   */
  const byPhone = new Map<
    string,
    { name: string; phone: string; whatsapp: string | null; city: string | null; orders: number; spent: number; last: string }
  >();

  for (const order of orders.items) {
    const existing = byPhone.get(order.phone);
    const counts = order.status !== 'cancelled';
    if (existing) {
      existing.orders += 1;
      if (counts) existing.spent += order.total;
      if (order.created_at > existing.last) {
        existing.last = order.created_at;
        existing.name = order.customer_name;
        existing.city = order.city;
      }
    } else {
      byPhone.set(order.phone, {
        name: order.customer_name,
        phone: order.phone,
        whatsapp: order.whatsapp,
        city: order.city,
        orders: 1,
        spent: counts ? order.total : 0,
        last: order.created_at,
      });
    }
  }

  const customers = [...byPhone.values()].sort((a, b) => b.spent - a.spent);

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Built from your orders — no account needed for anyone to shop."
      />
      <CustomersTable customers={customers} settings={settings} />
    </>
  );
}
