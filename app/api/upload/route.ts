import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import type { NextRequest } from 'next/server';

import { assertAdmin, handle } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB - keeps pages fast on mobile data
const ALLOWED = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/avif', 'avif'],
  ['image/gif', 'gif'],
]);

/**
 * Product / category image upload.
 *
 * Writes to Supabase Storage when configured, otherwise to `public/uploads`
 * so image management works in local mode too. Either way the caller gets
 * back a plain URL to store in `image_url`.
 */
export async function POST(request: NextRequest) {
  return handle(async () => {
    assertAdmin();

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new Error('Please choose an image to upload.');
    if (file.size === 0) throw new Error('That file appears to be empty.');
    if (file.size > MAX_BYTES) throw new Error('Images must be 5 MB or smaller. Please compress it and try again.');

    const ext = ALLOWED.get(file.type);
    if (!ext) throw new Error('Only JPG, PNG, WebP, AVIF or GIF images are supported.');

    const bytes = Buffer.from(await file.arrayBuffer());
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

    if (isSupabaseConfigured()) {
      const { serviceClient } = await import('@/lib/db/supabase');
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'product-images';
      const sb = serviceClient();
      const { error } = await sb.storage.from(bucket).upload(name, bytes, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      });
      if (error) throw new Error(`Upload failed: ${error.message}`);
      const { data } = sb.storage.from(bucket).getPublicUrl(name);
      return { url: data.publicUrl };
    }

    const dir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), bytes);
    return { url: `/uploads/${name}` };
  });
}
