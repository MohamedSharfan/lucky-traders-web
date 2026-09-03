import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { InventoryView } from '@/components/admin/InventoryView';
import { PageHeader } from '@/components/admin/PageHeader';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Inventory', robots: { index: false } };

type SearchParams = { q?: string; filter?: string; page?: string };

export default async function AdminInventoryPage({ searchParams }: { searchParams: SearchParams }) {
  const db = await getDb();
  const filter = searchParams.filter ?? '';

  const all = await db.queryProducts({
    search: searchParams.q,
    includeInactive: true,
    sort: 'name',
    page: 1,
    pageSize: 100000,
  });

  const summary = {
    inStock: all.items.filter((p) => p.stock_status === 'in_stock').length,
    low: all.items.filter((p) => p.stock_status === 'low_stock').length,
    out: all.items.filter((p) => p.stock_status === 'out_of_stock').length,
  };

  const filtered =
    filter === 'low'
      ? all.items.filter((p) => p.stock_status === 'low_stock')
      : filter === 'out'
        ? all.items.filter((p) => p.stock_status === 'out_of_stock')
        : // Default view puts the items needing attention at the top.
          [...all.items].sort((a, b) => a.stock - b.stock);

  const pageSize = 30;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(1, Number(searchParams.page) || 1), totalPages);

  return (
    <>
      <PageHeader title="Inventory" subtitle="Update stock levels as you unpack new deliveries." />
      <InventoryView
        items={filtered.slice((page - 1) * pageSize, page * pageSize)}
        total={filtered.length}
        page={page}
        totalPages={totalPages}
        query={{ q: searchParams.q ?? '', filter }}
        summary={summary}
      />
    </>
  );
}
