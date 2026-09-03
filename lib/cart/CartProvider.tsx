'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { ProductView } from '@/lib/types';

/**
 * Cart state.
 *
 * Lives in localStorage so guests never have to sign in, and is re-validated
 * against the server on the cart and checkout pages (prices and stock can
 * change while a cart sits open).
 */

export interface CartLine {
  product_id: string;
  slug: string;
  name: string;
  name_si: string | null;
  name_ta: string | null;
  unit: string;
  price: number;
  image_url: string | null;
  /** Kept so the cart can draw the right package illustration offline. */
  category_slug: string | null;
  subcategory_slug: string | null;
  quantity: number;
  /** Stock at the time of adding; refreshed by the cart page. */
  stock: number;
}

const STORAGE_KEY = 'sk.cart.v1';

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (product: ProductView, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  replaceAll: (lines: CartLine[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function read(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is CartLine => l && typeof l.product_id === 'string' && typeof l.quantity === 'number',
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(read());
    setReady(true);
  }, []);

  // Persist, and keep other open tabs in sync.
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* quota or private mode - the cart still works for this page view */
    }
  }, [lines, ready]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLines(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((product: ProductView, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product_id === product.id);
      const cap = Math.max(0, product.stock);
      if (existing) {
        return prev.map((l) =>
          l.product_id === product.id
            ? { ...l, quantity: Math.min(cap || l.quantity, l.quantity + quantity), stock: product.stock, price: product.effective_price }
            : l,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          slug: product.slug,
          name: product.name,
          name_si: product.name_si,
          name_ta: product.name_ta,
          unit: product.unit,
          price: product.effective_price,
          image_url: product.image_url,
          category_slug: product.category_slug,
          subcategory_slug: product.subcategory_slug,
          quantity: Math.min(Math.max(1, quantity), cap || 1),
          stock: product.stock,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      prev.flatMap((l) => {
        if (l.product_id !== productId) return [l];
        const next = Math.floor(quantity);
        if (next <= 0) return [];
        return [{ ...l, quantity: l.stock > 0 ? Math.min(next, l.stock) : next }];
      }),
    );
  }, []);

  const increment = useCallback((id: string) => {
    setLines((prev) =>
      prev.map((l) =>
        l.product_id === id ? { ...l, quantity: l.stock > 0 ? Math.min(l.quantity + 1, l.stock) : l.quantity + 1 } : l,
      ),
    );
  }, []);

  const decrement = useCallback((id: string) => {
    setLines((prev) =>
      prev.flatMap((l) => (l.product_id === id ? (l.quantity <= 1 ? [] : [{ ...l, quantity: l.quantity - 1 }]) : [l])),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.product_id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const replaceAll = useCallback((next: CartLine[]) => setLines(next), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((s, l) => s + l.quantity, 0);
    const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
    return { lines, count, subtotal, ready, add, setQuantity, increment, decrement, remove, clear, replaceAll };
  }, [lines, ready, add, setQuantity, increment, decrement, remove, clear, replaceAll]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
