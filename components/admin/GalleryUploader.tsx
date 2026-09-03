'use client';

import { useRef, useState } from 'react';

import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/format';
import { CloseIcon, ImageIcon, PlusIcon, UploadIcon } from '@/components/ui/Icon';

/**
 * Extra product photos.
 *
 * The main image is handled separately by `ImageUploader`; these are the
 * additional shots shown as thumbnails on the product page (back of the pack,
 * ingredients list, the item in someone's hand). Order matters, so images can
 * be moved left and right.
 */

const MAX_IMAGES = 6;

export function GalleryUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const remaining = MAX_IMAGES - value.length;

  async function upload(files: FileList) {
    const chosen = Array.from(files).slice(0, remaining);
    if (!chosen.length) {
      toast.error(`You can add up to ${MAX_IMAGES} extra images.`);
      return;
    }

    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of chosen) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image — skipped.`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is over 5 MB — skipped.`);
          continue;
        }

        const body = new FormData();
        body.append('file', file);
        const response = await fetch('/api/upload', { method: 'POST', body });
        const json = await response.json();
        if (!json.ok) {
          toast.error(json.error ?? `Could not upload ${file.name}.`);
          continue;
        }
        uploaded.push(json.data.url);
      }

      if (uploaded.length) {
        onChange([...value, ...uploaded]);
        toast.success(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} added.`);
      }
    } catch {
      toast.error('Upload failed. Please check your connection and try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div>
      <span className="label">
        More images{' '}
        <span className="font-normal text-muted">
          ({value.length}/{MAX_IMAGES})
        </span>
      </span>

      {value.length > 0 && (
        <ul className="mb-2 grid grid-cols-3 gap-2">
          {value.map((url, index) => (
            <li key={`${url}-${index}`} className="group relative">
              <div className="aspect-square overflow-hidden rounded-lg border border-line bg-white">
                {/* Admin-only preview of an already-uploaded file. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Extra image ${index + 1}`} className="h-full w-full object-contain" />
              </div>

              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="absolute right-1 top-1 rounded-full bg-white p-1 text-muted shadow-card transition-colors hover:text-brand-red"
                aria-label={`Remove image ${index + 1}`}
              >
                <CloseIcon size={13} />
              </button>

              <div className="mt-1 flex justify-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  className="rounded px-1.5 text-[13px] text-muted hover:bg-canvas hover:text-ink disabled:opacity-30"
                  aria-label={`Move image ${index + 1} earlier`}
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  disabled={index === value.length - 1}
                  className="rounded px-1.5 text-[13px] text-muted hover:bg-canvas hover:text-ink disabled:opacity-30"
                  aria-label={`Move image ${index + 1} later`}
                >
                  →
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || remaining <= 0}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line',
          'bg-canvas py-3 text-[13px] font-semibold text-muted transition-colors',
          'hover:border-brand-blue hover:text-brand-blue disabled:opacity-50 disabled:hover:border-line disabled:hover:text-muted',
        )}
      >
        {uploading ? (
          <>
            <UploadIcon size={16} />
            Uploading…
          </>
        ) : remaining <= 0 ? (
          <>
            <ImageIcon size={16} />
            Maximum of {MAX_IMAGES} extra images
          </>
        ) : (
          <>
            <PlusIcon size={16} />
            Add images
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="sr-only"
        onChange={(e) => e.target.files && upload(e.target.files)}
      />

      <p className="hint">Shown as thumbnails under the main photo on the product page.</p>
    </div>
  );
}
