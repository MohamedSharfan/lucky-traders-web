'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import { useI18n } from '@/lib/i18n/LanguageProvider';
import { cn } from '@/lib/format';
import { CloseIcon, SearchIcon } from '@/components/ui/Icon';

/**
 * Product search.
 *
 * Submits to /products?q=… so results are a normal, shareable, server-rendered
 * page — no client-side search index to download on a slow connection.
 */
interface SearchBarProps {
  className?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
}

/**
 * `useSearchParams` opts a subtree into client-side rendering, so the field is
 * wrapped in Suspense with a matching-height placeholder. Without this, any
 * statically prerendered page containing the header fails to build.
 */
export function SearchBar(props: SearchBarProps) {
  return (
    <Suspense fallback={<div className={`h-11 w-full rounded-lg border border-line bg-white ${props.className ?? ''}`} />}>
      <SearchBarInner {...props} />
    </Suspense>
  );
}

function SearchBarInner({ className, autoFocus = false, onSubmitted }: SearchBarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the field in sync when landing on /products?q=rice
  useEffect(() => {
    setValue(params.get('q') ?? '');
  }, [params]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = value.trim();
    router.push(term ? `/products?q=${encodeURIComponent(term)}` : '/products');
    onSubmitted?.();
  };

  return (
    <form role="search" onSubmit={submit} className={cn('relative w-full', className)}>
      <label htmlFor="site-search" className="sr-only">
        {t('nav.search')}
      </label>
      <SearchIcon
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        id="site-search"
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('nav.searchPlaceholder')}
        autoComplete="off"
        className="h-11 w-full rounded-lg border border-line bg-white pl-10 pr-24 text-[15px] text-ink
                   placeholder:text-muted/80 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue('');
            inputRef.current?.focus();
          }}
          className="absolute right-[76px] top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
          aria-label="Clear search"
        >
          <CloseIcon size={16} />
        </button>
      )}
      <button
        type="submit"
        className="absolute right-1 top-1/2 h-9 -translate-y-1/2 rounded-md bg-brand-red px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-redDark"
      >
        {t('nav.search')}
      </button>
    </form>
  );
}
