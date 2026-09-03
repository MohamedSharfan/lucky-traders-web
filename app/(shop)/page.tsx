import { getDb } from '@/lib/db';
import { CategoryStrip } from '@/components/home/CategoryStrip';
import { DeliveryInfo, WhatsAppCta } from '@/components/home/DeliveryAndCta';
import { HeroSection } from '@/components/home/HeroSection';
import { ProductRow } from '@/components/home/ProductRow';
import { WhyShop } from '@/components/home/WhyShop';

/**
 * Homepage.
 *
 * Every row is driven by admin-controlled flags (`is_sale` via a sale price,
 * `is_best_seller`, `is_new`, `is_featured`) so the owner curates the front
 * page from the product editor without touching code. Rows with no products
 * simply do not render.
 */

// Product data changes whenever the owner edits it, so render per request.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const db = await getDb();

  const [offers, bestSellers, popular, newArrivals, featured] = await Promise.all([
    db.queryProducts({ onSaleOnly: true, sort: 'discount', pageSize: 12 }),
    db.queryProducts({ bestSellerOnly: true, sort: 'popular', pageSize: 12 }),
    db.queryProducts({ sort: 'popular', pageSize: 12 }),
    db.queryProducts({ newOnly: true, sort: 'newest', pageSize: 12 }),
    db.queryProducts({ featuredOnly: true, sort: 'popular', pageSize: 12 }),
  ]);

  return (
    <>
      <HeroSection />
      <CategoryStrip />

      <ProductRow
        titleKey="home.todaysOffers"
        subtitle="Save on this week's grocery picks"
        href="/offers"
        products={offers.items}
        accent="red"
        priority
      />

      <ProductRow
        titleKey="home.bestSellers"
        subtitle="What our customers buy most"
        href="/products?best=true"
        products={bestSellers.items}
        accent="red"
      />

      <ProductRow
        titleKey="home.popular"
        href="/products"
        products={popular.items}
        accent="blue"
      />

      <ProductRow
        titleKey="home.newArrivals"
        subtitle="Just landed on our shelves"
        href="/new-arrivals"
        products={newArrivals.items}
        accent="blue"
      />

      <ProductRow
        titleKey="home.featured"
        href="/products?featured=true"
        products={featured.items}
        accent="red"
      />

      <WhyShop />
      <DeliveryInfo />
      <WhatsAppCta />
    </>
  );
}
