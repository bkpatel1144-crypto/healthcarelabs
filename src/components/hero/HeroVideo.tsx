import { useEffect, useRef, useState } from 'react';
import { useIsTablet, usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';

/**
 * Hero background video: a laboratory technician preparing and examining a
 * blood sample.
 *
 * Three things this handles that a bare `<video autoplay loop>` does not:
 *
 *  1. **Reduced motion and metered connections.** If the visitor has asked for
 *     less motion, or the browser reports a data-saver connection, only the
 *     poster frame is served — the video element is never mounted, so nothing
 *     is downloaded.
 *  2. **Source by viewport.** A phone gets the 720p encode (368 KB) rather
 *     than the 1080p one (917 KB). `<source media>` is unreliable across
 *     browsers, so the choice is made in JS before the element mounts.
 *  3. **No first-frame flash.** The poster shows until `canplay` fires, then
 *     the video cross-fades in over it.
 *
 * The clip is a forward+reversed ping-pong encode, so it loops without a
 * visible jump at the seam.
 */

const SOURCES = {
  desktop: '/media/hero-lab.mp4',
  mobile: '/media/hero-lab-720.mp4',
  poster: '/media/hero-lab-poster.jpg',
} as const;

/** True when the browser reports a metered or slow connection. */
function prefersLessData(): boolean {
  if (typeof navigator === 'undefined') return false;
  const c = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (!c) return false;
  if (c.saveData) return true;
  return c.effectiveType === 'slow-2g' || c.effectiveType === '2g';
}

export function HeroVideo() {
  const reduced = usePrefersReducedMotion();
  const compact = useIsTablet();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [stillOnly, setStillOnly] = useState(true);

  // Decided after mount so the first paint is never blocked, and so the
  // connection check runs on the client only.
  useEffect(() => {
    setStillOnly(reduced || prefersLessData());
  }, [reduced]);

  // Some browsers reject the autoplay promise even when muted; retry once on
  // the first user interaction rather than leaving a frozen poster.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || stillOnly) return;

    const tryPlay = () => void el.play().catch(() => undefined);
    tryPlay();

    const onInteract = () => {
      tryPlay();
      window.removeEventListener('pointerdown', onInteract);
    };
    window.addEventListener('pointerdown', onInteract, { once: true });
    return () => window.removeEventListener('pointerdown', onInteract);
  }, [stillOnly]);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {/*
        Poster: the base layer, and the only layer when motion is unwanted.
        The lg transform zooms slightly and shifts left so the technician sits
        in the gap between the copy and the finder panel — at native framing
        the subject fell directly behind the panel and was hidden.
      */}
      <img
        src={SOURCES.poster}
        alt=""
        width={1920}
        height={1080}
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-[62%_center] lg:origin-center lg:scale-[1.22] lg:-translate-x-[10%] lg:object-center"
      />

      {!stillOnly && (
        <video
          ref={videoRef}
          poster={SOURCES.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          tabIndex={-1}
          onCanPlay={() => setReady(true)}
          className={cn(
            'absolute inset-0 h-full w-full object-cover object-[62%_center] lg:origin-center lg:scale-[1.22] lg:-translate-x-[10%] lg:object-center',
            'transition-opacity duration-1000 ease-premium',
            ready ? 'opacity-100' : 'opacity-0',
          )}
        >
          <source src={compact ? SOURCES.mobile : SOURCES.desktop} type="video/mp4" />
        </video>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Overlay stack. The footage is mostly white PPE exactly where the   */}
      {/* headline sits, so legibility here is carried by a left-weighted    */}
      {/* ramp rather than by one flat scrim — a uniform darkening heavy     */}
      {/* enough for the copy would have killed the footage entirely.        */}
      {/* ---------------------------------------------------------------- */}

      {/*
        1. Base darkening. Deliberately light on desktop: these layers compound,
        and an earlier pass at 55% here plus the grade and the ramp left the
        footage all but invisible. Small screens still need a heavy scrim
        because the copy spans the full width there.
      */}
      <div className="absolute inset-0 bg-navy-950/72 sm:bg-navy-950/60 lg:bg-navy-950/32" />

      {/* 2. Grade the footage into the brand navy instead of neutral grey. */}
      <div className="absolute inset-0 bg-navy-700/28 mix-blend-color" />

      {/* 3. Legibility ramp: near-solid behind the copy, clearing to the right. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,14,46,0.9)_0%,rgba(5,14,46,0.5)_48%,rgba(7,19,61,0.7)_100%)] lg:bg-[linear-gradient(90deg,rgba(5,14,46,0.94)_0%,rgba(5,14,46,0.8)_28%,rgba(7,19,61,0.34)_54%,rgba(7,19,61,0.06)_100%)]" />

      {/* 4. Fade under the header and into the following section. */}
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-navy-950 via-navy-950/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-navy-950 to-transparent" />

      {/* 5. The technical grid, kept faint and masked away from the centre. */}
      <div className="absolute inset-0 bg-grid-dark opacity-40 [background-size:76px_76px] [mask-image:radial-gradient(ellipse_70%_70%_at_25%_40%,#000_10%,transparent_75%)]" />
    </div>
  );
}
