import type { NextRequest } from 'next/server';

import { assertAdmin, handle, parseBool, parseList, parseNumber } from '@/lib/api';
import { getDb } from '@/lib/db';
import type { ProductQuery, ProductSort } from '@/lib/types';

export const dynamic = 'force-dynamic';

const SORTS: ProductSort[] = ['popular', 'price_asc', 'price_desc', 'newest', 'discount', 'name'];

/** Builds a ProductQuery from the request's search params. */
function queryFromParams(params: URLSearchParams): ProductQuery {
  const sort = params.get('sort') as ProductSort | null;
  return {
    search: params.get('q') ?? undefined,
    category: params.get('category') ?? undefined,
    categories: parseList(params.get('categories')),
    brands: parseList(params.get('brands')),
    minPrice: parseNumber(params.get('min')),
    maxPrice: parseNumber(params.get('max')),
    inStockOnly: parseBool(params.get('inStock')),
    onSaleOnly: parseBool(params.get('sale')),
    newOnly: parseBool(params.get('new')),
    featuredOnly: parseBool(params.get('featured')),
    bestSellerOnly: parseBool(params.get('best')),
    sort: sort && SORTS.includes(sort) ? sort : 'popular',
    page: parseNumber(params.get('page')) ?? 1,
    pageSize: Math.min(parseNumber(params.get('pageSize')) ?? 24, 60),
  };
}

export async function GET(request: NextRequest) {
  return handle(async () => {
    const db = await getDb();
    return db.queryProducts(queryFromParams(request.nextUrl.searchParams));
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    assertAdmin();
    const body = await request.json();
    const db = await getDb();
    return db.createProduct(body);
  });
}
