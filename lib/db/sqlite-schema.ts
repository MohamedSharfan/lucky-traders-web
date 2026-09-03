/**
 * SQLite schema for the local datastore.
 *
 * Mirrors `supabase/schema.sql` as closely as SQLite allows, including the
 * generated `effective_price`, `discount_percent` and `search_text` columns —
 * so query behaviour is the same whichever backend is running.
 *
 * Every statement is idempotent, so this runs on every boot and doubles as the
 * migration path for a database created by an earlier version.
 */
/**
 * Statements that may legitimately fail on an existing database (for example
 * adding a column that is already there). Run separately, errors ignored.
 */
export const MIGRATION_STATEMENTS: string[] = [
  `ALTER TABLE orders ADD COLUMN access_token TEXT NOT NULL DEFAULT ''`,
];

export const SCHEMA_STATEMENTS: string[] = [
  `PRAGMA journal_mode = WAL`,
  `PRAGMA foreign_keys = ON`,

  // ----------------------------------------------------------- categories
  `CREATE TABLE IF NOT EXISTS categories (
    id          TEXT PRIMARY KEY,
    slug        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    name_si     TEXT,
    name_ta     TEXT,
    image_url   TEXT,
    icon        TEXT,
    parent_id   TEXT REFERENCES categories(id) ON DELETE RESTRICT,
    is_active   INTEGER NOT NULL DEFAULT 1,
    sort_order  INTEGER NOT NULL DEFAULT 100,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS categories_parent_idx ON categories(parent_id)`,
  `CREATE INDEX IF NOT EXISTS categories_active_idx ON categories(is_active, sort_order)`,

  // --------------------------------------------------------------- brands
  `CREATE TABLE IF NOT EXISTS brands (
    id        TEXT PRIMARY KEY,
    slug      TEXT NOT NULL UNIQUE,
    name      TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
  )`,

  // ------------------------------------------------------------- products
  `CREATE TABLE IF NOT EXISTS products (
    id                  TEXT PRIMARY KEY,
    slug                TEXT NOT NULL UNIQUE,
    sku                 TEXT NOT NULL,
    name                TEXT NOT NULL,
    name_si             TEXT,
    name_ta             TEXT,
    description         TEXT,
    category_id         TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    subcategory_id      TEXT REFERENCES categories(id) ON DELETE SET NULL,
    brand_id            TEXT REFERENCES brands(id) ON DELETE SET NULL,
    price               REAL NOT NULL DEFAULT 0,
    sale_price          REAL,
    stock               INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    unit                TEXT NOT NULL DEFAULT '1 piece',
    weight              TEXT,
    image_url           TEXT,
    gallery             TEXT NOT NULL DEFAULT '[]',
    is_featured         INTEGER NOT NULL DEFAULT 0,
    is_new              INTEGER NOT NULL DEFAULT 0,
    is_best_seller      INTEGER NOT NULL DEFAULT 0,
    is_active           INTEGER NOT NULL DEFAULT 1,
    popularity          INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL,

    -- What the customer actually pays, so it can be sorted and indexed on.
    effective_price REAL GENERATED ALWAYS AS (
      CASE WHEN sale_price IS NOT NULL AND sale_price > 0 AND sale_price < price
           THEN sale_price ELSE price END
    ) STORED,

    discount_percent INTEGER GENERATED ALWAYS AS (
      CASE WHEN sale_price IS NOT NULL AND sale_price > 0 AND sale_price < price AND price > 0
           THEN CAST(ROUND(((price - sale_price) / price) * 100) AS INTEGER) ELSE 0 END
    ) STORED,

    -- One lowercased haystack covering English, Sinhala and Tamil plus the SKU,
    -- so a single LIKE searches all three languages. LOWER() only folds ASCII,
    -- which is exactly right: Sinhala and Tamil have no letter case.
    search_text TEXT GENERATED ALWAYS AS (
      LOWER(
        COALESCE(name, '') || ' ' || COALESCE(name_si, '') || ' ' ||
        COALESCE(name_ta, '') || ' ' || COALESCE(sku, '') || ' ' ||
        COALESCE(description, '')
      )
    ) STORED
  )`,
  `CREATE INDEX IF NOT EXISTS products_category_idx   ON products(category_id)`,
  `CREATE INDEX IF NOT EXISTS products_subcat_idx     ON products(subcategory_id)`,
  `CREATE INDEX IF NOT EXISTS products_brand_idx      ON products(brand_id)`,
  `CREATE INDEX IF NOT EXISTS products_active_idx     ON products(is_active)`,
  `CREATE INDEX IF NOT EXISTS products_price_idx      ON products(effective_price)`,
  `CREATE INDEX IF NOT EXISTS products_discount_idx   ON products(discount_percent DESC)`,
  `CREATE INDEX IF NOT EXISTS products_popularity_idx ON products(stock DESC, popularity DESC)`,
  `CREATE INDEX IF NOT EXISTS products_search_idx     ON products(search_text)`,

  // --------------------------------------------------------------- orders
  `CREATE TABLE IF NOT EXISTS orders (
    id              TEXT PRIMARY KEY,
    order_number    TEXT NOT NULL UNIQUE,
    customer_name   TEXT NOT NULL,
    phone           TEXT NOT NULL,
    whatsapp        TEXT,
    email           TEXT,
    address_line    TEXT,
    street          TEXT,
    area            TEXT,
    city            TEXT,
    district        TEXT,
    notes           TEXT,
    delivery_method TEXT NOT NULL DEFAULT 'delivery',
    payment_method  TEXT NOT NULL DEFAULT 'cod',
    subtotal        REAL NOT NULL DEFAULT 0,
    delivery_fee    REAL NOT NULL DEFAULT 0,
    discount        REAL NOT NULL DEFAULT 0,
    total           REAL NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'new',
    access_token    TEXT NOT NULL DEFAULT '',
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS orders_status_idx  ON orders(status)`,
  `CREATE INDEX IF NOT EXISTS orders_phone_idx   ON orders(phone)`,

  `CREATE TABLE IF NOT EXISTS order_items (
    id           TEXT PRIMARY KEY,
    order_id     TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id   TEXT REFERENCES products(id) ON DELETE SET NULL,
    -- Name and price are copied, not joined: an order must still read correctly
    -- years later even if the product is renamed, re-priced or deleted.
    product_name TEXT NOT NULL,
    unit         TEXT NOT NULL DEFAULT '',
    quantity     INTEGER NOT NULL,
    unit_price   REAL NOT NULL,
    total        REAL NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id)`,

  // --------------------------------------------------------------- admins
  `CREATE TABLE IF NOT EXISTS admins (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'manager',
    password_hash TEXT NOT NULL,
    salt          TEXT NOT NULL,
    created_at    TEXT NOT NULL
  )`,

  // ------------------------------------------------------- settings & meta
  `CREATE TABLE IF NOT EXISTS settings (
    id         INTEGER PRIMARY KEY CHECK (id = 1),
    data       TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
];
