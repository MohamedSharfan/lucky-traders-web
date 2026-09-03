'use client';

import { useI18n } from '@/lib/i18n/LanguageProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchIcon } from '@/components/ui/Icon';

/** Heading above a product listing: search term, category name or a fallback. */
export function ListingHeader({
  searchTerm,
  categoryName,
  total,
}: {
  searchTerm?: string;
  categoryName?: string | null;
  total: number;
}) {
  const { t } = useI18n();

  const heading = searchTerm
    ? t('listing.searchResultsFor', { term: searchTerm })
    : categoryName ?? t('nav.allProducts');

  return (
    <header className="mb-4">
      <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{heading}</h1>
      <p className="mt-0.5 text-[13px] text-muted">{t('listing.results', { count: total })}</p>
    </header>
  );
}

/** Shown when filters or a search return nothing. */
export function NoResults() {
  const { t } = useI18n();
  return (
    <div className="card">
      <EmptyState
        icon={<SearchIcon size={26} />}
        title={t('listing.noResults')}
        body={t('listing.noResultsBody')}
        actionLabel={t('nav.allProducts')}
        actionHref="/products"
      />
    </div>
  );
}
