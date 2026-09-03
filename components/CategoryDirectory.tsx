'use client';

import Link from 'next/link';

import { useI18n } from '@/lib/i18n/LanguageProvider';
import { placeholderTint } from '@/lib/format';
import type { Category } from '@/lib/types';

/** Full A-Z style category directory used by /categories. */
export function CategoryDirectory({
  tree,
}: {
  tree: { root: Category; children: Category[] }[];
}) {
  const { t, ln } = useI18n();

  return (
    <div className="container-app py-5">
      <header className="mb-4">
        <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
          {t('home.shopByCategory')}
        </h1>
        <p className="mt-0.5 text-[13px] text-muted">
          {tree.length} categories · {tree.reduce((s, x) => s + x.children.length, 0)} subcategories
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tree.map(({ root, children }) => {
          const tint = placeholderTint(root.name);
          return (
            <section key={root.id} className="card flex flex-col p-4">
              <Link
                href={`/products?category=${root.slug}`}
                className="group flex items-center gap-3"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-2xl"
                  style={{ backgroundColor: tint.bg }}
                  aria-hidden="true"
                >
                  {root.icon ?? '🛒'}
                </span>
                <span className="min-w-0">
                  <h2 className="truncate text-[15px] font-bold text-ink group-hover:text-brand-blue">
                    {ln(root)}
                  </h2>
                  <span className="block text-[12px] text-muted">{children.length} subcategories</span>
                </span>
              </Link>

              {children.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/products?category=${child.slug}`}
                        className="inline-block rounded-full border border-line px-2.5 py-1 text-[12.5px] text-muted transition-colors hover:border-brand-blue hover:text-brand-blue"
                      >
                        {ln(child)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
