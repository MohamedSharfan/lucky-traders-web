import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { PageHeader } from '@/components/admin/PageHeader';
import { SettingsForm } from '@/components/admin/SettingsForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Delivery Settings', robots: { index: false } };

export default async function AdminDeliverySettingsPage() {
  const db = await getDb();
  const settings = await db.getSettings();

  return (
    <>
      <PageHeader title="Delivery Settings" subtitle="Fees, free-delivery threshold and the areas you cover." />
      <SettingsForm settings={settings} section="delivery" />
    </>
  );
}
