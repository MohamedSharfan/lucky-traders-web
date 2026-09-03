import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { PageHeader } from '@/components/admin/PageHeader';
import { SettingsForm } from '@/components/admin/SettingsForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'WhatsApp Settings', robots: { index: false } };

export default async function AdminWhatsappSettingsPage() {
  const db = await getDb();
  const settings = await db.getSettings();

  return (
    <>
      <PageHeader title="WhatsApp Settings" subtitle="Where customer orders are sent." />
      <SettingsForm settings={settings} section="whatsapp" />
    </>
  );
}
