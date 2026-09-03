import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { LoginForm } from '@/components/admin/LoginForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Sign In',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const db = await getDb();
  const settings = await db.getSettings();

  // Only same-site paths are accepted, so ?next= cannot be used for an
  // open redirect off the site.
  const next =
    searchParams.next && searchParams.next.startsWith('/admin') ? searchParams.next : '/admin';

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="mb-3 h-16 w-16 object-contain" />
          <h1 className="text-xl font-extrabold tracking-tight text-ink">{settings.shop_name}</h1>
          <p className="text-[13px] font-medium text-brand-blue">{settings.shop_subtitle}</p>
        </div>

        <LoginForm next={next} usingSupabase={Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)} />

        <p className="mt-5 text-center text-[12.5px] text-muted">
          <a href="/" className="font-medium text-brand-blue hover:underline">
            ← Back to the shop
          </a>
        </p>
      </div>
    </div>
  );
}
