'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiFetch } from '@/lib/client-api';
import { useToast } from '@/components/ui/Toast';
import type { Brand } from '@/lib/types';
import { PlusIcon, TrashIcon } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * Brand management.
 *
 * Brands are normally created from the product form, where they are actually
 * needed. This screen exists so a name typed in a hurry can be corrected
 * afterwards — a misspelt brand would otherwise be permanent, and it shows on
 * the shelf label and in the shop's filter sidebar.
 */
export function BrandManager({
  brands,
  counts,
}: {
  brands: Brand[];
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const toast = useToast();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function create() {
    const clean = name.trim();
    if (clean.length < 2) {
      toast.error('Enter a brand name first.');
      return;
    }
    setBusyId('new');
    try {
      const created = await apiFetch<Brand>('/api/brands', { method: 'POST', json: { name: clean } });
      toast.success(
        created.name.toLowerCase() === clean.toLowerCase()
          ? `${created.name} added.`
          : `${created.name} already exists.`,
      );
      setName('');
      setAdding(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save.');
    } finally {
      setBusyId(null);
    }
  }

  async function rename(brand: Brand) {
    const clean = draft.trim();
    if (clean.length < 2) {
      toast.error('Enter a brand name first.');
      return;
    }
    if (clean === brand.name) {
      setEditingId(null);
      return;
    }
    setBusyId(brand.id);
    try {
      await apiFetch(`/api/brands/${brand.id}`, { method: 'PATCH', json: { name: clean } });
      toast.success('Brand renamed.');
      setEditingId(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save.');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(brand: Brand) {
    const used = counts[brand.id] ?? 0;
    if (used) {
      toast.error(`${brand.name} is on ${used} product${used === 1 ? '' : 's'}. Change those first.`);
      return;
    }
    if (!window.confirm(`Delete "${brand.name}"?`)) return;

    setBusyId(brand.id);
    try {
      await apiFetch(`/api/brands/${brand.id}`, { method: 'DELETE' });
      toast.success('Brand deleted.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">Brands</h2>
          <p className="hint">
            {brands.length} brand{brands.length === 1 ? '' : 's'}. You can also add one while
            entering a product.
          </p>
        </div>
        {!adding && (
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            <PlusIcon size={16} /> Add brand
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            className="input flex-1"
            value={name}
            autoFocus
            placeholder="e.g. Araliya"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void create();
              }
              if (e.key === 'Escape') {
                setAdding(false);
                setName('');
              }
            }}
            disabled={busyId === 'new'}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void create()}
            disabled={busyId === 'new'}
          >
            {busyId === 'new' ? 'Saving…' : 'Add'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setAdding(false);
              setName('');
            }}
            disabled={busyId === 'new'}
          >
            Cancel
          </button>
        </div>
      )}

      {brands.length === 0 ? (
        <EmptyState title="No brands yet" body="Add one here, or while entering a product." />
      ) : (
        <ul className="divide-y divide-line">
          {brands.map((brand) => {
            const used = counts[brand.id] ?? 0;
            return (
              <li key={brand.id} className="flex flex-wrap items-center gap-3 py-2.5">
                {editingId === brand.id ? (
                  <>
                    <input
                      className="input flex-1"
                      value={draft}
                      autoFocus
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void rename(brand);
                        }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      disabled={busyId === brand.id}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => void rename(brand)}
                      disabled={busyId === brand.id}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setEditingId(null)}
                      disabled={busyId === brand.id}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium text-ink">{brand.name}</span>
                    <span className="hint shrink-0">
                      {used} product{used === 1 ? '' : 's'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost shrink-0"
                      onClick={() => {
                        setEditingId(brand.id);
                        setDraft(brand.name);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost shrink-0 text-brand-red"
                      onClick={() => void remove(brand)}
                      disabled={busyId === brand.id}
                      aria-label={`Delete ${brand.name}`}
                    >
                      <TrashIcon size={16} />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
