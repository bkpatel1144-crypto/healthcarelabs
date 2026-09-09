import { Expand } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { SitePhoto } from '@/types';

/**
 * A photograph that opens the lightbox. A real `<button>`, so it is reachable
 * by keyboard and announced properly — an `onClick` on a `<div>` would leave
 * the whole gallery unusable without a mouse.
 *
 * `width`/`height` come from the generated manifest, so the browser reserves
 * the exact aspect box before the image arrives and the layout never jumps.
 */
export function PhotoTile({
  photo,
  onOpen,
  sizes,
  className,
  priority = false,
  showTag = false,
  showCaption = true,
}: {
  photo: SitePhoto;
  onOpen: () => void;
  sizes: string;
  className?: string;
  priority?: boolean;
  showTag?: boolean;
  /** Off where a <figcaption> already carries the caption below the tile. */
  showCaption?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`View larger: ${photo.caption || photo.alt}`}
      className={cn(
        'group relative block w-full overflow-hidden rounded-xl ring-1 ring-inset ring-white/12',
        'transition-all duration-300 ease-premium hover:ring-brand-400/50',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300',
        className,
      )}
    >
      <picture>
        <source type="image/avif" srcSet={photo.avif} sizes={sizes} />
        <source type="image/webp" srcSet={photo.webp} sizes={sizes} />
        <img
          src={photo.src}
          srcSet={photo.jpeg}
          sizes={sizes}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 ease-premium group-hover:scale-[1.03]"
        />
      </picture>

      {/* Scrim so the chip and the expand affordance stay legible on any photo. */}
      {(showCaption || showTag) && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-navy-950/80 via-navy-950/25 to-transparent"
        />
      )}

      {showTag && photo.tag && (
        <span className="glass-dark absolute left-3 top-3 rounded-lg px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-white">
          {photo.tag}
        </span>
      )}

      {showCaption && photo.caption && (
        <span className="absolute inset-x-0 bottom-0 px-4 pb-3.5 text-left text-[13px] font-semibold leading-snug text-white">
          {photo.caption}
        </span>
      )}

      <span
        aria-hidden="true"
        className="glass-dark absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        <Expand className="h-4 w-4" strokeWidth={2.2} />
      </span>
    </button>
  );
}
