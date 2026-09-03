import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { FloatingWhatsApp } from '@/components/layout/FloatingWhatsApp';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

/**
 * Customer-facing shell: header, footer, bottom navigation and the floating
 * WhatsApp button. The admin panel deliberately uses a different shell.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <main id="main" className="flex-1 pb-mobile-nav">
        {children}
      </main>
      <Footer />
      <FloatingWhatsApp />
      <MobileBottomNav />
    </div>
  );
}
