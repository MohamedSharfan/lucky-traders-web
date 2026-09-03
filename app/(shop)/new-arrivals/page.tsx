import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { ProductGrid } from '@/components/ProductGrid';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { SparkIcon } from '@/components/ui/Icon';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'New Arrivals',
  description: 'The latest products added to our shelves.',
};

export default async function NewArrivalsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const db = await getDb();
  const result = await db.queryProducts({ newOnly: true, sort: 'newest', page, pageSize: 24 });

  return (
    <div className="container-app py-5">
      <header className="mb-4">
        <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">New Arrivals</h1>
        <p className="mt-0.5 text-[13px] text-muted">Just landed on our shelves</p>
      </header>

      {result.items.length ? (
        <>
          <ProductGrid products={result.items} priorityCount={5} label="New arrivals" />
          <Pagination page={result.page} totalPages={result.totalPages} basePath="/new-arrivals" />
        </>
      ) : (
        <div className="card">
          <EmptyState
            icon={<SparkIcon size={26} />}
            title="Nothing new just yet"
            body="New stock is added regularly — please check back soon."
            actionLabel="Browse all products"
            actionHref="/products"
          />
        </div>
      )}
    </div>
  );
}
