import { useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { SitePhoto } from '@/types';

/**
 * Full-screen photo viewer.
 *
 * Kept deliberately small — no library. It is a modal dialog with arrow-key
 * navigation, Escape to close, a focus trap, and focus returned to whatever
 * opened it. Body scroll is locked while open.
 */
export function PhotoLightbox({
  photos,
  index,
  onClose,
  onIndexChange,
}: {
  photos: SitePhoto[];
  index: number;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const photo = photos[index];

  const step = useCallback(
    (delta: number) => onIndexChange((index + delta + photos.length) % photos.length),
    [index, photos.length, onIndexChange],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>('button');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    window.requestAnimationFrame(() =>
      panelRef.current?.querySelector<HTMLElement>('button')?.focus(),
    );

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, step]);

  if (!photo) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photograph ${index + 1} of ${photos.length}: ${photo.caption || photo.alt}`}
      className="fixed inset-0 z-[80] flex flex-col bg-navy-950/95 backdrop-blur-sm"
    >
      <div className="flex shrink-0 items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <p className="font-mono text-[12.5px] tabular-nums text-slate-400">
          {String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photograph"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-brand-400 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300"
        >
          <X className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center gap-2 px-3 sm:gap-5 sm:px-8">
        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous photograph"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-brand-400 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
          </button>
        )}

        <figure className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <picture>
            <source type="image/avif" srcSet={photo.avif} sizes="92vw" />
            <source type="image/webp" srcSet={photo.webp} sizes="92vw" />
            <img
              src={photo.src}
              srcSet={photo.jpeg}
              sizes="92vw"
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              className="max-h-[72vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
            />
          </picture>
          {photo.caption && (
            <figcaption className="mt-5 max-w-2xl px-2 text-center text-[14px] leading-relaxed text-slate-300">
              {photo.caption}
            </figcaption>
          )}
        </figure>

        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next photograph"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-brand-400 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="h-6 shrink-0" />
    </div>
  );
}
