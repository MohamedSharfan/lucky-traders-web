/**
 * Loads the demo catalog straight into Supabase.
 *
 *   npm run seed
 *
 * `supabase/seed.sql` does the same thing, but it is 170 KB of SQL that has to
 * be pasted into the dashboard editor. This talks to the project directly with
 * the service_role key, so setting up a new shop is one command.
 *
 * Every write is an upsert keyed on `slug`, so re-running is safe: it refreshes
 * the demo catalog without duplicating it, and without touching real orders.
 *
 * Run `supabase/schema.sql` first — this creates rows, not tables.
 */

import { createClient } from '@supabase/supabase-js';

import { buildCatalog, defaultSettings } from '../data/build-catalog.mjs';
import { loadEnv } from './load-env.mjs';

/** Upserts in batches; one 293-row request can exceed the request body limit. */
async function upsert(db, table, rows, conflict) {
  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await db
      .from(table)
      .upsert(rows.slice(i, i + CHUNK), { onConflict: conflict });
    if (error) {
      throw new Error(`${table}: ${error.message}${error.hint ? ` (${error.hint})` : ''}`);
    }
  }
  console.log(`  ${String(rows.length).padStart(4)} ${table}`);
}

async function main() {
  await loadEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    console.error(
      'Seeding needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.\n' +
        'Both are in the Supabase dashboard under Project Settings -> API.\n' +
        'The service_role key is server-only; it must never be prefixed NEXT_PUBLIC_.',
    );
    process.exit(1);
  }

  const db = createClient(url, key, { auth: { persistSession: false } });

  // Fail early with a useful message if schema.sql has not been run yet.
  const { error: probe } = await db.from('products').select('id').limit(1);
  if (probe) {
    console.error(
      `Could not read public.products: ${probe.message}\n\n` +
        'Run supabase/schema.sql in the Supabase SQL editor first — this script ' +
        'inserts rows, it does not create tables.',
    );
    process.exit(1);
  }

  const { categories, brands, products } = buildCatalog();

  console.log(`Seeding ${url}`);

  // Parents before children: parent_id is a foreign key into the same table.
  await upsert(db, 'categories', categories.filter((c) => !c.parent_id), 'slug');
  await upsert(db, 'categories', categories.filter((c) => c.parent_id), 'slug');
  await upsert(db, 'brands', brands, 'slug');
  await upsert(db, 'products', products, 'slug');

  const { error: settingsError } = await db
    .from('settings')
    .upsert({ id: 1, data: defaultSettings, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (settingsError) throw new Error(`settings: ${settingsError.message}`);
  console.log('     1 settings');

  console.log('\nDone. Start the shop with `npm run dev`.');
}

main().catch((error) => {
  console.error(`\nSeeding failed: ${error.message}`);
  process.exit(1);
});
