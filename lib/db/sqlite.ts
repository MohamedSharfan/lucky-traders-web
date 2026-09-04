import 'server-only';

import crypto from 'node:crypto';
import path from 'node:path';
import { promises as fs } from 'node:fs';

import { createClient, type Client, type InValue } from '@libsql/client';

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
  ProductView,
  Settings,
} from '@/lib/types';
import type { DataStore } from './types';
import {
  DEFAULT_PAGE_SIZE,
  assertNoCategoryCycle,
  formatOrderNumber,
  orderTotals,
  sanitizeProductWrite,
  searchTerms,
  slugify,
  toProductView,
} from './shared';
import { MIGRATION_STATEMENTS, SCHEMA_STATEMENTS } from './sqlite-schema';
import { DatabaseUnreachableError, StorageUnavailableError } from './errors';
import { computeStats, resolveDeliveryFee } from './local';

/**
 * SQLite datastore — the default for this project.
 *
 * One file on disk (`.data/lucky-traders.db`), no server, no subscription and
 * nothing to keep awake. It implements exactly the same `DataStore` contract as
 * the Supabase adapter, so the rest of the app cannot tell them apart.
 *
 * Backing up the shop is copying that one file.
 */

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'lucky-traders.db');

let client: Client | null = null;
let ready: Promise<Client> | null = null;

/** Opens the database, applies the schema, and seeds it on first run. */
async function connect(): Promise<Client> {
  if (client) return client;
  if (ready) return ready;

  ready = (async () => {
    // A hosted libSQL/Turso database needs no local disk at all, so the data
    // directory is only created when we are actually going to write a file
    // there. Creating it unconditionally breaks an otherwise-correct hosted
    // deployment on a read-only filesystem.
    const remoteUrl = process.env.TURSO_DATABASE_URL?.trim();
    const authToken = process.env.TURSO_AUTH_TOKEN?.trim() || undefined;

    let url: string;
    if (remoteUrl) {
      url = remoteUrl;
    } else {
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
      } catch (error) {
        throw new StorageUnavailableError(
          `cannot create ${DATA_DIR} (${error instanceof Error ? error.message : String(error)})`,
        );
      }
      url = `file:${DB_FILE.replace(/\\/g, '/')}`;
    }

    const db = createClient({ url, authToken });

    try {
      for (const statement of SCHEMA_STATEMENTS) {
        await db.execute(statement);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // libSQL reports an unwritable file as ConnectionFailed rather than a
      // filesystem error, so match on that too.
      if (remoteUrl) {
        // A hosted database that will not open is always a configuration
        // problem - a bad URL, or a token that has been rotated or revoked.
        throw new DatabaseUnreachableError(remoteUrl, message);
      }
      if (/ConnectionFailed|unable to open|readonly|EROFS|EACCES/i.test(message)) {
        throw new StorageUnavailableError(`cannot open ${DB_FILE} (${message})`);
      }
      throw error;
    }

    // Bring older databases up to date. These throw when already applied,
    // which is the normal case, so the error is expected and ignored.
    for (const statement of MIGRATION_STATEMENTS) {
      try {
        await db.execute(statement);
      } catch {
        /* column already exists */
      }
    }

    await seedIfEmpty(db);

    client = db;
    ready = null;
    return db;
  })();

  return ready;
}

/** Loads the demo catalog the first time the database is created. */
async function seedIfEmpty(db: Client): Promise<void> {
  const count = await db.execute('SELECT COUNT(*) AS n FROM products');
  if (Number(count.rows[0]?.n ?? 0) > 0) return;

  const { buildCatalog, defaultSettings } = await import('@/data/build-catalog.mjs');
  const { categories, brands, products } = buildCatalog();
  const now = new Date().toISOString();

  const statements: { sql: string; args: InValue[] }[] = [];

  // Parents before children, because parent_id is a foreign key.
  for (const category of [...categories].sort((a, b) => Number(Boolean(a.parent_id)) - Number(Boolean(b.parent_id)))) {
    statements.push({
      sql: `INSERT INTO categories (id, slug, name, name_si, name_ta, image_url, icon, parent_id, is_active, sort_order, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        category.id, category.slug, category.name, category.name_si, category.name_ta,
        category.image_url, category.icon, category.parent_id,
        category.is_active ? 1 : 0, category.sort_order, category.created_at, category.updated_at,
      ],
    });
  }

  for (const brand of brands) {
    statements.push({
      sql: `INSERT INTO brands (id, slug, name, is_active) VALUES (?,?,?,?)`,
      args: [brand.id, brand.slug, brand.name, brand.is_active ? 1 : 0],
    });
  }

  for (const product of products) {
    statements.push({ sql: INSERT_PRODUCT, args: productArgs(product) });
  }

  statements.push({
    sql: `INSERT INTO settings (id, data, updated_at) VALUES (1, ?, ?)`,
    args: [JSON.stringify(defaultSettings), now],
  });
  statements.push({
    sql: `INSERT INTO meta (key, value) VALUES ('order_sequence', '0')`,
    args: [],
  });

  // One batch, not one statement at a time.
  //
  // batch() ships every statement in a single request and applies them
  // atomically, so a failure part-way still leaves no half-built catalog.
  // Executing them individually costs a network round trip each: ~480 of them
  // against a hosted database is well over ten seconds, which exceeds a
  // serverless function's time limit long before the catalog finishes loading.
  await db.batch(statements, 'write');

  console.log(
    `[sqlite] seeded ${categories.length} categories, ${brands.length} brands, ${products.length} products`,
  );
}

const INSERT_PRODUCT = `
  INSERT INTO products (
    id, slug, sku, name, name_si, name_ta, description, category_id, subcategory_id,
    brand_id, price, sale_price, stock, low_stock_threshold, unit, weight, image_url,
    gallery, is_featured, is_new, is_best_seller, is_active, popularity, created_at, updated_at
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

function productArgs(p: Product): InValue[] {
  return [
    p.id, p.slug, p.sku, p.name, p.name_si, p.name_ta, p.description,
    p.category_id, p.subcategory_id, p.brand_id, p.price, p.sale_price,
    p.stock, p.low_stock_threshold, p.unit, p.weight, p.image_url,
    JSON.stringify(p.gallery ?? []),
    p.is_featured ? 1 : 0, p.is_new ? 1 : 0, p.is_best_seller ? 1 : 0,
    p.is_active ? 1 : 0, p.popularity, p.created_at, p.updated_at,
  ];
}

// ---------------------------------------------------------------- mapping
// SQLite has no boolean or array types, so rows come back with 0/1 integers
// and JSON strings. These convert them back to the shapes the app expects.

type Row = Record<string, unknown>;

const bool = (v: unknown) => Number(v) === 1;
const str = (v: unknown) => (v === null || v === undefined ? null : String(v));
const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

function rowToCategory(r: Row): Category {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    name_si: str(r.name_si),
    name_ta: str(r.name_ta),
    image_url: str(r.image_url),
    icon: str(r.icon),
    parent_id: str(r.parent_id),
    is_active: bool(r.is_active),
    sort_order: num(r.sort_order),
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

function rowToProduct(r: Row): Product {
  let gallery: string[] = [];
  try {
    const parsed = JSON.parse(String(r.gallery ?? '[]'));
    if (Array.isArray(parsed)) gallery = parsed.filter((x) => typeof x === 'string');
  } catch {
    /* a hand-edited row should not take the shop down */
  }

  return {
    id: String(r.id),
    slug: String(r.slug),
    sku: String(r.sku),
    name: String(r.name),
    name_si: str(r.name_si),
    name_ta: str(r.name_ta),
    description: str(r.description),
    category_id: String(r.category_id),
    subcategory_id: str(r.subcategory_id),
    brand_id: str(r.brand_id),
    price: num(r.price),
    sale_price: r.sale_price === null || r.sale_price === undefined ? null : Number(r.sale_price),
    stock: num(r.stock),
    low_stock_threshold: num(r.low_stock_threshold),
    unit: String(r.unit),
    weight: str(r.weight),
    image_url: str(r.image_url),
    gallery,
    is_featured: bool(r.is_featured),
    is_new: bool(r.is_new),
    is_best_seller: bool(r.is_best_seller),
    is_active: bool(r.is_active),
    popularity: num(r.popularity),
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

function rowToProductView(r: Row): ProductView {
  return toProductView(rowToProduct(r), {
    categoryName: str(r.category_name),
    categorySlug: str(r.category_slug),
    subcategoryName: str(r.subcategory_name),
    subcategorySlug: str(r.subcategory_slug),
    brandName: str(r.brand_name),
  });
}

function rowToOrder(r: Row, items: OrderItem[]): Order {
  return {
    id: String(r.id),
    order_number: String(r.order_number),
    access_token: String(r.access_token ?? ''),
    customer_name: String(r.customer_name),
    phone: String(r.phone),
    whatsapp: str(r.whatsapp),
    email: str(r.email),
    address_line: str(r.address_line),
    street: str(r.street),
    area: str(r.area),
    city: str(r.city),
    district: str(r.district),
    notes: str(r.notes),
    delivery_method: String(r.delivery_method) as Order['delivery_method'],
    payment_method: String(r.payment_method) as Order['payment_method'],
    subtotal: num(r.subtotal),
    delivery_fee: num(r.delivery_fee),
    discount: num(r.discount),
    total: num(r.total),
    status: String(r.status) as OrderStatus,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
    items,
  };
}

function rowToOrderItem(r: Row): OrderItem {
  return {
    id: String(r.id),
    order_id: String(r.order_id),
    product_id: str(r.product_id),
    product_name: String(r.product_name),
    unit: String(r.unit ?? ''),
    quantity: num(r.quantity),
    unit_price: num(r.unit_price),
    total: num(r.total),
  };
}

// ------------------------------------------------------------- utilities

const now = () => new Date().toISOString();
const newId = () => crypto.randomUUID();

/**
 * Joins shared by the list and count queries, so both filter identically.
 * Aliases: c = category, s = subcategory, b = brand.
 */
const PRODUCT_FROM = `
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN categories s ON s.id = p.subcategory_id
  LEFT JOIN brands     b ON b.id = p.brand_id`;

const PRODUCT_SELECT = `
  SELECT p.*,
         c.name AS category_name,
         c.slug AS category_slug,
         s.name AS subcategory_name,
         s.slug AS subcategory_slug,
         b.name AS brand_name
  ${PRODUCT_FROM}`;

/**
 * One search term matches the product's own text (the generated `search_text`
 * column) or the name of its brand, category or subcategory — so "araliya" and
 * "rice & grains" find products just as "nadu rice" does.
 */
const SEARCH_CLAUSE = `(
  p.search_text LIKE ?
  OR LOWER(COALESCE(b.name, '')) LIKE ?
  OR LOWER(COALESCE(c.name, '')) LIKE ?
  OR LOWER(COALESCE(s.name, '')) LIKE ?
)`;

async function uniqueSlug(db: Client, table: string, base: string, selfId?: string): Promise<string> {
  let slug = base;
  let n = 2;
  for (;;) {
    const res = await db.execute({
      sql: `SELECT id FROM ${table} WHERE slug = ? LIMIT 1`,
      args: [slug],
    });
    const found = res.rows[0];
    if (!found || (selfId && String(found.id) === selfId)) return slug;
    slug = `${base}-${n++}`;
  }
}

/** scrypt hashing for admin passwords; plain text is never stored. */
function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derived) => {
      if (error) reject(error);
      else resolve(derived.toString('hex'));
    });
  });
}

export const sqliteStore: DataStore = {
  kind: 'sqlite',

  // ----------------------------------------------------------- categories
  async listCategories(opts) {
    const db = await connect();
    const res = await db.execute(
      opts?.includeInactive
        ? 'SELECT * FROM categories ORDER BY sort_order, name'
        : 'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, name',
    );
    return res.rows.map(rowToCategory);
  },

  async getCategory(idOrSlug) {
    const db = await connect();
    const res = await db.execute({
      sql: 'SELECT * FROM categories WHERE id = ? OR slug = ? LIMIT 1',
      args: [idOrSlug, idOrSlug],
    });
    return res.rows[0] ? rowToCategory(res.rows[0]) : null;
  },

  async createCategory(input) {
    const db = await connect();
    const name = (input.name ?? '').trim();
    if (!name) throw new Error('Category name is required');

    const id = newId();
    const ts = now();
    const slug = await uniqueSlug(db, 'categories', slugify(input.slug || name));

    await db.execute({
      sql: `INSERT INTO categories (id, slug, name, name_si, name_ta, image_url, icon, parent_id, is_active, sort_order, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        id, slug, name, input.name_si ?? null, input.name_ta ?? null,
        input.image_url ?? null, input.icon ?? null, input.parent_id ?? null,
        input.is_active === false ? 0 : 1, input.sort_order ?? 100, ts, ts,
      ],
    });

    return (await sqliteStore.getCategory(id))!;
  },

  async updateCategory(id, patch) {
    const db = await connect();

    const existing = await sqliteStore.getCategory(id);
    if (!existing) throw new Error('Category not found');

    if (patch.parent_id !== undefined) {
      const all = await sqliteStore.listCategories({ includeInactive: true });
      assertNoCategoryCycle(all, id, patch.parent_id);
    }

    const slug = patch.slug ? await uniqueSlug(db, 'categories', slugify(patch.slug), id) : existing.slug;

    await db.execute({
      sql: `UPDATE categories SET slug=?, name=?, name_si=?, name_ta=?, image_url=?, icon=?,
                                  parent_id=?, is_active=?, sort_order=?, updated_at=?
            WHERE id=?`,
      args: [
        slug,
        patch.name !== undefined ? patch.name : existing.name,
        patch.name_si !== undefined ? patch.name_si : existing.name_si,
        patch.name_ta !== undefined ? patch.name_ta : existing.name_ta,
        patch.image_url !== undefined ? patch.image_url : existing.image_url,
        patch.icon !== undefined ? patch.icon : existing.icon,
        patch.parent_id !== undefined ? patch.parent_id : existing.parent_id,
        (patch.is_active !== undefined ? patch.is_active : existing.is_active) ? 1 : 0,
        patch.sort_order !== undefined ? patch.sort_order : existing.sort_order,
        now(),
        id,
      ],
    });

    return (await sqliteStore.getCategory(id))!;
  },

  async deleteCategory(id) {
    const db = await connect();

    const children = await db.execute({ sql: 'SELECT id FROM categories WHERE parent_id = ? LIMIT 1', args: [id] });
    if (children.rows.length) throw new Error('Remove or move the subcategories first');

    const used = await db.execute({
      sql: 'SELECT id FROM products WHERE category_id = ? OR subcategory_id = ? LIMIT 1',
      args: [id, id],
    });
    if (used.rows.length) throw new Error('This category still has products assigned to it');

    await db.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [id] });
  },

  async listBrands() {
    const db = await connect();
    const res = await db.execute('SELECT * FROM brands ORDER BY name');
    return res.rows.map((r) => ({
      id: String(r.id),
      slug: String(r.slug),
      name: String(r.name),
      is_active: bool(r.is_active),
    })) as Brand[];
  },

  // ------------------------------------------------------------- products
  async queryProducts(query) {
    const db = await connect();
    const page = Math.max(1, query.page ?? 1);
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

    const where: string[] = [];
    const args: InValue[] = [];

    if (!query.includeInactive) where.push('p.is_active = 1');

    // A parent category also matches everything filed under it.
    const catSlugs = [query.category, ...(query.categories ?? [])].filter(Boolean) as string[];
    if (catSlugs.length) {
      const placeholders = catSlugs.map(() => '?').join(',');
      const cats = await db.execute({
        sql: `SELECT id FROM categories WHERE slug IN (${placeholders})
              UNION
              SELECT c.id FROM categories c
              JOIN categories parent ON c.parent_id = parent.id
              WHERE parent.slug IN (${placeholders})`,
        args: [...catSlugs, ...catSlugs],
      });
      const ids = cats.rows.map((r) => String(r.id));
      if (!ids.length) return { items: [], total: 0, page, pageSize, totalPages: 1 };
      const ph = ids.map(() => '?').join(',');
      where.push(`(p.category_id IN (${ph}) OR p.subcategory_id IN (${ph}))`);
      args.push(...ids, ...ids);
    }

    if (query.brands?.length) {
      const ph = query.brands.map(() => '?').join(',');
      where.push(`b.name IN (${ph})`);
      args.push(...query.brands);
    }

    if (query.inStockOnly) where.push('p.stock > 0');
    if (query.newOnly) where.push('p.is_new = 1');
    if (query.featuredOnly) where.push('p.is_featured = 1');
    if (query.bestSellerOnly) where.push('p.is_best_seller = 1');
    if (query.onSaleOnly) where.push('p.discount_percent > 0');
    if (query.minPrice != null) { where.push('p.effective_price >= ?'); args.push(query.minPrice); }
    if (query.maxPrice != null) { where.push('p.effective_price <= ?'); args.push(query.maxPrice); }

    // Every whitespace-separated term must match somewhere.
    const terms = searchTerms(query.search);
    if (terms === null) {
      // The customer typed only wildcards or punctuation. Matching everything
      // would be the opposite of what they asked for.
      return { items: [], total: 0, page, pageSize, totalPages: 1 };
    }
    for (const term of terms) {
      const like = `%${term}%`;
      where.push(SEARCH_CLAUSE);
      args.push(like, like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const orderSql = {
      price_asc: 'ORDER BY p.effective_price ASC',
      price_desc: 'ORDER BY p.effective_price DESC',
      newest: 'ORDER BY p.created_at DESC',
      discount: 'ORDER BY p.discount_percent DESC, p.popularity DESC',
      name: 'ORDER BY p.name ASC',
      popular: 'ORDER BY (p.stock > 0) DESC, p.popularity DESC',
    }[query.sort ?? 'popular'];

    const countRes = await db.execute({
      sql: `SELECT COUNT(*) AS n ${PRODUCT_FROM} ${whereSql}`,
      args,
    });
    const total = Number(countRes.rows[0]?.n ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);

    const res = await db.execute({
      sql: `${PRODUCT_SELECT} ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
      args: [...args, pageSize, (safePage - 1) * pageSize],
    });

    return {
      items: res.rows.map(rowToProductView),
      total,
      page: safePage,
      pageSize,
      totalPages,
    } as Paginated<ProductView>;
  },

  async getProduct(idOrSlug) {
    const db = await connect();
    const res = await db.execute({
      sql: `${PRODUCT_SELECT} WHERE p.id = ? OR p.slug = ? LIMIT 1`,
      args: [idOrSlug, idOrSlug],
    });
    return res.rows[0] ? rowToProductView(res.rows[0]) : null;
  },

  async getProductsByIds(ids) {
    if (!ids.length) return [];
    const db = await connect();
    const ph = ids.map(() => '?').join(',');
    const res = await db.execute({ sql: `${PRODUCT_SELECT} WHERE p.id IN (${ph})`, args: ids });
    return res.rows.map(rowToProductView);
  },

  async createProduct(input) {
    const db = await connect();
    const name = (input.name ?? '').trim();
    if (!name) throw new Error('Product name is required');
    if (!input.category_id) throw new Error('Please choose a category');

    const brand = input.brand_id
      ? await db.execute({ sql: 'SELECT name FROM brands WHERE id = ?', args: [input.brand_id] })
      : null;
    const brandName = brand?.rows[0] ? String(brand.rows[0].name) : undefined;

    const { buildSlugBase } = await import('./local');
    const base = slugify(input.slug || buildSlugBase(brandName, name, input.unit));
    const slug = await uniqueSlug(db, 'products', base);

    const id = newId();
    const ts = now();
    const clean = sanitizeProductWrite(input as Record<string, unknown>);

    const product: Product = {
      id,
      slug,
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
      created_at: ts,
      updated_at: ts,
    };

    await db.execute({ sql: INSERT_PRODUCT, args: productArgs(product) });
    return product;
  },

  async updateProduct(id, patch) {
    const db = await connect();
    const existing = await sqliteStore.getProduct(id);
    if (!existing) throw new Error('Product not found');

    patch = sanitizeProductWrite(patch as Record<string, unknown>, existing) as typeof patch;

    const slug = patch.slug ? await uniqueSlug(db, 'products', slugify(patch.slug), id) : existing.slug;
    const pick = <K extends keyof Product>(key: K): Product[K] =>
      patch[key] !== undefined ? (patch[key] as Product[K]) : (existing[key] as Product[K]);

    await db.execute({
      sql: `UPDATE products SET
              slug=?, sku=?, name=?, name_si=?, name_ta=?, description=?,
              category_id=?, subcategory_id=?, brand_id=?, price=?, sale_price=?,
              stock=?, low_stock_threshold=?, unit=?, weight=?, image_url=?, gallery=?,
              is_featured=?, is_new=?, is_best_seller=?, is_active=?, popularity=?, updated_at=?
            WHERE id=?`,
      args: [
        slug,
        pick('sku'),
        pick('name'),
        pick('name_si'),
        pick('name_ta'),
        pick('description'),
        pick('category_id'),
        pick('subcategory_id'),
        pick('brand_id'),
        Number(pick('price')),
        patch.sale_price !== undefined
          ? (patch.sale_price === null ? null : Number(patch.sale_price))
          : existing.sale_price,
        Number(pick('stock')),
        Number(pick('low_stock_threshold')),
        pick('unit'),
        pick('weight'),
        pick('image_url'),
        JSON.stringify(patch.gallery !== undefined ? patch.gallery : existing.gallery),
        pick('is_featured') ? 1 : 0,
        pick('is_new') ? 1 : 0,
        pick('is_best_seller') ? 1 : 0,
        pick('is_active') ? 1 : 0,
        Number(pick('popularity')),
        now(),
        id,
      ],
    });

    return (await sqliteStore.getProduct(id))!;
  },

  async deleteProduct(id) {
    const db = await connect();
    await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [id] });
  },

  async getFacets() {
    const db = await connect();

    const brands = await db.execute(`
      SELECT DISTINCT b.id, b.slug, b.name, b.is_active
      FROM brands b
      JOIN products p ON p.brand_id = b.id AND p.is_active = 1
      ORDER BY b.name`);

    const range = await db.execute(
      'SELECT MIN(effective_price) AS lo, MAX(effective_price) AS hi FROM products WHERE is_active = 1',
    );

    return {
      brands: brands.rows.map((r) => ({
        id: String(r.id),
        slug: String(r.slug),
        name: String(r.name),
        is_active: bool(r.is_active),
      })) as Brand[],
      minPrice: Math.floor(Number(range.rows[0]?.lo ?? 0)),
      maxPrice: Math.ceil(Number(range.rows[0]?.hi ?? 0)),
    };
  },

  // --------------------------------------------------------------- orders
  async createOrder(input) {
    const db = await connect();
    const settings = await sqliteStore.getSettings();

    const ids = input.items.map((i) => i.product_id);
    const products = await sqliteStore.getProductsByIds(ids);
    const byId = new Map(products.map((p) => [p.id, p]));

    const orderId = newId();
    const lines: OrderItem[] = [];

    for (const line of input.items) {
      const product = byId.get(line.product_id);
      if (!product || !product.is_active) throw new Error('One of the products is no longer available');

      const qty = Math.max(1, Math.floor(line.quantity));
      if (product.stock <= 0) throw new Error(`${product.name} is out of stock`);
      if (qty > product.stock) throw new Error(`Only ${product.stock} of ${product.name} left in stock`);

      lines.push({
        id: newId(),
        order_id: orderId,
        product_id: product.id,
        product_name: product.name,
        unit: product.unit,
        quantity: qty,
        unit_price: product.effective_price,
        total: product.effective_price * qty,
      });
    }
    if (!lines.length) throw new Error('Your cart is empty');

    const subtotalOnly = lines.reduce((s, l) => s + l.total, 0);
    const deliveryFee =
      input.delivery_method === 'pickup' || !settings.delivery_enabled
        ? 0
        : resolveDeliveryFee(settings, input.area ?? input.city ?? '', subtotalOnly);
    const { subtotal, discount, total } = orderTotals(lines, { deliveryFee });

    const ts = now();
    const accessToken = crypto.randomBytes(18).toString('base64url');
    const tx = await db.transaction('write');
    let orderNumber = '';

    try {
      // Bump the sequence inside the transaction so two simultaneous checkouts
      // cannot be handed the same order number.
      const seqRow = await tx.execute("SELECT value FROM meta WHERE key = 'order_sequence'");
      const sequence = Number(seqRow.rows[0]?.value ?? 0) + 1;
      await tx.execute({
        sql: `INSERT INTO meta (key, value) VALUES ('order_sequence', ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        args: [String(sequence)],
      });
      orderNumber = formatOrderNumber(settings.order_prefix, sequence);

      await tx.execute({
        sql: `INSERT INTO orders (id, order_number, customer_name, phone, whatsapp, email,
                                  address_line, street, area, city, district, notes,
                                  delivery_method, payment_method, subtotal, delivery_fee,
                                  discount, total, status, access_token, created_at, updated_at)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          orderId, orderNumber, input.customer_name.trim(), input.phone.trim(),
          input.whatsapp?.trim() || input.phone.trim(), input.email?.trim() || null,
          input.address_line?.trim() || null, input.street?.trim() || null,
          input.area?.trim() || null, input.city?.trim() || null,
          input.district?.trim() || null, input.notes?.trim() || null,
          input.delivery_method, input.payment_method,
          subtotal, deliveryFee, discount, total, 'new', accessToken, ts, ts,
        ],
      });

      for (const line of lines) {
        await tx.execute({
          sql: `INSERT INTO order_items (id, order_id, product_id, product_name, unit, quantity, unit_price, total)
                VALUES (?,?,?,?,?,?,?,?)`,
          args: [line.id, orderId, line.product_id, line.product_name, line.unit, line.quantity, line.unit_price, line.total],
        });

        // Guarded update: if someone else bought the last unit between our read
        // and this write, no row matches and the whole order rolls back.
        const reserved = await tx.execute({
          sql: `UPDATE products
                SET stock = stock - ?, popularity = popularity + ?, updated_at = ?
                WHERE id = ? AND stock >= ?`,
          args: [line.quantity, line.quantity, ts, line.product_id, line.quantity],
        });
        if (reserved.rowsAffected === 0) {
          throw new Error(`${line.product_name} just went out of stock. Please adjust your cart.`);
        }
      }

      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }

    return (await sqliteStore.getOrder(orderId))!;
  },

  async listOrders(opts) {
    const db = await connect();
    const page = Math.max(1, opts?.page ?? 1);
    const pageSize = opts?.pageSize ?? 20;

    const where: string[] = [];
    const args: InValue[] = [];

    if (opts?.status) { where.push('status = ?'); args.push(opts.status); }
    if (opts?.search) {
      const term = `%${opts.search.toLowerCase().replace(/[%_]/g, '')}%`;
      where.push('(LOWER(order_number) LIKE ? OR LOWER(customer_name) LIKE ? OR phone LIKE ? OR LOWER(COALESCE(city,\'\')) LIKE ?)');
      args.push(term, term, term, term);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countRes = await db.execute({ sql: `SELECT COUNT(*) AS n FROM orders ${whereSql}`, args });
    const total = Number(countRes.rows[0]?.n ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);

    const res = await db.execute({
      sql: `SELECT * FROM orders ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      args: [...args, pageSize, (safePage - 1) * pageSize],
    });

    // One query for all the items on this page rather than one per order.
    const orderIds = res.rows.map((r) => String(r.id));
    const itemsByOrder = new Map<string, OrderItem[]>();
    if (orderIds.length) {
      const ph = orderIds.map(() => '?').join(',');
      const itemRes = await db.execute({
        sql: `SELECT * FROM order_items WHERE order_id IN (${ph})`,
        args: orderIds,
      });
      for (const row of itemRes.rows) {
        const item = rowToOrderItem(row);
        const list = itemsByOrder.get(item.order_id) ?? [];
        list.push(item);
        itemsByOrder.set(item.order_id, list);
      }
    }

    return {
      items: res.rows.map((r) => rowToOrder(r, itemsByOrder.get(String(r.id)) ?? [])),
      total,
      page: safePage,
      pageSize,
      totalPages,
    } as Paginated<Order>;
  },

  async getOrder(idOrNumber) {
    const db = await connect();
    const res = await db.execute({
      sql: 'SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1',
      args: [idOrNumber, idOrNumber],
    });
    if (!res.rows[0]) return null;

    const items = await db.execute({
      sql: 'SELECT * FROM order_items WHERE order_id = ?',
      args: [String(res.rows[0].id)],
    });
    return rowToOrder(res.rows[0], items.rows.map(rowToOrderItem));
  },

  async updateOrderStatus(id, status) {
    const db = await connect();
    const order = await sqliteStore.getOrder(id);
    if (!order) throw new Error('Order not found');

    const ts = now();
    const tx = await db.transaction('write');
    try {
      // Cancelling returns the stock to the shelf.
      if (status === 'cancelled' && order.status !== 'cancelled') {
        for (const item of order.items) {
          if (!item.product_id) continue;
          await tx.execute({
            sql: 'UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?',
            args: [item.quantity, ts, item.product_id],
          });
        }
      }
      await tx.execute({
        sql: 'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?',
        args: [status, ts, id],
      });
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }

    return (await sqliteStore.getOrder(id))!;
  },

  async deleteOrder(id) {
    const db = await connect();
    await db.execute({ sql: 'DELETE FROM orders WHERE id = ?', args: [id] });
  },

  // ---------------------------------------------------------- admin users
  async listAdmins() {
    const db = await connect();
    const res = await db.execute('SELECT id, email, name, role, created_at FROM admins ORDER BY name');
    return res.rows.map((r) => ({
      id: String(r.id),
      email: String(r.email),
      name: String(r.name),
      role: String(r.role) as AdminUser['role'],
      created_at: String(r.created_at),
    }));
  },

  async createAdmin({ email, name, role, password }) {
    const db = await connect();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) throw new Error('An email address is required');
    if (name.trim().length < 2) throw new Error('A name is required');
    if (password.length < 8) throw new Error('The password must be at least 8 characters');

    const exists = await db.execute({ sql: 'SELECT id FROM admins WHERE email = ?', args: [cleanEmail] });
    if (exists.rows.length) throw new Error('An admin with that email already exists');
    if (cleanEmail === (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase()) {
      throw new Error('That email is already used by the account in your environment file');
    }

    const id = newId();
    const salt = crypto.randomBytes(16).toString('hex');
    const created = now();

    await db.execute({
      sql: `INSERT INTO admins (id, email, name, role, password_hash, salt, created_at)
            VALUES (?,?,?,?,?,?,?)`,
      args: [id, cleanEmail, name.trim(), role, await hashPassword(password, salt), salt, created],
    });

    return { id, email: cleanEmail, name: name.trim(), role, created_at: created };
  },

  async updateAdmin(id, patch) {
    const db = await connect();
    const res = await db.execute({ sql: 'SELECT * FROM admins WHERE id = ?', args: [id] });
    const row = res.rows[0];
    if (!row) throw new Error('Admin not found');

    let name = String(row.name);
    let role = String(row.role) as AdminUser['role'];
    let hash = String(row.password_hash);
    let salt = String(row.salt);

    if (patch.name !== undefined) {
      if (patch.name.trim().length < 2) throw new Error('A name is required');
      name = patch.name.trim();
    }
    if (patch.role !== undefined) role = patch.role;
    if (patch.password) {
      if (patch.password.length < 8) throw new Error('The password must be at least 8 characters');
      salt = crypto.randomBytes(16).toString('hex');
      hash = await hashPassword(patch.password, salt);
    }

    await db.execute({
      sql: 'UPDATE admins SET name = ?, role = ?, password_hash = ?, salt = ? WHERE id = ?',
      args: [name, role, hash, salt, id],
    });

    return { id, email: String(row.email), name, role, created_at: String(row.created_at) };
  },

  async deleteAdmin(id) {
    const db = await connect();
    await db.execute({ sql: 'DELETE FROM admins WHERE id = ?', args: [id] });
  },

  async verifyAdminPassword(email, password) {
    const db = await connect();
    const res = await db.execute({
      sql: 'SELECT * FROM admins WHERE email = ? LIMIT 1',
      args: [email.trim().toLowerCase()],
    });
    const row = res.rows[0];
    if (!row) return null;

    const candidate = await hashPassword(password, String(row.salt));
    const a = Buffer.from(candidate, 'hex');
    const b = Buffer.from(String(row.password_hash), 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    return {
      id: String(row.id),
      email: String(row.email),
      name: String(row.name),
      role: String(row.role) as AdminUser['role'],
      created_at: String(row.created_at),
    };
  },

  // ------------------------------------------------------------- settings
  async getSettings() {
    const db = await connect();
    const res = await db.execute('SELECT data FROM settings WHERE id = 1');
    const { defaultSettings } = await import('@/data/build-catalog.mjs');

    if (!res.rows[0]) return defaultSettings as Settings;
    try {
      return { ...(defaultSettings as Settings), ...JSON.parse(String(res.rows[0].data)) };
    } catch {
      return defaultSettings as Settings;
    }
  },

  async updateSettings(patch) {
    const db = await connect();
    const merged = { ...(await sqliteStore.getSettings()), ...patch };
    await db.execute({
      sql: `INSERT INTO settings (id, data, updated_at) VALUES (1, ?, ?)
            ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
      args: [JSON.stringify(merged), now()],
    });
    return merged;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const db = await connect();

    // Only the last 30 days of orders are needed for the dashboard.
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const orders = await sqliteStore.listOrders({ page: 1, pageSize: 100000 });
    const recent = orders.items.filter((o) => Date.parse(o.created_at) >= since.getTime());

    const productRows = await db.execute('SELECT * FROM products');
    const categoryRows = await db.execute('SELECT * FROM categories');

    return computeStats(recent, productRows.rows.map(rowToProduct), categoryRows.rows.map(rowToCategory));
  },
};
