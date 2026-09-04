import 'server-only';

import { randomBytes } from 'node:crypto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type {
  AdminUser,
  Brand,
  Category,
  DashboardStats,
  Order,
  OrderItem,
  OrderStatus,
  Paginated,
  Product,
  ProductQuery,
  ProductView,
  Settings,
} from '@/lib/types';
import type { DataStore } from './types';
import { DatabaseUnreachableError } from './errors';
import {
  DEFAULT_PAGE_SIZE,
  assertNoCategoryCycle,
  buildSlugBase,
  computeStats,
  formatOrderNumber,
  orderTotals,
  resolveDeliveryFee,
  sanitizeProductWrite,
  searchTerms,
  slugify,
  toProductView,
} from './shared';

/**
 * Supabase-backed datastore.
 *
 * Runs on the server only, using the service-role key so that Row Level
 * Security can lock the tables down to "public read, no public write" while
 * these trusted routes still perform admin writes. The service-role key must
 * never be exposed to the browser - see `lib/supabase/client.ts` for the
 * anon-key client used there.
 */

let client: SupabaseClient | null = null;

export function serviceClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase is not configured');
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

const now = () => new Date().toISOString();

/**
 * Recognises failures that mean "this deployment is misconfigured" rather than
 * "that particular query was wrong".
 *
 * A paused project, a wrong URL, a rotated key and a schema that was never
 * created all surface here as ordinary query errors. Reporting them as such
 * hides the real problem behind an opaque digest, so they are re-thrown as a
 * configuration error whose message says what to fix.
 */
function asConfigurationFailure(message: string): DatabaseUnreachableError | null {
  const patterns = [
    /fetch failed/i,
    /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN/i,
    /getaddrinfo/i,
    // PostgREST: the table does not exist, i.e. schema.sql was never run.
    /relation .* does not exist/i,
    /Could not find the table/i,
    /schema cache/i,
    // Auth against the project itself.
    /JWT|Invalid API key|invalid signature/i,
    /project.*paused/i,
  ];
  return patterns.some((p) => p.test(message)) ? new DatabaseUnreachableError(message) : null;
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) {
    const configFailure = asConfigurationFailure(res.error.message);
    if (configFailure) throw configFailure;
    throw new Error(res.error.message);
  }
  return res.data as T;
}

const PRODUCT_SELECT = '*, category:categories!products_category_id_fkey(id,name,slug), subcategory:categories!products_subcategory_id_fkey(id,name,slug), brand:brands(id,name)';

type ProductRow = Product & {
  category?: { id: string; name: string; slug: string } | null;
  subcategory?: { id: string; name: string; slug: string } | null;
  brand?: { id: string; name: string } | null;
};

function rowToView(row: ProductRow): ProductView {
  const { category, subcategory, brand, ...product } = row;
  return toProductView(product as Product, {
    categoryName: category?.name ?? null,
    categorySlug: category?.slug ?? null,
    subcategoryName: subcategory?.name ?? null,
    subcategorySlug: subcategory?.slug ?? null,
    brandName: brand?.name ?? null,
  });
}

async function loadCategoryIds(sb: SupabaseClient, slugs: string[]): Promise<string[]> {
  if (!slugs.length) return [];
  const parents = unwrap(await sb.from('categories').select('id').in('slug', slugs));
  const ids = (parents as { id: string }[]).map((c) => c.id);
  if (!ids.length) return [];
  const children = unwrap(await sb.from('categories').select('id').in('parent_id', ids));
  return [...ids, ...(children as { id: string }[]).map((c) => c.id)];
}

export const supabaseStore: DataStore = {
  kind: 'supabase',

  // ------------------------------------------------------------- categories
  async listCategories(opts) {
    const sb = serviceClient();
    let q = sb.from('categories').select('*').order('sort_order').order('name');
    if (!opts?.includeInactive) q = q.eq('is_active', true);
    return unwrap(await q) as Category[];
  },

  async getCategory(idOrSlug) {
    const sb = serviceClient();
    const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug);
    const res = await sb.from('categories').select('*').eq(isUuid ? 'id' : 'slug', idOrSlug).maybeSingle();
    if (res.error) throw new Error(res.error.message);
    return (res.data as Category) ?? null;
  },

  async createCategory(input) {
    const sb = serviceClient();
    const name = (input.name ?? '').trim();
    if (!name) throw new Error('Category name is required');
    const row = {
      slug: slugify(input.slug || name),
      name,
      name_si: input.name_si ?? null,
      name_ta: input.name_ta ?? null,
      image_url: input.image_url ?? null,
      icon: input.icon ?? null,
      parent_id: input.parent_id ?? null,
      is_active: input.is_active ?? true,
      sort_order: input.sort_order ?? 100,
    };
    return unwrap(await sb.from('categories').insert(row).select().single()) as Category;
  },

  async updateCategory(id, patch) {
    const sb = serviceClient();
    if (patch.parent_id !== undefined) {
      const all = unwrap(await sb.from('categories').select('id, parent_id')) as { id: string; parent_id: string | null }[];
      assertNoCategoryCycle(all, id, patch.parent_id);
    }
    const row = { ...patch, updated_at: now() } as Record<string, unknown>;
    delete row.id;
    delete row.created_at;
    if (patch.slug) row.slug = slugify(patch.slug);
    return unwrap(await sb.from('categories').update(row).eq('id', id).select().single()) as Category;
  },

  async deleteCategory(id) {
    const sb = serviceClient();
    const children = unwrap(await sb.from('categories').select('id').eq('parent_id', id).limit(1));
    if ((children as unknown[]).length) throw new Error('Remove or move the subcategories first');
    const used = unwrap(await sb.from('products').select('id').or(`category_id.eq.${id},subcategory_id.eq.${id}`).limit(1));
    if ((used as unknown[]).length) throw new Error('This category still has products assigned to it');
    const res = await sb.from('categories').delete().eq('id', id);
    if (res.error) throw new Error(res.error.message);
  },

  async listBrands() {
    const sb = serviceClient();
    return unwrap(await sb.from('brands').select('*').order('name')) as Brand[];
  },

  // --------------------------------------------------------------- products
  async queryProducts(query) {
    const sb = serviceClient();
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

    let q = sb.from('products').select(PRODUCT_SELECT, { count: 'exact' });

    if (!query.includeInactive) q = q.eq('is_active', true);

    const catSlugs = [query.category, ...(query.categories ?? [])].filter(Boolean) as string[];
    if (catSlugs.length) {
      const ids = await loadCategoryIds(sb, catSlugs);
      if (!ids.length) return { items: [], total: 0, page, pageSize, totalPages: 1 };
      q = q.or(`category_id.in.(${ids.join(',')}),subcategory_id.in.(${ids.join(',')})`);
    }

    if (query.brands?.length) {
      const brandRows = unwrap(await sb.from('brands').select('id').in('name', query.brands));
      const brandIds = (brandRows as { id: string }[]).map((b) => b.id);
      if (!brandIds.length) return { items: [], total: 0, page, pageSize, totalPages: 1 };
      q = q.in('brand_id', brandIds);
    }

    if (query.inStockOnly) q = q.gt('stock', 0);
    if (query.newOnly) q = q.eq('is_new', true);
    if (query.featuredOnly) q = q.eq('is_featured', true);
    if (query.bestSellerOnly) q = q.eq('is_best_seller', true);
    if (query.onSaleOnly) q = q.not('sale_price', 'is', null).gt('sale_price', 0);

    // A query of only wildcards or punctuation must match nothing, not all.
    if (searchTerms(query.search) === null) {
      return { items: [], total: 0, page, pageSize, totalPages: 1 };
    }

    if (query.search) {
      // `search_text` is a generated column holding name + si + ta + sku +
      // description, so one ILIKE covers all three languages (see schema.sql).
      // Brand and category names live in other tables, so they are resolved to
      // ids first and folded into the same OR, so "araliya" or "rice & grains"
      // find products just as a product name does.
      const term = query.search.replace(/[%,()]/g, ' ').trim();
      if (term) {
        const pattern = `%${term}%`;
        const [brandHits, categoryHits] = await Promise.all([
          sb.from('brands').select('id').ilike('name', pattern),
          sb.from('categories').select('id').ilike('name', pattern),
        ]);

        const clauses = [`search_text.ilike.${pattern}`];
        const brandIds = (brandHits.data ?? []).map((b: { id: string }) => b.id);
        const categoryIds = (categoryHits.data ?? []).map((c: { id: string }) => c.id);
        if (brandIds.length) clauses.push(`brand_id.in.(${brandIds.join(',')})`);
        if (categoryIds.length) {
          clauses.push(`category_id.in.(${categoryIds.join(',')})`);
          clauses.push(`subcategory_id.in.(${categoryIds.join(',')})`);
        }

        q = q.or(clauses.join(','));
      }
    }

    // Effective price filtering uses the generated `effective_price` column.
    if (query.minPrice != null) q = q.gte('effective_price', query.minPrice);
    if (query.maxPrice != null) q = q.lte('effective_price', query.maxPrice);

    switch (query.sort) {
      case 'price_asc': q = q.order('effective_price', { ascending: true }); break;
      case 'price_desc': q = q.order('effective_price', { ascending: false }); break;
      case 'newest': q = q.order('created_at', { ascending: false }); break;
      case 'discount': q = q.order('discount_percent', { ascending: false }); break;
      case 'name': q = q.order('name', { ascending: true }); break;
      default: q = q.order('stock', { ascending: false }).order('popularity', { ascending: false });
    }

    const from = (page - 1) * pageSize;
    const res = await q.range(from, from + pageSize - 1);
    if (res.error) throw new Error(res.error.message);

    const total = res.count ?? 0;
    return {
      items: (res.data as ProductRow[]).map(rowToView),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async getProduct(idOrSlug) {
    const sb = serviceClient();
    const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug);
    const res = await sb.from('products').select(PRODUCT_SELECT).eq(isUuid ? 'id' : 'slug', idOrSlug).maybeSingle();
    if (res.error) throw new Error(res.error.message);
    return res.data ? rowToView(res.data as ProductRow) : null;
  },

  async getProductsByIds(ids) {
    if (!ids.length) return [];
    const sb = serviceClient();
    const rows = unwrap(await sb.from('products').select(PRODUCT_SELECT).in('id', ids));
    return (rows as ProductRow[]).map(rowToView);
  },

  async createProduct(input) {
    const sb = serviceClient();
    const name = (input.name ?? '').trim();
    if (!name) throw new Error('Product name is required');
    if (!input.category_id) throw new Error('Please choose a category');

    const clean = sanitizeProductWrite(input as Record<string, unknown>);
    const row = {
      slug: slugify(input.slug || buildSlugBase(undefined, name, input.unit)),
      sku: (input.sku ?? '').trim() || `SK-${Date.now().toString(36).toUpperCase()}`,
      name,
      name_si: input.name_si ?? null,
      name_ta: input.name_ta ?? null,
      description: input.description ?? null,
      category_id: input.category_id,
      subcategory_id: input.subcategory_id ?? null,
      brand_id: input.brand_id ?? null,
      price: Number(clean.price ?? 0),
      sale_price: clean.sale_price != null ? Number(clean.sale_price) : null,
      stock: Number(clean.stock ?? 0),
      low_stock_threshold: Number(clean.low_stock_threshold ?? 10),
      unit: input.unit ?? '1 piece',
      weight: input.weight ?? input.unit ?? null,
      image_url: input.image_url ?? null,
      gallery: input.gallery ?? [],
      is_featured: input.is_featured ?? false,
      is_new: input.is_new ?? true,
      is_best_seller: input.is_best_seller ?? false,
      is_active: input.is_active ?? true,
      popularity: Number(clean.popularity ?? 0),
    };
    return unwrap(await sb.from('products').insert(row).select().single()) as Product;
  },

  async updateProduct(id, patch) {
    const sb = serviceClient();
    const existing = await supabaseStore.getProduct(id);
    if (!existing) throw new Error('Product not found');

    patch = sanitizeProductWrite(patch as Record<string, unknown>, existing) as typeof patch;

    const row = { ...patch, updated_at: now() } as Record<string, unknown>;
    delete row.id;
    delete row.created_at;
    if (patch.slug) row.slug = slugify(patch.slug);
    return unwrap(await sb.from('products').update(row).eq('id', id).select().single()) as Product;
  },

  async deleteProduct(id) {
    const sb = serviceClient();
    const res = await sb.from('products').delete().eq('id', id);
    if (res.error) throw new Error(res.error.message);
  },

  async getFacets() {
    const sb = serviceClient();
    const brands = unwrap(await sb.from('brands').select('*').order('name')) as Brand[];
    const min = unwrap(await sb.from('products').select('effective_price').eq('is_active', true).order('effective_price').limit(1)) as { effective_price: number }[];
    const max = unwrap(await sb.from('products').select('effective_price').eq('is_active', true).order('effective_price', { ascending: false }).limit(1)) as { effective_price: number }[];
    return {
      brands,
      minPrice: Math.floor(min[0]?.effective_price ?? 0),
      maxPrice: Math.ceil(max[0]?.effective_price ?? 0),
    };
  },

  // ----------------------------------------------------------------- orders
  async createOrder(input) {
    const sb = serviceClient();
    const settings = await supabaseStore.getSettings();

    const ids = input.items.map((i) => i.product_id);
    const products = unwrap(await sb.from('products').select('*').in('id', ids)) as Product[];
    const byId = new Map(products.map((p) => [p.id, p]));

    const lines: Omit<OrderItem, 'id' | 'order_id'>[] = [];
    for (const line of input.items) {
      const product = byId.get(line.product_id);
      if (!product || !product.is_active) throw new Error('One of the products is no longer available');
      const qty = Math.max(1, Math.floor(line.quantity));
      if (product.stock <= 0) throw new Error(`${product.name} is out of stock`);
      if (qty > product.stock) throw new Error(`Only ${product.stock} of ${product.name} left in stock`);
      const unitPrice =
        product.sale_price != null && product.sale_price > 0 && product.sale_price < product.price
          ? product.sale_price
          : product.price;
      lines.push({
        product_id: product.id,
        product_name: product.name,
        unit: product.unit,
        quantity: qty,
        unit_price: unitPrice,
        total: unitPrice * qty,
      });
    }
    if (!lines.length) throw new Error('Your cart is empty');

    const subtotalOnly = lines.reduce((s, i) => s + i.total, 0);
    const deliveryFee =
      input.delivery_method === 'pickup' || !settings.delivery_enabled
        ? 0
        : resolveDeliveryFee(settings, input.area ?? input.city ?? '', subtotalOnly);
    const { subtotal, discount, total } = orderTotals(lines, { deliveryFee });

    const sequence = unwrap(await sb.rpc('next_order_sequence')) as number;
    const accessToken = randomBytes(18).toString('base64url');

    const order = unwrap(
      await sb
        .from('orders')
        .insert({
          order_number: formatOrderNumber(settings.order_prefix, sequence),
          customer_name: input.customer_name.trim(),
          phone: input.phone.trim(),
          whatsapp: input.whatsapp?.trim() || input.phone.trim(),
          email: input.email?.trim() || null,
          address_line: input.address_line?.trim() || null,
          street: input.street?.trim() || null,
          area: input.area?.trim() || null,
          city: input.city?.trim() || null,
          district: input.district?.trim() || null,
          notes: input.notes?.trim() || null,
          delivery_method: input.delivery_method,
          payment_method: input.payment_method,
          subtotal,
          delivery_fee: deliveryFee,
          discount,
          total,
          status: 'new',
          access_token: accessToken,
        })
        .select()
        .single(),
    ) as Order;

    const items = unwrap(
      await sb.from('order_items').insert(lines.map((l) => ({ ...l, order_id: order.id }))).select(),
    ) as OrderItem[];

    // Decrement stock atomically inside Postgres.
    const res = await sb.rpc('reserve_stock', {
      lines: lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
    });
    if (res.error) throw new Error(res.error.message);

    return { ...order, items };
  },

  async listOrders(opts) {
    const sb = serviceClient();
    const page = opts?.page ?? 1;
    const pageSize = opts?.pageSize ?? 20;
    let q = sb.from('orders').select('*, items:order_items(*)', { count: 'exact' }).order('created_at', { ascending: false });
    if (opts?.status) q = q.eq('status', opts.status);
    if (opts?.search) {
      const term = opts.search.replace(/[%,()]/g, ' ').trim();
      if (term) q = q.or(`order_number.ilike.%${term}%,customer_name.ilike.%${term}%,phone.ilike.%${term}%`);
    }
    const from = (page - 1) * pageSize;
    const res = await q.range(from, from + pageSize - 1);
    if (res.error) throw new Error(res.error.message);
    const total = res.count ?? 0;
    return {
      items: res.data as Order[],
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    } as Paginated<Order>;
  },

  async getOrder(idOrNumber) {
    const sb = serviceClient();
    const isUuid = /^[0-9a-f-]{36}$/i.test(idOrNumber);
    const res = await sb
      .from('orders')
      .select('*, items:order_items(*)')
      .eq(isUuid ? 'id' : 'order_number', idOrNumber)
      .maybeSingle();
    if (res.error) throw new Error(res.error.message);
    return (res.data as Order) ?? null;
  },

  async updateOrderStatus(id, status: OrderStatus) {
    const sb = serviceClient();
    const current = await supabaseStore.getOrder(id);
    if (!current) throw new Error('Order not found');

    if (status === 'cancelled' && current.status !== 'cancelled') {
      const res = await sb.rpc('release_stock', {
        lines: current.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      if (res.error) throw new Error(res.error.message);
    }

    unwrap(await sb.from('orders').update({ status, updated_at: now() }).eq('id', id).select().single());
    return (await supabaseStore.getOrder(id))!;
  },

  async deleteOrder(id) {
    const sb = serviceClient();
    const res = await sb.from('orders').delete().eq('id', id);
    if (res.error) throw new Error(res.error.message);
  },

  // ----------------------------------------------------------- admin users
  //
  // Passwords live in Supabase Auth, never in our own table. `admins` holds the
  // name and role, and an account must exist in BOTH to be able to sign in -
  // so removing the row here revokes admin access without touching the auth
  // user, and vice versa.
  async listAdmins() {
    const sb = serviceClient();
    const rows = unwrap(await sb.from('admins').select('*').order('name')) as AdminUser[];
    return rows;
  },

  async createAdmin({ email, name, role, password }) {
    const sb = serviceClient();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) throw new Error('An email address is required');
    if (name.trim().length < 2) throw new Error('A name is required');
    if (password.length < 8) throw new Error('The password must be at least 8 characters');

    // Create the auth user first; if the admins row then fails we roll it back,
    // so we never leave an auth user that can never sign in.
    const created = await sb.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
    });
    if (created.error) {
      if (/already/i.test(created.error.message)) {
        throw new Error('An account with that email already exists');
      }
      throw new Error(created.error.message);
    }

    const row = await sb
      .from('admins')
      .insert({ email: cleanEmail, name: name.trim(), role })
      .select()
      .single();

    if (row.error) {
      if (created.data.user) await sb.auth.admin.deleteUser(created.data.user.id);
      throw new Error(row.error.message);
    }

    return row.data as AdminUser;
  },

  async updateAdmin(id, patch) {
    const sb = serviceClient();
    const existing = unwrap(await sb.from('admins').select('*').eq('id', id).single()) as AdminUser;

    if (patch.password) {
      if (patch.password.length < 8) throw new Error('The password must be at least 8 characters');
      // Supabase Auth is keyed by its own user id, so look it up by email.
      const users = await sb.auth.admin.listUsers();
      if (users.error) throw new Error(users.error.message);
      const authUser = users.data.users.find((u) => u.email?.toLowerCase() === existing.email.toLowerCase());
      if (!authUser) throw new Error('No Supabase Auth user matches this admin');
      const updated = await sb.auth.admin.updateUserById(authUser.id, { password: patch.password });
      if (updated.error) throw new Error(updated.error.message);
    }

    const fields: Record<string, unknown> = {};
    if (patch.name !== undefined) {
      if (patch.name.trim().length < 2) throw new Error('A name is required');
      fields.name = patch.name.trim();
    }
    if (patch.role !== undefined) fields.role = patch.role;
    if (!Object.keys(fields).length) return existing;

    return unwrap(await sb.from('admins').update(fields).eq('id', id).select().single()) as AdminUser;
  },

  async deleteAdmin(id) {
    const sb = serviceClient();
    const existing = unwrap(await sb.from('admins').select('email').eq('id', id).single()) as { email: string };

    const res = await sb.from('admins').delete().eq('id', id);
    if (res.error) throw new Error(res.error.message);

    // Remove the auth user too, so the account cannot linger and be re-granted
    // by someone re-adding only the admins row.
    const users = await sb.auth.admin.listUsers();
    if (!users.error) {
      const authUser = users.data.users.find((u) => u.email?.toLowerCase() === existing.email.toLowerCase());
      if (authUser) await sb.auth.admin.deleteUser(authUser.id);
    }
  },

  async verifyAdminPassword(email, password) {
    // Supabase Auth is the source of truth for passwords here, and
    // `verifyCredentials` in lib/auth.ts already performs that check.
    void email;
    void password;
    return null;
  },

  // --------------------------------------------------------------- settings
  async getSettings() {
    const sb = serviceClient();
    const res = await sb.from('settings').select('data').eq('id', 1).maybeSingle();
    if (res.error) throw new Error(res.error.message);
    const { defaultSettings } = await import('@/data/build-catalog.mjs');
    return { ...(defaultSettings as Settings), ...((res.data?.data as Settings) ?? {}) };
  },

  async updateSettings(patch) {
    const sb = serviceClient();
    const merged = { ...(await supabaseStore.getSettings()), ...patch };
    unwrap(await sb.from('settings').upsert({ id: 1, data: merged, updated_at: now() }).select().single());
    return merged;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const sb = serviceClient();
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const orders = unwrap(
      await sb.from('orders').select('*, items:order_items(*)').gte('created_at', since.toISOString()),
    ) as Order[];
    const products = unwrap(await sb.from('products').select('*')) as Product[];
    const categories = unwrap(await sb.from('categories').select('*')) as Category[];
    return computeStats(orders, products, categories);
  },
};
