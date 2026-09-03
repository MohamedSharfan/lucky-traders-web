import type { NextRequest } from 'next/server';

import { assertAdmin, fail, handle } from '@/lib/api';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  const db = await getDb();
  const product = await db.getProduct(params.id);
  if (!product) return fail('Product not found', 404);
  return handle(async () => product);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return handle(async () => {
    assertAdmin();
    const body = await request.json();
    const db = await getDb();
    return db.updateProduct(params.id, body);
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return handle(async () => {
    assertAdmin();
    const db = await getDb();
    await db.deleteProduct(params.id);
    return { deleted: true };
  });
}
