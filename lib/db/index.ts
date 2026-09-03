import 'server-only';

import type { DataStore } from './types';

/**
 * Picks the datastore for this deployment.
 *
 *   1. Supabase   - when a project URL and key are present.
 *   2. SQLite     - the default. One file in `.data/`, free forever, no server
 *                   to keep awake and nothing that can be paused.
 *   3. JSON store - only if SQLite cannot load (for example a machine with no
 *                   prebuilt binary available). Same data, simpler engine.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

/** Set DATA_BACKEND=json to force the plain-file store. */
function forcedBackend(): string {
  return (process.env.DATA_BACKEND ?? '').trim().toLowerCase();
}

let resolved: DataStore | null = null;

export async function getDb(): Promise<DataStore> {
  if (resolved) return resolved;

  const forced = forcedBackend();

  if (forced !== 'json' && forced !== 'sqlite' && isSupabaseConfigured()) {
    const { supabaseStore } = await import('./supabase');
    resolved = supabaseStore;
    return resolved;
  }

  if (forced === 'json') {
    const { localStore } = await import('./local');
    resolved = localStore;
    return resolved;
  }

  try {
    const { sqliteStore } = await import('./sqlite');
    // Touching the store here surfaces a missing native binary now, while we
    // can still fall back, rather than on the first customer's page view.
    await sqliteStore.getSettings();
    resolved = sqliteStore;
  } catch (error) {
    console.error(
      '[db] SQLite is unavailable, falling back to the JSON store. Set DATA_BACKEND=json to silence this.',
      error,
    );
    const { localStore } = await import('./local');
    resolved = localStore;
  }

  return resolved;
}

export type { DataStore } from './types';
