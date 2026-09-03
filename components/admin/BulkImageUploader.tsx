'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';

import { apiFetch } from '@/lib/client-api';
import { cn } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';
import { matchFiles, type MatchConfidence, type MatchableProduct } from '@/lib/match-images';
import { AlertIcon, CheckIcon, ImageIcon, SearchIcon, UploadIcon } from '@/components/ui/Icon';

/**
 * Bulk product photography upload.
 *
 * Photographing a shelf produces a folder of images; assigning them one at a
 * time through the product editor is the slow part. This drops the whole folder
 * in at once, works out which photo belongs to which product from the file
 * name, and lets the owner correct anything it got wrong before committing.
 *
 * Nothing is written until "Upload" is pressed, and a photo that would replace
 * an existing one is flagged first.
 */

interface Row {
  file: File;
  previewUrl: string;
  productId: string | null;
  confidence: MatchConfidence;
  reason: string;
  status: 'pending' | 'uploading' | 'done' | 'failed' | 'skipped';
  error?: string;
}

const CONFIDENCE_STYLE: Record<MatchConfidence, string> = {
  exact: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  strong: 'bg-brand-blueSoft text-brand-blueDark ring-brand-blue/20',
  weak: 'bg-amber-50 text-amber-700 ring-amber-200',
  none: 'bg-gray-100 text-gray-600 ring-gray-200',
};

const CONFIDENCE_LABEL: Record<MatchConfidence, string> = {
  exact: 'Exact',
  strong: 'Likely',
  weak: 'Check this',
  none: 'Unmatched',
};

const MAX_BYTES = 5 * 1024 * 1024;

export function BulkImageUploader({ products }: { products: MatchableProduct[] }) {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  const withPhoto = products.filter((p) => p.image_url).length;
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList).filter((f) => {
      if (!f.type.startsWith('image/')) return false;
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} is over 5 MB and was skipped.`);
        return false;
      }
      return true;
    });
    if (!incoming.length) return;

    const matches = matchFiles(incoming.map((f) => f.name), products);
    const next: Row[] = incoming.map((file, i) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      productId: matches[i].productId,
      confidence: matches[i].confidence,
      reason: matches[i].reason,
      status: 'pending',
    }));

    setRows((prev) => [...prev, ...next]);

    const matched = next.filter((r) => r.productId).length;
    toast.success(`${next.length} photo${next.length > 1 ? 's' : ''} added — ${matched} matched automatically.`);
  }

  function reassign(index: number, productId: string) {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              productId: productId || null,
              confidence: productId ? 'exact' : 'none',
              reason: productId ? 'Chosen by you' : 'Not assigned',
            }
          : row,
      ),
    );
  }

  function removeRow(index: number) {
    setRows((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  const readyCount = rows.filter((r) => r.productId && r.status === 'pending').length;

  async function uploadAll() {
    if (busy || !readyCount) return;

    const replacing = rows.filter(
      (r) => r.productId && r.status === 'pending' && productById.get(r.productId)?.image_url,
    ).length;
    if (
      replacing &&
      !window.confirm(
        `${replacing} of these will replace a photo the product already has. Continue?`,
      )
    ) {
      return;
    }

    setBusy(true);
    let done = 0;
    let failed = 0;

    // Sequential rather than parallel: a shop laptop on home broadband copes
    // better, and the progress readout stays truthful.
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.productId || row.status !== 'pending') continue;

      setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: 'uploading' } : r)));

      try {
        const body = new FormData();
        body.append('file', row.file);
        const res = await fetch('/api/upload', { method: 'POST', body });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error ?? 'Upload failed');

        await apiFetch(`/api/products/${row.productId}`, {
          method: 'PATCH',
          json: { image_url: json.data.url },
        });

        done += 1;
        setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: 'done' } : r)));
      } catch (error) {
        failed += 1;
        setRows((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? { ...r, status: 'failed', error: error instanceof Error ? error.message : 'Failed' }
              : r,
          ),
        );
      }
    }

    setBusy(false);
    if (done) toast.success(`${done} photo${done > 1 ? 's' : ''} published to the shop.`);
    if (failed) toast.error(`${failed} could not be uploaded. They are marked below.`);
    router.refresh();
  }

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.brand_name ?? '').toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term),
    );
  }, [products, search]);

  return (
    <div className="space-y-4">
      {/* Progress */}
      <section className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-ink">Photo coverage</h2>
            <p className="text-[13px] text-muted">
              {withPhoto} of {products.length} products have a real photo. The rest show a drawn
              package illustration until you add one.
            </p>
          </div>
          <p className="text-2xl font-extrabold tracking-tight text-brand-red">
            {Math.round((withPhoto / Math.max(1, products.length)) * 100)}%
          </p>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-canvas">
          <div
            className="h-full rounded-full bg-brand-red transition-all"
            style={{ width: `${(withPhoto / Math.max(1, products.length)) * 100}%` }}
          />
        </div>
      </section>

      {/* Drop zone */}
      <section
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex flex-col items-center justify-center rounded-card border-2 border-dashed p-8 text-center transition-colors',
          dragging ? 'border-brand-blue bg-brand-blueSoft' : 'border-line bg-white',
        )}
      >
        <ImageIcon size={34} className="mb-3 text-muted" />
        <p className="text-[15px] font-semibold text-ink">Drop your product photos here</p>
        <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-muted">
          Select as many as you like. Photos are matched to products by file name — naming a file
          after the product, its SKU, or its web address gives an exact match.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn-outline mt-4"
        >
          <UploadIcon size={16} />
          Choose photos
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="sr-only"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <p className="mt-3 text-[12px] text-muted">JPG, PNG or WebP · up to 5 MB each</p>
      </section>

      {/* Naming help */}
      {rows.length === 0 && (
        <section className="card p-4">
          <h2 className="mb-2 text-sm font-bold text-ink">Naming your photos</h2>
          <ul className="space-y-1.5 text-[13px] text-muted">
            <li>
              <span className="font-mono text-ink">Araliya Nadu Rice 5kg.jpg</span> — brand, name and
              pack size. Matches exactly.
            </li>
            <li>
              <span className="font-mono text-ink">SK-RGNAD-5KG-78.jpg</span> — the SKU from the
              product page. Always exact.
            </li>
            <li>
              <span className="font-mono text-ink">IMG_2043.jpg</span> — no match; assign it by hand
              from the dropdown.
            </li>
          </ul>
          <p className="mt-3 rounded-lg bg-brand-blueSoft px-3 py-2 text-[12.5px] text-brand-blueDark">
            The pack size is checked: a file named “1kg” will never be attached to the 5kg product,
            even when every other word matches.
          </p>
        </section>
      )}

      {/* Matches */}
      {rows.length > 0 && (
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
            <div>
              <h2 className="text-sm font-bold text-ink">
                {rows.length} photo{rows.length > 1 ? 's' : ''} ready
              </h2>
              <p className="text-[13px] text-muted">
                {readyCount} matched · {rows.filter((r) => !r.productId).length} need assigning
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  rows.forEach((r) => URL.revokeObjectURL(r.previewUrl));
                  setRows([]);
                }}
                disabled={busy}
                className="btn-ghost btn-sm"
              >
                Clear
              </button>
              <button type="button" onClick={uploadAll} disabled={busy || !readyCount} className="btn-primary">
                {busy ? 'Uploading…' : `Upload ${readyCount} photo${readyCount === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>

          <div className="relative border-b border-line p-3">
            <SearchIcon size={16} className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter the product list in the dropdowns…"
              className="input h-9 pl-9 text-[13.5px]"
              aria-label="Filter products"
            />
          </div>

          <ul className="divide-y divide-line">
            {rows.map((row, index) => {
              const product = row.productId ? productById.get(row.productId) : null;
              const replaces = Boolean(product?.image_url);

              return (
                <li key={`${row.file.name}-${index}`} className="flex flex-wrap items-center gap-3 p-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                    {/* Local object URL preview of a file the owner just chose. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={row.previewUrl} alt="" className="h-full w-full object-contain" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-ink">{row.file.name}</p>
                    <p className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
                      <span className={cn('status-pill', CONFIDENCE_STYLE[row.confidence])}>
                        {CONFIDENCE_LABEL[row.confidence]}
                      </span>
                      <span>{row.reason}</span>
                      {replaces && row.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 font-medium text-amber-600">
                          <AlertIcon size={13} />
                          replaces an existing photo
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="w-full sm:w-[300px]">
                    <label className="sr-only" htmlFor={`assign-${index}`}>
                      Product for {row.file.name}
                    </label>
                    <select
                      id={`assign-${index}`}
                      value={row.productId ?? ''}
                      disabled={busy || row.status === 'done'}
                      onChange={(e) => reassign(index, e.target.value)}
                      className="input h-9 text-[13px]"
                    >
                      <option value="">— not assigned —</option>
                      {filteredProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {[p.brand_name, p.name].filter(Boolean).join(' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex w-24 shrink-0 items-center justify-end gap-2">
                    {row.status === 'done' && (
                      <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-emerald-600">
                        <CheckIcon size={14} /> Live
                      </span>
                    )}
                    {row.status === 'uploading' && (
                      <span className="text-[12.5px] font-medium text-muted">Uploading…</span>
                    )}
                    {row.status === 'failed' && (
                      <span className="text-[12.5px] font-semibold text-brand-red" title={row.error}>
                        Failed
                      </span>
                    )}
                    {row.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        disabled={busy}
                        className="btn-ghost btn-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
