'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { cn } from '@/lib/format';
import { AlertIcon, ShieldIcon } from '@/components/ui/Icon';

/**
 * Admin sign-in.
 *
 * Credentials go straight to /api/admin/login, which sets an httpOnly session
 * cookie. Nothing sensitive is ever kept in client state or localStorage.
 */
export function LoginForm({ next, usingSupabase }: { next: string; usingSupabase: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? 'Sign in failed.');
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-5">
      <h2 className="mb-1 text-base font-bold text-ink">Admin sign in</h2>
      <p className="mb-4 text-[13px] text-muted">
        Manage products, prices, stock and orders.
      </p>

      {error && (
        <p
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg bg-brand-redSoft px-3 py-2 text-[13px] font-medium text-brand-redDark"
        >
          <AlertIcon size={16} className="mt-px shrink-0" />
          {error}
        </p>
      )}

      <div className="space-y-3.5">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            className={cn('input', error && 'input-error')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className={cn('input', error && 'input-error')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <button type="submit" disabled={busy} className="btn-primary btn-lg mt-5 w-full">
        {busy ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-muted">
        <ShieldIcon size={14} className="mt-px shrink-0 text-brand-blue" />
        {usingSupabase
          ? 'Verified against Supabase Auth. Your account must also be listed in the admins table.'
          : 'Verified against the ADMIN_EMAIL and ADMIN_PASSWORD values in your .env.local file.'}
      </p>
    </form>
  );
}
