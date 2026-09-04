/**
 * Configuration errors.
 *
 * Next.js hides thrown messages in production behind an opaque digest, which
 * tells an operator nothing. These carry explicit, actionable text that is
 * logged server-side and surfaced by `GET /api/health`, so a misconfigured
 * deployment can be diagnosed without guesswork.
 */

/** Raised when Supabase credentials are missing entirely. */
export class SupabaseNotConfiguredError extends Error {
  readonly isConfigurationError = true;

  constructor() {
    super(
      [
        'Supabase is not configured, and there is no local fallback.',
        '',
        'Set these environment variables and redeploy:',
        '',
        '  NEXT_PUBLIC_SUPABASE_URL       https://<project-ref>.supabase.co',
        '  NEXT_PUBLIC_SUPABASE_ANON_KEY  the anon / public key',
        '  SUPABASE_SERVICE_ROLE_KEY      the service_role key (server only)',
        '',
        'All three are in Supabase under Project Settings -> API.',
        '',
        'On Vercel, environment variables apply per environment: tick Production,',
        'Preview and Development, then redeploy - an existing build does not pick',
        'up new variables.',
        '',
        'See README -> Setting up Supabase.',
      ].join('\n'),
    );
    this.name = 'SupabaseNotConfiguredError';
  }
}

/**
 * Raised when Supabase is configured but the project cannot be reached, or the
 * schema has not been created yet.
 */
export class DatabaseUnreachableError extends Error {
  readonly isConfigurationError = true;

  constructor(cause: string) {
    super(
      [
        'Could not reach the Supabase project.',
        '',
        `Cause: ${cause}`,
        '',
        'Check that:',
        '  - the project is not paused (free projects pause after inactivity;',
        '    open it in the Supabase dashboard to resume it)',
        '  - NEXT_PUBLIC_SUPABASE_URL points at the right project',
        '  - SUPABASE_SERVICE_ROLE_KEY is current and has not been rotated',
        '  - supabase/schema.sql has been run, so the tables exist',
        '',
        'The app will not fall back to local storage: orders written to the wrong',
        'database would be lost.',
      ].join('\n'),
    );
    this.name = 'DatabaseUnreachableError';
  }
}

/** True when the error means "the app is misconfigured", not "a query failed". */
export function isConfigurationError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'isConfigurationError' in error);
}
