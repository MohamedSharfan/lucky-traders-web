import type { Metadata } from 'next';

import { envAdminEmail, getSession } from '@/lib/auth';
import { getDb, isSupabaseConfigured } from '@/lib/db';
import { AdminUsersManager } from '@/components/admin/AdminUsersManager';
import { PageHeader } from '@/components/admin/PageHeader';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Admin Users', robots: { index: false } };

export default async function AdminUsersPage() {
  const session = getSession()!; // the protected layout guarantees this
  const db = await getDb();
  const admins = await db.listAdmins();

  return (
    <>
      <PageHeader
        title="Admin Users"
        subtitle="Who can sign in and manage the shop."
      />
      <AdminUsersManager
        admins={admins}
        currentEmail={session.email}
        currentRole={session.role}
        envEmail={envAdminEmail()}
        usingSupabase={isSupabaseConfigured()}
      />
    </>
  );
}
