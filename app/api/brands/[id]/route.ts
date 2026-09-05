import type { NextRequest } from 'next/server';

import { assertAdmin, handle } from '@/lib/api';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  return handle(async () => {
    assertAdmin();
    const body = await request.json();

    const patch: { name?: string; is_active?: boolean } = {};
    if (body?.name !== undefined) patch.name = String(body.name);
    if (body?.is_active !== undefined) patch.is_active = Boolean(body.is_active);

    const db = await getDb();
    return db.updateBrand(params.id, patch);
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return handle(async () => {
    assertAdmin();
    const db = await getDb();
    await db.deleteBrand(params.id);
    return { deleted: true };
  });
}
