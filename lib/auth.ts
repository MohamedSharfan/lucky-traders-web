import 'server-only';

import crypto from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Admin authentication.
 *
 * Two modes, chosen automatically:
 *
 *  1. Supabase Auth (production). When Supabase is configured, credentials are
 *     verified with `signInWithPassword` against the project's auth users, and
 *     the account must also exist in the `admins` table. Row Level Security
 *     then keeps the tables closed to anonymous writes.
 *
 *  2. Env credentials (local / zero-config). ADMIN_EMAIL + ADMIN_PASSWORD.
 *
 * Either way the browser only ever receives an HMAC-signed, httpOnly session
 * cookie. No password, key or token is exposed to client code.
 */

export { SESSION_COOKIE } from './auth.edge';
import { SESSION_COOKIE } from './auth.edge';

const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export interface AdminSession {
  email: string;
  name: string;
  role: 'owner' | 'manager';
  exp: number;
}

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (value && value.length >= 16 && value !== 'please-change-this-to-a-long-random-string') return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_SESSION_SECRET must be set to a long random string in production');
  }
  // Development fallback so the app runs before the owner edits .env.local.
  return 'lucky-traders-development-session-secret';
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function createSessionToken(session: Omit<AdminSession, 'exp'>): string {
  const full: AdminSession = { ...session, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const body = Buffer.from(JSON.stringify(full)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const session = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AdminSession;
    if (!session.exp || session.exp * 1000 < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

/** Reads the current admin session from cookies, or null. */
export function getSession(): AdminSession | null {
  return verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
}

export function requireSession(): AdminSession {
  const session = getSession();
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}

/**
 * Verifies admin credentials.
 *
 * The environment account is checked FIRST and always works. That ordering
 * matters: Supabase Auth requires both an auth user and a matching row in
 * `admins`, so checking it first would lock the owner out of a fresh
 * deployment before they could create either.
 *
 * Supabase Auth is then tried for additional staff accounts created in
 * Admin -> Admin Users.
 */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<Omit<AdminSession, 'exp'> | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) return null;

  // --- the owner account, from the environment -----------------------------
  const envEmail = envAdminEmail();
  const envPassword = process.env.ADMIN_PASSWORD ?? '';
  if (envPassword) {
    const emailOk = crypto.timingSafeEqual(
      Buffer.from(cleanEmail.padEnd(64).slice(0, 64)),
      Buffer.from(envEmail.padEnd(64).slice(0, 64)),
    );
    const passwordOk = crypto.timingSafeEqual(
      Buffer.from(password.padEnd(64).slice(0, 64)),
      Buffer.from(envPassword.padEnd(64).slice(0, 64)),
    );
    if (emailOk && passwordOk) {
      return { email: envEmail, name: 'Shop Owner', role: 'owner' };
    }
  }

  // --- additional staff, via Supabase Auth ---------------------------------
  const { isSupabaseConfigured } = await import('@/lib/db');
  if (!isSupabaseConfigured() || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );
    const { data, error } = await sb.auth.signInWithPassword({ email: cleanEmail, password });
    if (error || !data.user) return null;

    // Being an auth user is not enough - the account must also be listed as an
    // admin, so revoking access is a single row delete.
    const { serviceClient } = await import('@/lib/db/supabase');
    const admin = await serviceClient()
      .from('admins')
      .select('name, role')
      .eq('email', cleanEmail)
      .maybeSingle();
    if (admin.error || !admin.data) return null;

    return {
      email: cleanEmail,
      name: (admin.data.name as string) ?? cleanEmail,
      role: (admin.data.role as AdminSession['role']) ?? 'manager',
    };
  } catch (error) {
    // An unreachable project must not look like a wrong password.
    console.error('[auth] Supabase sign-in failed', error);
    return null;
  }
}

/** The email of the environment-defined owner account, for display purposes. */
export function envAdminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? 'admin@luckytraders.lk').trim().toLowerCase();
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
