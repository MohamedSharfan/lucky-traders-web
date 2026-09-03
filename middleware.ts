import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { SESSION_COOKIE } from '@/lib/auth.edge';

/**
 * Fast path that bounces signed-out visitors away from /admin before any admin
 * page renders.
 *
 * This is a *presence* check only - the middleware runs on the Edge runtime and
 * cannot use node:crypto to verify the signature. The real check happens in
 * `app/admin/(protected)/layout.tsx` and in `assertAdmin()` on every mutating
 * API route, so a forged cookie gets no further than this redirect.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLogin = pathname === '/admin/login';
  const hasCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!isLogin && !hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = pathname === '/admin' ? '' : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (isLogin && hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/((?!login$).*)', '/admin/login'],
};
