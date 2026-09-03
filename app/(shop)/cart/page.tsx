import type { Metadata } from 'next';

import { CartView } from '@/components/cart/CartView';
import { CartPageHeading } from '@/components/cart/CartPageHeading';

// Store settings live in the database, so the shell must render per request.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Shopping Cart' };

export default function CartPage() {
  return (
    <div className="container-app py-5">
      <CartPageHeading />
      <CartView />
    </div>
  );
}
