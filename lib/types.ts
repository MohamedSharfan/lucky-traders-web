/**
 * Shared domain types.
 *
 * These mirror the database tables 1:1 (see `supabase/schema.sql`) so that the
 * local JSON adapter and the Supabase adapter are interchangeable.
 */

export type Locale = 'en' | 'si' | 'ta';

export interface Category {
  id: string;
  slug: string;
  name: string;
  name_si: string | null;
  name_ta: string | null;
  image_url: string | null;
  icon: string | null;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  name_si: string | null;
  name_ta: string | null;
  description: string | null;
  category_id: string;
  subcategory_id: string | null;
  brand_id: string | null;
  price: number;
  sale_price: number | null;
  stock: number;
  low_stock_threshold: number;
  unit: string;
  weight: string | null;
  image_url: string | null;
  gallery: string[];
  is_featured: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  is_active: boolean;
  popularity: number;
  created_at: string;
  updated_at: string;
}

/** A product joined with its category/brand labels, as returned to the UI. */
export interface ProductView extends Product {
  category_name: string | null;
  category_slug: string | null;
  subcategory_name: string | null;
  subcategory_slug: string | null;
  brand_name: string | null;
  /** price the customer actually pays */
  effective_price: number;
  /** percentage off, rounded; 0 when there is no discount */
  discount_percent: number;
  on_sale: boolean;
  stock_status: StockStatus;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'new',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

export type DeliveryMethod = 'delivery' | 'pickup';
export type PaymentMethod = 'cod' | 'pay_at_store';

/**
 * Which payment methods make sense for each order type.
 *
 * You cannot "pay at the store" for something being delivered to your house,
 * and "cash on delivery" is meaningless when you are collecting it yourself.
 * This is the single source of truth for that rule - the checkout form renders
 * from it and the order API validates against it.
 */
export const PAYMENT_METHODS_BY_DELIVERY: Record<DeliveryMethod, PaymentMethod[]> = {
  delivery: ['cod'],
  pickup: ['pay_at_store'],
};

export function isPaymentMethodAllowed(
  delivery: DeliveryMethod,
  payment: PaymentMethod,
): boolean {
  return PAYMENT_METHODS_BY_DELIVERY[delivery]?.includes(payment) ?? false;
}

/** The payment method to select when the customer switches order type. */
export function defaultPaymentMethod(delivery: DeliveryMethod): PaymentMethod {
  return PAYMENT_METHODS_BY_DELIVERY[delivery][0];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Order {
  id: string;
  order_number: string;
  /**
   * Unguessable key for the confirmation page.
   *
   * Order numbers are sequential and therefore trivially enumerable, so they
   * alone must never unlock an order: it holds the customer's name, phone and
   * home address. The confirmation link carries this token; without it the
   * page and the public API return 404. Admin access goes through the session
   * cookie instead and never needs it.
   */
  access_token: string;
  customer_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  address_line: string | null;
  street: string | null;
  area: string | null;
  city: string | null;
  district: string | null;
  notes: string | null;
  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export type AdminRole = 'owner' | 'manager';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  created_at: string;
  /** True for the account defined by env vars, which cannot be edited here. */
  is_env_account?: boolean;
}

export interface DeliveryArea {
  id: string;
  name: string;
  fee: number;
  is_active: boolean;
}

export interface Settings {
  shop_name: string;
  shop_subtitle: string;
  tagline: string;
  logo_url: string | null;
  phone: string;
  whatsapp: string;
  whatsapp_greeting: string;
  email: string;
  address: string;
  opening_hours: string;
  facebook: string;
  instagram: string;
  maps_url: string;
  maps_embed_url: string;
  currency: string;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  delivery_fee: number;
  free_delivery_threshold: number;
  delivery_areas: DeliveryArea[];
  order_prefix: string;
  announcement: string;
}

/** Payload accepted by the checkout / order-creation API. */
export interface CreateOrderInput {
  customer_name: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  address_line?: string | null;
  street?: string | null;
  area?: string | null;
  city?: string | null;
  district?: string | null;
  notes?: string | null;
  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;
  items: { product_id: string; quantity: number }[];
}

export interface ProductQuery {
  search?: string;
  category?: string;
  /** category slugs, used by the listing page filter */
  categories?: string[];
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  newOnly?: boolean;
  featuredOnly?: boolean;
  bestSellerOnly?: boolean;
  includeInactive?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export type ProductSort = 'popular' | 'price_asc' | 'price_desc' | 'newest' | 'discount' | 'name';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalCustomers: number;
  salesByDay: { date: string; total: number; orders: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  categoryPerformance: { name: string; revenue: number }[];
}
