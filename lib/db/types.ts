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
 * One implementation backs it: `supabase.ts`. The interface is kept because it
 * documents the whole data surface in one place and keeps every query behind a
 * single seam - but there is deliberately no second backend to silently fall
 * back to.
 */
export interface DataStore {
  readonly kind: 'supabase';

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
