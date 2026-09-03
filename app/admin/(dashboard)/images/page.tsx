import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { PageHeader } from '@/components/admin/PageHeader';
import { BulkImageUploader } from '@/components/admin/BulkImageUploader';
import type { MatchableProduct } from '@/lib/match-images';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Product Photos', robots: { index: false } };

export default async function AdminImagesPage() {
  const db = await getDb();
  const all = await db.queryProducts({ includeInactive: true, sort: 'name', page: 1, pageSize: 100000 });

  // Only the fields the matcher and the dropdowns need — the full product rows
  // would be a needlessly large payload for a 300-item catalog.
  const products: MatchableProduct[] = all.items.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    slug: p.slug,
    brand_name: p.brand_name,
    unit: p.unit,
    image_url: p.image_url,
  }));

  return (
    <>
      <PageHeader
        title="Product Photos"
        subtitle="Drop a folder of photos in and they are matched to products by file name."
      />
      <BulkImageUploader products={products} />
    </>
  );
}
