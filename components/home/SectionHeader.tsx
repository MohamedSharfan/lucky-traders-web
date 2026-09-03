'use client';

import Link from 'next/link';

import { useI18n } from '@/lib/i18n/LanguageProvider';
import { ChevronRightIcon } from '@/components/ui/Icon';

/** Shared heading for every homepage row: title, optional accent, "View all". */
export function SectionHeader({
  title,
  subtitle,
  href,
  accent,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  accent?: 'red' | 'blue';
}) {
  const { t } = useI18n();
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink sm:text-xl">
          {accent && (
            <span
              aria-hidden="true"
              className={`inline-block h-5 w-1.5 rounded-full ${accent === 'red' ? 'bg-brand-red' : 'bg-brand-blue'}`}
            />
          )}
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 truncate text-[13px] text-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-brand-blue hover:underline"
        >
          {t('home.viewAll')}
          <ChevronRightIcon size={15} />
        </Link>
      )}
    </div>
  );
}
