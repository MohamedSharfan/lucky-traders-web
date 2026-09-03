import type { Brand, Category, Product, Settings } from '@/lib/types';

/** Deterministic UUID derived from a stable key. */
export declare function uid(key: string): string;

/** Expands the compact seed files into a database-shaped catalog. */
export declare function buildCatalog(): {
  categories: Category[];
  brands: Brand[];
  products: Product[];
};

export declare const defaultSettings: Settings;
