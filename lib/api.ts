import 'server-only';

import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';

/**
 * Small helpers shared by every route handler: consistent JSON envelopes,
 * friendly error messages and a single place where admin access is enforced.
 */

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/** Turns a thrown value into a message that is safe to show a customer. */
export function toMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof Error) {
    if (error.message === 'UNAUTHORIZED') return 'Please sign in again.';
    // Postgres / Supabase internals should never reach the customer.
    if (/duplicate key|violates|constraint|relation .* does not exist/i.test(error.message)) {
      return 'That value is already in use. Please try a different one.';
    }
    return error.message || fallback;
  }
  return fallback;
}

/** Wraps a handler so any thrown error becomes a clean JSON error response. */
export async function handle<T>(fn: () => Promise<T>) {
  try {
    return ok(await fn());
  } catch (error) {
    const message = toMessage(error);
    const status = message === 'Please sign in again.' ? 401 : 400;
    if (process.env.NODE_ENV !== 'production') console.error('[api]', error);
    return fail(message, status);
  }
}

/** Throws UNAUTHORIZED unless a valid admin session cookie is present. */
export function assertAdmin() {
  const session = getSession();
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}

export function parseNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function parseBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1' || value === 'on';
}

export function parseList(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}
