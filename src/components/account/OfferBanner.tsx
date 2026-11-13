import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useContent } from '@/store/content';
import { formatPrice, savings, savingsPercent } from '@/lib/format';
import { cn } from '@/lib/cn';

/**
 * One offer, surfaced at the top of the signed-in area.
 *
 * Everything on it is read from the catalogue the admin panel edits — name,
 * both prices, the saving. Nothing is written into this component, which is
 * the point: a promotional banner is exactly where a site starts inventing a
 * discount, a deadline or a "limited time" that nobody at the lab agreed to.
 * Change a price in the admin and this changes with it; archive the package
 * and it disappears.
 *
 * It picks the largest real saving rather than carrying a hand-chosen hero, so
 * there is no second list to keep in step with the first.
 *
 * No countdown. The lab publishes no expiry, and a fake clock is the oldest
 * dark pattern there is.
 */
export function OfferBanner({ className }: { className?: string }) {
  const { packages } = useContent();

  const best = useMemo(() => {
    const candidates = packages.filter(
      (p) => !p.archived && p.price !== null && p.offerPrice !== null && p.offerPrice < p.price,
    );
    if (candidates.length === 0) return null;
    return candidates.reduce((top, p) =>
      (p.price! - p.offerPrice!) > (top.price! - top.offerPrice!) ? p : top,
    );
  }, [packages]);

  // No live offer, no banner. Better an empty space than a manufactured one.
  if (!best) return null;

  const saved = savings(best.price, best.offerPrice);
  const percent = savingsPercent(best.price, best.offerPrice);

  return (
    <section
      aria-labelledby="offer-banner-title"
      className={cn(
        'relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-5 text-white sm:p-7',
        className,
      )}
    >
      {/* Ground: the same faint grid the dark bands elsewhere use. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-dark opacity-40 [background-size:56px_56px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden="true" />
            Biggest saving right now
          </p>
          <h2
            id="offer-banner-title"
            className="mt-2.5 text-balance text-[clamp(1.25rem,2.6vw,1.6rem)] font-extrabold leading-tight tracking-editorial"
          >
            {best.name}
          </h2>
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-white/75">
            {best.summary}
          </p>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[26px] font-extrabold leading-none tracking-tightest">
              {formatPrice(best.offerPrice)}
            </span>
            <span className="text-[15px] font-semibold text-white/50 line-through">
              {formatPrice(best.price)}
            </span>
            {saved !== null && (
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-bold">
                Save {formatPrice(saved)}
                {percent !== null && ` · ${percent}% off`}
              </span>
            )}
          </div>
        </div>

        <Link
          to={`/health-package/${best.slug}`}
          className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-[14px] font-bold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          View package
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            strokeWidth={2.4}
            aria-hidden="true"
          />
        </Link>
      </div>
    </section>
  );
}
