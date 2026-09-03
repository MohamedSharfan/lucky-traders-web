import type { NextRequest } from 'next/server';

import { assertAdmin, handle } from '@/lib/api';
import { getDb } from '@/lib/db';
import type { ProductView } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Bulk product updates, used by the Offers screen.
 *
 * Running a category-wide promotion one PATCH at a time would mean hundreds of
 * round trips on a mobile connection, so the whole operation is described in a
 * single request and applied server-side.
 */
export async function POST(request: NextRequest) {
  return handle(async () => {
    assertAdmin();
    const body = await request.json();
    const db = await getDb();

    const action = String(body?.action ?? '');
    const categorySlug: string | undefined = body?.category || undefined;
    const productIds: string[] = Array.isArray(body?.product_ids) ? body.product_ids.map(String) : [];

    // Resolve the target set: explicit ids, a whole category, or the whole shop.
    let targets: ProductView[];
    if (productIds.length) {
      targets = await db.getProductsByIds(productIds.slice(0, 2000));
    } else if (categorySlug || body?.all === true) {
      const result = await db.queryProducts({
        category: categorySlug,
        includeInactive: true,
        page: 1,
        pageSize: 100000,
      });
      targets = result.items;
    } else {
      throw new Error('Choose a category or select some products first.');
    }

    if (!targets.length) throw new Error('No products matched that selection.');

    let updated = 0;

    for (const product of targets) {
      let patch: Record<string, unknown> | null = null;

      switch (action) {
        case 'discount_percent': {
          const percent = Number(body?.percent);
          if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) {
            throw new Error('Enter a discount between 1 and 99 percent.');
          }
          // Round to the nearest 5 rupees, the way shelf prices are written.
          const sale = Math.round((product.price * (100 - percent)) / 100 / 5) * 5;
          if (sale > 0 && sale < product.price) patch = { sale_price: sale };
          break;
        }
        case 'discount_fixed': {
          const amount = Number(body?.amount);
          if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter an amount greater than zero.');
          const sale = Math.max(1, Math.round(product.price - amount));
          if (sale < product.price) patch = { sale_price: sale };
          break;
        }
        case 'clear_discount':
          if (product.sale_price != null) patch = { sale_price: null };
          break;
        case 'flag': {
          const key = String(body?.flag);
          if (!['is_featured', 'is_new', 'is_best_seller', 'is_active'].includes(key)) {
            throw new Error('Unknown product flag.');
          }
          patch = { [key]: Boolean(body?.value) };
          break;
        }
        default:
          throw new Error('Unknown bulk action.');
      }

      if (patch) {
        await db.updateProduct(product.id, patch);
        updated += 1;
      }
    }

    return { updated, considered: targets.length };
  });
}
