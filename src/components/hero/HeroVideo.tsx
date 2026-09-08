import { useEffect, useRef, useState } from 'react';
import { useIsTablet } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';

/**
 * Hero background video: a laboratory technician preparing a blood sample.
 *
 * It always autoplays, on every visit, with no gating and no controls. An
 * earlier version withheld it under `prefers-reduced-motion` and on data-saver
 * connections; that is the textbook behaviour, but on Windows the reduced-
 * motion flag is set by switching off animation effects — a performance
 * setting as often as an accessibility one — so ordinary machines showed a
 * still image and looked broken. Autoplay-always is the client's explicit
 * decision, taken with that trade-off on the table.
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

export function HeroVideo() {
  const compact = useIsTablet();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Muted autoplay is permitted everywhere, but a browser can still reject the
  // promise; retry once on first interaction rather than sitting frozen.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const tryPlay = () => void el.play().catch(() => undefined);
    tryPlay();

    const onInteract = () => {
      tryPlay();
      window.removeEventListener('pointerdown', onInteract);
    };
    window.addEventListener('pointerdown', onInteract, { once: true });
    return () => window.removeEventListener('pointerdown', onInteract);
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {/*
        Poster: the base layer, always present. The video cross-fades in over
        it, so there is never a flash of empty space — and a decode failure
        just leaves the still in place instead of a black rectangle.
      */}
      <img src={SOURCES.poster} alt="" width={1920} height={1080} className={FRAMING} />

      {!failed && (
        <video
          ref={videoRef}
          poster={SOURCES.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
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
