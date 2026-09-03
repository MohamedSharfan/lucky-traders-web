import type { NextRequest } from 'next/server';

import { assertAdmin, handle, parseBool } from '@/lib/api';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    const db = await getDb();
    return db.listCategories({
      includeInactive: parseBool(request.nextUrl.searchParams.get('includeInactive')),
    });
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    assertAdmin();
    const body = await request.json();
    const db = await getDb();
    return db.createCategory(body);
  });
}
