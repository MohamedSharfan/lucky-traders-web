import 'server-only';

import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import type {
  AdminRole,
  AdminUser,
  Brand,
  Category,
  CreateOrderInput,
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
import {
  DEFAULT_PAGE_SIZE,
  assertNoCategoryCycle,
  filterProducts,
  formatOrderNumber,
  orderTotals,
  paginate,
  sanitizeProductWrite,
  searchTerms,
  slugify,
  sortProducts,
  toProductView,
} from './shared';

/**
 * File-backed datastore.
 *
 * Its purpose is to make the app runnable (and demonstrable) the moment it is
 * cloned - `npm run dev` with no Supabase project. It implements exactly the
 * same contract as the Supabase adapter, so switching is an env-var change.
 */

/** A stored admin. The password is kept only as a scrypt hash. */
interface StoredAdmin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  password_hash: string;
  salt: string;
  created_at: string;
}

interface Shape {
  categories: Category[];
  brands: Brand[];
  products: Product[];
  orders: Order[];
  admins?: StoredAdmin[];
  settings: Settings;
  order_sequence: number;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

let cache: Shape | null = null;
let loading: Promise<Shape> | null = null;
/** Serialises writes so concurrent requests cannot clobber the file. */
let writeChain: Promise<unknown> = Promise.resolve();

async function seedShape(): Promise<Shape> {
  const { buildCatalog, defaultSettings } = await import('@/data/build-catalog.mjs');
  const { categories, brands, products } = buildCatalog();
  return {
    categories,
    brands,
    products,
    orders: [],
    admins: [],
    settings: defaultSettings as Settings,
    order_sequence: 0,
  };
}

/**
 * Password hashing for locally stored admins.
 *
 * scrypt with a per-user random salt and a constant-time comparison. Plain
 * passwords are never written to disk, logged, or returned by any API.
 */
const SCRYPT_KEYLEN = 64;

function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, (error, derived) => {
      if (error) reject(error);
      else resolve(derived.toString('hex'));
    });
  });
}

async function passwordMatches(password: string, admin: StoredAdmin): Promise<boolean> {
  const candidate = await hashPassword(password, admin.salt);
  const a = Buffer.from(candidate, 'hex');
  const b = Buffer.from(admin.password_hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function toAdminUser(admin: StoredAdmin): AdminUser {
  // The hash and salt deliberately never leave this module.
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    created_at: admin.created_at,
  };
}

async function load(): Promise<Shape> {
  if (cache) return cache;
  if (loading) return loading;

  loading = (async () => {
    try {
      const raw = await fs.readFile(DATA_FILE, 'utf8');
      cache = JSON.parse(raw) as Shape;
    } catch {
      cache = await seedShape();
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(DATA_FILE, JSON.stringify(cache, null, 2), 'utf8');
    }
    loading = null;
    return cache!;
  })();

  return loading;
}

async function persist(): Promise<void> {
  const snapshot = cache;
  if (!snapshot) return;
  writeChain = writeChain.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DATA_FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(snapshot, null, 2), 'utf8');
    await fs.rename(tmp, DATA_FILE);
  });
  await writeChain;
}

const now = () => new Date().toISOString();
const newId = () => crypto.randomUUID();

function lookups(db: Shape) {
  return {
    categories: new Map(db.categories.map((c) => [c.id, c])),
    brands: new Map(db.brands.map((b) => [b.id, b])),
  };
}

function views(db: Shape): ProductView[] {
  const l = lookups(db);
  return db.products.map((p) => toProductView(p, l));
}

function ensureUniqueSlug(existing: { slug: string; id: string }[], base: string, selfId?: string): string {
  let slug = base;
  let n = 2;
  while (existing.some((e) => e.slug === slug && e.id !== selfId)) slug = `${base}-${n++}`;
  return slug;
}

export const localStore: DataStore = {
  kind: 'local',

  // ------------------------------------------------------------- categories
  async listCategories(opts) {
    const db = await load();
    const list = opts?.includeInactive ? db.categories : db.categories.filter((c) => c.is_active);
    return [...list].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  },

  async getCategory(idOrSlug) {
    const db = await load();
    return db.categories.find((c) => c.id === idOrSlug || c.slug === idOrSlug) ?? null;
  },

  async createCategory(input) {
    const db = await load();
    const name = (input.name ?? '').trim();
    if (!name) throw new Error('Category name is required');
    const category: Category = {
      id: newId(),
      slug: ensureUniqueSlug(db.categories, slugify(input.slug || name)),
      name,
      name_si: input.name_si ?? null,
      name_ta: input.name_ta ?? null,
      image_url: input.image_url ?? null,
      icon: input.icon ?? null,
      parent_id: input.parent_id ?? null,
      is_active: input.is_active ?? true,
      sort_order: input.sort_order ?? (db.categories.length + 1) * 10,
      created_at: now(),
      updated_at: now(),
    };
    db.categories.push(category);
    await persist();
    return category;
  },

  async updateCategory(id, patch) {
    const db = await load();
    const cat = db.categories.find((c) => c.id === id);
    if (!cat) throw new Error('Category not found');
    if (patch.parent_id !== undefined) assertNoCategoryCycle(db.categories, id, patch.parent_id);
    Object.assign(cat, {
      ...patch,
      id: cat.id,
      slug: patch.slug ? ensureUniqueSlug(db.categories, slugify(patch.slug), id) : cat.slug,
      created_at: cat.created_at,
      updated_at: now(),
    });
    await persist();
    return cat;
  },

  async deleteCategory(id) {
    const db = await load();
    const hasChildren = db.categories.some((c) => c.parent_id === id);
    if (hasChildren) throw new Error('Remove or move the subcategories first');
    const inUse = db.products.some((p) => p.category_id === id || p.subcategory_id === id);
    if (inUse) throw new Error('This category still has products assigned to it');
    db.categories = db.categories.filter((c) => c.id !== id);
    await persist();
  },

  async listBrands() {
    const db = await load();
    return [...db.brands].sort((a, b) => a.name.localeCompare(b.name));
  },

  // --------------------------------------------------------------- products
  async queryProducts(query) {
    const db = await load();

    // A query of only wildcards or punctuation must match nothing, not all.
    if (searchTerms(query.search) === null) {
      return { items: [], total: 0, page: query.page ?? 1, pageSize: query.pageSize ?? DEFAULT_PAGE_SIZE, totalPages: 1 };
    }

    const filtered = filterProducts(views(db), query, db.categories);
    const sorted = sortProducts(filtered, query.sort);
    return paginate(sorted, query.page ?? 1, query.pageSize ?? DEFAULT_PAGE_SIZE) as Paginated<ProductView>;
  },

  async getProduct(idOrSlug) {
    const db = await load();
    const p = db.products.find((x) => x.id === idOrSlug || x.slug === idOrSlug);
    return p ? toProductView(p, lookups(db)) : null;
  },

  async getProductsByIds(ids) {
    const db = await load();
    const set = new Set(ids);
    const l = lookups(db);
    return db.products.filter((p) => set.has(p.id)).map((p) => toProductView(p, l));
  },

  async createProduct(input) {
    const db = await load();
    const name = (input.name ?? '').trim();
    if (!name) throw new Error('Product name is required');
    if (!input.category_id) throw new Error('Please choose a category');

    const clean = sanitizeProductWrite(input as Record<string, unknown>);
    const brandName = db.brands.find((b) => b.id === input.brand_id)?.name;
    const base = slugify(buildSlugBase(brandName, name, input.unit));
    const product: Product = {
      id: newId(),
      slug: ensureUniqueSlug(db.products, slugify(input.slug || base)),
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
      created_at: now(),
      updated_at: now(),
    };
    db.products.unshift(product);
    await persist();
    return product;
  },

  async updateProduct(id, patch) {
    const db = await load();
    const p = db.products.find((x) => x.id === id);
    if (!p) throw new Error('Product not found');

    patch = sanitizeProductWrite(patch as Record<string, unknown>, p) as typeof patch;

    Object.assign(p, {
      ...patch,
      id: p.id,
      slug: patch.slug ? ensureUniqueSlug(db.products, slugify(patch.slug), id) : p.slug,
      price: patch.price != null ? Number(patch.price) : p.price,
      sale_price: patch.sale_price !== undefined
        ? (patch.sale_price === null ? null : Number(patch.sale_price))
        : p.sale_price,
      stock: patch.stock != null ? Number(patch.stock) : p.stock,
      created_at: p.created_at,
      updated_at: now(),
    });
    await persist();
    return p;
  },

  async deleteProduct(id) {
    const db = await load();
    db.products = db.products.filter((p) => p.id !== id);
    await persist();
  },

  async getFacets() {
    const db = await load();
    const active = views(db).filter((p) => p.is_active);
    const prices = active.map((p) => p.effective_price);
    const usedBrandIds = new Set(active.map((p) => p.brand_id).filter(Boolean) as string[]);
    return {
      brands: db.brands.filter((b) => usedBrandIds.has(b.id)).sort((a, b) => a.name.localeCompare(b.name)),
      minPrice: prices.length ? Math.floor(Math.min(...prices)) : 0,
      maxPrice: prices.length ? Math.ceil(Math.max(...prices)) : 0,
    };
  },

  // ----------------------------------------------------------------- orders
  async createOrder(input) {
    const db = await load();
    const settings = db.settings;

    const productById = new Map(db.products.map((p) => [p.id, p]));
    const items: OrderItem[] = [];
    const orderId = newId();

    for (const line of input.items) {
      const product = productById.get(line.product_id);
      if (!product) throw new Error('One of the products is no longer available');
      if (!product.is_active) throw new Error(`${product.name} is no longer available`);
      const qty = Math.max(1, Math.floor(line.quantity));
      if (product.stock <= 0) throw new Error(`${product.name} is out of stock`);
      if (qty > product.stock) throw new Error(`Only ${product.stock} of ${product.name} left in stock`);

      const unitPrice =
        product.sale_price != null && product.sale_price > 0 && product.sale_price < product.price
          ? product.sale_price
          : product.price;

      items.push({
        id: newId(),
        order_id: orderId,
        product_id: product.id,
        product_name: product.name,
        unit: product.unit,
        quantity: qty,
        unit_price: unitPrice,
        total: unitPrice * qty,
      });
    }

    if (!items.length) throw new Error('Your cart is empty');

    const subtotalOnly = items.reduce((s, i) => s + i.total, 0);
    const deliveryFee =
      input.delivery_method === 'pickup' || !settings.delivery_enabled
        ? 0
        : resolveDeliveryFee(settings, input.area ?? input.city ?? '', subtotalOnly);
    const { subtotal, discount, total } = orderTotals(items, { deliveryFee });

    db.order_sequence += 1;
    const order: Order = {
      id: orderId,
      order_number: formatOrderNumber(settings.order_prefix, db.order_sequence),
      access_token: crypto.randomBytes(18).toString('base64url'),
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
      created_at: now(),
      updated_at: now(),
      items,
    };

    // Reserve stock immediately so two customers cannot buy the last bag of rice.
    for (const item of items) {
      const product = productById.get(item.product_id!);
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
        product.popularity += item.quantity;
        product.updated_at = now();
      }
    }

    db.orders.unshift(order);
    await persist();
    return order;
  },

  async listOrders(opts) {
    const db = await load();
    let list = [...db.orders];
    if (opts?.status) list = list.filter((o) => o.status === opts.status);
    if (opts?.search) {
      const term = opts.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.order_number.toLowerCase().includes(term) ||
          o.customer_name.toLowerCase().includes(term) ||
          o.phone.includes(term) ||
          (o.city ?? '').toLowerCase().includes(term),
      );
    }
    list.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    return paginate(list, opts?.page ?? 1, opts?.pageSize ?? 20) as Paginated<Order>;
  },

  async getOrder(idOrNumber) {
    const db = await load();
    return db.orders.find((o) => o.id === idOrNumber || o.order_number === idOrNumber) ?? null;
  },

  async updateOrderStatus(id, status) {
    const db = await load();
    const order = db.orders.find((o) => o.id === id);
    if (!order) throw new Error('Order not found');

    // Cancelling an order returns its stock to the shelf.
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        const product = db.products.find((p) => p.id === item.product_id);
        if (product) product.stock += item.quantity;
      }
    }
    order.status = status;
    order.updated_at = now();
    await persist();
    return order;
  },

  async deleteOrder(id) {
    const db = await load();
    db.orders = db.orders.filter((o) => o.id !== id);
    await persist();
  },

  // ----------------------------------------------------------- admin users
  async listAdmins() {
    const db = await load();
    return (db.admins ?? []).map(toAdminUser).sort((a, b) => a.name.localeCompare(b.name));
  },

  async createAdmin({ email, name, role, password }) {
    const db = await load();
    db.admins ??= [];

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) throw new Error('An email address is required');
    if (name.trim().length < 2) throw new Error('A name is required');
    if (password.length < 8) throw new Error('The password must be at least 8 characters');
    if (db.admins.some((a) => a.email === cleanEmail)) {
      throw new Error('An admin with that email already exists');
    }
    if (cleanEmail === (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase()) {
      throw new Error('That email is already used by the account in your environment file');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const admin: StoredAdmin = {
      id: newId(),
      email: cleanEmail,
      name: name.trim(),
      role,
      salt,
      password_hash: await hashPassword(password, salt),
      created_at: now(),
    };

    db.admins.push(admin);
    await persist();
    return toAdminUser(admin);
  },

  async updateAdmin(id, patch) {
    const db = await load();
    const admin = (db.admins ?? []).find((a) => a.id === id);
    if (!admin) throw new Error('Admin not found');

    if (patch.name !== undefined) {
      if (patch.name.trim().length < 2) throw new Error('A name is required');
      admin.name = patch.name.trim();
    }
    if (patch.role !== undefined) admin.role = patch.role;
    if (patch.password) {
      if (patch.password.length < 8) throw new Error('The password must be at least 8 characters');
      admin.salt = crypto.randomBytes(16).toString('hex');
      admin.password_hash = await hashPassword(patch.password, admin.salt);
    }

    await persist();
    return toAdminUser(admin);
  },

  async deleteAdmin(id) {
    const db = await load();
    db.admins = (db.admins ?? []).filter((a) => a.id !== id);
    await persist();
  },

  async verifyAdminPassword(email, password) {
    const db = await load();
    const admin = (db.admins ?? []).find((a) => a.email === email.trim().toLowerCase());
    if (!admin) return null;
    return (await passwordMatches(password, admin)) ? toAdminUser(admin) : null;
  },

  // --------------------------------------------------------------- settings
  async getSettings() {
    const db = await load();
    return db.settings;
  },

  async updateSettings(patch) {
    const db = await load();
    db.settings = { ...db.settings, ...patch };
    await persist();
    return db.settings;
  },

  async getDashboardStats() {
    const db = await load();
    return computeStats(db.orders, db.products, db.categories);
  },
};

/** Area-specific fee, free-delivery threshold, then the default fee. */
export function resolveDeliveryFee(settings: Settings, area: string, subtotal: number): number {
  if (!settings.delivery_enabled) return 0;
  if (settings.free_delivery_threshold > 0 && subtotal >= settings.free_delivery_threshold) return 0;
  const match = settings.delivery_areas?.find(
    (a) => a.is_active && a.name.toLowerCase() === area.trim().toLowerCase(),
  );
  return match ? match.fee : settings.delivery_fee;
}

export function computeStats(orders: Order[], products: Product[], categories: Category[]): DashboardStats {
  const today = new Date().toISOString().slice(0, 10);
  const counted = orders.filter((o) => o.status !== 'cancelled');
  const todays = counted.filter((o) => o.created_at.slice(0, 10) === today);

  const salesByDay: DashboardStats['salesByDay'] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayOrders = counted.filter((o) => o.created_at.slice(0, 10) === key);
    salesByDay.push({
      date: key,
      total: dayOrders.reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    });
  }

  const productTotals = new Map<string, { name: string; quantity: number; revenue: number }>();
  const categoryTotals = new Map<string, number>();
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const productById = new Map(products.map((p) => [p.id, p]));

  for (const order of counted) {
    for (const item of order.items) {
      const entry = productTotals.get(item.product_name) ?? { name: item.product_name, quantity: 0, revenue: 0 };
      entry.quantity += item.quantity;
      entry.revenue += item.total;
      productTotals.set(item.product_name, entry);

      const product = item.product_id ? productById.get(item.product_id) : undefined;
      const cat = product ? categoryById.get(product.category_id) : undefined;
      if (cat) categoryTotals.set(cat.name, (categoryTotals.get(cat.name) ?? 0) + item.total);
    }
  }

  return {
    todaySales: todays.reduce((s, o) => s + o.total, 0),
    todayOrders: todays.length,
    pendingOrders: orders.filter((o) => ['new', 'confirmed', 'preparing', 'ready'].includes(o.status)).length,
    totalProducts: products.filter((p) => p.is_active).length,
    lowStockCount: products.filter((p) => p.stock > 0 && p.stock <= (p.low_stock_threshold || 10)).length,
    outOfStockCount: products.filter((p) => p.stock <= 0).length,
    totalCustomers: new Set(orders.map((o) => o.phone)).size,
    salesByDay,
    topProducts: [...productTotals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    categoryPerformance: [...categoryTotals.entries()]
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6),
  };
}

/**
 * Slug base for a new product: "<brand> <name> <unit>", skipping the unit when
 * the name already ends with it (so "Cinnamon 100g" does not become
 * "cinnamon-100g-100g").
 */
export function buildSlugBase(brand: string | undefined, name: string, unit?: string): string {
  const parts = [brand, name];
  const trimmedUnit = (unit ?? '').trim();
  if (trimmedUnit && !name.trim().toLowerCase().endsWith(trimmedUnit.toLowerCase())) {
    parts.push(trimmedUnit);
  }
  return parts.filter(Boolean).join(' ');
}
