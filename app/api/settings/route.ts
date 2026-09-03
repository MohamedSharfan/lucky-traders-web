import type { NextRequest } from 'next/server';

import { assertAdmin, handle } from '@/lib/api';
import { getDb } from '@/lib/db';
import { sanitizeOrderPrefix } from '@/lib/db/shared';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => {
    const db = await getDb();
    return db.getSettings();
  });
}

export async function PUT(request: NextRequest) {
  return handle(async () => {
    assertAdmin();
    const body = await request.json();
    // Only known keys are written, so a crafted request cannot inject fields.
    const allowed = [
      'shop_name', 'shop_subtitle', 'tagline', 'logo_url', 'phone', 'whatsapp',
      'whatsapp_greeting', 'email', 'address', 'opening_hours', 'facebook',
      'instagram', 'maps_url', 'maps_embed_url', 'currency', 'delivery_enabled',
      'pickup_enabled', 'delivery_fee', 'free_delivery_threshold',
      'delivery_areas', 'order_prefix', 'announcement',
    ] as const;

    const patch: Record<string, unknown> = {};
    for (const key of allowed) if (key in body) patch[key] = body[key];

    // Order numbers end up in URLs and WhatsApp messages, so the prefix is
    // reduced to letters and digits rather than passed through as typed.
    if ('order_prefix' in patch) patch.order_prefix = sanitizeOrderPrefix(String(patch.order_prefix ?? ''));
    if ('delivery_fee' in patch) patch.delivery_fee = Math.max(0, Number(patch.delivery_fee) || 0);
    if ('free_delivery_threshold' in patch) {
      patch.free_delivery_threshold = Math.max(0, Number(patch.free_delivery_threshold) || 0);
    }
    if ('delivery_areas' in patch && Array.isArray(patch.delivery_areas)) {
      patch.delivery_areas = (patch.delivery_areas as any[])
        .filter((a) => a && String(a.name ?? '').trim())
        .map((a, i) => ({
          id: String(a.id ?? `area-${i}`),
          name: String(a.name).trim(),
          fee: Math.max(0, Number(a.fee) || 0),
          is_active: a.is_active !== false,
        }));
    }

    const db = await getDb();
    return db.updateSettings(patch);
  });
}
