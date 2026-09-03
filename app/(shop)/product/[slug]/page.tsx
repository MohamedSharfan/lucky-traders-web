import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getDb } from '@/lib/db';
import { ProductDetail } from '@/components/product/ProductDetail';
import { RelatedProducts } from '@/components/product/RelatedProducts';

export const dynamic = 'force-dynamic';

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const db = await getDb();
  const product = await db.getProduct(params.slug);
  if (!product) return { title: 'Product not found' };

  return {
    title: product.name,
    description: product.description ?? `Buy ${product.name} online.`,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: product.image_url ? [product.image_url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const db = await getDb();
  const product = await db.getProduct(params.slug);

  if (!product || !product.is_active) notFound();

  // Related: same subcategory first, falling back to the parent category.
  const related = await db.queryProducts({
    category: product.category_slug ?? undefined,
    sort: 'popular',
    pageSize: 12,
  });

  return (
    <>
      <ProductDetail product={product} />
      <RelatedProducts products={related.items.filter((p) => p.id !== product.id).slice(0, 10)} />
    </>
  );
}
