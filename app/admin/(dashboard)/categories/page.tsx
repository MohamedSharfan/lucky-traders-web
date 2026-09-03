import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { PageHeader } from '@/components/admin/PageHeader';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Categories', robots: { index: false } };

export default async function AdminCategoriesPage() {
  const db = await getDb();
  const categories = await db.listCategories({ includeInactive: true });

  // Product counts per category, so the owner can see what a delete would affect.
  const all = await db.queryProducts({ includeInactive: true, page: 1, pageSize: 100000 });
  const counts: Record<string, number> = {};
  for (const product of all.items) {
    counts[product.category_id] = (counts[product.category_id] ?? 0) + 1;
    if (product.subcategory_id) {
      counts[product.subcategory_id] = (counts[product.subcategory_id] ?? 0) + 1;
    }
  }

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Group your products. Changes appear on the shop immediately."
      />
      <CategoryManager categories={categories} counts={counts} />
    </>
  );
}
