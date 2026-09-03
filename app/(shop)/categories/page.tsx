import type { Metadata } from 'next';

import { getDb } from '@/lib/db';
import { CategoryDirectory } from '@/components/CategoryDirectory';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse every grocery and household category we stock.',
};

export default async function CategoriesPage() {
  const db = await getDb();
  const categories = await db.listCategories();

  const roots = categories.filter((c) => !c.parent_id);
  const tree = roots.map((root) => ({
    root,
    children: categories.filter((c) => c.parent_id === root.id),
  }));

  return <CategoryDirectory tree={tree} />;
}
