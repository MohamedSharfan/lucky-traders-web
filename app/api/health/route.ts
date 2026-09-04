import { getDb, isSupabaseConfigured } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Deployment health check.
 *
 * Next.js hides server-render errors in production behind an opaque digest, so
 * a misconfigured deployment gives the operator nothing to act on. This route
 * answers the only question that matters at that point: is the database
 * actually reachable, and if not, why.
 *
 * It reports whether each variable is *present*, never its value — no URLs, no
 * keys, no passwords. The only free text it returns is this application's own
 * configuration error message.
 */
export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    ADMIN_SESSION_SECRET: Boolean(
      process.env.ADMIN_SESSION_SECRET?.trim() &&
        process.env.ADMIN_SESSION_SECRET !== 'please-change-this-to-a-long-random-string',
    ),
    ADMIN_EMAIL: Boolean(process.env.ADMIN_EMAIL?.trim()),
    ADMIN_PASSWORD: Boolean(
      process.env.ADMIN_PASSWORD?.trim() && process.env.ADMIN_PASSWORD !== 'change-this-password',
    ),
  };

  if (!isSupabaseConfigured()) {
    return Response.json(
      {
        ok: false,
        env,
        error: 'Supabase is not configured for this environment.',
        hint:
          'Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and ' +
          'SUPABASE_SERVICE_ROLE_KEY. On Vercel these apply per environment — tick ' +
          'Production, Preview and Development, then redeploy.',
      },
      { status: 503 },
    );
  }

  try {
    const db = await getDb();
    const [settings, products, categories] = await Promise.all([
      db.getSettings(),
      db.queryProducts({ page: 1, pageSize: 1 }),
      db.listCategories(),
    ]);

    return Response.json({
      ok: true,
      backend: db.kind,
      shopName: settings.shop_name,
      productCount: products.total,
      categoryCount: categories.length,
      env,
      // An empty catalog means the schema exists but seed.sql has not been run.
      note:
        products.total === 0
          ? 'Connected, but the catalog is empty. Run supabase/seed.sql in the Supabase SQL editor.'
          : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return Response.json(
      {
        ok: false,
        env,
        error: message,
        hint:
          'Supabase credentials are present but the project could not be queried. ' +
          'Check that the project is not paused and that supabase/schema.sql has been run.',
      },
      { status: 503 },
    );
  }
}
