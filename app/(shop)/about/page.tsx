import type { Metadata } from 'next';
import Link from 'next/link';

import { getDb } from '@/lib/db';
import { StoreIcon, TruckIcon, UsersIcon, WhatsAppIcon } from '@/components/ui/Icon';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const db = await getDb();
  const settings = await db.getSettings();
  return {
    title: `About ${settings.shop_name}`,
    description: `${settings.shop_name} — ${settings.shop_subtitle}. Your trusted local grocery store, now online.`,
  };
}

export default async function AboutPage() {
  const db = await getDb();
  const settings = await db.getSettings();

  const points = [
    {
      icon: StoreIcon,
      title: 'A neighbourhood shop, online',
      body: `${settings.shop_name} has served families in and around ${settings.address.split(',').slice(-3, -2)[0]?.trim() || 'our area'} with the everyday things a household runs on — rice, dhal, spices, tea, soap, school books. This website is that same shop, open on your phone.`,
    },
    {
      icon: UsersIcon,
      title: 'We know what you buy',
      body: 'Our shelves are stocked for real Sri Lankan kitchens: Keeri Samba and Nadu, roasted curry powder and goraka, milk powder and cream soda. If we do not have it, ask us on WhatsApp and we will try to get it in.',
    },
    {
      icon: WhatsAppIcon,
      title: 'Order the way you already chat',
      body: 'No account. No password. Fill your cart, tap the button, and your order arrives in our WhatsApp exactly as you built it. We reply to confirm, and that is it.',
    },
    {
      icon: TruckIcon,
      title: 'Delivered, or ready when you are',
      body: 'We deliver around our usual routes, and you are always welcome to collect from the counter. Pay cash on delivery or at the shop — whichever suits you.',
    },
  ];

  return (
    <div className="container-app py-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-brand-red">
            {settings.shop_subtitle}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            About {settings.shop_name}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            A trusted local grocery store providing everyday essentials and household products to our
            community. We have kept the same counter, the same faces and the same prices — we have just
            added a way to shop from home.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          {points.map(({ icon: Icon, title, body }) => (
            <section key={title} className="card p-5">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blueSoft text-brand-blue">
                <Icon size={20} />
              </span>
              <h2 className="text-sm font-bold text-ink">{title}</h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{body}</p>
            </section>
          ))}
        </div>

        <div className="card mt-5 p-5">
          <h2 className="text-base font-bold text-ink">Visit us</h2>
          <p className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed text-muted">
            {settings.address}
          </p>
          {settings.opening_hours && (
            <p className="mt-3 whitespace-pre-line text-[13.5px] text-muted">{settings.opening_hours}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link href="/contact" className="btn-secondary">
              Contact us
            </Link>
            <Link href="/products" className="btn-outline">
              Start shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
