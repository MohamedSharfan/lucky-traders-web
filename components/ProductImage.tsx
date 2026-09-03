import Image from 'next/image';

import { cn } from '@/lib/format';
import { ProductArtwork, artworkKindFor, type ArtworkKind } from './ProductArtwork';

/**
 * Product / category image.
 *
 * Shows the uploaded photo when there is one. Otherwise it draws an
 * illustration of the right kind of package for the product's category (see
 * `ProductArtwork`) — so the catalog looks like a shop before a single photo
 * has been uploaded, and every uploaded photo silently replaces one.
 */
export function ProductImage({
  src,
  alt,
  emoji,
  categorySlug,
  subcategorySlug,
  artwork,
  unit,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px',
  priority = false,
  className,
  rounded = 'rounded-t-card',
}: {
  src: string | null | undefined;
  alt: string;
  /** Overrides the artwork with a single emoji — used for category tiles. */
  emoji?: string | null;
  categorySlug?: string | null;
  subcategorySlug?: string | null;
  /** Force a specific illustration instead of deriving it from the category. */
  artwork?: ArtworkKind;
  /** Printed on the pack, e.g. "5kg". */
  unit?: string | null;
  sizes?: string;
  priority?: boolean;
  className?: string;
  rounded?: string;
}) {
  if (src) {
    return (
      <div className={cn('relative aspect-square w-full overflow-hidden bg-white', rounded, className)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          className="object-contain p-2 transition-transform duration-200 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  if (emoji) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'relative flex aspect-square w-full items-center justify-center overflow-hidden bg-canvas select-none',
          rounded,
          className,
        )}
      >
        <span className="text-4xl sm:text-5xl" aria-hidden="true">
          {emoji}
        </span>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn('relative aspect-square w-full overflow-hidden select-none', rounded, className)}
    >
      <ProductArtwork
        kind={artwork ?? artworkKindFor(categorySlug, subcategorySlug, alt)}
        seed={alt}
        label={unit}
      />
    </div>
  );
}
