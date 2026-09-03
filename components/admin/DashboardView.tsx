'use client';

import Link from 'next/link';

import { cn, formatPrice } from '@/lib/format';
import type { DashboardStats, Settings } from '@/lib/types';
import { AlertIcon, BoxIcon, ChartIcon, ListIcon, UsersIcon, WalletIcon } from '@/components/ui/Icon';

/**
 * Admin dashboard.
 *
 * The charts are plain SVG/CSS rather than a charting library — the data is
 * simple, and it keeps the admin bundle small for owners on mobile data.
 */
export function DashboardView({ stats, settings }: { stats: DashboardStats; settings: Settings }) {
  const currency = settings.currency;

  const cards = [
    {
      label: "Today's Sales",
      value: formatPrice(stats.todaySales, currency),
      icon: WalletIcon,
      tone: 'red' as const,
      href: '/admin/orders',
    },
    {
      label: "Today's Orders",
      value: String(stats.todayOrders),
      icon: ListIcon,
      tone: 'blue' as const,
      href: '/admin/orders',
    },
    {
      label: 'Pending Orders',
      value: String(stats.pendingOrders),
      icon: ChartIcon,
      tone: 'amber' as const,
      href: '/admin/orders?status=new',
    },
    {
      label: 'Products',
      value: stats.totalProducts.toLocaleString(),
      icon: BoxIcon,
      tone: 'blue' as const,
      href: '/admin/products',
    },
    {
      label: 'Low Stock',
      value: String(stats.lowStockCount),
      icon: AlertIcon,
      tone: 'amber' as const,
      href: '/admin/inventory?filter=low',
    },
    {
      label: 'Customers',
      value: stats.totalCustomers.toLocaleString(),
      icon: UsersIcon,
      tone: 'blue' as const,
      href: '/admin/customers',
    },
  ];

  const maxDaily = Math.max(1, ...stats.salesByDay.map((d) => d.total));
  const maxOrders = Math.max(1, ...stats.salesByDay.map((d) => d.orders));
  const maxProduct = Math.max(1, ...stats.topProducts.map((p) => p.revenue));
  const maxCategory = Math.max(1, ...stats.categoryPerformance.map((c) => c.revenue));

  const toneClass = {
    red: 'bg-brand-redSoft text-brand-red',
    blue: 'bg-brand-blueSoft text-brand-blue',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ label, value, icon: Icon, tone, href }) => (
          <li key={label}>
            <Link
              href={href}
              className="flex h-full flex-col rounded-card border border-line bg-white p-3.5 shadow-card transition-colors hover:border-brand-blue sm:p-4"
            >
              <span className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg ${toneClass[tone]}`}>
                <Icon size={18} />
              </span>
              <span className="text-[12px] font-medium text-muted">{label}</span>
              <span className="mt-0.5 truncate text-lg font-extrabold tracking-tight text-ink sm:text-xl">
                {value}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {stats.outOfStockCount > 0 && (
        <p className="flex items-center gap-2 rounded-card border border-brand-red/20 bg-brand-redSoft px-4 py-3 text-[13.5px] text-brand-redDark">
          <AlertIcon size={17} className="shrink-0" />
          <span>
            <strong>{stats.outOfStockCount} product{stats.outOfStockCount > 1 ? 's are' : ' is'} out of stock.</strong>{' '}
            Customers cannot order them until you restock.
          </span>
          <Link href="/admin/inventory?filter=out" className="ml-auto shrink-0 font-semibold underline">
            Fix now
          </Link>
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Sales, last 7 days */}
        <section className="card p-4">
          <h2 className="mb-4 text-sm font-bold text-ink">Sales — last 7 days</h2>
          {stats.salesByDay.every((d) => d.total === 0) ? (
            <EmptyChart message="No sales recorded yet. Orders will appear here as they come in." />
          ) : (
            <BarChart
              bars={stats.salesByDay.map((day) => ({
                key: day.date,
                label: new Date(day.date).toLocaleDateString('en-GB', { weekday: 'short' }),
                value: day.total,
                max: maxDaily,
                caption: day.total > 0 ? `${Math.round(day.total / 1000)}k` : '',
                title: `${day.date}: ${formatPrice(day.total, currency)} from ${day.orders} orders`,
              }))}
              tone="red"
            />
          )}
        </section>

        {/* Orders per day */}
        <section className="card p-4">
          <h2 className="mb-4 text-sm font-bold text-ink">Orders — last 7 days</h2>
          {stats.salesByDay.every((d) => d.orders === 0) ? (
            <EmptyChart message="No orders yet." />
          ) : (
            <BarChart
              bars={stats.salesByDay.map((day) => ({
                key: day.date,
                label: new Date(day.date).toLocaleDateString('en-GB', { weekday: 'short' }),
                value: day.orders,
                max: maxOrders,
                caption: day.orders ? String(day.orders) : '',
                title: `${day.date}: ${day.orders} orders`,
              }))}
              tone="blue"
            />
          )}
        </section>

        {/* Best sellers */}
        <section className="card p-4">
          <h2 className="mb-3 text-sm font-bold text-ink">Best-selling products</h2>
          {stats.topProducts.length ? (
            <ul className="space-y-2.5">
              {stats.topProducts.map((product) => (
                <li key={product.name}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="clamp-2 min-w-0 font-medium text-ink">{product.name}</span>
                    <span className="shrink-0 font-semibold text-muted">
                      {product.quantity} · {formatPrice(product.revenue, currency)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                    <div
                      className="h-full rounded-full bg-brand-red"
                      style={{ width: `${(product.revenue / maxProduct) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyChart message="Once customers start ordering, your best sellers appear here." />
          )}
        </section>

        {/* Category performance */}
        <section className="card p-4">
          <h2 className="mb-3 text-sm font-bold text-ink">Category performance</h2>
          {stats.categoryPerformance.length ? (
            <ul className="space-y-2.5">
              {stats.categoryPerformance.map((cat) => (
                <li key={cat.name}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="truncate font-medium text-ink">{cat.name}</span>
                    <span className="shrink-0 font-semibold text-muted">
                      {formatPrice(cat.revenue, currency)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                    <div
                      className="h-full rounded-full bg-brand-blue"
                      style={{ width: `${(cat.revenue / maxCategory) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyChart message="No category sales yet." />
          )}
        </section>
      </div>

      {/* Quick actions */}
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products/new" className="btn-primary btn-sm">Add a product</Link>
          <Link href="/admin/inventory" className="btn-outline btn-sm">Update stock</Link>
          <Link href="/admin/orders?status=new" className="btn-outline btn-sm">New orders</Link>
          <Link href="/admin/categories" className="btn-outline btn-sm">Manage categories</Link>
          <Link href="/admin/delivery" className="btn-outline btn-sm">Delivery fees</Link>
          <Link href="/admin/whatsapp" className="btn-outline btn-sm">WhatsApp number</Link>
        </div>
      </section>
    </div>
  );
}

/**
 * Minimal bar chart.
 *
 * Bar heights are in pixels rather than percentages: a percentage height inside
 * an auto-height flex column resolves against zero, which silently renders no
 * bars at all.
 */
const CHART_HEIGHT = 132;

function BarChart({
  bars,
  tone,
}: {
  bars: { key: string; label: string; value: number; max: number; caption: string; title: string }[];
  tone: 'red' | 'blue';
}) {
  return (
    <div className="flex items-end gap-2" style={{ height: CHART_HEIGHT + 34 }}>
      {bars.map((bar) => (
        <div key={bar.key} className="flex flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[10.5px] font-semibold text-muted">{bar.caption}</span>
          <div
            className={cn('w-full rounded-t transition-all', tone === 'red' ? 'bg-brand-red' : 'bg-brand-blue')}
            style={{ height: Math.max(bar.value > 0 ? 6 : 2, (bar.value / bar.max) * CHART_HEIGHT) }}
            title={bar.title}
            role="presentation"
          />
          <span className="text-[11px] text-muted">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-36 items-center justify-center rounded-lg bg-canvas px-6 text-center text-[13px] text-muted">
      {message}
    </div>
  );
}
