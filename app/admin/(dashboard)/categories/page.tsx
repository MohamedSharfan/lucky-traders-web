import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { BrandManager } from '@/components/admin/BrandManager';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { PageHeader } from '@/components/admin/PageHeader';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Categories & Brands', robots: { index: false } };

export default async function AdminCategoriesPage() {
  const db = await getDb();
  const [categories, brands] = await Promise.all([
    db.listCategories({ includeInactive: true }),
    db.listBrands(),
  ]);

  // Product counts per category and brand, so the owner can see what a delete
  // would affect before attempting one.
  const all = await db.queryProducts({ includeInactive: true, page: 1, pageSize: 100000 });
  const counts: Record<string, number> = {};
  const brandCounts: Record<string, number> = {};
  for (const product of all.items) {
    counts[product.category_id] = (counts[product.category_id] ?? 0) + 1;
    if (product.subcategory_id) {
      counts[product.subcategory_id] = (counts[product.subcategory_id] ?? 0) + 1;
    }
    if (product.brand_id) {
      brandCounts[product.brand_id] = (brandCounts[product.brand_id] ?? 0) + 1;
    }
  }

  return (
    <>
      <PageHeader
        title="Categories & Brands"
        subtitle="Group your products. Changes appear on the shop immediately."
      />
      <div className="space-y-5">
        <CategoryManager categories={categories} counts={counts} />
        <BrandManager brands={brands} counts={brandCounts} />
      </div>
    </>
  );
}
