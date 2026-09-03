import Link from 'next/link';

/** Standard heading for every admin screen, with an optional primary action. */
export function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
  children,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {actionLabel && actionHref && (
          <Link href={actionHref} className="btn-primary">
            {actionLabel}
          </Link>
        )}
      </div>
    </header>
  );
}
