import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { PageHeader } from '@/components/admin/PageHeader';
import { ProductsTable } from '@/components/admin/ProductsTable';
import type { ProductView } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Products', robots: { index: false } };

type SearchParams = { q?: string; category?: string; status?: string; page?: string };

/** Status filters that cannot be expressed as a plain ProductQuery. */
function applyStatus(items: ProductView[], status: string): ProductView[] {
  switch (status) {
    case 'active': return items.filter((p) => p.is_active);
    case 'hidden': return items.filter((p) => !p.is_active);
    case 'sale': return items.filter((p) => p.on_sale);
    case 'out': return items.filter((p) => p.stock <= 0);
    case 'low': return items.filter((p) => p.stock > 0 && p.stock_status === 'low_stock');
    default: return items;
  }
}

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const db = await getDb();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const status = searchParams.status ?? '';

  const [categories, settings] = await Promise.all([
    db.listCategories({ includeInactive: true }),
    db.getSettings(),
  ]);

  // Status filters run over the full result set, so they are applied after a
  // wide query rather than being pushed into the datastore.
  const wide = await db.queryProducts({
    search: searchParams.q,
    category: searchParams.category,
    includeInactive: true,
    sort: 'newest',
    page: 1,
    pageSize: 100000,
  });

  const filtered = applyStatus(wide.items, status);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const result = {
    items: filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    total: filtered.length,
    page: safePage,
    pageSize,
    totalPages,
  };

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Edit prices and stock inline, or open a product for full details."
        actionLabel="Add Product"
        actionHref="/admin/products/new"
      />
      <ProductsTable
        result={result}
        categories={categories}
        settings={settings}
        query={{ q: searchParams.q ?? '', category: searchParams.category ?? '', status }}
      />
    </>
  );
}
