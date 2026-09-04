import 'server-only';

import type { DataStore } from './types';

/**
 * Resolves the datastore.
 *
 * Supabase is the only backend. There is deliberately no local or in-memory
 * fallback: a shop that quietly serves a different database than the one it was
 * pointed at would accept orders the owner never sees, which is worse than not
 * serving at all.
 */

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
  );
}

let resolved: DataStore | null = null;

export async function getDb(): Promise<DataStore> {
  if (resolved) return resolved;

  if (!isSupabaseConfigured()) {
    const { SupabaseNotConfiguredError } = await import('./errors');
    const error = new SupabaseNotConfiguredError();
    console.error(`\n[db] ${error.message}\n`);
    throw error;
  }

  const { supabaseStore } = await import('./supabase');
  resolved = supabaseStore;
  return resolved;
}

export type { DataStore } from './types';
