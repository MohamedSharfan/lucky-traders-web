import { getDb, isSupabaseConfigured } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Deployment health check.
 *
 * Next.js hides server-render errors in production behind an opaque digest, so
 * a misconfigured deployment gives the operator nothing to act on. This route
 * answers the only question that matters at that point: is a database actually
 * reachable, and if not, why.
 *
 * It reports whether each variable is *present*, never its value — no URLs, no
 * tokens, no passwords. The only free text it returns is this application's own
 * configuration error message.
 */
export async function GET() {
  const env = {
    TURSO_DATABASE_URL: Boolean(process.env.TURSO_DATABASE_URL?.trim()),
    TURSO_AUTH_TOKEN: Boolean(process.env.TURSO_AUTH_TOKEN?.trim()),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
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

  const expectedBackend = isSupabaseConfigured()
    ? 'supabase'
    : env.TURSO_DATABASE_URL
      ? 'libsql (hosted)'
      : 'sqlite (local file)';

  try {
    const db = await getDb();
    const [settings, products] = await Promise.all([
      db.getSettings(),
      db.queryProducts({ page: 1, pageSize: 1 }),
    ]);

    // Running on a different store than the one configured is a failure even
    // though every query succeeded - the data is going to the wrong place.
    // The libSQL adapter reports 'sqlite' whether the database is a local file
    // or a hosted one, so a kind of 'local' means the JSON fallback took over.
    const expectedKind = isSupabaseConfigured() ? 'supabase' : 'sqlite';
    const backendMismatch = db.kind !== expectedKind;

    return Response.json({
      ok: !backendMismatch,
      backend: db.kind,
      expectedBackend,
      shopName: settings.shop_name,
      productCount: products.total,
      env,
      // A hosted deployment reading zero products usually means the database is
      // empty and seeding has not run yet, or it points at the wrong database.
      note: backendMismatch
        ? 'The app is NOT using the configured database. It fell back to local storage, so any orders placed here would not reach the real database.'
        : products.total === 0
          ? 'The database is reachable but holds no products.'
          : undefined,
    }, { status: backendMismatch ? 503 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return Response.json(
      {
        ok: false,
        expectedBackend,
        env,
        error: message,
        hint: !env.TURSO_DATABASE_URL && !env.NEXT_PUBLIC_SUPABASE_URL
          ? 'No hosted database is configured for this environment. On Vercel, environment variables apply per environment — check that they are enabled for Preview as well as Production, and redeploy afterwards.'
          : 'A hosted database is configured but could not be opened. Check the URL and token, and that the token has not been revoked.',
      },
      { status: 503 },
    );
  }
}
