import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { ProductGrid } from '@/components/ProductGrid';
import { ActiveFilterChips } from '@/components/filters/ActiveFilterChips';
import { FilterSheet, FilterSidebar } from '@/components/filters/FilterPanel';
import { SortSelect } from '@/components/filters/SortSelect';
import { ListingHeader, NoResults } from '@/components/ListingChrome';
import { Pagination } from '@/components/ui/Pagination';
import type { ProductQuery, ProductSort } from '@/lib/types';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

const SORTS: ProductSort[] = ['popular', 'price_asc', 'price_desc', 'newest', 'discount', 'name'];

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Turns the page's search params into a ProductQuery. */
function toQuery(searchParams: SearchParams): ProductQuery {
  const sort = one(searchParams.sort) as ProductSort | undefined;
  const num = (v: string | undefined) => (v && Number.isFinite(Number(v)) ? Number(v) : undefined);

  return {
    search: one(searchParams.q),
    category: one(searchParams.category),
    brands: (one(searchParams.brands) ?? '').split(',').filter(Boolean),
    minPrice: num(one(searchParams.min)),
    maxPrice: num(one(searchParams.max)),
    inStockOnly: one(searchParams.inStock) === 'true',
    onSaleOnly: one(searchParams.sale) === 'true',
    newOnly: one(searchParams.new) === 'true',
    featuredOnly: one(searchParams.featured) === 'true',
    bestSellerOnly: one(searchParams.best) === 'true',
    sort: sort && SORTS.includes(sort) ? sort : 'popular',
    page: Math.max(1, num(one(searchParams.page)) ?? 1),
    pageSize: 24,
  };
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const term = one(searchParams.q);
  const category = one(searchParams.category);
  if (term) return { title: `Search: ${term}` };
  if (category) {
    const db = await getDb();
    const cat = await db.getCategory(category);
    if (cat) return { title: cat.name, description: `Buy ${cat.name} online.` };
  }
  return { title: 'All Products' };
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const db = await getDb();
  const query = toQuery(searchParams);

  const [result, facets, category] = await Promise.all([
    db.queryProducts(query),
    db.getFacets(),
    query.category ? db.getCategory(query.category) : Promise.resolve(null),
  ]);

  // Every current filter is carried across pages.
  const paginationParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    const v = one(value);
    if (v && key !== 'page') paginationParams[key] = v;
  }

  return (
    <div className="container-app py-5">
      <ListingHeader
        searchTerm={query.search}
        categoryName={category?.name ?? null}
        total={result.total}
      />

      <div className="flex gap-6">
        <FilterSidebar
          brands={facets.brands}
          minPrice={facets.minPrice}
          maxPrice={facets.maxPrice}
          totalResults={result.total}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between gap-3">
            <FilterSheet
              brands={facets.brands}
              minPrice={facets.minPrice}
              maxPrice={facets.maxPrice}
              totalResults={result.total}
            />
            <p className="hidden text-[13px] text-muted lg:block">{result.total} products</p>
            <SortSelect />
          </div>

          <ActiveFilterChips />

          {result.items.length ? (
            <>
              <ProductGrid products={result.items} priorityCount={5} />
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                basePath="/products"
                params={paginationParams}
              />
            </>
          ) : (
            <NoResults />
          )}
        </div>
      </div>
    </div>
  );
}
