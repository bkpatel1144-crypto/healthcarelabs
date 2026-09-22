import { useId, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Search, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/common/Primitives';
import { useContent } from '@/store/content';
import { formatPrice, savingsPercent } from '@/lib/format';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';
import { useSheen } from '@/hooks/useSheen';

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
/*
  Example searches, not links.

  These fill the search field rather than navigating, which is the one thing
  this control can offer that nothing else on the page does. The first draft
  put the twelve health concerns here and they duplicated the concern tabs in
  the section immediately below — the same twelve labels twice, and links to
  the package listing on this page went from 6 to 17.

  The terms are the tests that appear in the most packages, so every one of
  them returns results.
*/
const EXAMPLE_SEARCHES = ['Lipid Profile', 'HbA1c', 'Vit. B12', 'CBC', 'Blood Group', 'Urine R/M'];

export function HeroFinder() {
  const { livePackages } = useContent();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const [query, setQuery] = useState('');
  const sheen = useSheen<HTMLDivElement>();
  // useId rather than a literal: the finder is one instance now, but a
  // hardcoded id silently breaks `<label for>` the moment it is rendered twice.
  const inputId = useId();

  const trimmed = query.trim().toLowerCase();

  /*
    With no query this shows concerns, not packages.

    It used to list three featured panels with their prices, which made it the
    first of three priced package listings on the homepage. Before a visitor
    has told us anything, the useful offer is a way in — "which of these is
    me?" — not a shortlist they did not ask for. Prices appear the moment they
    actually search.
  */
  const results = useMemo(() => {
    if (!trimmed) return [];
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
    <section
      aria-label="Find a test or package"
      className="relative overflow-hidden bg-surface-tint py-10 sm:py-12"
    >
      {/* Glass needs something behind it: two blooms under the pane. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(53,199,244,0.35),transparent_66%)]" />
        <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(20,196,163,0.28),transparent_66%)]" />
      </div>
      <Container className="relative">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          {...sheen}
          className="glass-flat glass-sheen rounded-4xl p-5 sm:p-7"
        >
          {/*
            The field is the band now.

            It used to be a pale grey slot stretched between a short label and
            a saturated blue "Browse all" button, on a card that is itself
            near-white. The one control this section exists for had the least
            contrast on it and the secondary action had the most, so the band
            read as an empty form. The field is white with its own ring and
            shadow, it carries the submit inside it, and browsing the full
            catalogue steps down to a link beside the examples.
          */}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <p className="flex shrink-0 items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
              <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-mint-400" />
                {!reduced && (
                  <span className="absolute inset-0 rounded-full bg-mint-400/70 animate-pulse-ring" />
                )}
              </span>
              Find your test
            </p>
            <p className="flex items-center gap-2 text-[12px] text-ink-soft">
              <ShieldCheck className="h-4 w-4 shrink-0 text-mint-500" strokeWidth={2} aria-hidden="true" />
              Prices and full test lists published on every package
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-4" role="search">
            <label htmlFor={inputId} className="sr-only">
              Search health packages and tests
            </label>
            <div className="group relative flex items-center gap-2 rounded-2xl bg-white p-2 shadow-card ring-1 ring-brand-100 transition-all duration-200 focus-within:shadow-liftLg focus-within:ring-2 focus-within:ring-brand-400">
              <Search
                className="pointer-events-none ml-3 h-[20px] w-[20px] shrink-0 text-brand-500"
                strokeWidth={2.2}
                aria-hidden="true"
              />
              <input
                id={inputId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="HbA1c, thyroid, lipid profile…"
                className="h-[48px] min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-soft/70"
              />
              <button
                type="submit"
                className={cn(
                  'group/go flex h-[48px] shrink-0 items-center gap-2 rounded-xl px-5',
                  'bg-gradient-to-r from-brand-600 to-brand-500 text-[14px] font-bold text-white',
                  'shadow-[0_14px_30px_-16px_rgba(15,122,172,0.95)] transition-all duration-200',
                  'hover:from-brand-700 hover:to-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                )}
              >
                <span className="hidden sm:inline">Search</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover/go:translate-x-0.5"
                  strokeWidth={2.4}
                  aria-hidden="true"
                />
              </button>
            </div>
          </form>

          {/* ---------- Results ---------- */}
          <div className="mt-4">
            {!trimmed && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-soft">
                  Try
                </p>
                <ul className="flex min-w-0 flex-wrap gap-2">
                  {EXAMPLE_SEARCHES.map((term) => (
                    <li key={term}>
                      <button
                        type="button"
                        onClick={() => setQuery(term)}
                        className="inline-flex items-center rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-ink-muted shadow-soft ring-1 ring-brand-100 transition-all duration-200 hover:-translate-y-0.5 hover:text-brand-700 hover:ring-brand-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                      >
                        {term}
                      </button>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/health-package"
                  className="group ml-auto inline-flex shrink-0 items-center gap-1.5 text-[13.5px] font-bold text-brand-700 transition-colors hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
                >
                  Browse all {livePackages.length} packages
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    strokeWidth={2.4}
                    aria-hidden="true"
                  />
                </Link>
              </div>
            )}

            {trimmed && (
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-soft">
                {results.length === 0 ? 'No' : 'Top'} matches
              </p>
            )}

            <ul
              aria-live="polite"
              className={cn('mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3', !trimmed && 'hidden')}
            >
              {trimmed && results.length === 0 && (
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
                      className="group flex h-full items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-soft ring-1 ring-brand-50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card hover:ring-brand-200 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-400"
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
