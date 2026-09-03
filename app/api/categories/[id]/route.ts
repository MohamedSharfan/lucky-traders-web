import type { NextRequest } from 'next/server';

import { assertAdmin, handle } from '@/lib/api';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  return handle(async () => {
    assertAdmin();
    const body = await request.json();
    const db = await getDb();
    return db.updateCategory(params.id, body);
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return handle(async () => {
    assertAdmin();
    const db = await getDb();
    await db.deleteCategory(params.id);
    return { deleted: true };
  });
}
