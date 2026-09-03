import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { ProductGrid } from '@/components/ProductGrid';
import { Pagination } from '@/components/ui/Pagination';
import { PromoBanner } from '@/components/PromoBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { TagIcon } from '@/components/ui/Icon';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Offers',
  description: 'Discounted groceries and household essentials, updated by the shop.',
};

export default async function OffersPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const db = await getDb();
  const result = await db.queryProducts({ onSaleOnly: true, sort: 'discount', page, pageSize: 24 });

  const best = result.items.reduce((max, p) => Math.max(max, p.discount_percent), 0);

  return (
    <div className="container-app py-5">
      <PromoBanner
        title="Weekend Grocery Sale"
        subtitle={best > 0 ? `Up to ${best}% OFF across the shop` : 'Fresh discounts every week'}
      />

      {result.items.length ? (
        <>
          <ProductGrid products={result.items} priorityCount={5} label="Products on offer" />
          <Pagination page={result.page} totalPages={result.totalPages} basePath="/offers" />
        </>
      ) : (
        <div className="card">
          <EmptyState
            icon={<TagIcon size={26} />}
            title="No offers right now"
            body="Check back soon — we update our discounts every week."
            actionLabel="Browse all products"
            actionHref="/products"
          />
        </div>
      )}
    </div>
  );
}
