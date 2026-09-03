/** Simple promotional banner used at the top of the offers page. */
export function PromoBanner({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5 overflow-hidden rounded-card bg-gradient-to-r from-brand-red to-brand-redDark px-6 py-7 text-white sm:px-8 sm:py-9">
      <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/80">Limited time</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-1.5 text-sm text-white/90 sm:text-base">{subtitle}</p>
    </div>
  );
}
