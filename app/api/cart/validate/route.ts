import type { NextRequest } from 'next/server';

import { handle } from '@/lib/api';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Re-checks a cart against the live catalog.
 *
 * A cart can sit in localStorage for days, so before the cart and checkout
 * pages show totals they ask the server for current prices, stock and
 * availability. Removed or deactivated products come back as `unavailable`.
 */
export async function POST(request: NextRequest) {
  return handle(async () => {
    const body = await request.json();
    const ids: string[] = Array.isArray(body?.ids)
      ? body.ids.map((id: unknown) => String(id)).filter(Boolean).slice(0, 200)
      : [];
    if (!ids.length) return { products: [], unavailable: [] };

    const db = await getDb();
    const products = await db.getProductsByIds(ids);
    const found = new Set(products.map((p) => p.id));

    return {
      products: products
        .filter((p) => p.is_active)
        .map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          name_si: p.name_si,
          name_ta: p.name_ta,
          unit: p.unit,
          price: p.effective_price,
          original_price: p.price,
          image_url: p.image_url,
          category_slug: p.category_slug,
          subcategory_slug: p.subcategory_slug,
          stock: p.stock,
        })),
      unavailable: ids.filter((id) => !found.has(id) || products.find((p) => p.id === id)?.is_active === false),
    };
  });
}
