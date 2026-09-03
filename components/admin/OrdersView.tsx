'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiFetch } from '@/lib/client-api';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  cn,
  formatDateTime,
  formatPrice,
  toWhatsAppNumber,
} from '@/lib/format';
import { useToast } from '@/components/ui/Toast';
import { ORDER_STATUSES, type Order, type OrderStatus, type Paginated, type Settings } from '@/lib/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import {
  ChevronDownIcon,
  ListIcon,
  PhoneIcon,
  SearchIcon,
  StoreIcon,
  TruckIcon,
  WhatsAppIcon,
} from '@/components/ui/Icon';

/**
 * Orders screen.
 *
 * Every order can be expanded in place to see its items and address, and the
 * status changes with one select — the owner should never have to navigate
 * away to move an order along.
 */
export function OrdersView({
  result,
  settings,
  query,
  counts,
}: {
  result: Paginated<Order>;
  settings: Settings;
  query: { q: string; status: string };
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState(query.q);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const buildHref = (overrides: Partial<typeof query> & { page?: number }) => {
    const params = new URLSearchParams();
    const merged = { ...query, ...overrides };
    if (merged.q) params.set('q', merged.q);
    if (merged.status) params.set('status', merged.status);
    if (overrides.page && overrides.page > 1) params.set('page', String(overrides.page));
    return `/admin/orders${params.toString() ? `?${params}` : ''}`;
  };

  async function setStatus(order: Order, status: OrderStatus) {
    if (status === order.status) return;
    if (status === 'cancelled' && !window.confirm(`Cancel order ${order.order_number}? Its stock goes back on the shelf.`)) {
      return;
    }

    setBusyId(order.id);
    try {
      await apiFetch(`/api/orders/${order.id}`, { method: 'PATCH', json: { status } });
      toast.success(`${order.order_number} is now “${ORDER_STATUS_LABELS[status]}”.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update the order.');
    } finally {
      setBusyId(null);
    }
  }

  const tabs: { value: string; label: string }[] = [
    { value: '', label: 'All' },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] })),
  ];

  return (
    <div className="space-y-3">
      {/* Status tabs */}
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {tabs.map((tab) => {
          const active = query.status === tab.value;
          const count = tab.value ? counts[tab.value] ?? 0 : counts.all ?? 0;
          return (
            <button
              key={tab.value || 'all'}
              type="button"
              onClick={() => router.push(buildHref({ status: tab.value, page: 1 }))}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors',
                active
                  ? 'border-brand-red bg-brand-red text-white'
                  : 'border-line bg-white text-ink hover:border-brand-blue hover:text-brand-blue',
              )}
            >
              {tab.label}
              <span className={cn('ml-1.5 text-[11.5px]', active ? 'text-white/80' : 'text-muted')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <form
        className="card relative p-3"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(buildHref({ q: search, page: 1 }));
        }}
      >
        <SearchIcon size={16} className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order number, customer name or phone…"
          className="input h-9 pl-9 text-[13.5px]"
          aria-label="Search orders"
        />
      </form>

      {result.items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ListIcon size={26} />}
            title="No orders here yet"
            body={
              query.q || query.status
                ? 'Try clearing the search or choosing a different status.'
                : 'Orders placed on the shop will appear here the moment they come in.'
            }
          />
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {result.items.map((order) => {
              const isOpen = expanded === order.id;
              return (
                <li key={order.id} className={cn('card overflow-hidden', busyId === order.id && 'opacity-60')}>
                  <div className="grid gap-2 p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : order.id)}
                        aria-expanded={isOpen}
                        className="flex items-center gap-1.5 font-mono text-[14px] font-bold text-ink hover:text-brand-blue"
                      >
                        #{order.order_number}
                        <ChevronDownIcon size={15} className={cn('transition-transform', isOpen && 'rotate-180')} />
                      </button>
                      <p className="text-[12px] text-muted">{formatDateTime(order.created_at)}</p>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-semibold text-ink">{order.customer_name}</p>
                      <p className="flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
                        <a href={`tel:${order.phone}`} className="hover:text-brand-blue">{order.phone}</a>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          {order.delivery_method === 'delivery' ? (
                            <>
                              <TruckIcon size={13} /> {order.city || 'Delivery'}
                            </>
                          ) : (
                            <>
                              <StoreIcon size={13} /> Pickup
                            </>
                          )}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{order.payment_method === 'cod' ? 'COD' : 'Pay at store'}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                      <span className="text-[15px] font-extrabold text-brand-red">
                        {formatPrice(order.total, settings.currency)}
                      </span>

                      <label className="sr-only" htmlFor={`status-${order.id}`}>
                        Status of order {order.order_number}
                      </label>
                      <select
                        id={`status-${order.id}`}
                        value={order.status}
                        onChange={(e) => setStatus(order, e.target.value as OrderStatus)}
                        className={cn(
                          'h-8 rounded-full border-0 px-3 text-[12.5px] font-semibold ring-1 ring-inset focus:ring-2',
                          ORDER_STATUS_STYLES[order.status],
                        )}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {ORDER_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>

                      <a
                        href={`https://wa.me/${toWhatsAppNumber(order.whatsapp || order.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-1.5 text-[#25D366] transition-colors hover:bg-emerald-50"
                        aria-label={`Message ${order.customer_name} on WhatsApp`}
                      >
                        <WhatsAppIcon size={18} />
                      </a>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-line bg-canvas/50 p-3 sm:p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <h3 className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-muted">
                            Customer
                          </h3>
                          <p className="text-[13.5px] font-semibold text-ink">{order.customer_name}</p>
                          <p className="text-[13px] text-muted">
                            <a href={`tel:${order.phone}`} className="inline-flex items-center gap-1 hover:text-brand-blue">
                              <PhoneIcon size={13} /> {order.phone}
                            </a>
                          </p>
                          {order.whatsapp && order.whatsapp !== order.phone && (
                            <p className="text-[13px] text-muted">WhatsApp: {order.whatsapp}</p>
                          )}
                          {order.email && <p className="text-[13px] text-muted">{order.email}</p>}

                          <h3 className="mb-1.5 mt-3 text-[12px] font-bold uppercase tracking-wide text-muted">
                            {order.delivery_method === 'delivery' ? 'Delivery address' : 'Collection'}
                          </h3>
                          <p className="text-[13px] text-muted">
                            {order.delivery_method === 'delivery'
                              ? [order.address_line, order.street, order.area, order.city, order.district]
                                  .filter(Boolean)
                                  .join(', ') || '—'
                              : 'Customer collects from the shop.'}
                          </p>
                          {order.notes && (
                            <p className="mt-2 rounded-lg bg-brand-blueSoft px-3 py-2 text-[12.5px] text-brand-blueDark">
                              <strong>Note:</strong> {order.notes}
                            </p>
                          )}
                        </div>

                        <div>
                          <h3 className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-muted">
                            Items ({order.items.length})
                          </h3>
                          <ul className="divide-y divide-line rounded-lg border border-line bg-white">
                            {order.items.map((item) => (
                              <li key={item.id} className="flex items-start justify-between gap-3 px-3 py-2 text-[13px]">
                                <span className="min-w-0">
                                  <span className="block font-medium text-ink">{item.product_name}</span>
                                  <span className="text-muted">
                                    {formatPrice(item.unit_price, settings.currency)} × {item.quantity}
                                  </span>
                                </span>
                                <span className="shrink-0 font-semibold text-ink">
                                  {formatPrice(item.total, settings.currency)}
                                </span>
                              </li>
                            ))}
                          </ul>

                          <dl className="mt-2 space-y-1 text-[13px]">
                            <div className="flex justify-between">
                              <dt className="text-muted">Subtotal</dt>
                              <dd className="font-semibold text-ink">
                                {formatPrice(order.subtotal, settings.currency)}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-muted">Delivery</dt>
                              <dd className="font-semibold text-ink">
                                {order.delivery_fee === 0 ? 'Free' : formatPrice(order.delivery_fee, settings.currency)}
                              </dd>
                            </div>
                            {order.discount > 0 && (
                              <div className="flex justify-between">
                                <dt className="text-muted">Discount</dt>
                                <dd className="font-semibold text-emerald-600">
                                  −{formatPrice(order.discount, settings.currency)}
                                </dd>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-line pt-1.5 text-[15px]">
                              <dt className="font-bold text-ink">Total</dt>
                              <dd className="font-extrabold text-brand-red">
                                {formatPrice(order.total, settings.currency)}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath="/admin/orders"
            params={query}
          />
        </>
      )}
    </div>
  );
}
