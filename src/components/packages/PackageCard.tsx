import { Link } from 'react-router-dom';
import { ArrowRight, Bookmark, Clock, Home, ListChecks } from 'lucide-react';
import { Badge } from '@/components/common/Primitives';
import { formatPrice, savings, savingsPercent } from '@/lib/format';
import { useContent } from '@/store/content';
import { cn } from '@/lib/cn';
import type { HealthPackage } from '@/types';

/**
 * Package card. Deliberately square-shouldered with a single soft radius and a
 * flat surface — the emphasis is on the type hierarchy and the price block,
 * not on shadows.
 */
export function PackageCard({
  pkg,
  variant = 'default',
}: {
  pkg: HealthPackage;
  variant?: 'default' | 'feature';
}) {
  const { preferences, toggleSavedPackage } = useContent();
  const saved = preferences.savedPackages.includes(pkg.slug);
  const pct = savingsPercent(pkg.price, pkg.offerPrice);
  const save = savings(pkg.price, pkg.offerPrice);
  const isFeature = variant === 'feature';

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col rounded-xl border bg-white transition-all duration-300 ease-premium',
        'hover:-translate-y-1 hover:border-brand-200 hover:shadow-liftLg',
        isFeature ? 'border-brand-200 ring-1 ring-brand-100' : 'border-ink-line',
      )}
    >
      {/* Top accent that draws in on hover. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 rounded-t-xl bg-gradient-to-r from-brand-500 to-brand-400 transition-transform duration-400 ease-premium group-hover:scale-x-100"
      />

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {isFeature && <Badge tone="brand">Popular</Badge>}
            {pct !== null && <Badge tone="success">Save {pct}%</Badge>}
            {pkg.homeCollection && (
              <Badge tone="neutral">
                <Home className="h-3 w-3" strokeWidth={2.4} aria-hidden="true" />
                Home visit
              </Badge>
            )}
          </div>

          <button
            type="button"
            onClick={() => toggleSavedPackage(pkg.slug)}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${pkg.name} from saved` : `Save ${pkg.name}`}
            className={cn(
              'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
              saved
                ? 'border-brand-300 bg-brand-50 text-brand-600'
                : 'border-transparent text-ink-soft/50 hover:border-ink-line hover:text-brand-500',
            )}
          >
            <Bookmark
              className="h-[15px] w-[15px]"
              strokeWidth={2.2}
              fill={saved ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
          </button>
        </div>

        <h3 className="mt-5 text-[19px] font-bold leading-snug tracking-[-0.02em] text-ink">
          <Link
            to={`/health-package/${pkg.slug}`}
            className="rounded before:absolute before:inset-0 before:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
          >
            {pkg.name}
          </Link>
        </h3>

        <p className="mt-2.5 line-clamp-3 text-[14.5px] leading-relaxed text-ink-muted">
          {pkg.summary}
        </p>

        <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-muted">
          <div className="flex items-center gap-1.5">
            <ListChecks className="h-4 w-4 text-brand-500" strokeWidth={2} aria-hidden="true" />
            <dt className="sr-only">Tests included</dt>
            <dd>
              <span className="font-semibold tabular-nums text-ink">{pkg.tests.length}</span> tests
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-brand-500" strokeWidth={2} aria-hidden="true" />
            <dt className="sr-only">Report time</dt>
            <dd>{pkg.reportTime}</dd>
          </div>
        </dl>

        {pkg.suitableFor.length > 0 && (
          <p className="mt-4 text-[12.5px] text-ink-soft">
            <span className="font-semibold text-ink-muted">For:</span>{' '}
            {pkg.suitableFor.slice(0, 2).join(' · ')}
          </p>
        )}

        {/* ---- Price block ---- */}
        <div className="mt-auto flex items-end justify-between gap-4 border-t border-ink-line pt-6">
          <div>
            {pkg.offerPrice !== null ? (
              <>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-[26px] font-extrabold leading-none tracking-tightest text-ink tabular-nums">
                    {formatPrice(pkg.offerPrice)}
                  </span>
                  {pkg.price !== null && (
                    <span className="text-[15px] font-medium text-ink-soft line-through tabular-nums">
                      {formatPrice(pkg.price)}
                    </span>
                  )}
                </div>
                {save !== null && (
                  <p className="mt-1.5 text-[12.5px] font-semibold text-emerald-600">
                    You save {formatPrice(save)}
                  </p>
                )}
              </>
            ) : (
              <>
                <span className="text-[19px] font-bold leading-none text-ink">On request</span>
                {pkg.priceNote && (
                  <p className="mt-1.5 max-w-[15rem] text-[12px] leading-snug text-ink-soft">
                    {pkg.priceNote}
                  </p>
                )}
              </>
            )}
          </div>

          <span
            aria-hidden="true"
            className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mist text-ink-muted transition-all duration-300 group-hover:bg-brand-500 group-hover:text-white"
          >
            <ArrowRight
              className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-0.5"
              strokeWidth={2.2}
            />
          </span>
        </div>
      </div>
    </article>
  );
}
