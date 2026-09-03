/**
 * Resets the local demo data.
 *
 *   npm run seed            # report what is there
 *   npm run seed -- --force # wipe and rebuild, discarding orders
 *
 * The app seeds itself on first run, so this is only needed to reset the demo
 * catalog. It clears BOTH local backends: the SQLite database (the default)
 * and the JSON fallback file. Stop the server first — SQLite keeps the file
 * locked while it is running.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCatalog, defaultSettings } from '../data/build-catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, '.data');
const dataFile = path.join(dataDir, 'store.json');

const force = process.argv.includes('--force');

async function main() {
  // SQLite is the default backend; deleting the file makes the app re-seed on
  // its next boot, which is simpler and safer than rewriting rows in place.
  // The old name is listed too so a database from before the rename is cleaned up.
  const dbFiles = [
    'lucky-traders.db', 'lucky-traders.db-shm', 'lucky-traders.db-wal',
    'sillara-kade.db', 'sillara-kade.db-shm', 'sillara-kade.db-wal',
  ];
  let removed = 0;
  for (const name of dbFiles) {
    try {
      await fs.unlink(path.join(dataDir, name));
      removed += 1;
    } catch (error) {
      if (error.code === 'EBUSY' || error.code === 'EPERM') {
        console.error(`Could not delete ${name} — stop the dev server first, then re-run.`);
        process.exit(1);
      }
      // ENOENT just means there was nothing to clear.
    }
  }
  if (removed) console.log('Cleared the SQLite database; it will re-seed on next start.');

  const exists = await fs
    .access(dataFile)
    .then(() => true)
    .catch(() => false);

  if (exists && !force) {
    const existing = JSON.parse(await fs.readFile(dataFile, 'utf8'));
    console.log('.data/store.json already exists — nothing to do.');
    console.log(`  ${existing.products?.length ?? 0} products, ${existing.orders?.length ?? 0} orders`);
    console.log('  Run "npm run seed -- --force" to reset it (this deletes orders).');
    return;
  }

  const { categories, brands, products } = buildCatalog();
  const store = {
    categories,
    brands,
    products,
    orders: [],
    settings: defaultSettings,
    order_sequence: 0,
  };

  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(store, null, 2), 'utf8');

  console.log(force ? 'Reset .data/store.json' : 'Created .data/store.json');
  console.log(`  ${categories.length} categories`);
  console.log(`  ${brands.length} brands`);
  console.log(`  ${products.length} products`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
