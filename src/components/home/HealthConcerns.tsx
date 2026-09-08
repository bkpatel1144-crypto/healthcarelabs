import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Container, SectionHeading } from '@/components/common/Primitives';
import { ConcernIcon } from '@/components/common/ConcernIcon';
import { HEALTH_CONCERNS } from '@/data/healthConcerns';
import { useContent } from '@/store/content';
import { formatPrice, savingsPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import type { ConcernId } from '@/types';

/**
 * Interactive concern explorer. Selecting a concern filters the catalogue live
 * and stores the choice in preferences, so the package page can open on the
 * same filter next time.
 */
export function HealthConcerns() {
  const { livePackages, preferences, setPreferences } = useContent();
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState<ConcernId>(
    preferences.lastConcern ?? 'general-wellness',
  );
  const tablistRef = useRef<HTMLDivElement>(null);

  const concern = HEALTH_CONCERNS.find((c) => c.id === active) ?? HEALTH_CONCERNS[0];

  const matches = useMemo(
    () =>
      livePackages
        .filter((p) => p.concerns.includes(active))
        .sort((a, b) => (a.offerPrice ?? a.price ?? 0) - (b.offerPrice ?? b.price ?? 0))
        .slice(0, 4),
    [livePackages, active],
  );

  const select = (id: ConcernId) => {
    setActive(id);
    setPreferences({ lastConcern: id });
  };

  /**
   * Arrow-key traversal for the tablist, as the ARIA tabs pattern expects.
   * The newly selected tab is scrolled into view, which matters now that the
   * row scrolls horizontally instead of wrapping.
   */
  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: HEALTH_CONCERNS.length - 1,
    };
    const target = keys[e.key];
    if (target === undefined) return;
    e.preventDefault();
    const next = (target + HEALTH_CONCERNS.length) % HEALTH_CONCERNS.length;
    select(HEALTH_CONCERNS[next].id);
    const el = tablistRef.current?.children[next] as HTMLElement | undefined;
    el?.focus();
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  };

  return (
    <section
      aria-labelledby="concerns-heading"
      className="relative overflow-hidden bg-navy-900 py-20 text-white sm:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-dark [background-size:72px_72px] [mask-image:radial-gradient(ellipse_70%_70%_at_30%_20%,#000,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-1/4 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(21,155,211,0.18),transparent_66%)] blur-2xl"
      />

      <Container className="relative">
        <SectionHeading
          eyebrow="Health Concerns"
          tone="dark"
          title={
            <span id="concerns-heading">
              Understand your health.
              <br />
              Start with the <span className="text-brand-400">right test.</span>
            </span>
          }
          description="Pick what you want to look into. The catalogue filters to the panels built for it, so you are not choosing a package from a price list alone."
        />

        {/* ---- Concern selector: one scrolling row, not five wrapped ones ---- */}
        <div className="relative mt-12">
          <div
            role="tablist"
            aria-label="Health concerns"
            aria-orientation="horizontal"
            ref={tablistRef}
            className="scroll-row -mx-5 flex snap-x gap-2.5 px-5 pb-3 sm:-mx-8 sm:px-8 lg:-mx-2 lg:px-2"
          >
            {HEALTH_CONCERNS.map((c, i) => {
              const isActive = c.id === active;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  id={`concern-tab-${c.id}`}
                  aria-selected={isActive}
                  aria-controls="concern-panel"
                  /* Roving tabindex: one tab stop for the group, arrows move within it. */
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => select(c.id)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                  className={cn(
                    'group inline-flex shrink-0 snap-start items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-3 text-[14px] font-semibold transition-all duration-200 ease-premium',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300',
                    isActive
                      ? 'bg-brand-500 text-white shadow-[0_12px_28px_-14px_rgba(21,155,211,0.95)]'
                      : 'bg-white/[0.05] text-slate-300 ring-1 ring-inset ring-white/10 hover:bg-white/[0.1] hover:text-white',
                  )}
                >
                  <ConcernIcon
                    name={c.icon}
                    className={cn(
                      'h-[17px] w-[17px] transition-colors',
                      isActive ? 'text-white' : 'text-brand-300',
                    )}
                  />
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Edge fade so it reads as scrollable rather than clipped. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-5 bottom-3 top-0 w-14 bg-gradient-to-l from-navy-900 to-transparent sm:-right-8 lg:hidden"
          />
        </div>

        {/* ---- Result panel ---- */}
        <div
          id="concern-panel"
          role="tabpanel"
          aria-labelledby={`concern-tab-${active}`}
          className="mt-10 grid gap-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-9 lg:grid-cols-12 lg:gap-12"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-4"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300 ring-1 ring-inset ring-brand-400/25">
                <ConcernIcon name={concern.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-[24px] font-bold tracking-editorial text-white">
                {concern.label}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-300/90">
                {concern.description}
              </p>

              <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                People usually test when
              </p>
              <ul className="mt-3 space-y-2.5">
                {concern.signals.map((s) => (
                  <li key={s} className="flex gap-2.5 text-[14px] text-slate-300">
                    <span
                      aria-hidden="true"
                      className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brand-400"
                    />
                    {s}
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>

          <div className="lg:col-span-8">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Matching packages
              </p>
              <Link
                to={`/health-package?concern=${active}`}
                className="group inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-brand-300 transition-colors hover:text-brand-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-300"
              >
                View all
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={2.2}
                  aria-hidden="true"
                />
              </Link>
            </div>

            <AnimatePresence mode="wait">
              <motion.ul
                key={active}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-4 divide-y divide-white/[0.08] border-t border-white/[0.08]"
              >
                {matches.length === 0 && (
                  <li className="py-8 text-[15px] text-slate-400">
                    No package is filed under this concern yet. Call the lab and a panel can be put
                    together for you.
                  </li>
                )}
                {matches.map((p) => {
                  const pct = savingsPercent(p.price, p.offerPrice);
                  return (
                    <li key={p.id}>
                      <Link
                        to={`/health-package/${p.slug}`}
                        className="group flex items-center justify-between gap-6 py-5 transition-colors hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-300"
                      >
                        <div className="min-w-0">
                          <h4 className="truncate text-[16px] font-semibold text-white transition-colors group-hover:text-brand-300">
                            {p.name}
                          </h4>
                          <p className="mt-1 text-[13px] text-slate-400">
                            {p.tests.length} tests · Report {p.reportTime.toLowerCase()}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          {p.offerPrice !== null ? (
                            <>
                              <span className="block text-[17px] font-bold tabular-nums text-white">
                                {formatPrice(p.offerPrice)}
                              </span>
                              {pct !== null && (
                                <span className="mt-0.5 block text-[12px] font-semibold text-emerald-400">
                                  {pct}% off
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="block text-[14px] font-semibold text-slate-300">
                              On request
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </motion.ul>
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </section>
  );
}
