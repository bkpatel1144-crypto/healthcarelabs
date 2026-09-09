import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ShieldCheck, X } from 'lucide-react';
import { STORAGE_KEYS, storage } from '@/lib/storage';
import { useAutoplayVideo } from '@/hooks/useAutoplayVideo';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { ACCREDITATION } from '@/data/accreditation';

/**
 * Floating promo reel, bottom-left.
 *
 * A vertical clip of the lab's own microscope work, playing muted on a loop in
 * a glass frame with one call to action. The source is 1080x1920 ProRes, so the
 * frame follows the footage rather than cropping it — portrait is also what
 * makes it read as a reel rather than a stray video player.
 *
 * The card itself is the resting state — an earlier version rested as a 76px
 * bubble that expanded on hover, and the client asked for the video to show
 * rather than a thumbnail of it. It is held back until the visitor has scrolled
 * past the hero, so it never sits on the opening screen. `useAutoplayVideo` keeps it playing: `autoplay` alone is not
 * reliable, since some mobile Chrome builds and data-saver modes leave a muted
 * inline video paused even where the policy allows it.
 *
 * The remaining rules exist so a fixed overlay does not become a nuisance:
 *
 *  - Dismissible, and the dismissal is remembered. A promo that returns on
 *    every page view is an irritation, not a campaign.
 *  - From sm up only. Below that the accessibility launcher becomes a corner
 *    button in this exact spot and the comparison dock spans the full width,
 *    so there is no room to float without covering one of them.
 *  - Never on /admin, which is a working tool, not a shop window.
 *  - z-40, so it sits under the header, the comparison dock and the
 *    accessibility panel rather than over them.
 *
 * The clip carries no audio track at all, so `muted` has nothing to silence —
 * it is set because autoplay policies require it, not because there is sound.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export function LabReelAd() {
  const location = useLocation();
  const reduced = usePrefersReducedMotion();
  const videoRef = useAutoplayVideo();
  const [dismissed, setDismissed] = useState(true);
  const [pastHero, setPastHero] = useState(false);

  // Read the stored dismissal once, on mount.
  useEffect(() => {
    setDismissed(storage.get<boolean>(STORAGE_KEYS.reelDismissed, false));
  }, []);

  /*
    Hold it back until the visitor is past the hero. Measured at 1440, an
    always-on card at bottom-left covers the first hero stat card outright, and
    the hero already carries its own video inset — two clips playing over each
    other on first paint is noise, not a campaign. It appears once the reading
    starts and then stays for the rest of the page.
  */
  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => {
    setDismissed(true);
    storage.set(STORAGE_KEYS.reelDismissed, true);
  };

  const onAdmin = location.pathname.startsWith('/admin');

  return (
    <AnimatePresence>
      {!dismissed && !onAdmin && pastHero && (
        <motion.aside
          aria-label="Inside the laboratory"
          /*
            The transitions are declared per-variant, not once on `transition`.
            A shared transition applied the 0.6s entrance delay to the exit as
            well, so closing the card left it on screen for 1.15s and it read
            as an unresponsive button.
          */
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: -24, y: 12 }}
          animate={{
            opacity: 1,
            x: 0,
            y: 0,
            transition: { duration: 0.5, ease: EASE },
          }}
          exit={{
            opacity: 0,
            ...(reduced ? {} : { x: -20, scale: 0.96 }),
            transition: { duration: 0.26, ease: EASE },
          }}
          className="glass glass-sheen glass-sheen-dark fixed bottom-5 left-5 z-40 hidden w-[164px] rounded-3xl p-1.5 sm:block lg:bottom-6 lg:left-6 lg:w-[186px] xl:w-[200px]"
        >
          <div className="relative aspect-[9/16] overflow-hidden rounded-[1.15rem] bg-navy-950">
            {/*
              Plays on every device and under every motion preference. The
              client has asked twice for the video to start on its own, and
              Windows reports "animation effects off" as reduced motion, which
              had already silently withheld the hero video once.
            */}
            <video
              ref={videoRef}
              aria-hidden="true"
              poster="/media/lab-reel-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              disablePictureInPicture
              tabIndex={-1}
              className="block h-full w-full object-cover"
            >
              <source src="/media/lab-reel.mp4" type="video/mp4" />
            </video>

            {/* Light enough to keep the footage visible, dark enough to read on. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/25 to-transparent"
            />

            <div className="absolute inset-x-0 bottom-0 p-3.5">
              <p className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-mint-300">
                <ShieldCheck className="h-3 w-3 shrink-0" strokeWidth={2.6} aria-hidden="true" />
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
                  className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={2.4}
                  aria-hidden="true"
                />
              </Link>
            </div>

            <button
              type="button"
              onClick={close}
              aria-label="Hide the laboratory video"
              className="glass-dark absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-white transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
