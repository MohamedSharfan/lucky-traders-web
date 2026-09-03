import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { ContactDetails } from '@/components/ContactDetails';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const db = await getDb();
  const settings = await db.getSettings();
  return {
    title: 'Contact Us',
    description: `Call, WhatsApp or visit ${settings.shop_name} — ${settings.address}`,
  };
}

export default function ContactPage() {
  return <ContactDetails />;
}
