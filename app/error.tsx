'use client';

import { useEffect } from 'react';

/**
 * Top-level error boundary.
 *
 * Customers see a plain, reassuring message; the technical detail goes to the
 * console (and to your hosting provider's logs) rather than onto the page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-canvas px-6 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-redSoft text-2xl">
        ⚠️
      </span>
      <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        We could not load this page right now. Please check your connection and try again.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        <button type="button" onClick={reset} className="btn-primary">Try again</button>
        <a href="/" className="btn-outline">Go to the homepage</a>
      </div>
      {error.digest && (
        <p className="mt-4 font-mono text-[11px] text-muted">Reference: {error.digest}</p>
      )}
    </div>
  );
}
