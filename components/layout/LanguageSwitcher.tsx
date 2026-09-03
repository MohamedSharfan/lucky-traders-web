'use client';

import { useEffect, useRef, useState } from 'react';

import { useI18n } from '@/lib/i18n/LanguageProvider';
import { cn } from '@/lib/format';
import { ChevronDownIcon } from '@/components/ui/Icon';

/**
 * Language picker (English / Sinhala / Tamil).
 * The choice is stored per browser; product names switch to their translated
 * value automatically wherever one exists in the database.
 */
export function LanguageSwitcher({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const { locale, setLocale, locales, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = locales.find((l) => l.code === locale) ?? locales[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('nav.language')}
        className={cn(
          // min-h keeps this above the 32px pointer-target floor; it is a real
          // control, not an inline text link, so the WCAG inline exception
          // does not apply to it.
          'inline-flex min-h-[32px] items-center gap-1 rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors',
          variant === 'dark'
            ? 'text-white/90 hover:bg-white/10 hover:text-white'
            : 'text-ink hover:bg-canvas',
        )}
      >
        <span>{current.label}</span>
        <ChevronDownIcon size={14} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-line bg-white py-1 shadow-pop animate-fade-in"
        >
          {locales.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === locale}
                onClick={() => {
                  setLocale(l.code);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-canvas',
                  l.code === locale ? 'font-semibold text-brand-blue' : 'text-ink',
                )}
              >
                {l.label}
                {l.code === locale && <span aria-hidden="true">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
