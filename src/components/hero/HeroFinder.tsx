import { useId, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Search, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/common/Primitives';
import { useContent } from '@/store/content';
import { formatPrice, savingsPercent } from '@/lib/format';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';

/**
 * A working test finder, as a full-width band directly under the hero.
 *
 * This used to be a tall panel stacked under the photo inside the hero's right
 * column. That measured 584px on its own, which made the media column up to
 * 580px taller than the copy column — and because the grid centres its
 * columns, the copy was pushed into the middle of a very tall row with dead
 * space above and below it. The hero came out 1192–1464px tall against
 * viewports of 720–1080, so the finder was never on the first screen anyway.
 *
 * Laid out horizontally it is about 250px tall, the two hero columns are close
 * enough in height to sit level, and the search is visible without scrolling on
 * a normal desktop screen.
 *
 * The functionality is unchanged: it searches the live catalogue — every
 * package name, summary and individual test — and routes straight to a result,
 * so someone who arrives knowing they need an HbA1c reaches the right package
 * in two interactions without touching the navigation.
 */
export function HeroFinder() {
  const { livePackages } = useContent();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const [query, setQuery] = useState('');
  // useId rather than a literal: the finder is one instance now, but a
  // hardcoded id silently breaks `<label for>` the moment it is rendered twice.
  const inputId = useId();

  const trimmed = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!trimmed) {
      // No query: show the featured panels, cheapest first.
      return livePackages
        .filter((p) => p.featured)
        .sort((a, b) => (a.offerPrice ?? a.price ?? 0) - (b.offerPrice ?? b.price ?? 0))
        .slice(0, 3);
    }
    // Name matches rank above test matches, so typing "thyroid" surfaces the
    // thyroid panel before every package that merely includes a TSH.
    const scored = livePackages
      .map((p) => {
        const name = p.name.toLowerCase();
        if (name.includes(trimmed)) return { p, score: 0 };
        if (p.tests.some((t) => t.toLowerCase().includes(trimmed))) return { p, score: 1 };
        if (p.summary.toLowerCase().includes(trimmed)) return { p, score: 2 };
        return null;
      })
      .filter((x): x is { p: (typeof livePackages)[number]; score: number } => x !== null)
      .sort((a, b) => a.score - b.score || (a.p.offerPrice ?? 0) - (b.p.offerPrice ?? 0));
    return scored.slice(0, 3).map((x) => x.p);
  }, [livePackages, trimmed]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (results.length > 0) navigate(`/health-package/${results[0].slug}`);
    else navigate(`/health-package?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <section aria-label="Find a test or package" className="relative bg-surface-tint py-10 sm:py-12">
      <Container>
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-4xl bg-white p-5 shadow-card ring-1 ring-brand-50 sm:p-7"
        >
          {/* ---------- Search row ---------- */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
            <p className="flex shrink-0 items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
              <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-mint-400" />
                {!reduced && (
                  <span className="absolute inset-0 rounded-full bg-mint-400/70 animate-pulse-ring" />
                )}
              </span>
              Find your test
            </p>

            <form onSubmit={onSubmit} className="min-w-0 flex-1" role="search">
              <label htmlFor={inputId} className="sr-only">
                Search health packages and tests
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-soft"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <input
                  id={inputId}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="HbA1c, thyroid, lipid profile…"
                  className="h-[54px] w-full rounded-2xl border border-brand-100 bg-surface-soft pl-12 pr-4 text-[15px] text-ink transition-colors placeholder:text-ink-soft/70 focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
                />
              </div>
            </form>

            <Link
              to="/health-package"
              className={cn(
                'group flex h-[54px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand-500 px-6',
                'text-[14px] font-semibold text-white shadow-glow transition-all duration-200',
                'hover:-translate-y-0.5 hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
              )}
            >
              <span className="whitespace-nowrap">Browse all {livePackages.length} packages</span>
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={2.2}
                aria-hidden="true"
              />
            </Link>
          </div>

          {/* ---------- Results ---------- */}
          <div className="mt-6 border-t border-brand-50 pt-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-soft">
                {trimmed ? `${results.length === 0 ? 'No' : 'Top'} matches` : 'Most booked'}
              </p>
              <p className="flex items-center gap-2 text-[12px] text-ink-soft">
                <ShieldCheck
                  className="h-4 w-4 shrink-0 text-mint-500"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                Prices and full test lists published on every package
              </p>
            </div>

            <ul aria-live="polite" className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.length === 0 && (
                <li className="text-[14px] leading-relaxed text-ink-muted sm:col-span-2 lg:col-span-3">
                  Nothing matches “{query.trim()}”. The lab can quote any test that is not listed —
                  just call.
                </li>
              )}
              {results.map((p) => {
                const pct = savingsPercent(p.price, p.offerPrice);
                return (
                  <li key={p.id}>
                    <Link
                      to={`/health-package/${p.slug}`}
                      className="group flex h-full items-center justify-between gap-4 rounded-2xl bg-surface-soft px-4 py-3.5 ring-1 ring-transparent transition-all duration-200 hover:bg-white hover:ring-brand-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-400"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[14.5px] font-semibold text-ink transition-colors group-hover:text-brand-600">
                          {p.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-ink-soft">
                          {p.tests.length} tests
                          {p.homeCollection && ' · Home collection'}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        {p.offerPrice !== null ? (
                          <>
                            <span className="block text-[15px] font-bold tabular-nums text-ink">
                              {formatPrice(p.offerPrice)}
                            </span>
                            {pct !== null && (
                              <span className="block text-[11px] font-semibold text-mint-600">
                                {pct}% off
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="block text-[13px] font-semibold text-ink-muted">
                            On request
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
