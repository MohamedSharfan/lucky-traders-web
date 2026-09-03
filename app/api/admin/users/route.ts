import type { NextRequest } from 'next/server';

import { assertAdmin, handle } from '@/lib/api';
import { getDb } from '@/lib/db';
import type { AdminRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

const ROLES: AdminRole[] = ['owner', 'manager'];

export async function GET() {
  return handle(async () => {
    assertAdmin();
    const db = await getDb();
    return db.listAdmins();
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    // Only an owner may add other admins; a manager runs the shop, not the team.
    const session = assertAdmin();
    if (session.role !== 'owner') throw new Error('Only an owner can add admin users');

    const body = await request.json();
    const role = body?.role as AdminRole;

    const db = await getDb();
    return db.createAdmin({
      email: String(body?.email ?? ''),
      name: String(body?.name ?? ''),
      role: ROLES.includes(role) ? role : 'manager',
      password: String(body?.password ?? ''),
    });
  });
}
