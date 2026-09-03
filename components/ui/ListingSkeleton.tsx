/**
 * Loading skeleton for product listings.
 *
 * Only used by `loading.tsx` files on listing routes. A `loading.tsx` starts
 * streaming the response immediately, which locks in a 200 status — so these
 * must never sit above a route that calls `notFound()` (product detail, order
 * confirmation), or its 404s would be served as 200s.
 */
export function ListingSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="container-app py-5">
      <div className="skeleton mb-2 h-7 w-52" />
      <div className="skeleton mb-4 h-3.5 w-28" />

      <div className="flex gap-6">
        <div className="hidden w-[240px] shrink-0 space-y-4 lg:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-7 w-full" />
              <div className="skeleton h-7 w-full" />
              <div className="skeleton h-7 w-3/4" />
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between">
            <div className="skeleton h-8 w-24" />
            <div className="skeleton h-8 w-36" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-card border border-line bg-white shadow-card">
                <div className="skeleton aspect-square w-full rounded-none" />
                <div className="space-y-2 p-3">
                  <div className="skeleton h-3 w-1/3" />
                  <div className="skeleton h-3.5 w-full" />
                  <div className="skeleton h-3.5 w-2/3" />
                  <div className="skeleton h-5 w-1/2" />
                  <div className="skeleton h-9 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
