'use client';

import { useMemo, useState } from 'react';

import { ORDER_STATUS_LABELS, cn, formatDate, formatPrice } from '@/lib/format';
import type { DashboardStats, Order, Settings } from '@/lib/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChartIcon } from '@/components/ui/Icon';

/**
 * Reports.
 *
 * Deliberately simple: a date range, headline numbers, and a CSV export so the
 * owner can hand figures to an accountant without needing this app.
 */
export function ReportsView({
  orders,
  settings,
  stats,
}: {
  orders: Order[];
  settings: Settings;
  stats: DashboardStats;
}) {
  const [days, setDays] = useState(30);

  const { inRange, revenue, counted, cancelled, averageOrder, byStatus, byDay } = useMemo(() => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const inRange = orders.filter((o) => Date.parse(o.created_at) >= cutoff);
    const counted = inRange.filter((o) => o.status !== 'cancelled');
    const revenue = counted.reduce((sum, o) => sum + o.total, 0);

    const byStatus: Record<string, number> = {};
    for (const order of inRange) byStatus[order.status] = (byStatus[order.status] ?? 0) + 1;

    const byDay = new Map<string, { revenue: number; orders: number }>();
    for (const order of counted) {
      const key = order.created_at.slice(0, 10);
      const entry = byDay.get(key) ?? { revenue: 0, orders: 0 };
      entry.revenue += order.total;
      entry.orders += 1;
      byDay.set(key, entry);
    }

    return {
      inRange,
      revenue,
      counted,
      cancelled: inRange.length - counted.length,
      averageOrder: counted.length ? revenue / counted.length : 0,
      byStatus,
      byDay: [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0])),
    };
  }, [orders, days]);

  /** Builds a CSV in the browser — no server round trip, no extra dependency. */
  function exportCsv() {
    const rows = [
      ['Order', 'Date', 'Customer', 'Phone', 'City', 'Method', 'Payment', 'Status', 'Subtotal', 'Delivery', 'Total'],
      ...inRange.map((o) => [
        o.order_number,
        o.created_at,
        o.customer_name,
        o.phone,
        o.city ?? '',
        o.delivery_method,
        o.payment_method,
        o.status,
        String(o.subtotal),
        String(o.delivery_fee),
        String(o.total),
      ]),
    ];

    // Quote every field and double any embedded quotes, so commas in names or
    // addresses cannot break the columns.
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const slug = settings.shop_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'shop';
    link.download = `${slug}-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const ranges = [7, 30, 90, 365];

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <span className="text-[13px] font-semibold text-ink">Period</span>
        {ranges.map((range) => (
          <button
            key={range}
            type="button"
            onClick={() => setDays(range)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors',
              days === range
                ? 'border-brand-red bg-brand-red text-white'
                : 'border-line bg-white text-ink hover:border-brand-blue hover:text-brand-blue',
            )}
          >
            Last {range} days
          </button>
        ))}
        <button
          type="button"
          onClick={exportCsv}
          disabled={!inRange.length}
          className="btn-outline btn-sm ml-auto"
        >
          Export CSV
        </button>
      </div>

      <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Metric label="Revenue" value={formatPrice(revenue, settings.currency)} />
        <Metric label="Orders" value={counted.length.toLocaleString()} />
        <Metric label="Average order" value={formatPrice(averageOrder, settings.currency)} />
        <Metric label="Cancelled" value={cancelled.toLocaleString()} tone={cancelled > 0 ? 'red' : undefined} />
      </ul>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="mb-3 text-sm font-bold text-ink">Orders by status</h2>
          {inRange.length ? (
            <ul className="space-y-2">
              {Object.entries(byStatus)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <li key={status} className="flex items-center justify-between text-[13.5px]">
                    <span className="text-muted">
                      {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status}
                    </span>
                    <span className="font-semibold text-ink">{count}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-[13px] text-muted">No orders in this period.</p>
          )}
        </section>

        <section className="card p-4">
          <h2 className="mb-3 text-sm font-bold text-ink">Best-selling products</h2>
          {stats.topProducts.length ? (
            <ul className="space-y-1.5">
              {stats.topProducts.map((product, i) => (
                <li key={product.name} className="flex items-baseline justify-between gap-3 text-[13.5px]">
                  <span className="clamp-2 min-w-0 text-muted">
                    <span className="mr-1.5 font-semibold text-ink">{i + 1}.</span>
                    {product.name}
                  </span>
                  <span className="shrink-0 font-semibold text-ink">
                    {product.quantity} · {formatPrice(product.revenue, settings.currency)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-[13px] text-muted">No product sales yet.</p>
          )}
        </section>
      </div>

      <section className="card overflow-hidden">
        <h2 className="border-b border-line px-4 py-3 text-sm font-bold text-ink">Daily breakdown</h2>
        {byDay.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[380px] text-left text-[13.5px]">
              <thead className="border-b border-line bg-canvas text-[12px] uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-bold">Date</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-bold">Orders</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-bold">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {byDay.slice(0, 60).map(([date, entry]) => (
                  <tr key={date}>
                    <td className="px-4 py-2 text-muted">{formatDate(date)}</td>
                    <td className="px-4 py-2 text-right font-semibold text-ink">{entry.orders}</td>
                    <td className="px-4 py-2 text-right font-semibold text-ink">
                      {formatPrice(entry.revenue, settings.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<ChartIcon size={26} />}
            title="No sales in this period"
            body="Pick a longer period, or come back once orders start arriving."
          />
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'red' }) {
  return (
    <li className="rounded-card border border-line bg-white p-4 shadow-card">
      <p className="text-[12px] font-medium text-muted">{label}</p>
      <p className={cn('mt-0.5 truncate text-xl font-extrabold tracking-tight', tone === 'red' ? 'text-brand-red' : 'text-ink')}>
        {value}
      </p>
    </li>
  );
}
