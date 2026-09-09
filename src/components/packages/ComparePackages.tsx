import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Minus, Scale, X } from 'lucide-react';
import { COMPARE_LIMIT, useContent } from '@/store/content';
import { formatPrice, savingsPercent } from '@/lib/format';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { useSheen } from '@/hooks/useSheen';
import { cn } from '@/lib/cn';
import type { HealthPackage } from '@/types';

/**
 * Side-by-side package comparison.
 *
 * Seventeen packages overlap heavily — four of them include a lipid profile,
 * three include HbA1c — so the question a visitor actually has is not "what is
 * in this package" but "what does this one have that the cheaper one doesn't".
 * Reading that off two separate pages means holding twenty test names in your
 * head. This answers it directly: pick up to three, and every test either side
 * gets a tick or a dash in one table.
 *
 * The row set is the union of the selected packages' tests, so nothing is
 * hidden, and rows where every package agrees are collapsed behind a toggle —
 * with three full-body panels selected, forty of the fifty rows are ticks all
 * the way across and the differences are what you came for.
 *
 * Everything shown is from the published catalogue. The queue lives in the
 * same localStorage preferences as saved packages, so it survives a reload and
 * follows the visitor between the listing and the detail pages.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------------ Trigger */

export function CompareToggle({
  slug,
  className,
  variant = 'icon',
}: {
  slug: string;
  className?: string;
  variant?: 'icon' | 'label';
}) {
  const { preferences, toggleComparePackage } = useContent();
  const queue = preferences.comparePackages;
  const selected = queue.includes(slug);
  const full = !selected && queue.length >= COMPARE_LIMIT;

  return (
    <button
      type="button"
      onClick={() => toggleComparePackage(slug)}
      disabled={full}
      aria-pressed={selected}
      title={
        full ? `Comparison is full — remove one of the ${COMPARE_LIMIT} first` : undefined
      }
      className={cn(
        'inline-flex min-w-0 shrink items-center gap-2 whitespace-nowrap rounded-full text-[12.5px] font-semibold transition-all duration-200',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        variant === 'icon' ? 'h-9 px-3' : 'h-11 px-5 text-[13.5px]',
        selected
          ? 'bg-brand-500 text-white shadow-glow'
          : 'bg-white text-ink-muted shadow-soft ring-1 ring-brand-100 hover:text-brand-600 hover:ring-brand-300',
        full && 'cursor-not-allowed opacity-45 hover:text-ink-muted hover:ring-brand-100',
        className,
      )}
    >
      <Scale className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
      <span className="truncate">{selected ? 'In comparison' : 'Compare'}</span>
    </button>
  );
}

/* ---------------------------------------------------------------- Dock + UI */

export function CompareDock() {
  const { preferences, livePackages, toggleComparePackage, clearCompare } = useContent();
  const reduced = usePrefersReducedMotion();
  const sheen = useSheen<HTMLDivElement>();
  const [open, setOpen] = useState(false);

  const picked = useMemo(
    () =>
      preferences.comparePackages
        .map((slug) => livePackages.find((p) => p.slug === slug))
        .filter((p): p is HealthPackage => Boolean(p)),
    [preferences.comparePackages, livePackages],
  );

  // A queue of one is not a comparison; close the sheet if it drops to that.
  useEffect(() => {
    if (picked.length < 2) setOpen(false);
  }, [picked.length]);

  return (
    <>
      <AnimatePresence>
        {picked.length > 0 && !open && (
          <motion.div
            initial={reduced ? false : { y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? undefined : { y: 90, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            /*
              Docked *above* the two corner controls rather than beside them.
              Sharing their band meant reserving side gutters wide enough to
              clear both, and at 140% text scale the buttons grow while the
              gutters do not — measured, the dock still overlapped a corner
              control at 13 of 16 width/zoom combinations and overflowed a
              320px screen. Sitting clear of the band needs no gutter at all.
            */
            className="pointer-events-none fixed inset-x-0 bottom-20 z-[55] flex justify-center px-3 sm:bottom-24 sm:px-4"
          >
            <div
              {...sheen}
              className="glass glass-sheen pointer-events-auto flex w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-full py-2 pl-4 pr-2 sm:w-auto sm:justify-start sm:gap-4 sm:pl-5"
            >
              <p className="hidden shrink-0 items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-brand-700 sm:flex">
                <Scale className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                Compare
              </p>

              <p className="min-w-0 truncate text-[12.5px] font-semibold text-ink sm:hidden">
                {picked.length} selected
              </p>

              <ul className="hidden min-w-0 items-center gap-2 sm:flex">
                {picked.map((p) => (
                  <li key={p.id} className="min-w-0">
                    <span className="flex items-center gap-1.5 rounded-full bg-white/70 py-1.5 pl-3 pr-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                      <span className="max-w-[92px] truncate text-[12.5px] font-semibold text-ink sm:max-w-[150px]">
                        {p.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleComparePackage(p.slug)}
                        aria-label={`Remove ${p.name} from the comparison`}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-rose-50 hover:text-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden="true" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>

              {picked.length < 2 ? (
                <p className="shrink-0 pr-2 text-[12px] text-ink-soft">Pick one more</p>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="flex h-10 min-w-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-500 px-4 text-[13px] font-semibold text-white shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                >
                  <span className="truncate">Compare {picked.length}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />
                </button>
              )}

              <button
                type="button"
                onClick={clearCompare}
                aria-label="Clear the comparison"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-white/70 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                <X className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CompareSheet open={open} onClose={() => setOpen(false)} picked={picked} />
    </>
  );
}

/* --------------------------------------------------------------- The table */

function CompareSheet({
  open,
  onClose,
  picked,
}: {
  open: boolean;
  onClose: () => void;
  picked: HealthPackage[];
}) {
  const reduced = usePrefersReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [showShared, setShowShared] = useState(false);

  // Union of every test across the selection, alphabetical so two visits to
  // the same pair produce the same table.
  const rows = useMemo(() => {
    const all = [...new Set(picked.flatMap((p) => p.tests))].sort((a, b) =>
      a.localeCompare(b, 'en'),
    );
    return all.map((test) => {
      const has = picked.map((p) => p.tests.includes(test));
      return { test, has, shared: has.every(Boolean) };
    });
  }, [picked]);

  const differing = rows.filter((r) => !r.shared);
  const visible = showShared ? rows : differing;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab') return;
      // Trap focus: this is a modal sheet over the page.
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
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

  return (
    <AnimatePresence>
      {open && picked.length >= 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6"
        >
          <button
            type="button"
            aria-label="Close the comparison"
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default bg-navy-950/45 backdrop-blur-md"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="compare-title"
            initial={reduced ? false : { y: 40, opacity: 0, scale: 0.99 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduced ? undefined : { y: 30, opacity: 0 }}
            transition={{ duration: 0.34, ease: EASE }}
            className="glass-solid relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-4xl sm:max-h-[86vh] sm:rounded-4xl"
          >
            {/* ---- Header ---- */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-brand-50 p-5 sm:p-7">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">
                  <Scale className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                  Side by side
                </p>
                <h2
                  id="compare-title"
                  className="mt-2 text-[21px] font-extrabold tracking-editorial text-ink sm:text-[25px]"
                >
                  {differing.length === 0
                    ? 'These panels cover the same tests'
                    : `${differing.length} test${differing.length === 1 ? '' : 's'} differ`}
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close the comparison"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-ink-muted shadow-soft ring-1 ring-brand-100 transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                <X className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>

            {/* ---- Scrolling table ---- */}
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  Tests included in {picked.map((p) => p.name).join(', ')}
                </caption>
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th
                      scope="col"
                      className="glass-solid w-[38%] rounded-none border-0 border-b border-brand-100 px-5 py-4 text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-soft sm:px-7"
                    >
                      Test
                    </th>
                    {picked.map((p) => {
                      const pct = savingsPercent(p.price, p.offerPrice);
                      return (
                        <th
                          key={p.id}
                          scope="col"
                          className="glass-solid rounded-none border-0 border-b border-l border-brand-100 px-4 py-4 align-top"
                        >
                          <Link
                            to={`/health-package/${p.slug}`}
                            className="block text-[13.5px] font-bold leading-snug text-ink transition-colors hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                          >
                            {p.name}
                          </Link>
                          <span className="mt-1.5 block text-[15px] font-extrabold tabular-nums text-brand-600">
                            {p.offerPrice !== null ? formatPrice(p.offerPrice) : 'On request'}
                          </span>
                          {pct !== null && (
                            <span className="mt-0.5 block text-[11px] font-semibold text-mint-600">
                              {pct}% off
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  <SpecRow label="Tests included" picked={picked} render={(p) => `${p.tests.length}`} />
                  <SpecRow label="Report ready" picked={picked} render={(p) => p.reportTime} />
                  <SpecRow
                    label="Home collection"
                    picked={picked}
                    render={(p) => (p.homeCollection ? 'Available' : 'Centre visit')}
                  />

                  <tr>
                    <td
                      colSpan={picked.length + 1}
                      className="border-b border-brand-100 bg-surface-soft/70 px-5 py-3 sm:px-7"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-soft">
                          {showShared
                            ? `All ${rows.length} tests`
                            : `${differing.length} differing test${differing.length === 1 ? '' : 's'}`}
                        </p>
                        {rows.length !== differing.length && (
                          <button
                            type="button"
                            onClick={() => setShowShared((v) => !v)}
                            className="text-[12.5px] font-semibold text-brand-600 underline-offset-4 transition-colors hover:text-brand-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
                          >
                            {showShared
                              ? 'Show only what differs'
                              : `Show the ${rows.length - differing.length} shared`}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {visible.length === 0 && (
                    <tr>
                      <td
                        colSpan={picked.length + 1}
                        className="px-5 py-8 text-[14.5px] text-ink-muted sm:px-7"
                      >
                        Every test in these panels appears in all of them — the difference is
                        price and what the report is framed around, not the parameters.
                      </td>
                    </tr>
                  )}

                  {visible.map(({ test, has }) => (
                    <tr key={test} className="even:bg-surface-soft/40">
                      <th
                        scope="row"
                        className="border-b border-brand-50 px-5 py-3 text-[13.5px] font-medium text-ink sm:px-7"
                      >
                        {test}
                      </th>
                      {has.map((included, i) => (
                        <td
                          key={picked[i].id}
                          className="border-b border-l border-brand-50 px-4 py-3 text-center"
                        >
                          {included ? (
                            <>
                              <Check
                                className="mx-auto h-[18px] w-[18px] text-mint-600"
                                strokeWidth={2.8}
                                aria-hidden="true"
                              />
                              <span className="sr-only">Included</span>
                            </>
                          ) : (
                            <>
                              <Minus
                                className="mx-auto h-[18px] w-[18px] text-ink-line"
                                strokeWidth={2.4}
                                aria-hidden="true"
                              />
                              <span className="sr-only">Not included</span>
                            </>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ---- Footer ---- */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-brand-100 p-5 sm:p-7">
              {/*
                The lab's published lists name some tests two ways — "S. TSH"
                and "TSH", "CBC Indices, ESR" and "CBC, ESR & Blood Indices".
                Matching is on the exact published name, because deciding that
                two differently-worded entries are the same test is the lab's
                call, not this site's. So a dash can mean "worded differently"
                rather than "not included", and saying so is better than
                quietly merging entries and changing their test counts.
              */}
              <p className="max-w-md text-[12.5px] leading-relaxed text-ink-soft">
                Test lists and prices exactly as the lab publishes them. Where two panels word a
                test differently it is listed twice — call the lab to confirm an overlap.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {picked.map((p) => (
                  <Link
                    key={p.id}
                    to={`/health-package/${p.slug}`}
                    onClick={onClose}
                    className="flex h-11 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-brand-700 shadow-soft ring-1 ring-brand-100 transition-all duration-200 hover:-translate-y-0.5 hover:ring-brand-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                  >
                    <span className="max-w-[160px] truncate">{p.name}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SpecRow({
  label,
  picked,
  render,
}: {
  label: string;
  picked: HealthPackage[];
  render: (p: HealthPackage) => string;
}) {
  return (
    <tr>
      <th
        scope="row"
        className="border-b border-brand-50 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft sm:px-7"
      >
        {label}
      </th>
      {picked.map((p) => (
        <td
          key={p.id}
          className="border-b border-l border-brand-50 px-4 py-3 text-center text-[13.5px] font-semibold text-ink"
        >
          {render(p)}
        </td>
      ))}
    </tr>
  );
}
