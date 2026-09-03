'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiFetch } from '@/lib/client-api';
import { cn } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import type { Category } from '@/lib/types';
import { ImageUploader } from './ImageUploader';
import { ChevronDownIcon, CloseIcon, GridIcon, PlusIcon, TrashIcon } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * Category management.
 *
 * Two levels (category → subcategory), which is what a grocery shop actually
 * needs. Sort order controls the sequence customers see on the homepage strip
 * and in the mega-menu.
 */
export function CategoryManager({
  categories,
  counts,
}: {
  categories: Category[];
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const toast = useToast();

  const [editing, setEditing] = useState<Category | null>(null);
  const [creatingUnder, setCreatingUnder] = useState<string | null | undefined>(undefined);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const roots = categories.filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  const childrenOf = (id: string) =>
    categories.filter((c) => c.parent_id === id).sort((a, b) => a.sort_order - b.sort_order);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  async function remove(category: Category) {
    const kids = childrenOf(category.id).length;
    if (kids) {
      toast.error('Delete or move its subcategories first.');
      return;
    }
    if (!window.confirm(`Delete "${category.name}"?`)) return;

    setBusyId(category.id);
    try {
      await apiFetch(`/api/categories/${category.id}`, { method: 'DELETE' });
      toast.success('Category deleted.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete the category.');
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(category: Category) {
    setBusyId(category.id);
    try {
      await apiFetch(`/api/categories/${category.id}`, {
        method: 'PATCH',
        json: { is_active: !category.is_active },
      });
      toast.success(category.is_active ? 'Category hidden from the shop.' : 'Category is visible again.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update the category.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setCreatingUnder(null);
          }}
          className="btn-primary btn-sm"
        >
          <PlusIcon size={16} />
          Add category
        </button>
        <p className="text-[13px] text-muted">
          {roots.length} categories · {categories.length - roots.length} subcategories
        </p>
      </div>

      {roots.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<GridIcon size={26} />}
            title="No categories yet"
            body="Categories group your products so customers can find things quickly."
            actionLabel="Add your first category"
            onAction={() => setCreatingUnder(null)}
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {roots.map((root) => {
            const kids = childrenOf(root.id);
            const isOpen = expanded.has(root.id);
            return (
              <li key={root.id} className={cn('card overflow-hidden', busyId === root.id && 'opacity-60')}>
                <div className="flex flex-wrap items-center gap-2 p-3">
                  <button
                    type="button"
                    onClick={() => toggle(root.id)}
                    disabled={!kids.length}
                    className="rounded-lg p-1 text-muted hover:bg-canvas disabled:opacity-30"
                    aria-expanded={isOpen}
                    aria-label={`Show subcategories of ${root.name}`}
                  >
                    <ChevronDownIcon size={16} className={cn('transition-transform', isOpen && 'rotate-180')} />
                  </button>

                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-canvas text-lg" aria-hidden="true">
                    {root.icon ?? '🛒'}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-bold text-ink">{root.name}</p>
                    <p className="truncate text-[12px] text-muted">
                      {kids.length} subcategories · {counts[root.id] ?? 0} products ·{' '}
                      <span className="font-mono">{root.slug}</span>
                    </p>
                  </div>

                  {!root.is_active && (
                    <span className="status-pill bg-gray-100 text-gray-600 ring-gray-200">Hidden</span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(null);
                        setCreatingUnder(root.id);
                      }}
                      className="btn-ghost btn-sm"
                    >
                      <PlusIcon size={14} />
                      Sub
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreatingUnder(undefined);
                        setEditing(root);
                      }}
                      className="btn-outline btn-sm"
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => toggleActive(root)} className="btn-ghost btn-sm">
                      {root.is_active ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(root)}
                      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-brand-redSoft hover:text-brand-red"
                      aria-label={`Delete ${root.name}`}
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>

                {isOpen && kids.length > 0 && (
                  <ul className="divide-y divide-line border-t border-line bg-canvas/50">
                    {kids.map((kid) => (
                      <li key={kid.id} className="flex flex-wrap items-center gap-2 px-3 py-2 pl-12">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-semibold text-ink">{kid.name}</p>
                          <p className="truncate text-[11.5px] text-muted">
                            {counts[kid.id] ?? 0} products · <span className="font-mono">{kid.slug}</span>
                          </p>
                        </div>
                        {!kid.is_active && (
                          <span className="status-pill bg-gray-100 text-gray-600 ring-gray-200">Hidden</span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setCreatingUnder(undefined);
                            setEditing(kid);
                          }}
                          className="btn-outline btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(kid)}
                          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-brand-redSoft hover:text-brand-red"
                          aria-label={`Delete ${kid.name}`}
                        >
                          <TrashIcon size={15} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {(editing || creatingUnder !== undefined) && (
        <CategoryDialog
          category={editing}
          parentId={creatingUnder ?? null}
          roots={roots}
          onClose={() => {
            setEditing(null);
            setCreatingUnder(undefined);
          }}
          onSaved={() => {
            setEditing(null);
            setCreatingUnder(undefined);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function CategoryDialog({
  category,
  parentId,
  roots,
  onClose,
  onSaved,
}: {
  category: Category | null;
  parentId: string | null;
  roots: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: category?.name ?? '',
    name_si: category?.name_si ?? '',
    name_ta: category?.name_ta ?? '',
    icon: category?.icon ?? '',
    parent_id: category?.parent_id ?? parentId ?? '',
    sort_order: String(category?.sort_order ?? 100),
    is_active: category?.is_active ?? true,
    image_url: category?.image_url ?? null,
  });
  const [error, setError] = useState('');

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (form.name.trim().length < 2) {
      setError('Enter a category name.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        name_si: form.name_si.trim() || null,
        name_ta: form.name_ta.trim() || null,
        icon: form.icon.trim() || null,
        parent_id: form.parent_id || null,
        sort_order: Number(form.sort_order) || 100,
        is_active: form.is_active,
        image_url: form.image_url,
      };

      if (category) {
        await apiFetch(`/api/categories/${category.id}`, { method: 'PATCH', json: payload });
        toast.success('Category updated.');
      } else {
        await apiFetch('/api/categories', { method: 'POST', json: payload });
        toast.success('Category added.');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the category.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink/50 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-dialog-title"
        className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-pop animate-slide-up sm:max-w-lg sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="category-dialog-title" className="text-base font-bold text-ink">
            {category ? 'Edit category' : parentId ? 'Add subcategory' : 'Add category'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-canvas"
            aria-label="Close"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {error && (
          <p role="alert" className="mb-3 rounded-lg bg-brand-redSoft px-3 py-2 text-[13px] font-medium text-brand-redDark">
            {error}
          </p>
        )}

        <form onSubmit={save} className="space-y-4">
          <div>
            <label htmlFor="cat-name" className="label">
              Name <span className="text-brand-red">*</span>
            </label>
            <input
              id="cat-name"
              className="input"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cat-si" className="label">Sinhala name</label>
              <input id="cat-si" className="input" value={form.name_si} onChange={(e) => set('name_si', e.target.value)} />
            </div>
            <div>
              <label htmlFor="cat-ta" className="label">Tamil name</label>
              <input id="cat-ta" className="input" value={form.name_ta} onChange={(e) => set('name_ta', e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cat-parent" className="label">Parent category</label>
              <select
                id="cat-parent"
                className="input"
                value={form.parent_id}
                onChange={(e) => set('parent_id', e.target.value)}
              >
                <option value="">None — this is a main category</option>
                {roots
                  .filter((r) => r.id !== category?.id)
                  .map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label htmlFor="cat-order" className="label">Sort order</label>
              <input
                id="cat-order"
                type="number"
                inputMode="numeric"
                className="input"
                value={form.sort_order}
                onChange={(e) => set('sort_order', e.target.value)}
              />
              <p className="hint">Lower numbers appear first.</p>
            </div>
          </div>

          <div>
            <label htmlFor="cat-icon" className="label">Icon</label>
            <input
              id="cat-icon"
              className="input"
              value={form.icon}
              onChange={(e) => set('icon', e.target.value)}
              placeholder="A single emoji, e.g. 🌾"
              maxLength={4}
            />
            <p className="hint">Used on the homepage category strip when there is no image.</p>
          </div>

          <ImageUploader
            value={form.image_url}
            onChange={(url) => set('image_url', url)}
            label="Category image (optional)"
            aspect="wide"
            hint="Optional. The emoji icon is used when no image is set."
          />

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-line text-brand-red focus:ring-brand-blue"
            />
            <span className="text-[13.5px] font-medium text-ink">Visible on the shop</span>
          </label>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={busy} className="btn-primary flex-1">
              {busy ? 'Saving…' : 'Save category'}
            </button>
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
