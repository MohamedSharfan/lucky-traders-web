import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { OrdersView } from '@/components/admin/OrdersView';
import { PageHeader } from '@/components/admin/PageHeader';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Orders', robots: { index: false } };

type SearchParams = { q?: string; status?: string; page?: string };

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const db = await getDb();
  const status = searchParams.status as OrderStatus | undefined;
  const validStatus = status && ORDER_STATUSES.includes(status) ? status : undefined;

  const [result, settings, all] = await Promise.all([
    db.listOrders({
      status: validStatus,
      search: searchParams.q,
      page: Math.max(1, Number(searchParams.page) || 1),
      pageSize: 20,
    }),
    db.getSettings(),
    // A light second pass purely to count each status for the tab badges.
    db.listOrders({ page: 1, pageSize: 100000 }),
  ]);

  const counts: Record<string, number> = { all: all.total };
  for (const s of ORDER_STATUSES) counts[s] = 0;
  for (const order of all.items) counts[order.status] = (counts[order.status] ?? 0) + 1;

  return (
    <>
      <PageHeader title="Orders" subtitle="Change a status and the customer's order moves along." />
      <OrdersView
        result={result}
        settings={settings}
        counts={counts}
        query={{ q: searchParams.q ?? '', status: validStatus ?? '' }}
      />
    </>
  );
}
