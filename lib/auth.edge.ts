/**
 * Edge-safe auth constants.
 *
 * `lib/auth.ts` is marked `server-only` and imports node:crypto, so it cannot be
 * pulled into middleware. This module holds the few values both sides need.
 */
export const SESSION_COOKIE = 'sk_admin_session';
