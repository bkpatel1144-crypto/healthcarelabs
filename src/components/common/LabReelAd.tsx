import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ShieldCheck, X } from 'lucide-react';
import { STORAGE_KEYS, storage } from '@/lib/storage';
import { useAutoplayVideo } from '@/hooks/useAutoplayVideo';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { ACCREDITATION } from '@/data/accreditation';
import { cn } from '@/lib/cn';

/**
 * Floating promo reel, bottom-left.
 *
 * A vertical clip of the lab's own microscope work. The source is 1080x1920
 * ProRes, so the frame follows the footage rather than cropping it — portrait
 * is also what makes it read as a reel rather than a stray video player.
 *
 * It opens as a small live bubble and expands to the full card on hover, focus
 * or click. The full card measured 212x366 docked over the left column, which
 * covered a section heading outright; a fixed overlay large enough to sell
 * something is too large to leave sitting on the content, so the resting state
 * is the 76px bubble and the card is something the visitor asks for.
 *
 * Other rules it obeys to stay professional rather than intrusive:
 *
 *  - It waits until the visitor has scrolled past the hero, which would
 *    otherwise be competing with the thing the page is built around.
 *  - Dismissal is permanent and remembered. A promo that returns on every page
 *    view is an irritation, not a campaign.
 *  - Desktop only, from xl up. Below that the accessibility button occupies
 *    the same corner and there is no spare margin to float in.
 *  - Never on /admin, which is a working tool, not a shop window.
 *  - Under `prefers-reduced-motion` the poster frame replaces the moving clip.
 *    The hero video plays regardless because it is the centre of the page and
 *    the client asked for that explicitly; a clip looping in the corner of the
 *    screen is decoration, and looping decoration is what that setting is
 *    asking us not to do.
 *
 * The clip carries no audio track at all, so there is nothing to mute.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export function LabReelAd() {
  const location = useLocation();
  const reduced = usePrefersReducedMotion();
  const videoRef = useAutoplayVideo();
  const [dismissed, setDismissed] = useState(true);
  const [past, setPast] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  // Read the stored dismissal once, on mount.
  useEffect(() => {
    setDismissed(storage.get<boolean>(STORAGE_KEYS.reelDismissed, false));
  }, []);

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Escape collapses the card rather than dismissing the whole unit, so a
  // stray keypress cannot cost the visitor the thing they just opened.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    setDismissed(true);
    storage.set(STORAGE_KEYS.reelDismissed, true);
  };

  const onAdmin = location.pathname.startsWith('/admin');
  const show = !dismissed && !onAdmin && past;

  const media = reduced ? (
    <img
      src="/media/lab-reel-poster.jpg"
      alt="A scientist at the microscope in the Healthcare Labs laboratory."
      width={540}
      height={960}
      className="block h-full w-full object-cover"
    />
  ) : (
    <video
      ref={videoRef}
      aria-hidden="true"
      poster="/media/lab-reel-poster.jpg"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      tabIndex={-1}
      className="block h-full w-full object-cover"
    >
      <source src="/media/lab-reel.mp4" type="video/mp4" />
    </video>
  );

  return (
    <AnimatePresence>
      {show && (
        <motion.aside
          ref={rootRef}
          aria-label="Inside the laboratory"
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: -24, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, x: -20, scale: 0.96 }}
          transition={{ duration: 0.45, ease: EASE }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          /*
            z-40 keeps it under the header (z-50), the comparison dock (z-55)
            and the accessibility panel (z-65/66), so nothing it could overlap
            ends up behind it.
          */
          className="fixed bottom-6 left-6 z-40 hidden xl:block"
        >
          {/* ---------------- Collapsed: live bubble ---------------- */}
          <AnimatePresence initial={false}>
            {!open && (
              <motion.button
                type="button"
                onClick={() => setOpen(true)}
                aria-expanded={false}
                aria-label="Watch inside the laboratory"
                initial={reduced ? false : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.28, ease: EASE }}
                /*
                  Circle only. With the label alongside, the resting bubble
                  measured 203x76 and sat across a section heading; at 76x76 it
                  keeps to the margin. The label is what the expanded card is
                  for, and the pulse ring already reads as "this is playing".
                */
                className="glass group block rounded-full p-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                <span className="relative block h-[62px] w-[62px] overflow-hidden rounded-full ring-1 ring-white/70">
                  {media}
                  {!reduced && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full ring-2 ring-inset ring-mint-400/70"
                    />
                  )}
                </span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* ---------------- Expanded: full card ---------------- */}
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={reduced ? false : { opacity: 0, scale: 0.94, originX: 0, originY: 1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.32, ease: EASE }}
                className={cn('glass glass-sheen glass-sheen-dark w-[196px] rounded-3xl p-1.5')}
              >
                <div className="relative aspect-[9/16] overflow-hidden rounded-[1.15rem] bg-navy-950">
                  {media}

                  {/* Light enough to keep the footage visible, dark enough to read on. */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/25 to-transparent"
                  />

                  <div className="absolute inset-x-0 bottom-0 p-3.5">
                    <p className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-mint-300">
                      <ShieldCheck className="h-3 w-3" strokeWidth={2.6} aria-hidden="true" />
                      NABL {ACCREDITATION.certificateNumber}
                    </p>
                    <p className="mt-1.5 text-[13.5px] font-bold leading-snug tracking-[-0.01em] text-white">
                      Inside our laboratory
                    </p>
                    <Link
                      to="/health-package"
                      className="group mt-3 flex h-9 items-center justify-center gap-1.5 rounded-full bg-white text-[12.5px] font-semibold text-brand-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      Book a health check
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                        strokeWidth={2.4}
                        aria-hidden="true"
                      />
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={close}
                    aria-label="Hide the laboratory video for good"
                    className="glass-dark absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-white transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
