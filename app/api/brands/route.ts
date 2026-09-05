import type { NextRequest } from 'next/server';

import { assertAdmin, handle } from '@/lib/api';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => {
    const db = await getDb();
    return db.listBrands();
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    assertAdmin();
    const body = await request.json();
    const db = await getDb();
    return db.createBrand({ name: String(body?.name ?? '') });
  });
}
