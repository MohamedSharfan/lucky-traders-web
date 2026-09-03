'use client';

import Link from 'next/link';

import { cn } from '@/lib/format';
import { useI18n } from '@/lib/i18n/LanguageProvider';
import { ChevronLeftIcon, ChevronRightIcon } from './Icon';

/**
 * Link-based pagination, so results stay shareable and work without JS.
 *
 * Props are plain data rather than a `buildHref` callback: this component is a
 * client component, and functions cannot cross the server/client boundary.
 */
export function Pagination({
  page,
  totalPages,
  basePath,
  params = {},
}: {
  page: number;
  totalPages: number;
  /** e.g. "/products" — the path links are built on. */
  basePath: string;
  /** Query params to carry across pages; empty values are dropped. */
  params?: Record<string, string | number | undefined | null>;
}) {
  const { t } = useI18n();
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === 'page') continue;
      if (value !== undefined && value !== null && String(value) !== '') {
        search.set(key, String(value));
      }
    }
    if (target > 1) search.set('page', String(target));
    return `${basePath}${search.toString() ? `?${search}` : ''}`;
  };

  // A compact window of page numbers around the current page.
  const windowSize = 5;
  const end = Math.min(totalPages, Math.max(page + 2, windowSize));
  const start = Math.max(1, Math.min(page - 2, end - windowSize + 1));
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const linkClass = (active: boolean) =>
    cn(
      'inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors',
      active
        ? 'border-brand-blue bg-brand-blue text-white'
        : 'border-line bg-white text-ink hover:border-brand-blue hover:text-brand-blue',
    );

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} className={linkClass(false)} rel="prev">
          <ChevronLeftIcon size={16} />
          <span className="ml-1 hidden sm:inline">{t('listing.previous')}</span>
        </Link>
      ) : (
        <span className={cn(linkClass(false), 'cursor-not-allowed opacity-40')} aria-disabled="true">
          <ChevronLeftIcon size={16} />
          <span className="ml-1 hidden sm:inline">{t('listing.previous')}</span>
        </span>
      )}

      {start > 1 && (
        <>
          <Link href={href(1)} className={linkClass(false)}>1</Link>
          {start > 2 && <span className="px-1 text-muted" aria-hidden="true">…</span>}
        </>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          className={linkClass(p === page)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </Link>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-muted" aria-hidden="true">…</span>}
          <Link href={href(totalPages)} className={linkClass(false)}>{totalPages}</Link>
        </>
      )}

      {page < totalPages ? (
        <Link href={href(page + 1)} className={linkClass(false)} rel="next">
          <span className="mr-1 hidden sm:inline">{t('listing.next')}</span>
          <ChevronRightIcon size={16} />
        </Link>
      ) : (
        <span className={cn(linkClass(false), 'cursor-not-allowed opacity-40')} aria-disabled="true">
          <span className="mr-1 hidden sm:inline">{t('listing.next')}</span>
          <ChevronRightIcon size={16} />
        </span>
      )}
    </nav>
  );
}
