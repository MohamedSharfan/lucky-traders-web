import type {
  AdminRole,
  AdminUser,
  Brand,
  Category,
  CreateOrderInput,
  DashboardStats,
  Order,
  OrderStatus,
  Paginated,
  Product,
  ProductQuery,
  ProductView,
  Settings,
} from '@/lib/types';

/**
 * The single data-access contract used by every server route and page.
 *
 * Three implementations exist and are chosen at runtime by `lib/db/index.ts`:
 *   - `sqlite.ts`    the default: one local SQLite file, free and permanent
 *   - `supabase.ts`  Supabase / Postgres, used as soon as env vars are present
 *   - `local.ts`     a plain JSON file, kept as a dependency-free fallback
 *
 * Nothing above this layer knows which one is active.
 */
export interface DataStore {
  readonly kind: 'local' | 'sqlite' | 'supabase';

  // -- catalog ---------------------------------------------------------------
  listCategories(opts?: { includeInactive?: boolean }): Promise<Category[]>;
  getCategory(idOrSlug: string): Promise<Category | null>;
  createCategory(input: Partial<Category>): Promise<Category>;
  updateCategory(id: string, patch: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  listBrands(): Promise<Brand[]>;

  queryProducts(query: ProductQuery): Promise<Paginated<ProductView>>;
  getProduct(idOrSlug: string): Promise<ProductView | null>;
  getProductsByIds(ids: string[]): Promise<ProductView[]>;
  createProduct(input: Partial<Product>): Promise<Product>;
  updateProduct(id: string, patch: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  /** Distinct price bounds + brand list for the filter sidebar. */
  getFacets(): Promise<{ brands: Brand[]; minPrice: number; maxPrice: number }>;

  // -- orders ----------------------------------------------------------------
  createOrder(input: CreateOrderInput): Promise<Order>;
  listOrders(opts?: { status?: OrderStatus; search?: string; page?: number; pageSize?: number }): Promise<Paginated<Order>>;
  getOrder(idOrNumber: string): Promise<Order | null>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order>;
  deleteOrder(id: string): Promise<void>;

  // -- admin users -----------------------------------------------------------
  listAdmins(): Promise<AdminUser[]>;
  createAdmin(input: { email: string; name: string; role: AdminRole; password: string }): Promise<AdminUser>;
  updateAdmin(id: string, patch: { name?: string; role?: AdminRole; password?: string }): Promise<AdminUser>;
  deleteAdmin(id: string): Promise<void>;
  /** Verifies a stored admin's password. Returns null when it does not match. */
  verifyAdminPassword(email: string, password: string): Promise<AdminUser | null>;

  // -- settings & reporting --------------------------------------------------
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;
  getDashboardStats(): Promise<DashboardStats>;
}
