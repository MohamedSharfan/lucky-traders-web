'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiFetch } from '@/lib/client-api';
import { cn, formatPrice, toWhatsAppNumber } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';
import type { DeliveryArea, Settings } from '@/lib/types';
import { ImageUploader } from './ImageUploader';
import { PlusIcon, TrashIcon, WhatsAppIcon } from '@/components/ui/Icon';

/**
 * Store / delivery / WhatsApp settings.
 *
 * One component with three sections; each admin page renders only the section
 * it needs. Everything written here is read by the storefront on the next
 * request — nothing about the shop is hard-coded in the frontend.
 */

type Section = 'store' | 'delivery' | 'whatsapp';

export function SettingsForm({ settings, section }: { settings: Settings; section: Section }) {
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState<Settings>(settings);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (section === 'store') {
      if (!form.shop_name.trim()) next.shop_name = 'The shop needs a name.';
      if (!form.phone.trim()) next.phone = 'Enter a contact number.';
    }
    if (section === 'whatsapp') {
      const digits = toWhatsAppNumber(form.whatsapp);
      if (!digits || digits.length < 11) {
        next.whatsapp = 'Enter a valid WhatsApp number, for example 0771234567.';
      }
    }
    if (section === 'delivery') {
      if (form.delivery_fee < 0) next.delivery_fee = 'The fee cannot be negative.';
      if (form.free_delivery_threshold < 0) next.free_delivery_threshold = 'The threshold cannot be negative.';
    }

    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0])?.focus();
      return false;
    }
    return true;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !validate()) return;

    setBusy(true);
    try {
      await apiFetch('/api/settings', { method: 'PUT', json: form });
      toast.success('Settings saved. The shop is already using them.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the settings.');
    } finally {
      setBusy(false);
    }
  }

  const field = (key: string) => cn('input', errors[key] && 'input-error');

  const updateArea = (id: string, patch: Partial<DeliveryArea>) =>
    set(
      'delivery_areas',
      form.delivery_areas.map((area) => (area.id === id ? { ...area, ...patch } : area)),
    );

  return (
    <form onSubmit={save} className="max-w-3xl space-y-4">
      {section === 'store' && (
        <>
          <section className="card p-4 sm:p-5">
            <h2 className="mb-4 text-base font-bold text-ink">Shop identity</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="shop_name" className="label">
                  Shop name <span className="text-brand-red">*</span>
                </label>
                <input
                  id="shop_name"
                  className={field('shop_name')}
                  value={form.shop_name}
                  onChange={(e) => set('shop_name', e.target.value)}
                />
                {errors.shop_name && <p className="field-error">{errors.shop_name}</p>}
              </div>

              <div>
                <label htmlFor="shop_subtitle" className="label">Subtitle</label>
                <input
                  id="shop_subtitle"
                  className="input"
                  value={form.shop_subtitle}
                  onChange={(e) => set('shop_subtitle', e.target.value)}
                />
                <p className="hint">Shown under the shop name, e.g. “Lucky Traders”.</p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="tagline" className="label">Tagline</label>
                <input
                  id="tagline"
                  className="input"
                  value={form.tagline}
                  onChange={(e) => set('tagline', e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="announcement" className="label">Announcement bar</label>
                <input
                  id="announcement"
                  className="input"
                  value={form.announcement}
                  onChange={(e) => set('announcement', e.target.value)}
                  placeholder="Leave blank to hide the bar"
                />
                <p className="hint">A single line shown at the very top of the shop on desktop.</p>
              </div>

              <div className="sm:col-span-2">
                <ImageUploader
                  value={form.logo_url}
                  onChange={(url) => set('logo_url', url)}
                  label="Logo"
                  aspect="wide"
                  hint="Optional. Without a logo the shop shows an “SK” mark."
                />
              </div>
            </div>
          </section>

          <section className="card p-4 sm:p-5">
            <h2 className="mb-4 text-base font-bold text-ink">Contact details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className="label">
                  Phone <span className="text-brand-red">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  className={field('phone')}
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                />
                {errors.phone && <p className="field-error">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="email" className="label">Email</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className="label">Address</label>
                <textarea
                  id="address"
                  rows={2}
                  className="input resize-y"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="opening_hours" className="label">Opening hours</label>
                <textarea
                  id="opening_hours"
                  rows={2}
                  className="input resize-y"
                  value={form.opening_hours}
                  onChange={(e) => set('opening_hours', e.target.value)}
                />
                <p className="hint">One line per entry — line breaks are preserved on the shop.</p>
              </div>

              <div>
                <label htmlFor="currency" className="label">Currency symbol</label>
                <input
                  id="currency"
                  className="input"
                  value={form.currency}
                  onChange={(e) => set('currency', e.target.value)}
                />
                <p className="hint">Prices display as “{form.currency} 1,250”.</p>
              </div>

              <div>
                <label htmlFor="order_prefix" className="label">Order number prefix</label>
                <input
                  id="order_prefix"
                  className="input"
                  maxLength={6}
                  value={form.order_prefix}
                  onChange={(e) => set('order_prefix', e.target.value.toUpperCase())}
                />
                <p className="hint">Orders are numbered {form.order_prefix || 'SK'}-10001, -10002, …</p>
              </div>
            </div>
          </section>

          <section className="card p-4 sm:p-5">
            <h2 className="mb-4 text-base font-bold text-ink">Social & maps</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="facebook" className="label">Facebook URL</label>
                <input
                  id="facebook"
                  type="url"
                  className="input"
                  value={form.facebook}
                  onChange={(e) => set('facebook', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="instagram" className="label">Instagram URL</label>
                <input
                  id="instagram"
                  type="url"
                  className="input"
                  value={form.instagram}
                  onChange={(e) => set('instagram', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="maps_url" className="label">Google Maps link</label>
                <input
                  id="maps_url"
                  type="url"
                  className="input"
                  value={form.maps_url}
                  onChange={(e) => set('maps_url', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="maps_embed_url" className="label">Google Maps embed URL</label>
                <input
                  id="maps_embed_url"
                  type="url"
                  className="input"
                  value={form.maps_embed_url}
                  onChange={(e) => set('maps_embed_url', e.target.value)}
                />
                <p className="hint">Used for the map on the Contact page. Leave blank to hide it.</p>
              </div>
            </div>
          </section>
        </>
      )}

      {section === 'delivery' && (
        <>
          <section className="card p-4 sm:p-5">
            <h2 className="mb-4 text-base font-bold text-ink">Delivery & pickup</h2>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={form.delivery_enabled}
                  onChange={(e) => set('delivery_enabled', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-line text-brand-red focus:ring-brand-blue"
                />
                <span>
                  <span className="block text-[13.5px] font-semibold text-ink">Offer home delivery</span>
                  <span className="block text-[12px] text-muted">
                    Turn this off and checkout only offers store pickup.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={form.pickup_enabled}
                  onChange={(e) => set('pickup_enabled', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-line text-brand-red focus:ring-brand-blue"
                />
                <span>
                  <span className="block text-[13.5px] font-semibold text-ink">Offer store pickup</span>
                  <span className="block text-[12px] text-muted">
                    Customers collect from the shop with no delivery fee.
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="delivery_fee" className="label">Default delivery fee ({form.currency})</label>
                <input
                  id="delivery_fee"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className={field('delivery_fee')}
                  value={form.delivery_fee}
                  onChange={(e) => set('delivery_fee', Number(e.target.value))}
                />
                {errors.delivery_fee && <p className="field-error">{errors.delivery_fee}</p>}
                <p className="hint">Used when the customer&apos;s area is not listed below.</p>
              </div>

              <div>
                <label htmlFor="free_delivery_threshold" className="label">
                  Free delivery above ({form.currency})
                </label>
                <input
                  id="free_delivery_threshold"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className={field('free_delivery_threshold')}
                  value={form.free_delivery_threshold}
                  onChange={(e) => set('free_delivery_threshold', Number(e.target.value))}
                />
                {errors.free_delivery_threshold && (
                  <p className="field-error">{errors.free_delivery_threshold}</p>
                )}
                <p className="hint">Set to 0 to switch free delivery off entirely.</p>
              </div>
            </div>

            <p className="mt-4 rounded-lg bg-brand-blueSoft px-3 py-2 text-[12.5px] text-brand-blueDark">
              Customers currently see:{' '}
              {form.free_delivery_threshold > 0 ? (
                <>
                  orders above {formatPrice(form.free_delivery_threshold, form.currency)} get{' '}
                  <strong>free delivery</strong>; below that,{' '}
                  {formatPrice(form.delivery_fee, form.currency)}.
                </>
              ) : (
                <>a flat {formatPrice(form.delivery_fee, form.currency)} delivery fee.</>
              )}
            </p>
          </section>

          <section className="card p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-ink">Delivery areas</h2>
                <p className="text-[13px] text-muted">Area-specific fees override the default.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  set('delivery_areas', [
                    ...form.delivery_areas,
                    { id: `area-${Date.now().toString(36)}`, name: '', fee: form.delivery_fee, is_active: true },
                  ])
                }
                className="btn-outline btn-sm"
              >
                <PlusIcon size={15} />
                Add area
              </button>
            </div>

            {form.delivery_areas.length === 0 ? (
              <p className="rounded-lg bg-canvas px-3 py-4 text-center text-[13px] text-muted">
                No areas yet — every delivery uses the default fee.
              </p>
            ) : (
              <ul className="space-y-2">
                {form.delivery_areas.map((area) => (
                  <li key={area.id} className="flex flex-wrap items-center gap-2">
                    <input
                      value={area.name}
                      onChange={(e) => updateArea(area.id, { name: e.target.value })}
                      placeholder="Area name"
                      aria-label="Area name"
                      className="input h-9 min-w-[140px] flex-1 text-[13.5px]"
                    />
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12.5px] text-muted">{form.currency}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={area.fee}
                        onChange={(e) => updateArea(area.id, { fee: Number(e.target.value) })}
                        aria-label={`Delivery fee for ${area.name || 'this area'}`}
                        className="input h-9 w-24 text-[13.5px]"
                      />
                    </div>
                    <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-muted">
                      <input
                        type="checkbox"
                        checked={area.is_active}
                        onChange={(e) => updateArea(area.id, { is_active: e.target.checked })}
                        className="h-4 w-4 rounded border-line text-brand-red focus:ring-brand-blue"
                      />
                      Active
                    </label>
                    <button
                      type="button"
                      onClick={() => set('delivery_areas', form.delivery_areas.filter((a) => a.id !== area.id))}
                      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-brand-redSoft hover:text-brand-red"
                      aria-label={`Remove ${area.name || 'area'}`}
                    >
                      <TrashIcon size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {section === 'whatsapp' && (
        <section className="card p-4 sm:p-5">
          <h2 className="mb-1 text-base font-bold text-ink">WhatsApp ordering</h2>
          <p className="mb-4 text-[13px] text-muted">
            Orders are sent here as a ready-made message. This uses the free click-to-chat link, so no
            WhatsApp Business API subscription is needed.
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="whatsapp" className="label">
                Owner WhatsApp number <span className="text-brand-red">*</span>
              </label>
              <input
                id="whatsapp"
                type="tel"
                inputMode="tel"
                className={field('whatsapp')}
                value={form.whatsapp}
                onChange={(e) => set('whatsapp', e.target.value)}
                placeholder="0771234567 or +94771234567"
              />
              {errors.whatsapp ? (
                <p className="field-error">{errors.whatsapp}</p>
              ) : (
                <p className="hint">
                  Orders will open a chat with{' '}
                  <span className="font-mono font-semibold">+{toWhatsAppNumber(form.whatsapp) || '—'}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="whatsapp_greeting" className="label">Greeting message</label>
              <textarea
                id="whatsapp_greeting"
                rows={2}
                className="input resize-y"
                value={form.whatsapp_greeting}
                onChange={(e) => set('whatsapp_greeting', e.target.value)}
              />
              <p className="hint">
                Pre-filled when a customer taps the floating WhatsApp button or the “Chat on WhatsApp”
                links. Order messages are generated separately from the cart.
              </p>
            </div>

            {toWhatsAppNumber(form.whatsapp) && (
              <a
                href={`https://wa.me/${toWhatsAppNumber(form.whatsapp)}?text=${encodeURIComponent(
                  form.whatsapp_greeting || 'Test message',
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn w-full bg-[#25D366] text-white hover:bg-[#1da851] sm:w-auto"
              >
                <WhatsAppIcon size={17} />
                Send yourself a test message
              </a>
            )}
          </div>
        </section>
      )}

      <div className="sticky bottom-0 -mx-3 border-t border-line bg-white/95 p-3 backdrop-blur sm:mx-0 sm:rounded-card sm:border sm:shadow-card">
        <button type="submit" disabled={busy} className="btn-primary btn-lg w-full sm:w-auto">
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}
