'use client';

import { useRef, useState } from 'react';

import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/format';
import { CloseIcon, ImageIcon, UploadIcon } from '@/components/ui/Icon';

/**
 * Image picker used by the product, category and store-settings forms.
 *
 * Uploads go to /api/upload, which stores them in Supabase Storage when it is
 * configured and in `public/uploads` otherwise. The caller only ever deals with
 * the resulting URL string.
 */
export function ImageUploader({
  value,
  onChange,
  label = 'Image',
  hint = 'JPG, PNG or WebP, up to 5 MB. Square images look best.',
  aspect = 'square',
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
  aspect?: 'square' | 'wide';
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const toast = useToast();

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('That image is larger than 5 MB. Please compress it first.');
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error ?? 'Upload failed');
      onChange(json.data.url);
      toast.success('Image uploaded.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <span className="label">{label}</span>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors',
          dragging ? 'border-brand-blue bg-brand-blueSoft' : 'border-line bg-canvas',
          aspect === 'square' ? 'min-h-[180px]' : 'min-h-[130px]',
        )}
      >
        {value ? (
          <>
            {/* Plain img: uploaded files vary in origin and this is admin-only. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Uploaded preview"
              className={cn('mx-auto rounded-lg object-contain', aspect === 'square' ? 'max-h-40' : 'max-h-28')}
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-muted shadow-card transition-colors hover:text-brand-red"
              aria-label="Remove image"
            >
              <CloseIcon size={15} />
            </button>
          </>
        ) : (
          <>
            <ImageIcon size={28} className="mb-2 text-muted" />
            <p className="text-[13px] text-muted">Drag an image here, or</p>
          </>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-outline btn-sm"
          >
            <UploadIcon size={15} />
            {uploading ? 'Uploading…' : value ? 'Replace image' : 'Choose image'}
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
        />
      </div>

      <p className="hint">{hint}</p>

      {/* A URL can also be pasted, which is handy when migrating an old catalog. */}
      <input
        type="url"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="…or paste an image URL"
        className="input mt-2 h-9 text-[13px]"
        aria-label={`${label} URL`}
      />
    </div>
  );
}
