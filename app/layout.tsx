import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Sinhala, Noto_Sans_Tamil } from 'next/font/google';

import './globals.css';
import { StoreProvider } from '@/components/StoreProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { CartProvider } from '@/lib/cart/CartProvider';
import { LanguageProvider } from '@/lib/i18n/LanguageProvider';
import { getDb } from '@/lib/db';
import type { Category, Settings } from '@/lib/types';

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

/**
 * Loads the shop chrome — name, contact details, category menu.
 *
 * This runs for every page, including the `/_not-found` shell that Next
 * prerenders at build time. A build must not depend on production
 * infrastructure being up, so an unreachable database falls back to the packaged
 * defaults here rather than failing the whole deployment.
 *
 * That is safe because this only supplies presentation: every page that needs
 * real data fetches it itself and still fails loudly if the database is down.
 * Nothing is ever written through this path.
 */
async function loadShell(): Promise<{ settings: Settings; categories: Category[] }> {
  try {
    const db = await getDb();
    const [settings, categories] = await Promise.all([db.getSettings(), db.listCategories()]);
    return { settings, categories };
  } catch (error) {
    const { defaultSettings } = await import('@/data/build-catalog.mjs');
    console.error(
      '[layout] Falling back to default shop details; the database is unreachable.',
      error instanceof Error ? error.message : error,
    );
    return { settings: defaultSettings as Settings, categories: [] };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await loadShell();
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
  const { settings, categories } = await loadShell();

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
