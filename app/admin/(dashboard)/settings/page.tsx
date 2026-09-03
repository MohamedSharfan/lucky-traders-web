import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { PageHeader } from '@/components/admin/PageHeader';
import { SettingsForm } from '@/components/admin/SettingsForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Store Settings', robots: { index: false } };

export default async function AdminStoreSettingsPage() {
  const db = await getDb();
  const settings = await db.getSettings();

  return (
    <>
      <PageHeader title="Store Settings" subtitle="Your shop name, contact details and social links." />
      <SettingsForm settings={settings} section="store" />
    </>
  );
}
