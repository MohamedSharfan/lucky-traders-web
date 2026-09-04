/**
 * Exports the local SQLite database to a SQL file you can load into Turso.
 *
 *   npm run export:turso                # everything
 *   npm run export:turso -- --catalog   # products/categories/settings only
 *
 * Then load it:
 *   turso db shell <your-db-name> < turso-export.sql
 *
 * You usually do not need this: the app creates its schema and seeds the demo
 * catalog into an empty Turso database on first boot. Use it when you have
 * already edited products, prices or settings locally and want to move that
 * work up rather than starting from the demo data again.
 *
 * The schema is read back out of the live database rather than duplicated
 * here, so the export always matches what the app actually created - including
 * the generated columns, which are recomputed by SQLite and must never be
 * written to directly.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@libsql/client';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DB_FILE = path.join(root, '.data', 'lucky-traders.db');
const OUT_FILE = path.join(root, 'turso-export.sql');

const catalogOnly = process.argv.includes('--catalog');

/**
 * Tables in dependency order. `orders` must precede `order_items`, and
 * `categories`/`brands` must precede `products`, or the foreign keys fail.
 */
const TABLE_ORDER = [
  'categories',
  'brands',
  'products',
  'orders',
  'order_items',
  'admins',
  'settings',
  'meta',
];

/** Tables holding personal data or credentials, skipped by --catalog. */
const SENSITIVE = new Set(['orders', 'order_items', 'admins']);

/** A SQL literal for one value. */
function literal(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'bigint') return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    const bytes = Buffer.from(value instanceof ArrayBuffer ? value : value.buffer);
    return `X'${bytes.toString('hex')}'`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function main() {
  const exists = await fs.access(DB_FILE).then(() => true).catch(() => false);
  if (!exists) {
    console.error(`No database at ${DB_FILE}`);
    console.error('Start the app once (npm run dev) so it creates and seeds one, then re-run.');
    process.exit(1);
  }

  const db = createClient({ url: `file:${DB_FILE.replace(/\\/g, '/')}` });

  const tablesRes = await db.execute(
    "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND sql IS NOT NULL",
  );
  const indexesRes = await db.execute(
    "SELECT name, sql FROM sqlite_master WHERE type = 'index' AND sql IS NOT NULL",
  );

  const schemaByTable = new Map(tablesRes.rows.map((r) => [String(r.name), String(r.sql)]));
  const tables = TABLE_ORDER.filter((t) => schemaByTable.has(t));
  // Anything created later that this script has not been taught about.
  for (const name of schemaByTable.keys()) if (!tables.includes(name)) tables.push(name);

  const out = [
    '-- ==========================================================================',
    '--  Lucky Traders — database export for Turso / libSQL',
    `--  Generated ${new Date().toISOString()}`,
    catalogOnly
      ? '--  Catalog only: orders, order items and admin accounts were excluded.'
      : '--  Full export.',
    '--',
    '--  Load with:  turso db shell <your-db-name> < turso-export.sql',
    '-- ==========================================================================',
    '',
    'PRAGMA foreign_keys = OFF;',
    'BEGIN TRANSACTION;',
    '',
  ];

  let totalRows = 0;
  let sensitiveRows = 0;
  const summary = [];

  for (const table of tables) {
    const skip = catalogOnly && SENSITIVE.has(table);

    out.push(`-- ---------------------------------------------------------- ${table}`);
    // CREATE TABLE IF NOT EXISTS, so loading into a database the app has
    // already initialised is safe.
    out.push(`${schemaByTable.get(table).replace(/^CREATE TABLE /i, 'CREATE TABLE IF NOT EXISTS ')};`);

    if (skip) {
      out.push(`-- rows omitted (--catalog)`, '');
      summary.push([table, 'skipped']);
      continue;
    }

    // Generated columns are recomputed by SQLite and rejected in an INSERT.
    // PRAGMA table_xinfo flags them with hidden >= 2.
    const info = await db.execute(`PRAGMA table_xinfo(${table})`);
    const columns = info.rows.filter((c) => Number(c.hidden) < 2).map((c) => String(c.name));

    // Parent categories must be inserted before their children.
    const orderBy = table === 'categories' ? ' ORDER BY parent_id IS NOT NULL, sort_order' : '';
    const rows = await db.execute(`SELECT ${columns.map((c) => `"${c}"`).join(', ')} FROM ${table}${orderBy}`);

    if (!rows.rows.length) {
      out.push('-- (no rows)', '');
      summary.push([table, '0 rows']);
      continue;
    }

    const columnList = columns.map((c) => `"${c}"`).join(', ');
    // Chunked so no single statement becomes awkward to read or replay.
    const CHUNK = 100;
    for (let i = 0; i < rows.rows.length; i += CHUNK) {
      const chunk = rows.rows.slice(i, i + CHUNK);
      const values = chunk
        .map((row) => `  (${columns.map((c) => literal(row[c])).join(', ')})`)
        .join(',\n');
      out.push(`INSERT OR REPLACE INTO ${table} (${columnList}) VALUES\n${values};`);
    }
    out.push('');

    totalRows += rows.rows.length;
    if (SENSITIVE.has(table)) sensitiveRows += rows.rows.length;
    summary.push([table, `${rows.rows.length} rows`]);
  }

  out.push('-- ------------------------------------------------------------ indexes');
  for (const row of indexesRes.rows) {
    out.push(`${String(row.sql).replace(/^CREATE INDEX /i, 'CREATE INDEX IF NOT EXISTS ')};`);
  }

  out.push('', 'COMMIT;', 'PRAGMA foreign_keys = ON;', '');

  if (sensitiveRows > 0) {
    out.push(
      '-- --------------------------------------------------------------------------',
      '-- WARNING: this file contains customer names, phone numbers and addresses',
      '-- from your orders, and hashed admin passwords. Keep it off shared drives',
      '-- and out of git. Delete it once the import has finished.',
      '-- --------------------------------------------------------------------------',
    );
  }

  await fs.writeFile(OUT_FILE, out.join('\n'), 'utf8');
  await db.close();

  const bytes = (await fs.stat(OUT_FILE)).size;

  console.log(`Wrote ${path.relative(root, OUT_FILE)}`);
  for (const [table, note] of summary) console.log(`  ${table.padEnd(14)} ${note}`);
  console.log(`  ${'total'.padEnd(14)} ${totalRows} rows, ${(bytes / 1024).toFixed(0)} KB`);
  console.log('');
  console.log('Load it into Turso with:');
  console.log('  turso db shell lucky-traders-mohamedsharfan < turso-export.sql');
  if (sensitiveRows > 0) {
    console.log('');
    console.log(`Contains ${sensitiveRows} rows of customer/admin data — delete the file after importing.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
