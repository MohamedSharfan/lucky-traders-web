import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { fail } from '@/lib/api';
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken, verifyCredentials } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Simple in-memory throttle to blunt password guessing. */
const attempts = new Map<string, { count: number; until: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function throttleKey(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

export async function POST(request: NextRequest) {
  const key = throttleKey(request);
  const record = attempts.get(key);
  if (record && record.count >= MAX_ATTEMPTS && record.until > Date.now()) {
    return fail('Too many sign-in attempts. Please wait 15 minutes and try again.', 429);
  }

  let email = '';
  let password = '';
  try {
    const body = await request.json();
    email = String(body?.email ?? '');
    password = String(body?.password ?? '');
  } catch {
    return fail('Invalid request.', 400);
  }

  const session = await verifyCredentials(email, password);
  if (!session) {
    const next = record && record.until > Date.now() ? record : { count: 0, until: Date.now() + WINDOW_MS };
    next.count += 1;
    attempts.set(key, next);
    // Deliberately vague: never reveal whether the email exists.
    return fail('Incorrect email or password.', 401);
  }

  attempts.delete(key);

  // Signing refuses to run in production without a real ADMIN_SESSION_SECRET.
  // Surface that as a clear instruction rather than an opaque 500.
  let token: string;
  try {
    token = createSessionToken(session);
  } catch (error) {
    console.error('[admin login]', error);
    return fail(
      'The admin session secret is not configured. Set ADMIN_SESSION_SECRET to a long random ' +
        'string in your environment and restart the server.',
      500,
    );
  }

  const response = NextResponse.json({ ok: true, data: { name: session.name, role: session.role } });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
