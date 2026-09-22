import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';
import { Container, SectionHeading } from '@/components/common/Primitives';
import { ConcernIcon } from '@/components/common/ConcernIcon';
import { ScrollRail } from '@/components/common/ScrollRail';
import { HEALTH_CONCERNS } from '@/data/healthConcerns';
import { useContent } from '@/store/content';
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

  const forConcern = useMemo(
    () =>
      livePackages
        .filter((p) => p.concerns.includes(active))
        .sort((a, b) => (a.offerPrice ?? a.price ?? 0) - (b.offerPrice ?? b.price ?? 0)),
    [livePackages, active],
  );
  /*
    Four tiles fit the panel; the total is shown beside them so "4 of 7" is
    honest about there being more, rather than implying four is all there is.
  */
  const matchCount = forConcern.length;
  const matches = useMemo(() => forConcern.slice(0, 4), [forConcern]);

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
      className="relative overflow-hidden bg-surface-soft py-20 sm:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-light [background-size:72px_72px] [mask-image:radial-gradient(ellipse_70%_70%_at_30%_20%,#000,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-1/4 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(20,196,163,0.20),transparent_66%)]"
      />

      <Container className="relative">
        <SectionHeading
          eyebrow="Health Concerns"
                    title={
            <span id="concerns-heading">
              Understand your health.
              <br />
              Start with the <span className="text-brand-600">right test.</span>
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
            className="scroll-x -mx-5 flex snap-x gap-2.5 px-5 pb-1 sm:-mx-8 sm:px-8 lg:-mx-2 lg:px-2"
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
                      ? 'bg-brand-500 text-white shadow-glow'
                      : 'bg-white text-ink-muted shadow-soft ring-1 ring-brand-50 hover:text-brand-600 hover:ring-brand-200',
                  )}
                >
                  <ConcernIcon
                    name={c.icon}
                    className={cn(
                      'h-[17px] w-[17px] transition-colors',
                      isActive ? 'text-white' : 'text-brand-500',
                    )}
                  />
                  {c.label}
                </button>
              );
            })}
          </div>

          {/*
            A 2px indicator instead of the native bar. `scroll-row` painted a
            thick pale scrollbar with stepper arrows directly under the tabs,
            which was the loudest thing in the section and looked like a 2010
            widget. The rail says "there is more" without being furniture.
          */}
          <div className="relative mt-3 h-[2px]">
            <ScrollRail targetRef={tablistRef} axis="x" />
          </div>

          {/* Edge fade so it reads as scrollable rather than clipped. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-5 bottom-5 top-0 w-16 bg-gradient-to-l from-surface-soft via-surface-soft/70 to-transparent sm:-right-8"
          />
        </div>

        {/* ---- Result panel ---- */}
        <div
          id="concern-panel"
          role="tabpanel"
          aria-labelledby={`concern-tab-${active}`}
          className="mt-10 grid gap-5 lg:grid-cols-12 lg:gap-6"
        >
          {/*
            No AnimatePresence here, and no exit.

            With mode="wait" the panel played the old content out before
            playing the new content in, and waited on completion callbacks for
            both blocks: measured with a MutationObserver in the page, the
            heading took 2359ms to change after a tab click. On a control that
            should feel instant that reads as lag rather than as animation.
            Keying the element on the concern replaces it immediately and the
            new content fades in on its own.
          */}
          <div className="lg:col-span-4">
            <motion.div
              key={active}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              {/*
                The identity block is the anchor now. It was a small pale icon,
                a heading and a bullet list on the same white as everything
                else, which left the left third of the panel looking empty. A
                saturated block gives the section a centre of gravity and makes
                the selected concern unmistakable.
              */}
              <div className="relative flex h-full flex-col overflow-hidden rounded-4xl bg-gradient-to-br from-brand-700 via-brand-600 to-mint-600 p-7 text-white shadow-card sm:p-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-grid-dark [background-size:44px_44px] opacity-40"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10"
                />

                <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm">
                  <ConcernIcon name={concern.icon} className="h-7 w-7" />
                </span>
                <h3 className="relative mt-6 text-balance text-[26px] font-extrabold leading-[1.1] tracking-editorial">
                  {concern.label}
                </h3>
                <p className="relative mt-3 text-[14.5px] leading-relaxed text-white/85">
                  {concern.description}
                </p>

                <p className="relative mt-7 text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/70">
                  People usually test when
                </p>
                <ul className="relative mt-3 flex flex-wrap gap-2">
                  {concern.signals.map((s) => (
                    <li
                      key={s}
                      className="rounded-full bg-white/12 px-3 py-1.5 text-[12.5px] font-medium leading-snug text-white ring-1 ring-inset ring-white/20"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col rounded-4xl bg-white p-6 shadow-card ring-1 ring-brand-50 sm:p-7 lg:col-span-8">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-soft">
                Matching packages
              </p>
              <p className="text-[12.5px] tabular-nums text-ink-soft">
                {matches.length} of {matchCount}
              </p>
            </div>

            <motion.ul
                key={active}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="mt-5 grid gap-3 sm:grid-cols-2"
              >
                {matches.length === 0 && (
                  <li className="py-8 text-[15px] text-ink-muted sm:col-span-2">
                    No package is filed under this concern yet. Call the lab and a panel can be put
                    together for you.
                  </li>
                )}
                {/*
                  No prices here, deliberately.

                  This is the "which of these is me?" step, and the page
                  carried the same priced package rows in three places — the
                  hero finder, this list and the packages section — 24 prices
                  and 13 package cards on one screenful of scrolling. Pricing
                  now lives in exactly one section. What belongs here is
                  whether the panel answers your question: its name, how many
                  parameters it covers, and when the report lands.
                */}
                {/*
                  Tiles, not rows. Four identical text lines each ending in
                  "View panel →" read as a table and repeated the same call to
                  action four times. The parameter count carries the visual
                  weight instead, because it is the one number that differs
                  between panels and the one a visitor is actually comparing.
                */}
                {matches.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/health-package/${p.slug}`}
                      className="group flex h-full items-start gap-4 rounded-3xl bg-surface-soft p-4 ring-1 ring-inset ring-brand-50 transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-white hover:shadow-card hover:ring-brand-200 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-400"
                    >
                      <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-white text-brand-700 ring-1 ring-inset ring-brand-100 transition-colors duration-300 group-hover:bg-brand-500 group-hover:text-white group-hover:ring-brand-500">
                        <span className="text-[18px] font-extrabold leading-none tabular-nums">
                          {p.tests.length}
                        </span>
                        <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.1em] opacity-70">
                          tests
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-balance text-[15px] font-bold leading-snug text-ink transition-colors group-hover:text-brand-700">
                          {p.name}
                        </span>
                        <span className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-ink-soft">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-mint-500" strokeWidth={2.2} aria-hidden="true" />
                          {p.reportTime}
                        </span>
                      </span>
                      <ArrowRight
                        className="mt-1 h-4 w-4 shrink-0 text-brand-500 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                        strokeWidth={2.4}
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </motion.ul>

            {/*
              The action sits at the foot rather than as a small link in the
              corner. The card stretches to match the identity block beside it,
              which left dead space under four tiles; this fills it with the one
              thing a visitor wants next.
            */}
            <Link
              to={`/health-package?concern=${active}`}
              className="group mt-auto flex items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-200 pt-0 text-[13.5px] font-bold text-brand-700 transition-all duration-200 hover:border-brand-400 hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              style={{ minHeight: 56, marginTop: 20 }}
            >
              See every {concern.label.toLowerCase()} panel
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={2.4}
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
