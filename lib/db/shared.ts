import type {
  Brand,
  Category,
  Order,
  Product,
  ProductQuery,
  ProductSort,
  ProductView,
  StockStatus,
} from '@/lib/types';

export const DEFAULT_PAGE_SIZE = 24;

export function stockStatus(p: Pick<Product, 'stock' | 'low_stock_threshold'>): StockStatus {
  if (p.stock <= 0) return 'out_of_stock';
  if (p.stock <= (p.low_stock_threshold || 10)) return 'low_stock';
  return 'in_stock';
}

/** Adds the derived pricing/stock fields the UI works with. */
export function toProductView(
  p: Product,
  lookups: {
    categories?: Map<string, Category>;
    brands?: Map<string, Brand>;
    categoryName?: string | null;
    categorySlug?: string | null;
    subcategoryName?: string | null;
    subcategorySlug?: string | null;
    brandName?: string | null;
  } = {},
): ProductView {
  const cat = lookups.categories?.get(p.category_id);
  const sub = p.subcategory_id ? lookups.categories?.get(p.subcategory_id) : undefined;
  const brand = p.brand_id ? lookups.brands?.get(p.brand_id) : undefined;

  const hasSale = p.sale_price != null && p.sale_price > 0 && p.sale_price < p.price;
  const effective = hasSale ? (p.sale_price as number) : p.price;

  return {
    ...p,
    gallery: p.gallery ?? [],
    category_name: lookups.categoryName ?? cat?.name ?? null,
    category_slug: lookups.categorySlug ?? cat?.slug ?? null,
    subcategory_name: lookups.subcategoryName ?? sub?.name ?? null,
    subcategory_slug: lookups.subcategorySlug ?? sub?.slug ?? null,
    brand_name: lookups.brandName ?? brand?.name ?? null,
    effective_price: effective,
    discount_percent: hasSale ? Math.round(((p.price - effective) / p.price) * 100) : 0,
    on_sale: hasSale,
    stock_status: stockStatus(p),
  };
}

/** Normalises a search term: lowercase, collapse whitespace. */
export function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Full-text-ish matching across English, Sinhala and Tamil names plus brand,
 * category and SKU. Every whitespace-separated term must match somewhere.
 */
export function matchesSearch(p: ProductView, term: string): boolean {
  const haystack = normalize(
    [p.name, p.name_si, p.name_ta, p.brand_name, p.category_name, p.subcategory_name, p.sku, p.description]
      .filter(Boolean)
      .join(' '),
  );
  return normalize(term)
    .split(' ')
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function sortProducts(items: ProductView[], sort: ProductSort = 'popular'): ProductView[] {
  const out = [...items];
  switch (sort) {
    case 'price_asc':
      out.sort((a, b) => a.effective_price - b.effective_price);
      break;
    case 'price_desc':
      out.sort((a, b) => b.effective_price - a.effective_price);
      break;
    case 'newest':
      out.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
      break;
    case 'discount':
      out.sort((a, b) => b.discount_percent - a.discount_percent);
      break;
    case 'name':
      out.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      // Popular: in-stock first, then popularity score.
      out.sort((a, b) => {
        const stockRank = Number(b.stock > 0) - Number(a.stock > 0);
        return stockRank !== 0 ? stockRank : b.popularity - a.popularity;
      });
  }
  return out;
}

export function paginate<T>(items: T[], page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

/**
 * Resolves the category slugs a query targets into the set of category ids that
 * should match, expanding a parent slug into all of its subcategories.
 */
export function resolveCategoryIds(categories: Category[], slugs: string[]): Set<string> {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const ids = new Set<string>();
  for (const slug of slugs) {
    const cat = bySlug.get(slug);
    if (!cat) continue;
    ids.add(cat.id);
    for (const child of categories) if (child.parent_id === cat.id) ids.add(child.id);
  }
  return ids;
}

export function filterProducts(
  products: ProductView[],
  query: ProductQuery,
  categories: Category[],
): ProductView[] {
  const catSlugs = [query.category, ...(query.categories ?? [])].filter(Boolean) as string[];
  const catIds = catSlugs.length ? resolveCategoryIds(categories, catSlugs) : null;
  const brandSet = query.brands?.length ? new Set(query.brands.map(normalize)) : null;

  return products.filter((p) => {
    if (!query.includeInactive && !p.is_active) return false;
    if (catIds && !catIds.has(p.category_id) && !(p.subcategory_id && catIds.has(p.subcategory_id))) return false;
    if (brandSet && !(p.brand_name && brandSet.has(normalize(p.brand_name)))) return false;
    if (query.minPrice != null && p.effective_price < query.minPrice) return false;
    if (query.maxPrice != null && p.effective_price > query.maxPrice) return false;
    if (query.inStockOnly && p.stock <= 0) return false;
    if (query.onSaleOnly && !p.on_sale) return false;
    if (query.newOnly && !p.is_new) return false;
    if (query.featuredOnly && !p.is_featured) return false;
    if (query.bestSellerOnly && !p.is_best_seller) return false;
    if (query.search && !matchesSearch(p, query.search)) return false;
    return true;
  });
}

/**
 * Cleans an order-number prefix.
 *
 * The owner types this in Store Settings, so it can arrive with spaces, slashes
 * or lowercase. Order numbers end up in URLs and WhatsApp messages, so anything
 * outside A-Z and 0-9 is stripped rather than passed through.
 */
export function sanitizeOrderPrefix(raw: string): string {
  return (raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

/** LT-10025 style order numbers, monotonically increasing per store. */
export function formatOrderNumber(prefix: string, sequence: number): string {
  // 'ORD' rather than any shop's initials: a neutral fallback stays correct
  // whatever the shop is renamed to.
  return `${sanitizeOrderPrefix(prefix) || 'ORD'}-${10000 + sequence}`;
}

/**
 * Splits a search query into the terms a LIKE/ILIKE can use.
 *
 * Returns `null` when the customer typed something real but it contained no
 * searchable characters (for example "%%%" or "___"). Callers must treat that
 * as "no results" - stripping the wildcards and searching for what is left
 * would otherwise match the entire catalog, which is the opposite of what the
 * customer asked for.
 */
export function searchTerms(raw: string | undefined): string[] | null {
  if (!raw || !raw.trim()) return [];
  const terms = normalize(raw)
    .split(' ')
    // % and _ are LIKE wildcards; strip them so they cannot widen the match.
    .map((term) => term.replace(/[%_]/g, '').trim())
    .filter(Boolean);
  return terms.length ? terms : null;
}

/**
 * Rejects a category move that would create a loop.
 *
 * Making a category the child of its own descendant leaves an orphaned ring
 * that no longer appears under any root, and any code walking the tree spins
 * forever.
 */
export function assertNoCategoryCycle(
  categories: { id: string; parent_id: string | null }[],
  categoryId: string,
  newParentId: string | null | undefined,
): void {
  if (!newParentId) return;
  if (newParentId === categoryId) throw new Error('A category cannot be its own parent');

  const byId = new Map(categories.map((c) => [c.id, c]));
  let cursor = byId.get(newParentId);
  let hops = 0;

  while (cursor && hops++ < 100) {
    if (cursor.id === categoryId) {
      throw new Error('That would put the category inside one of its own subcategories');
    }
    cursor = cursor.parent_id ? byId.get(cursor.parent_id) : undefined;
  }
}

/**
 * Normalises and validates the numeric fields of a product write.
 *
 * Applied inside the datastore so every path is covered - the product form, the
 * inline price/stock edits on the list, and the bulk offers endpoint.
 */
export function sanitizeProductWrite(
  patch: Record<string, unknown>,
  existing?: { price: number; sale_price: number | null },
): Record<string, unknown> {
  const out = { ...patch };

  const positive = (value: unknown, label: string): number => {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error(`${label} must be a number`);
    if (n < 0) throw new Error(`${label} cannot be negative`);
    return n;
  };

  if (out.price !== undefined) out.price = positive(out.price, 'Price');
  if (out.stock !== undefined) out.stock = Math.floor(positive(out.stock, 'Stock'));
  if (out.low_stock_threshold !== undefined) {
    out.low_stock_threshold = Math.floor(positive(out.low_stock_threshold, 'Low-stock threshold'));
  }
  if (out.popularity !== undefined) out.popularity = Math.floor(positive(out.popularity, 'Popularity'));

  if (out.sale_price !== undefined && out.sale_price !== null) {
    out.sale_price = positive(out.sale_price, 'Sale price');
  }

  // A sale price at or above the regular price is not a discount - it would
  // show as "0% off" with a struck-through price that is lower than the one
  // being charged, which reads as an error to the customer.
  const finalPrice = out.price !== undefined ? Number(out.price) : existing?.price;
  const finalSale =
    out.sale_price !== undefined
      ? (out.sale_price === null ? null : Number(out.sale_price))
      : existing?.sale_price ?? null;

  if (finalSale !== null && finalPrice !== undefined && finalSale >= finalPrice) {
    throw new Error('The sale price must be lower than the regular price');
  }

  return out;
}

export function orderTotals(
  items: { unit_price: number; quantity: number }[],
  opts: { deliveryFee: number; discount?: number },
) {
  const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const discount = opts.discount ?? 0;
  const total = Math.max(0, subtotal + opts.deliveryFee - discount);
  return { subtotal, discount, total };
}

export function emptyOrderStats(orders: Order[]) {
  return orders;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9඀-෿஀-௿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'item';
}
