import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { OffersManager } from '@/components/admin/OffersManager';
import { PageHeader } from '@/components/admin/PageHeader';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Offers', robots: { index: false } };

export default async function AdminOffersPage() {
  const db = await getDb();
  const [onSale, categories, settings] = await Promise.all([
    db.queryProducts({ onSaleOnly: true, includeInactive: true, sort: 'discount', page: 1, pageSize: 100000 }),
    db.listCategories({ includeInactive: true }),
    db.getSettings(),
  ]);

  return (
    <>
      <PageHeader title="Offers" subtitle="Discount a category or the whole shop in one step." />
      <OffersManager onSale={onSale.items} categories={categories} settings={settings} />
    </>
  );
}
