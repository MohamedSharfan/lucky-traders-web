'use client';

import Link from 'next/link';
import { useState } from 'react';

import { formatDate, formatPrice, toWhatsAppNumber } from '@/lib/format';
import type { Settings } from '@/lib/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchIcon, UsersIcon, WhatsAppIcon } from '@/components/ui/Icon';

interface Customer {
  name: string;
  phone: string;
  whatsapp: string | null;
  city: string | null;
  orders: number;
  spent: number;
  last: string;
}

/** Customer list derived from orders, searchable by name, phone or city. */
export function CustomersTable({
  customers,
  settings,
}: {
  customers: Customer[];
  settings: Settings;
}) {
  const [search, setSearch] = useState('');

  const term = search.trim().toLowerCase();
  const filtered = term
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.phone.includes(term) ||
          (c.city ?? '').toLowerCase().includes(term),
      )
    : customers;

  if (!customers.length) {
    return (
      <div className="card">
        <EmptyState
          icon={<UsersIcon size={26} />}
          title="No customers yet"
          body="As soon as someone places an order, they will show up here."
          actionLabel="View the shop"
          actionHref="/"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="card relative p-3">
        <SearchIcon size={16} className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone or city…"
          className="input h-9 pl-9 text-[13.5px]"
          aria-label="Search customers"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState title="No customers match" body="Try a different search term." />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-[13.5px]">
            <thead className="border-b border-line bg-canvas text-[12px] uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-bold">Customer</th>
                <th scope="col" className="px-3 py-2.5 font-bold">Phone</th>
                <th scope="col" className="px-3 py-2.5 font-bold">City</th>
                <th scope="col" className="px-3 py-2.5 text-right font-bold">Orders</th>
                <th scope="col" className="px-3 py-2.5 text-right font-bold">Total spent</th>
                <th scope="col" className="px-3 py-2.5 font-bold">Last order</th>
                <th scope="col" className="px-4 py-2.5 text-right font-bold">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((customer) => (
                <tr key={customer.phone}>
                  <td className="px-4 py-2.5 font-semibold text-ink">{customer.name}</td>
                  <td className="px-3 py-2.5">
                    <a href={`tel:${customer.phone}`} className="text-muted hover:text-brand-blue">
                      {customer.phone}
                    </a>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{customer.city ?? '—'}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-ink">{customer.orders}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-brand-red">
                    {formatPrice(customer.spent, settings.currency)}
                  </td>
                  <td className="px-3 py-2.5 text-muted">{formatDate(customer.last)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/orders?q=${encodeURIComponent(customer.phone)}`}
                        className="btn-outline btn-sm"
                      >
                        Orders
                      </Link>
                      <a
                        href={`https://wa.me/${toWhatsAppNumber(customer.whatsapp || customer.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-1.5 text-[#25D366] transition-colors hover:bg-emerald-50"
                        aria-label={`Message ${customer.name} on WhatsApp`}
                      >
                        <WhatsAppIcon size={18} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
