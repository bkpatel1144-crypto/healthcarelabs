import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, MessageCircle } from 'lucide-react';
import { SITE_CONFIG, whatsappHref } from '@/config/site';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';

/**
 * Restores scroll position on navigation. React Router keeps the scroll offset
 * between routes by default, which lands visitors halfway down a new page.
 * Hash targets are honoured so in-page anchors keep working.
 *
 * Getting a cross-page anchor to land takes more than one frame, and the site
 * has seven of these links — the header and hero "Book Home Collection"
 * buttons among them. Measured before this change, /contact-us#home-collection
 * missed its target on three runs out of three and left the visitor at the top
 * of the page; /contact-us#location-heading missed on two out of three, and
 * those two overshot by 500 and 1800 pixels.
 *
 * Two separate causes, so two separate defences:
 *
 *   1. The target does not exist yet. Route components are lazy-loaded, so one
 *      frame after navigation the Suspense fallback is still mounted and
 *      querySelector finds nothing. Retrying across frames fixes that; the old
 *      single check simply gave up and scrolled to the top.
 *   2. The target exists but the page is still settling. The scroll lands, then
 *      a band above the target resolves to a different height and carries it
 *      back out of view. One correction once the smooth scroll has finished is
 *      enough.
 *
 * Both defences stop the moment the visitor scrolls, presses a key or touches
 * the screen. Moving the page under someone who has taken over is worse than
 * missing the anchor.
 */
const ANCHOR_DEADLINE_MS = 5000;
/** How far the target may drift from its resting place before it is worth correcting. */
const ANCHOR_TOLERANCE_PX = 24;
/** How long the smooth scroll is given before corrections start jumping. */
const ANCHOR_SMOOTH_GRACE_MS = 650;
/**
 * How long the target is held in place while the page finishes settling.
 * Measured on the contact page, laying out took 1.7s from the anchor being
 * found to the document reaching its final height, so this has real headroom
 * over that rather than sitting just above it.
 */
const ANCHOR_HOLD_MS = 5000;
/** How often the landing is re-checked while the page settles. */
const ANCHOR_CHECK_MS = 150;
/**
 * Consecutive checks the target must sit still for, at an unchanged document
 * height, before the hold is released. Six of them is nearly a second of a
 * genuinely quiet page; at 200ms the contact page went quiet mid-render and
 * the hold let go just before the layout grew.
 */
const ANCHOR_STEADY_CHECKS = 6;

export function ScrollManager() {
  const { pathname, hash } = useLocation();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      return;
    }

    let cancelled = false;
    let frame = 0;
    let timer = 0;
    let movedToTop = false;

    const stop = () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };

    // A hash is not guaranteed to be a valid selector — "#1" throws.
    const find = (): HTMLElement | null => {
      try {
        return document.querySelector<HTMLElement>(hash);
      } catch {
        return null;
      }
    };

    /** Where scroll-margin-top says the target should come to rest. */
    const restingOffset = (el: HTMLElement) =>
      Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0;

    const land = (found: HTMLElement) => {
      found.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      /*
        Landing once is not enough, for two separate reasons.

        The smooth scroll may never arrive. A downward smooth scroll on this
        site does not reliably finish — content below the fold resolves as the
        scroll passes it and the browser abandons the animation part-way.
        Measured from the homepage, a smooth scroll to 1200px ended at 0, and
        on the blog it stopped after 90px. Scrolling up is unaffected, which is
        why the back-to-top button never showed this.

        And the page may still be laying out. On one run the target was found,
        measured near the top of the viewport and judged already in place —
        then the rest of the page rendered above it and carried it 2692px down.
        A fixed number of re-checks lost that race.

        So the target is held: every frame, if it has drifted from where
        scroll-margin-top says it belongs, it is put back with an instant jump,
        which nothing cancels. The hold ends as soon as it has been steady for
        a moment, or when the window runs out. `behavior: 'instant'` is the
        point — 'auto' inherits scroll-behavior: smooth from html and would be
        swallowed the same way.
      */
      const giveUpOnSmooth = performance.now() + (reduced ? 0 : ANCHOR_SMOOTH_GRACE_MS);
      const until = performance.now() + ANCHOR_HOLD_MS;
      let steady = 0;
      let lastHeight = -1;

      const check = () => {
        if (cancelled) return;

        /*
          Position alone cannot tell "settled" from "not rendered yet". Before
          the destination page lays out, the target really is sitting a few
          pixels below the top of an almost-empty document — exactly where it
          is supposed to end up — so a position check calls it done and lets go
          just before the page grows underneath it. The document's height is
          the honest signal: while it is still changing, nothing has settled.

          Polling rather than a frame loop, because this reads layout and a
          frame loop would do it sixty times a second for as long as the hold
          lasts, on a site where scroll cost has been fought for.
        */
        /*
          Re-queried every time, never held. Holding the node found on the
          first frame is what broke this: React replaces the subtree as the
          destination page finishes rendering, and the captured node is left
          detached. A detached node reports getBoundingClientRect().top of 0
          and a scroll-margin of 0, so it reads as permanently "already in
          place" — the hold sat there measuring a corpse while the live target
          stayed 2692px down the page.
        */
        const el = find();
        const height = document.documentElement.scrollHeight;
        if (!el || !el.isConnected) {
          steady = 0;
          lastHeight = height;
          if (performance.now() < until) timer = window.setTimeout(check, ANCHOR_CHECK_MS);
          return;
        }

        const resting = restingOffset(el);
        const top = el.getBoundingClientRect().top;
        const atRest = Math.abs(top - resting) <= ANCHOR_TOLERANCE_PX;

        if (!atRest && performance.now() > giveUpOnSmooth) {
          window.scrollTo({
            top: Math.max(0, window.scrollY + top - resting),
            left: 0,
            behavior: 'instant' as ScrollBehavior,
          });
        }

        steady = atRest && height === lastHeight ? steady + 1 : 0;
        lastHeight = height;

        if (steady < ANCHOR_STEADY_CHECKS && performance.now() < until) {
          timer = window.setTimeout(check, ANCHOR_CHECK_MS);
        }
      };

      timer = window.setTimeout(check, ANCHOR_CHECK_MS);
    };

    const deadline = performance.now() + ANCHOR_DEADLINE_MS;
    const tick = () => {
      if (cancelled) return;
      const el = find();
      if (el) {
        land(el);
        return;
      }
      /*
        Nothing to scroll to yet. Put the visitor at the top of the new page
        rather than leaving them at the previous page's offset — instantly,
        because html has scroll-behavior: smooth and an animated trip to the
        top would then fight the trip to the anchor.
      */
      if (!movedToTop) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        movedToTop = true;
      }
      if (performance.now() < deadline) frame = window.requestAnimationFrame(tick);
    };

    const takeovers = ['wheel', 'touchstart', 'keydown'] as const;
    for (const e of takeovers) window.addEventListener(e, stop, { passive: true });
    frame = window.requestAnimationFrame(tick);

    return () => {
      stop();
      for (const e of takeovers) window.removeEventListener(e, stop);
    };
  }, [pathname, hash, reduced]);

  return null;
}

/** Announces route changes to assistive technology. */
export function RouteAnnouncer() {
  const { pathname } = useLocation();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const id = window.setTimeout(() => setMessage(`${document.title} — page loaded`), 220);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}

export function FloatingActions() {
  const [showTop, setShowTop] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > window.innerHeight * 1.2);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-7 sm:right-7">
      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            onClick={() =>
              window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
            }
            aria-label="Back to top"
            initial={reduced ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.22 }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-line bg-white text-ink-muted shadow-lift transition-all duration-200 hover:-translate-y-0.5 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>

      <a
        href={whatsappHref()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Message ${SITE_CONFIG.brandName} on WhatsApp`}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_32px_-10px_rgba(37,211,102,0.75)] transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_rgba(37,211,102,0.9)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
      >
        {!reduced && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-[#25D366]/40 animate-pulse-ring"
          />
        )}
        <MessageCircle className="relative h-[26px] w-[26px]" strokeWidth={2} aria-hidden="true" />
        <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-navy-900 px-3 py-2 text-[13px] font-medium text-white opacity-0 shadow-lift transition-opacity duration-200 group-hover:opacity-100 lg:block">
          Chat with us
        </span>
      </a>
    </div>
  );
}
