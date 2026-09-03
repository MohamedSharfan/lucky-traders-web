import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { PageHeader } from '@/components/admin/PageHeader';
import { ReportsView } from '@/components/admin/ReportsView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Reports', robots: { index: false } };

export default async function AdminReportsPage() {
  const db = await getDb();
  const [orders, settings, stats] = await Promise.all([
    db.listOrders({ page: 1, pageSize: 100000 }),
    db.getSettings(),
    db.getDashboardStats(),
  ]);

  return (
    <>
      <PageHeader title="Reports" subtitle="Sales, order and product performance at a glance." />
      <ReportsView orders={orders.items} settings={settings} stats={stats} />
    </>
  );
}
