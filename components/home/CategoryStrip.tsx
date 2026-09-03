'use client';

import Link from 'next/link';

import { useI18n } from '@/lib/i18n/LanguageProvider';
import { useStore } from '@/components/StoreProvider';
import { placeholderTint } from '@/lib/format';
import { SectionHeader } from './SectionHeader';

/**
 * Category shortcuts.
 * A horizontally scrollable strip on phones, a grid from tablet upwards.
 */
export function CategoryStrip() {
  const { rootCategories } = useStore();
  const { t, ln } = useI18n();

  return (
    <section className="container-app mt-8">
      <SectionHeader title={t('home.shopByCategory')} href="/categories" accent="blue" />

      <ul className="no-scrollbar -mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
        {rootCategories.map((cat) => {
          const tint = placeholderTint(cat.name);
          return (
            <li key={cat.id} className="w-[100px] shrink-0 sm:w-auto">
              <Link
                href={`/products?category=${cat.slug}`}
                className="group flex h-full flex-col items-center gap-2 rounded-card border border-line bg-white p-3 text-center shadow-card transition-colors hover:border-brand-blue"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
                  style={{ backgroundColor: tint.bg }}
                  aria-hidden="true"
                >
                  {cat.icon ?? '🛒'}
                </span>
                <span className="clamp-2 text-[12px] font-semibold leading-tight text-ink group-hover:text-brand-blue">
                  {ln(cat)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
