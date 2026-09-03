'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useCart } from '@/lib/cart/CartProvider';
import { useI18n } from '@/lib/i18n/LanguageProvider';
import { useStore } from '@/components/StoreProvider';
import { useToast } from '@/components/ui/Toast';
import { cn, formatPrice, isValidEmail, isValidSriLankanPhone } from '@/lib/format';
import { whatsappLink } from '@/lib/whatsapp';
import {
  PAYMENT_METHODS_BY_DELIVERY,
  defaultPaymentMethod,
  type DeliveryMethod,
  type PaymentMethod,
} from '@/lib/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { CartIcon, StoreIcon, TruckIcon, WalletIcon, WhatsAppIcon } from '@/components/ui/Icon';

/**
 * Checkout.
 *
 * Guest-only by design — the brief asks for the fewest possible steps. On
 * submit the order is created server-side (which re-reads prices and stock),
 * then WhatsApp opens with the generated message and the customer lands on the
 * confirmation page.
 */

interface FormState {
  customer_name: string;
  phone: string;
  whatsapp: string;
  sameWhatsapp: boolean;
  email: string;
  address_line: string;
  street: string;
  area: string;
  city: string;
  district: string;
  notes: string;
  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;
}

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara',
  'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa',
  'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle',
];

const DRAFT_KEY = 'sk.checkout.draft';

export function CheckoutForm() {
  const router = useRouter();
  const { lines, subtotal, ready, clear } = useCart();
  const { settings } = useStore();
  const { t, ln } = useI18n();
  const toast = useToast();

  // Whichever order type the shop currently offers, preferring delivery.
  const initialDeliveryMethod: DeliveryMethod = settings.delivery_enabled ? 'delivery' : 'pickup';
  const orderingAvailable = settings.delivery_enabled || settings.pickup_enabled;

  const [form, setForm] = useState<FormState>({
    customer_name: '',
    phone: '',
    whatsapp: '',
    sameWhatsapp: true,
    email: '',
    address_line: '',
    street: '',
    area: '',
    city: '',
    district: 'Kandy',
    notes: '',
    delivery_method: initialDeliveryMethod,
    // Derived, never hardcoded: with delivery switched off the order type
    // starts as pickup, and 'cod' would be a pair the API rejects.
    payment_method: defaultPaymentMethod(initialDeliveryMethod),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  // Remember details between visits so repeat customers type less. Only the
  // contact and address fields are restored - never the order or payment type,
  // which must always be decided together on this visit.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<FormState>;
      delete draft.delivery_method;
      delete draft.payment_method;
      setForm((prev) => ({ ...prev, ...draft }));
    } catch {
      /* a corrupt draft should never block checkout */
    }
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  /**
   * Changing the order type also changes how it gets paid for: a delivery is
   * paid in cash on arrival, a pickup at the counter. Switching both together
   * means the customer can never submit a contradictory pair.
   */
  const setDeliveryMethod = (method: DeliveryMethod) => {
    setForm((prev) => ({
      ...prev,
      delivery_method: method,
      payment_method: defaultPaymentMethod(method),
    }));
    setErrors((prev) => ({ ...prev, delivery_method: undefined, payment_method: undefined }));
  };

  const isPickup = form.delivery_method === 'pickup';
  const availablePayments = PAYMENT_METHODS_BY_DELIVERY[form.delivery_method];

  const deliveryFee = useMemo(() => {
    if (isPickup || !settings.delivery_enabled) return 0;
    if (settings.free_delivery_threshold > 0 && subtotal >= settings.free_delivery_threshold) return 0;
    const area = (form.area || form.city).trim().toLowerCase();
    const match = settings.delivery_areas?.find((a) => a.is_active && a.name.toLowerCase() === area);
    return match ? match.fee : settings.delivery_fee;
  }, [isPickup, settings, subtotal, form.area, form.city]);

  const total = subtotal + deliveryFee;

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (form.customer_name.trim().length < 2) next.customer_name = t('checkout.required');
    if (!isValidSriLankanPhone(form.phone)) next.phone = t('checkout.invalidPhone');
    if (!form.sameWhatsapp && form.whatsapp && !isValidSriLankanPhone(form.whatsapp)) {
      next.whatsapp = t('checkout.invalidPhone');
    }
    if (form.email.trim() && !isValidEmail(form.email)) next.email = t('checkout.invalidEmail');

    if (!availablePayments.includes(form.payment_method)) {
      next.payment_method = isPickup
        ? 'Store pickup orders are paid at the counter.'
        : 'Home delivery orders are paid in cash on arrival.';
    }

    if (!isPickup) {
      if (!form.address_line.trim() && !form.street.trim()) next.address_line = t('checkout.required');
      if (!form.city.trim()) next.city = t('checkout.required');
    }

    setErrors(next);
    if (Object.keys(next).length) {
      // Move focus to the first problem so keyboard and screen-reader users
      // are not left guessing.
      const first = Object.keys(next)[0];
      document.getElementById(first)?.focus();
      return false;
    }
    return true;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!lines.length) {
      toast.error(t('checkout.emptyCart'));
      return;
    }
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Open the tab synchronously: browsers block window.open once an await
      // has run, so the popup is created now and pointed at WhatsApp later.
      const waTab = window.open('', '_blank');

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.customer_name,
          phone: form.phone,
          whatsapp: form.sameWhatsapp ? form.phone : form.whatsapp,
          email: form.email,
          address_line: isPickup ? '' : form.address_line,
          street: isPickup ? '' : form.street,
          area: isPickup ? '' : form.area,
          city: isPickup ? '' : form.city,
          district: isPickup ? '' : form.district,
          notes: form.notes,
          delivery_method: form.delivery_method,
          payment_method: form.payment_method,
          items: lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
        }),
      });

      const json = await res.json();
      if (!json.ok) {
        waTab?.close();
        toast.error(json.error || t('checkout.failed'));
        return;
      }

      try {
        window.localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            customer_name: form.customer_name,
            phone: form.phone,
            whatsapp: form.whatsapp,
            sameWhatsapp: form.sameWhatsapp,
            email: form.email,
            address_line: form.address_line,
            street: form.street,
            area: form.area,
            city: form.city,
            district: form.district,
          }),
        );
      } catch {
        /* ignore */
      }

      const link = whatsappLink(json.data.whatsapp_number, json.data.whatsapp_message);
      if (waTab) waTab.location.href = link;
      else window.location.href = link;

      clear();
      // The token makes the confirmation link private to this customer.
      const { order, } = json.data;
      router.push(`/order/${order.order_number}?t=${encodeURIComponent(order.access_token)}`);
    } catch {
      toast.error('We could not reach the server. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) return <CheckoutSkeleton />;

  if (!lines.length) {
    return (
      <div className="card mx-auto max-w-2xl">
        <EmptyState
          icon={<CartIcon size={26} />}
          title={t('cart.empty')}
          body={t('cart.emptyBody')}
          actionLabel={t('cart.startShopping')}
          actionHref="/products"
        />
      </div>
    );
  }

  // The owner can switch both delivery and pickup off in Delivery Settings.
  // Rendering a form nobody could submit would waste the customer's time, so
  // say so plainly and point them at WhatsApp instead.
  if (!orderingAvailable) {
    return (
      <div className="card mx-auto max-w-2xl">
        <EmptyState
          icon={<StoreIcon size={26} />}
          title="Online ordering is paused"
          body={`${settings.shop_name} is not taking delivery or pickup orders right now. Your cart is saved — please message us and we will help.`}
          actionLabel={t('contact.chatWhatsapp')}
          actionHref="/contact"
        />
      </div>
    );
  }

  const field = (key: keyof FormState) => cn('input', errors[key] && 'input-error');

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {/* Customer */}
        <section className="card p-4 sm:p-5">
          <h2 className="mb-4 text-base font-bold text-ink">{t('checkout.customerInfo')}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="customer_name" className="label">
                {t('checkout.fullName')} <span className="text-brand-red">*</span>
              </label>
              <input
                id="customer_name"
                name="name"
                autoComplete="name"
                className={field('customer_name')}
                value={form.customer_name}
                onChange={(e) => set('customer_name', e.target.value)}
                aria-invalid={Boolean(errors.customer_name)}
                aria-describedby={errors.customer_name ? 'customer_name-error' : undefined}
              />
              {errors.customer_name && (
                <p id="customer_name-error" className="field-error">{errors.customer_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="label">
                {t('checkout.mobile')} <span className="text-brand-red">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0771234567"
                className={field('phone')}
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
              />
              {errors.phone && <p id="phone-error" className="field-error">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="whatsapp" className="label">
                {t('checkout.whatsapp')}
              </label>
              <input
                id="whatsapp"
                type="tel"
                inputMode="tel"
                placeholder="0771234567"
                className={field('whatsapp')}
                value={form.sameWhatsapp ? form.phone : form.whatsapp}
                disabled={form.sameWhatsapp}
                onChange={(e) => set('whatsapp', e.target.value)}
                aria-invalid={Boolean(errors.whatsapp)}
              />
              <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-[13px] text-muted">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-line text-brand-red focus:ring-brand-blue"
                  checked={form.sameWhatsapp}
                  onChange={(e) => set('sameWhatsapp', e.target.checked)}
                />
                {t('checkout.sameAsMobile')}
              </label>
              {errors.whatsapp && <p className="field-error">{errors.whatsapp}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="email" className="label">
                {t('checkout.email')}{' '}
                <span className="font-normal text-muted">({t('checkout.optional')})</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={field('email')}
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>
          </div>
        </section>

        {/* Order type */}
        <section className="card p-4 sm:p-5">
          <h2 className="mb-3 text-base font-bold text-ink">{t('checkout.orderType')}</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {settings.delivery_enabled && (
              <ChoiceCard
                selected={form.delivery_method === 'delivery'}
                onSelect={() => setDeliveryMethod('delivery')}
                name="delivery_method"
                icon={<TruckIcon size={20} />}
                title={t('checkout.homeDelivery')}
                hint={
                  settings.free_delivery_threshold > 0
                    ? `Free above ${formatPrice(settings.free_delivery_threshold, settings.currency)}`
                    : `${formatPrice(settings.delivery_fee, settings.currency)} delivery fee`
                }
              />
            )}
            {settings.pickup_enabled && (
              <ChoiceCard
                selected={form.delivery_method === 'pickup'}
                onSelect={() => setDeliveryMethod('pickup')}
                name="delivery_method"
                icon={<StoreIcon size={20} />}
                title={t('checkout.storePickup')}
                hint={t('checkout.pickupHint')}
              />
            )}
          </div>
        </section>

        {/* Address */}
        {!isPickup && (
          <section className="card p-4 sm:p-5">
            <h2 className="mb-4 text-base font-bold text-ink">{t('checkout.deliveryInfo')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="address_line" className="label">
                  {t('checkout.house')} <span className="text-brand-red">*</span>
                </label>
                <input
                  id="address_line"
                  autoComplete="address-line1"
                  className={field('address_line')}
                  value={form.address_line}
                  onChange={(e) => set('address_line', e.target.value)}
                  aria-invalid={Boolean(errors.address_line)}
                />
                {errors.address_line && <p className="field-error">{errors.address_line}</p>}
              </div>

              <div>
                <label htmlFor="street" className="label">{t('checkout.street')}</label>
                <input
                  id="street"
                  autoComplete="address-line2"
                  className="input"
                  value={form.street}
                  onChange={(e) => set('street', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="area" className="label">{t('checkout.area')}</label>
                <input
                  id="area"
                  list="delivery-areas"
                  className="input"
                  value={form.area}
                  onChange={(e) => set('area', e.target.value)}
                />
                <datalist id="delivery-areas">
                  {(settings.delivery_areas ?? [])
                    .filter((a) => a.is_active)
                    .map((a) => (
                      <option key={a.id} value={a.name} />
                    ))}
                </datalist>
                {form.area && (
                  <p className="hint">
                    Delivery to {form.area}: {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee, settings.currency)}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="city" className="label">
                  {t('checkout.city')} <span className="text-brand-red">*</span>
                </label>
                <input
                  id="city"
                  autoComplete="address-level2"
                  className={field('city')}
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  aria-invalid={Boolean(errors.city)}
                />
                {errors.city && <p className="field-error">{errors.city}</p>}
              </div>

              <div>
                <label htmlFor="district" className="label">{t('checkout.district')}</label>
                <select
                  id="district"
                  className="input"
                  value={form.district}
                  onChange={(e) => set('district', e.target.value)}
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="notes" className="label">
                  {t('checkout.notes')}{' '}
                  <span className="font-normal text-muted">({t('checkout.optional')})</span>
                </label>
                <textarea
                  id="notes"
                  rows={2}
                  className="input resize-none"
                  placeholder="Landmark, gate colour, best time to deliver…"
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                />
              </div>
            </div>
          </section>
        )}

        {/* Payment — only the methods that make sense for this order type */}
        <section className="card p-4 sm:p-5">
          <h2 className="mb-3 text-base font-bold text-ink">{t('checkout.paymentMethod')}</h2>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {availablePayments.map((method) =>
              method === 'cod' ? (
                <ChoiceCard
                  key={method}
                  selected={form.payment_method === 'cod'}
                  onSelect={() => set('payment_method', 'cod')}
                  name="payment_method"
                  icon={<WalletIcon size={20} />}
                  title={t('checkout.cod')}
                  hint="Pay the driver in cash when your order arrives."
                />
              ) : (
                <ChoiceCard
                  key={method}
                  selected={form.payment_method === 'pay_at_store'}
                  onSelect={() => set('payment_method', 'pay_at_store')}
                  name="payment_method"
                  icon={<StoreIcon size={20} />}
                  title={t('checkout.payAtStore')}
                  hint="Settle at the counter when you collect your order."
                />
              ),
            )}
          </div>

          {/* Explain why there is only one option, so it does not look broken. */}
          {availablePayments.length === 1 && (
            <p className="mt-3 rounded-lg bg-brand-blueSoft px-3 py-2 text-[12.5px] text-brand-blueDark">
              {isPickup
                ? 'You are collecting this order from the shop, so you pay at the counter.'
                : 'This order is being delivered, so you pay the driver in cash on arrival.'}
            </p>
          )}
        </section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-[132px] lg:self-start">
        <div className="card p-4">
          <h2 className="mb-3 text-base font-bold text-ink">{t('checkout.orderSummary')}</h2>

          <ul className="mb-3 max-h-64 space-y-2.5 overflow-y-auto pr-1">
            {lines.map((line) => (
              <li key={line.product_id} className="flex items-start justify-between gap-3 text-[13px]">
                <span className="min-w-0 flex-1">
                  <span className="clamp-2 font-medium text-ink">{ln(line)}</span>
                  <span className="text-muted">
                    {line.unit} × {line.quantity}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-ink">
                  {formatPrice(line.price * line.quantity, settings.currency)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="space-y-2 border-t border-line pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{t('cart.subtotal')}</dt>
              <dd className="font-semibold text-ink">{formatPrice(subtotal, settings.currency)}</dd>
            </div>
            {!isPickup && (
              <div className="flex justify-between">
                <dt className="text-muted">{t('cart.deliveryFee')}</dt>
                <dd className={cn('font-semibold', deliveryFee === 0 ? 'text-emerald-600' : 'text-ink')}>
                  {deliveryFee === 0 ? t('cart.freeDelivery') : formatPrice(deliveryFee, settings.currency)}
                </dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2.5 text-base">
              <dt className="font-bold text-ink">{t('cart.grandTotal')}</dt>
              <dd className="font-extrabold text-brand-red">{formatPrice(total, settings.currency)}</dd>
            </div>
          </dl>

          <button type="submit" disabled={submitting} className="btn btn-lg mt-4 w-full bg-[#25D366] text-white hover:bg-[#1da851]">
            <WhatsAppIcon size={18} />
            {submitting ? t('checkout.placing') : t('checkout.placeOrder')}
          </button>

          <p className="mt-2 text-center text-[12px] leading-relaxed text-muted">
            Your order opens in WhatsApp so you can send it to us directly.
          </p>

          <Link href="/cart" className="mt-3 block text-center text-sm font-semibold text-brand-blue hover:underline">
            ← {t('cart.title')}
          </Link>
        </div>
      </aside>
    </form>
  );
}

function ChoiceCard({
  selected,
  onSelect,
  name,
  icon,
  title,
  hint,
}: {
  selected: boolean;
  onSelect: () => void;
  name: string;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-colors',
        selected ? 'border-brand-red bg-brand-redSoft/50' : 'border-line bg-white hover:border-brand-blue',
      )}
    >
      <input
        type="radio"
        name={name}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span className={cn('mt-0.5 shrink-0', selected ? 'text-brand-red' : 'text-brand-blue')}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-ink">{title}</span>
        <span className="block text-[12.5px] leading-snug text-muted">{hint}</span>
      </span>
    </label>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card space-y-3 p-5">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-11 w-full" />
            <div className="skeleton h-11 w-full" />
          </div>
        ))}
      </div>
      <div className="card space-y-3 p-4">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-12 w-full" />
      </div>
    </div>
  );
}
