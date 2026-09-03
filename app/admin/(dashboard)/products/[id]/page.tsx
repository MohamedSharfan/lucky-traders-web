import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getDb } from '@/lib/db';
import { PageHeader } from '@/components/admin/PageHeader';
import { ProductForm } from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Edit Product', robots: { index: false } };

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const db = await getDb();
  const product = await db.getProduct(params.id);
  if (!product) notFound();

  const [categories, brands, settings] = await Promise.all([
    db.listCategories({ includeInactive: true }),
    db.listBrands(),
    db.getSettings(),
  ]);

  return (
    <>
      <PageHeader title="Edit Product" subtitle={product.name}>
        <Link href={`/product/${product.slug}`} target="_blank" className="btn-outline btn-sm">
          View on shop
        </Link>
      </PageHeader>
      <ProductForm product={product} categories={categories} brands={brands} settings={settings} />
    </>
  );
}
