import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ClipboardList, Clock, ListChecks, Plus, X } from 'lucide-react';
import { useContent } from '@/store/content';
import { formatPrice } from '@/lib/format';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';
import type { HealthPackage } from '@/types';

/**
 * Plan a visit: pick several panels, see the total, book them in one request.
 *
 * Every comparable lab in the market — Redcliffe, Orange Health, Healthians —
 * lets someone assemble more than one test before they book. This site could
 * only ever hand over a single package slug, so a visitor who wanted a full
 * body check *and* a thyroid panel had to book twice or explain it in a free
 * text box. That is the gap, and unlike report tracking or family profiles it
 * needs no server: the plan is a list of slugs in the same localStorage
 * preferences that already hold saved and compared packages.
 *
 * Deliberately a header control with a slide-over, not another floating dock.
 * The page already carries a comparison dock, the reel, the accessibility
 * launcher and two contact buttons; a fifth floating thing would be clutter,
 * and a cart in the header is where people look for one anyway.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Resolves the visit list to live packages, dropping anything since archived. */
function useVisit() {
  const { preferences, livePackages, toggleVisitPackage, clearVisit } = useContent();
  const items = useMemo(
    () =>
      preferences.visitPackages
        .map((slug) => livePackages.find((p) => p.slug === slug))
        .filter((p): p is HealthPackage => Boolean(p)),
    [preferences.visitPackages, livePackages],
  );

  const total = items.reduce((sum, p) => sum + (p.offerPrice ?? p.price ?? 0), 0);
  const priced = items.filter((p) => (p.offerPrice ?? p.price) !== null).length;
  const tests = new Set(items.flatMap((p) => p.tests)).size;

  return { items, total, priced, tests, toggleVisitPackage, clearVisit };
}

/* ------------------------------------------------------------------ Trigger */

export function AddToVisit({
  slug,
  className,
  variant = 'icon',
}: {
  slug: string;
  className?: string;
  variant?: 'icon' | 'label';
}) {
  const { preferences, toggleVisitPackage } = useContent();
  const added = preferences.visitPackages.includes(slug);

  return (
    <button
      type="button"
      onClick={() => toggleVisitPackage(slug)}
      aria-pressed={added}
      className={cn(
        'inline-flex min-w-0 shrink items-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        variant === 'icon' ? 'h-9 px-3 text-[12.5px]' : 'h-11 px-5 text-[13.5px]',
        added
          ? 'bg-mint-500 text-white shadow-[0_12px_28px_-14px_rgba(6,122,104,0.9)]'
          : 'bg-white text-ink-muted shadow-soft ring-1 ring-brand-100 hover:text-brand-600 hover:ring-brand-300',
        className,
      )}
    >
      {added ? (
        <Check className="h-4 w-4 shrink-0" strokeWidth={2.6} aria-hidden="true" />
      ) : (
        <Plus className="h-4 w-4 shrink-0" strokeWidth={2.6} aria-hidden="true" />
      )}
      <span className="truncate">{added ? 'In your visit' : 'Add to visit'}</span>
    </button>
  );
}

/* ------------------------------------------------------- Header control */

export function VisitButton({ className }: { className?: string }) {
  const { items } = useVisit();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={
          items.length === 0
            ? 'Your visit plan is empty'
            : `Your visit plan, ${items.length} package${items.length === 1 ? '' : 's'}`
        }
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition-colors',
          'hover:bg-white hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
          className,
        )}
      >
        <ClipboardList className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
        {items.length > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-mint-500 px-1 text-[10.5px] font-bold tabular-nums text-white ring-2 ring-white"
          >
            {items.length}
          </span>
        )}
      </button>

      <VisitDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/* --------------------------------------------------------------- Slide-over */

function VisitDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  /*
    Rendered into <body>, not where it sits in the tree.

    The trigger lives in the header, and the header bar carries a
    backdrop-filter for its glass. Any filter, transform or backdrop-filter on
    an ancestor makes that ancestor the containing block for `position: fixed`
    descendants — so `fixed inset-0` resolved against the 76px header bar
    instead of the viewport, and the drawer rendered as a 76px sliver pinned
    under the nav. Measured: wrapper height 76 at top 40 in a 900px viewport.
    A portal is the fix; moving the markup elsewhere in the tree would only
    move the problem.
  */
  const { items, total, priced, tests, toggleVisitPackage, clearVisit } = useVisit();
  const reduced = usePrefersReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab') return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
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
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70]"
        >
          <button
            type="button"
            aria-label="Close the visit plan"
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default bg-navy-950/45 backdrop-blur-md"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="visit-title"
            initial={reduced ? false : { x: '100%' }}
            animate={{ x: 0 }}
            exit={reduced ? undefined : { x: '100%' }}
            transition={{ duration: 0.36, ease: EASE }}
            className="glass-solid absolute inset-y-0 right-0 flex w-[min(420px,92vw)] flex-col rounded-none border-y-0 border-r-0"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-brand-50 p-6">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">
                  <ClipboardList className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                  Your visit
                </p>
                <h2 id="visit-title" className="mt-2 text-[21px] font-extrabold tracking-editorial text-ink">
                  {items.length === 0
                    ? 'Nothing added yet'
                    : `${items.length} package${items.length === 1 ? '' : 's'}`}
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close the visit plan"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-ink-muted shadow-soft ring-1 ring-brand-100 transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                <X className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-6">
              {items.length === 0 ? (
                <p className="text-[14.5px] leading-relaxed text-ink-muted">
                  Add panels from any package and they collect here, so one home visit can cover
                  everything you need rather than booking them one at a time.
                </p>
              ) : (
                <ul className="space-y-3">
                  {items.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-start gap-3 rounded-2xl bg-surface-soft p-3.5 ring-1 ring-brand-50"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/health-package/${p.slug}`}
                          onClick={onClose}
                          className="block truncate text-[14.5px] font-semibold text-ink transition-colors hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                        >
                          {p.name}
                        </Link>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-ink-soft">
                          <span className="flex items-center gap-1">
                            <ListChecks className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                            {p.tests.length} tests
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                            {p.reportTime}
                          </span>
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="block text-[14.5px] font-bold tabular-nums text-ink">
                          {p.offerPrice !== null
                            ? formatPrice(p.offerPrice)
                            : p.price !== null
                              ? formatPrice(p.price)
                              : 'On request'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleVisitPackage(p.slug)}
                          aria-label={`Remove ${p.name} from your visit`}
                          className="mt-1 text-[12px] font-semibold text-ink-soft transition-colors hover:text-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="shrink-0 border-t border-brand-50 p-6">
                <dl className="space-y-2 text-[14px]">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-ink-muted">Distinct tests</dt>
                    <dd className="font-semibold tabular-nums text-ink">{tests}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-semibold text-ink">Total</dt>
                    <dd className="text-[20px] font-extrabold tabular-nums text-brand-600">
                      {formatPrice(total)}
                    </dd>
                  </div>
                </dl>

                {priced < items.length && (
                  <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
                    {items.length - priced} of these is priced on request, so the total covers the
                    rest. The lab confirms the final amount when it calls.
                  </p>
                )}

                <Link
                  to="/contact-us#home-collection"
                  onClick={onClose}
                  className="group mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-brand-500 text-[14px] font-semibold text-white shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                >
                  Book one home visit for all
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    strokeWidth={2.4}
                    aria-hidden="true"
                  />
                </Link>
                <button
                  type="button"
                  onClick={clearVisit}
                  className="mt-3 w-full text-[12.5px] font-semibold text-ink-soft transition-colors hover:text-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                >
                  Clear the plan
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* --------------------------------------------- Summary inside the booking form */

/** What the home-collection form shows when a visit has been planned. */
export function VisitSummary() {
  const { items, total, priced } = useVisit();
  if (items.length === 0) return null;

  return (
    <div className="mb-8 rounded-3xl bg-surface-soft p-5 ring-1 ring-brand-100 sm:p-6">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">
        <ClipboardList className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
        Booking for your planned visit
      </p>
      <ul className="mt-4 space-y-2">
        {items.map((p) => (
          <li key={p.id} className="flex items-baseline justify-between gap-4 text-[14px]">
            <span className="min-w-0 truncate text-ink">{p.name}</span>
            <span className="shrink-0 font-semibold tabular-nums text-ink-muted">
              {p.offerPrice !== null
                ? formatPrice(p.offerPrice)
                : p.price !== null
                  ? formatPrice(p.price)
                  : 'On request'}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-baseline justify-between gap-4 border-t border-brand-100 pt-3 text-[14px]">
        <span className="font-semibold text-ink">Total</span>
        <span className="text-[18px] font-extrabold tabular-nums text-brand-600">
          {formatPrice(total)}
        </span>
      </p>
      {priced < items.length && (
        <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
          Some of these are priced on request — the lab confirms the final amount when it calls.
        </p>
      )}
    </div>
  );
}
