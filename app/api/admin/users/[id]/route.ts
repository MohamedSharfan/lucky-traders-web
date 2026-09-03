import type { NextRequest } from 'next/server';

import { assertAdmin, handle } from '@/lib/api';
import { getDb } from '@/lib/db';
import type { AdminRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

const ROLES: AdminRole[] = ['owner', 'manager'];

type Params = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  return handle(async () => {
    const session = assertAdmin();
    const body = await request.json();

    const db = await getDb();
    const admins = await db.listAdmins();
    const target = admins.find((a) => a.id === params.id);
    if (!target) throw new Error('Admin not found');

    // A manager may only change their own name and password.
    const isSelf = target.email === session.email;
    if (session.role !== 'owner' && !isSelf) {
      throw new Error('You can only change your own account');
    }
    if (session.role !== 'owner' && body?.role !== undefined) {
      throw new Error('Only an owner can change roles');
    }

    const patch: { name?: string; role?: AdminRole; password?: string } = {};
    if (body?.name !== undefined) patch.name = String(body.name);
    if (body?.password) patch.password = String(body.password);
    if (body?.role !== undefined && ROLES.includes(body.role)) patch.role = body.role;

    return db.updateAdmin(params.id, patch);
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return handle(async () => {
    const session = assertAdmin();
    if (session.role !== 'owner') throw new Error('Only an owner can remove admin users');

    const db = await getDb();
    const admins = await db.listAdmins();
    const target = admins.find((a) => a.id === params.id);
    if (!target) throw new Error('Admin not found');

    // Guard against locking yourself, or everyone, out of the panel.
    if (target.email === session.email) throw new Error('You cannot remove your own account');
    if (target.role === 'owner' && admins.filter((a) => a.role === 'owner').length <= 1) {
      throw new Error('There must always be at least one owner');
    }

    await db.deleteAdmin(params.id);
    return { deleted: true };
  });
}
