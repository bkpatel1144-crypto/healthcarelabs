import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { useIsTablet, usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';

/**
 * Hero background video: a laboratory technician preparing a blood sample.
 *
 * The clip loops by crossfading its own tail back onto its head, so motion
 * always runs forward. Two earlier cuts were wrong in instructive ways: a
 * ping-pong encode looped seamlessly but ran the technician's hands backwards,
 * and a later cut took the microscope half of the source — technically a
 * perfect loop, but so nearly motionless it read as a still photograph. The
 * current cut is the pipetting sequence, where the movement actually is:
 * 30.35 RMSE between samples in the visible band, against 7.90 for that
 * static attempt. Seam measures 7.34/255 first vs last frame. See the README
 * before re-encoding.
 *
 * | File                | Size   | Notes                    |
 * | ------------------- | ------ | ------------------------ |
 * | hero-lab.mp4        | 980 KB | 1080p, H.264 High@4.0    |
 * | hero-lab-720.mp4    | 444 KB | 720p, H.264 Main@3.1     |
 * | hero-lab-poster.jpg |  96 KB | the loop's own 1st frame |
 *
 * **The H.264 levels are pinned deliberately.** An earlier encode came out at
 * Level 5.0, which decodes fine in software but sits above the ceiling many
 * older hardware decoders accept for High profile — so it played on the
 * machine it was built on and nowhere else. Level 4.0 covers 1080p25 with room
 * to spare and is the widest-supported ceiling; 3.1 is the classic 720p one.
 */

const SOURCES = {
  desktop: '/media/hero-lab.mp4',
  mobile: '/media/hero-lab-720.mp4',
  poster: '/media/hero-lab-poster.jpg',
} as const;

/** Shared framing: zoom and shift so the technician clears the finder panel. */
const FRAMING =
  'absolute inset-0 h-full w-full object-cover object-[62%_center] ' +
  'lg:origin-center lg:scale-[1.22] lg:-translate-x-[10%] lg:object-center';

/** True when the browser reports a metered or very slow connection. */
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
  const [failed, setFailed] = useState(false);
  const [userStarted, setUserStarted] = useState(false);
  /** Undecided until mounted, so first paint is never blocked. */
  const [optIn, setOptIn] = useState<boolean | null>(null);

  useEffect(() => {
    setOptIn(reduced || prefersLessData());
  }, [reduced]);

  /*
    Opt-in mode shows a real play button rather than silently swallowing the
    video. The previous version simply refused to mount it, so a PC with
    Windows animation effects switched off — a common performance setting, not
    necessarily an accessibility one — saw a still image, no way to reach the
    footage, and no sign anything was missing.
  */
  const showVideo = optIn === false || userStarted;

  // Muted autoplay is permitted everywhere, but a browser can still reject the
  // promise; retry once on first interaction rather than sitting frozen.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !showVideo) return;

    const tryPlay = () => void el.play().catch(() => undefined);
    tryPlay();

    const onInteract = () => {
      tryPlay();
      window.removeEventListener('pointerdown', onInteract);
    };
    window.addEventListener('pointerdown', onInteract, { once: true });
    return () => window.removeEventListener('pointerdown', onInteract);
  }, [showVideo]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/*
        Poster: the base layer, always present. The video cross-fades in over
        it, so there is never a flash of empty space — and a decode failure
        just leaves the still in place instead of a black rectangle.
      */}
      <img
        src={SOURCES.poster}
        alt=""
        aria-hidden="true"
        width={1920}
        height={1080}
        className={FRAMING}
      />

      {showVideo && !failed && (
        <video
          ref={videoRef}
          aria-hidden="true"
          poster={SOURCES.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          tabIndex={-1}
          onCanPlay={() => setReady(true)}
          onError={() => {
            setFailed(true);
            if (import.meta.env.DEV) {
              console.warn('Hero video failed to load; leaving the poster in place.');
            }
          }}
          className={cn(
            FRAMING,
            'transition-opacity duration-1000 ease-premium',
            ready ? 'opacity-100' : 'opacity-0',
          )}
        >
          <source src={compact ? SOURCES.mobile : SOURCES.desktop} type="video/mp4" />
        </video>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Overlay stack. The footage is mostly white PPE exactly where the  */}
      {/* headline sits, so legibility is carried by a left-weighted ramp   */}
      {/* rather than one flat scrim — a uniform darkening heavy enough for */}
      {/* the copy killed the footage entirely.                            */}
      {/* ---------------------------------------------------------------- */}

      {/*
        1. Base darkening. Deliberately light on desktop: these layers compound,
        and an earlier pass at 55% here plus the grade and the ramp left the
        footage all but invisible. Small screens still need a heavy scrim
        because the copy spans the full width there.
      */}
      <div aria-hidden="true" className="absolute inset-0 bg-navy-950/72 sm:bg-navy-950/60 lg:bg-navy-950/32" />

      {/* 2. Grade the footage into the brand navy instead of neutral grey. */}
      <div aria-hidden="true" className="absolute inset-0 bg-navy-700/28 mix-blend-color" />

      {/* 3. Legibility ramp: near-solid behind the copy, clearing to the right. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,14,46,0.9)_0%,rgba(5,14,46,0.5)_48%,rgba(7,19,61,0.7)_100%)] lg:bg-[linear-gradient(90deg,rgba(5,14,46,0.94)_0%,rgba(5,14,46,0.8)_28%,rgba(7,19,61,0.34)_54%,rgba(7,19,61,0.06)_100%)]"
      />

      {/* 4. Fade under the header and into the following section. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-navy-950 via-navy-950/60 to-transparent" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-navy-950 to-transparent" />

      {/* 5. The technical grid, kept faint and masked away from the centre. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-grid-dark opacity-40 [background-size:76px_76px] [mask-image:radial-gradient(ellipse_70%_70%_at_25%_40%,#000_10%,transparent_75%)]"
      />

      {/* The one real control here — reachable by keyboard, above the overlay. */}
      {optIn === true && !userStarted && (
        <button
          type="button"
          onClick={() => setUserStarted(true)}
          className={cn(
            'group absolute bottom-6 right-5 z-10 flex items-center gap-2.5 rounded-full',
            'bg-navy-950/70 px-4 py-2.5 ring-1 ring-inset ring-white/20 backdrop-blur-sm',
            'transition-colors hover:bg-navy-900/85 hover:ring-white/35',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300',
            'sm:bottom-8 sm:right-8',
          )}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white">
            <Play className="h-3.5 w-3.5 translate-x-[1px]" strokeWidth={0} fill="currentColor" />
          </span>
          <span className="text-[12.5px] font-semibold text-white">Play background video</span>
        </button>
      )}
    </div>
  );
}
