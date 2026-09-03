import type { Metadata } from 'next';

import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { CheckoutHeading } from '@/components/checkout/CheckoutHeading';

// Store settings live in the database, so the shell must render per request.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="container-app py-5">
      <CheckoutHeading />
      <CheckoutForm />
    </div>
  );
}
