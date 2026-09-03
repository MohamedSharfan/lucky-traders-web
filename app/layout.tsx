import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Sinhala, Noto_Sans_Tamil } from 'next/font/google';

import './globals.css';
import { StoreProvider } from '@/components/StoreProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { CartProvider } from '@/lib/cart/CartProvider';
import { LanguageProvider } from '@/lib/i18n/LanguageProvider';
import { getDb } from '@/lib/db';

/**
 * Fonts are self-hosted through next/font: no render-blocking request to
 * Google, and no layout shift. Sinhala and Tamil faces are included so
 * translated product names render correctly rather than as boxes.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const notoSinhala = Noto_Sans_Sinhala({
  subsets: ['sinhala'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-sinhala',
});

const notoTamil = Noto_Sans_Tamil({
  subsets: ['tamil'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-tamil',
});

/**
 * Root layout.
 *
 * Store settings and the category tree are read once per request here and
 * handed to every client component through <StoreProvider>, which is why no
 * page ever hard-codes the shop name, phone number or delivery fees.
 */

export async function generateMetadata(): Promise<Metadata> {
  const db = await getDb();
  const settings = await db.getSettings();
  const title = `${settings.shop_name} — ${settings.shop_subtitle}`;

  return {
    title: { default: title, template: `%s | ${settings.shop_name}` },
    description: settings.tagline,
    applicationName: settings.shop_name,
    openGraph: {
      title,
      description: settings.tagline,
      type: 'website',
      locale: 'en_LK',
    },
    icons: { icon: [{ url: '/logo.svg', type: 'image/svg+xml' }] },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFFFFF',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const db = await getDb();
  const [settings, categories] = await Promise.all([db.getSettings(), db.listCategories()]);

  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoSinhala.variable} ${notoTamil.variable}`}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-brand-blue focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <LanguageProvider>
          <StoreProvider settings={settings} categories={categories}>
            <CartProvider>
              <ToastProvider>{children}</ToastProvider>
            </CartProvider>
          </StoreProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
