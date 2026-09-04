/**
 * Raised when no writable database is reachable.
 *
 * The common cause is deploying to a serverless host (Vercel, Netlify) whose
 * project directory is read-only, so the built-in SQLite file cannot be
 * created. Next.js hides thrown messages in production and shows only a digest,
 * which tells the operator nothing — so this carries an explicit, actionable
 * message that is logged server-side where they will actually see it.
 */
export class StorageUnavailableError extends Error {
  readonly isConfigurationError = true;

  constructor(cause: string) {
    super(
      [
        'No writable database is available.',
        '',
        `Cause: ${cause}`,
        '',
        'This host has a read-only filesystem, so the built-in SQLite file cannot be',
        'created. Pick one of these:',
        '',
        '  1. Hosted libSQL (works on Vercel, free tier, never pauses):',
        '     Create a database at https://turso.tech, then set',
        '       TURSO_DATABASE_URL=libsql://<your-db>.turso.io',
        '       TURSO_AUTH_TOKEN=<token>',
        '',
        '  2. Supabase: set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY',
        '     and SUPABASE_SERVICE_ROLE_KEY, after running supabase/schema.sql.',
        '',
        '  3. Deploy to a host with a persistent disk (Railway, Fly.io, a VPS),',
        '     where the local SQLite file works as-is.',
        '',
        'See README → Deploying.',
      ].join('\n'),
    );
    this.name = 'StorageUnavailableError';
  }
}

/** True when the error means "the app is misconfigured", not "a query failed". */
export function isConfigurationError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'isConfigurationError' in error);
}
