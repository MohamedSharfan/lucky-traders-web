import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { DashboardView } from '@/components/admin/DashboardView';
import { PageHeader } from '@/components/admin/PageHeader';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false } };

export default async function AdminDashboardPage() {
  const db = await getDb();
  const [stats, settings] = await Promise.all([db.getDashboardStats(), db.getSettings()]);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <PageHeader title="Dashboard" subtitle={today} actionLabel="Add Product" actionHref="/admin/products/new" />
      <DashboardView stats={stats} settings={settings} />
    </>
  );
}
