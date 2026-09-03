import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { AdminShell } from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

/**
 * Protected admin layout.
 *
 * This is the real access check: the middleware only looks for the presence of
 * a cookie, while `getSession()` here verifies its HMAC signature and expiry.
 * Every mutating API route repeats the check with `assertAdmin()`.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) redirect('/admin/login');

  const db = await getDb();
  const settings = await db.getSettings();

  return (
    <AdminShell adminName={session.name} shopName={settings.shop_name} storeKind={db.kind}>
      {children}
    </AdminShell>
  );
}
