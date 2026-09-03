import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { PageHeader } from '@/components/admin/PageHeader';
import { ProductForm } from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Add Product', robots: { index: false } };

export default async function NewProductPage() {
  const db = await getDb();
  const [categories, brands, settings] = await Promise.all([
    db.listCategories({ includeInactive: true }),
    db.listBrands(),
    db.getSettings(),
  ]);

  return (
    <>
      <PageHeader title="Add Product" subtitle="It appears on the shop as soon as you save." />
      <ProductForm categories={categories} brands={brands} settings={settings} />
    </>
  );
}
