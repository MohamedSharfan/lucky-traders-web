'use client';

import { createContext, useContext } from 'react';

import type { Category, Settings } from '@/lib/types';

/**
 * Makes store settings and the category tree available to client components.
 *
 * Both are fetched once per request in the root layout (a server component) and
 * passed down, so the WhatsApp number, delivery fees and shop name always come
 * from the database — never from a constant in the bundle.
 */

interface StoreContextValue {
  settings: Settings;
  categories: Category[];
  /** Top-level categories only, in sort order. */
  rootCategories: Category[];
  childrenOf: (parentId: string) => Category[];
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({
  settings,
  categories,
  children,
}: {
  settings: Settings;
  categories: Category[];
  children: React.ReactNode;
}) {
  const rootCategories = categories.filter((c) => !c.parent_id);
  const value: StoreContextValue = {
    settings,
    categories,
    rootCategories,
    childrenOf: (parentId) => categories.filter((c) => c.parent_id === parentId),
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
