import { useId, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Home,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useContent } from '@/store/content';
import { formatPrice, savingsPercent } from '@/lib/format';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';

/**
 * The hero's right-hand composition: a working test finder.
 *
 * This is deliberately real functionality rather than decoration. It searches
 * the live catalogue — every package name, summary and individual test — and
 * routes straight to a result. A visitor who arrives knowing they need an HbA1c
 * can be on the right package page in two interactions without touching the
 * navigation.
 *
 * The assurance row at the foot of the panel sits in the flow rather than
 * floating over it — see the note above that markup.
 */

const ASSURANCES = [
  {
    Icon: Home,
    title: 'Home collection',
    detail: 'Across Surat',
    tint: 'bg-brand-500/15 text-brand-300 ring-brand-400/25',
  },
  {
    Icon: FileCheck2,
    title: 'Digital reports',
    detail: 'Shared securely',
    tint: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/25',
  },
  {
    Icon: CheckCircle2,
    title: 'Verified',
    detail: 'Before release',
    tint: 'bg-white/[0.08] text-slate-200 ring-white/15',
  },
];

export function HeroFinder() {
  const { livePackages } = useContent();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const [query, setQuery] = useState('');
  /*
    The finder renders twice — once in the hero on desktop, once in its own
    band below the hero on mobile — so a hardcoded id would appear twice in the
    document. Duplicate ids are invalid and silently break `<label for>`
    association, which would leave the search box unlabelled for screen
    readers on whichever copy came second.
  */
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
    <div className="relative">
      {/* Layered glow behind the panel. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-[radial-gradient(ellipse_at_50%_40%,rgba(53,199,244,0.22),rgba(53,199,244,0)_70%)] blur-2xl"
      />

      {/* ---------- Finder panel ---------- */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl bg-white/[0.07] p-1.5 ring-1 ring-inset ring-white/15 backdrop-blur-2xl"
      >
        <div className="rounded-[0.85rem] bg-navy-950/50 p-6 ring-1 ring-inset ring-white/[0.06] sm:p-7">
          <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300">
            <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-brand-400" />
              {!reduced && (
                <span className="absolute inset-0 rounded-full bg-brand-400/70 animate-pulse-ring" />
              )}
            </span>
            Find your test
          </p>

          <form onSubmit={onSubmit} className="mt-5" role="search">
            <label htmlFor={inputId} className="sr-only">
              Search health packages and tests
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                strokeWidth={2}
                aria-hidden="true"
              />
              <input
                id={inputId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="HbA1c, thyroid, lipid profile…"
                className="h-[52px] w-full rounded-xl border border-white/15 bg-white/[0.06] pl-12 pr-4 text-[15px] text-white placeholder:text-slate-400/80 transition-colors focus:border-brand-400/70 focus:bg-white/[0.1] focus:outline-none focus:ring-4 focus:ring-brand-500/20"
              />
            </div>
          </form>

          <p className="mt-6 text-[10.5px] font-bold uppercase tracking-[0.16em] text-slate-500">
            {trimmed ? `${results.length === 0 ? 'No' : 'Top'} matches` : 'Most booked'}
          </p>

          <ul
            aria-live="polite"
            className="mt-2 divide-y divide-white/[0.07] border-t border-white/[0.07]"
          >
            {results.length === 0 && (
              <li className="py-5 text-[14px] leading-relaxed text-slate-400">
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
                    className="group flex items-center justify-between gap-4 py-3.5 transition-colors hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-300"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14.5px] font-semibold text-white transition-colors group-hover:text-brand-300">
                        {p.name}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-slate-400">
                        {p.tests.length} tests
                        {p.homeCollection && ' · Home collection'}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      {p.offerPrice !== null ? (
                        <>
                          <span className="block text-[15px] font-bold tabular-nums text-white">
                            {formatPrice(p.offerPrice)}
                          </span>
                          {pct !== null && (
                            <span className="block text-[11px] font-semibold text-emerald-400">
                              {pct}% off
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="block text-[13px] font-semibold text-slate-300">
                          On request
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <Link
            to="/health-package"
            className={cn(
              'group mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-white/[0.07]',
              'text-[14px] font-semibold text-white ring-1 ring-inset ring-white/15 transition-all duration-200',
              'hover:bg-white/[0.13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300',
            )}
          >
            Browse all {livePackages.length} packages
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              strokeWidth={2.2}
              aria-hidden="true"
            />
          </Link>

          <ul className="mt-6 grid grid-cols-3 gap-3 border-t border-white/[0.07] pt-5">
            {ASSURANCES.map(({ Icon, title, detail, tint }) => (
              <li key={title} className="text-center">
                <span
                  className={cn(
                    'mx-auto flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset',
                    tint,
                  )}
                >
                  <Icon className="h-[17px] w-[17px]" strokeWidth={2.1} aria-hidden="true" />
                </span>
                <span className="mt-2.5 block text-[11.5px] font-bold leading-tight text-white">
                  {title}
                </span>
                <span className="mt-1 block text-[10.5px] leading-tight text-slate-400">
                  {detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/*
        Assurances sit in the flow beneath the results rather than as floating
        badges. The floating version overlapped the search input by up to 120px
        at desktop widths — absolutely positioned ornament over an interactive
        control is a defect, not decoration.
      */}
      <p className="mt-6 flex items-center justify-center gap-2 text-[12.5px] text-slate-400">
        <ShieldCheck className="h-4 w-4 shrink-0 text-brand-400" strokeWidth={2} aria-hidden="true" />
        Prices and full test lists published on every package
      </p>
    </div>
  );
}
