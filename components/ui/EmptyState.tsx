import Link from 'next/link';

import { cn } from '@/lib/format';

/**
 * Shared empty state. Every "nothing here" surface in the app uses this so the
 * tone and spacing stay consistent (empty cart, no search results, no orders).
 */
export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  actionHref,
  onAction,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-canvas text-muted">
          {icon}
        </div>
      )}
      <h2 className="text-base font-bold text-ink sm:text-lg">{title}</h2>
      {body && <p className="mt-1.5 max-w-sm text-sm text-muted">{body}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary mt-5">
          {actionLabel}
        </Link>
      )}
      {actionLabel && !actionHref && onAction && (
        <button type="button" onClick={onAction} className="btn-primary mt-5">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
