import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-canvas px-6 text-center">
      <p className="text-[64px] font-black leading-none text-brand-red">404</p>
      <h1 className="mt-2 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
        We could not find that page
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        The page may have moved, or the product may no longer be in our catalog.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        <Link href="/" className="btn-primary">Go to the homepage</Link>
        <Link href="/products" className="btn-outline">Browse products</Link>
      </div>
    </div>
  );
}
