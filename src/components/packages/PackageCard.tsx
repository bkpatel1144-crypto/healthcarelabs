import { Link } from 'react-router-dom';
import { useId, useState } from 'react';
import { ArrowRight, Bookmark, ChevronDown, Clock, Home, ListChecks } from 'lucide-react';
import { CompareToggle } from '@/components/packages/ComparePackages';
import { AddToVisit } from '@/components/packages/VisitPlanner';
import { Badge } from '@/components/common/Primitives';
import { formatPrice, savings, savingsPercent } from '@/lib/format';
import { useContent } from '@/store/content';
import { cn } from '@/lib/cn';
import type { HealthPackage } from '@/types';

/**
 * Package card.
 *
 * The previous version put six controls above the product name — two rows of
 * chrome before a visitor learned what they were looking at — and then gave the
 * price, the thing they came for, a 26px number and a grey 40px arrow in the
 * corner. Everything else was 12–15px grey on white. It read like a settings
 * panel rather than an offer.
 *
 * This one is built in three zones, each with its own ground:
 *
 *   1. A tinted head carrying the identity — the discount, what it is, how many
 *      tests, how long the report takes.
 *   2. A white middle carrying the evidence — the panel contents and who it
 *      suits.
 *   3. A footed close carrying the transaction — the price at full size and a
 *      real button.
 *
 * The secondary actions moved to that last zone as square icon buttons beside
 * the call to action, which is where a shopper expects "add" and "compare" to
 * live and, more to the point, is not in front of the name.
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
        'group relative isolate flex h-full flex-col overflow-hidden rounded-3xl bg-white',
        'shadow-card ring-1 transition-all duration-300 ease-premium',
        'hover:-translate-y-1.5 hover:shadow-liftLg',
        isFeature ? 'ring-brand-200' : 'ring-brand-50 hover:ring-brand-200',
      )}
    >
      {/* ------------------------------ 1. Head ------------------------------ */}
      <div
        className={cn(
          'px-6 pb-6 pt-6 sm:px-7 sm:pt-7',
          isFeature
            ? 'bg-gradient-to-br from-brand-100 via-brand-50 to-surface-tint'
            : 'bg-gradient-to-br from-brand-50 via-surface-soft to-surface-soft',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/*
              The discount is the loudest thing on the card and it is solid,
              not another pale outline. coral-600 rather than coral-500 so
              white text on it clears 4.5:1 — measured, not assumed.
            */}
            {pct !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-coral-600 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_10px_22px_-12px_rgba(206,68,19,0.9)]">
                <span className="tabular-nums">{pct}%</span> off
              </span>
            )}
            {isFeature && <Badge tone="brand">Popular</Badge>}
            {pkg.homeCollection && (
              <Badge tone="home">
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
              'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
              saved
                ? 'bg-brand-500 text-white shadow-[0_10px_22px_-12px_rgba(15,122,172,0.9)]'
                : 'bg-white/70 text-ink-soft ring-1 ring-brand-100 hover:bg-white hover:text-brand-600 hover:ring-brand-300',
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

        <h3 className="mt-4 text-balance text-[21px] font-extrabold leading-[1.18] tracking-editorial text-ink">
          <Link
            to={`/health-package/${pkg.slug}`}
            className="rounded before:absolute before:inset-0 before:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
          >
            {pkg.name}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-ink-muted">
          {pkg.summary}
        </p>

        {/*
          Tests and turnaround as two solid facts on white, rather than another
          line of grey text with icons floating in it.
        */}
        <dl className="mt-5 flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 text-[12.5px] shadow-soft ring-1 ring-brand-50">
            <ListChecks className="h-[15px] w-[15px] text-brand-500" strokeWidth={2.2} aria-hidden="true" />
            <dt className="sr-only">Tests included</dt>
            <dd>
              <span className="font-bold tabular-nums text-ink">{pkg.tests.length}</span>
              <span className="text-ink-muted"> tests</span>
            </dd>
          </div>
          <div className="flex min-w-0 items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 text-[12.5px] shadow-soft ring-1 ring-brand-50">
            <Clock className="h-[15px] w-[15px] shrink-0 text-mint-500" strokeWidth={2.2} aria-hidden="true" />
            <dt className="sr-only">Report time</dt>
            <dd className="truncate text-ink-muted">{pkg.reportTime}</dd>
          </div>
        </dl>
      </div>

      {/* ----------------------------- 2. Middle ----------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col px-6 pb-6 pt-5 sm:px-7">
        {/*
          What is actually in the panel, on the card. The card used to say
          "26 tests" and nothing else, so the one question every visitor has
          before they will consider a price could only be answered by opening
          another page.
        */}
        {pkg.tests.length > 0 && <TestList tests={pkg.tests} name={pkg.name} />}

        {pkg.suitableFor.length > 0 && (
          <p className="mt-4 text-[12.5px] leading-snug text-ink-soft">
            <span className="font-semibold text-ink-muted">For</span>{' '}
            {pkg.suitableFor.slice(0, 2).join(' · ')}
          </p>
        )}

        {/* ------------------------------ 3. Close ------------------------------ */}
        <div className="mt-auto border-t border-brand-50 pt-5">
          {/* data-package-price: the row the alignment check measures, in the
              same spirit as the header's data hooks. Several things on this
              card are tabular-nums, so a class selector picked the wrong one. */}
          <div
            data-package-price
            className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2"
          >
            {pkg.offerPrice !== null ? (
              <>
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                  <span className="text-[32px] font-extrabold leading-none tracking-tightest text-ink tabular-nums">
                    {formatPrice(pkg.offerPrice)}
                  </span>
                  {pkg.price !== null && (
                    <span className="text-[15px] font-medium text-ink-soft line-through tabular-nums">
                      {formatPrice(pkg.price)}
                    </span>
                  )}
                </div>
                {save !== null && (
                  <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[11.5px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    Save {formatPrice(save)}
                  </span>
                )}
              </>
            ) : (
              <div className="min-w-0">
                <span className="text-[22px] font-extrabold leading-none tracking-tightest text-ink">
                  On request
                </span>
                {pkg.priceNote && (
                  <p className="mt-1.5 max-w-[15rem] text-[12px] leading-snug text-ink-soft">
                    {pkg.priceNote}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                'flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-bold',
                'bg-gradient-to-r from-brand-600 to-brand-500 text-white',
                'shadow-[0_14px_30px_-16px_rgba(15,122,172,0.95)] transition-all duration-300',
                'group-hover:from-brand-700 group-hover:to-brand-600 group-hover:shadow-[0_18px_36px_-16px_rgba(15,122,172,1)]',
              )}
            >
              View package
              <ArrowRight
                className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
                strokeWidth={2.4}
              />
            </span>
            <AddToVisit slug={pkg.slug} variant="compact" className="relative z-10" />
            <CompareToggle slug={pkg.slug} variant="compact" className="relative z-10" />
          </div>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------- Test list */

const PREVIEW_COUNT = 6;

function TestList({ tests, name }: { tests: string[]; name: string }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const hidden = tests.length - PREVIEW_COUNT;
  const shown = open ? tests : tests.slice(0, PREVIEW_COUNT);

  return (
    <div className="relative z-10 rounded-2xl bg-surface-soft p-4 ring-1 ring-inset ring-brand-50">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-600">
        What is included
      </p>

      {/*
        Bounded growth. A 26-test panel expands to about nine rows of chips,
        which doubled the height of its grid row and left the cards beside it
        hollow. Capped and scrollable, the row grows by a predictable amount
        whatever the package size.
      */}
      <ul
        id={listId}
        className={cn(
          'mt-2.5 flex flex-wrap gap-1.5',
          open && 'scroll-row max-h-[190px] overflow-y-auto pr-1',
        )}
      >
        {shown.map((test) => (
          <li
            key={test}
            className="rounded-lg bg-white px-2 py-1 text-[12px] leading-snug text-ink-muted shadow-soft ring-1 ring-brand-50"
          >
            {test}
          </li>
        ))}
      </ul>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={listId}
          className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-brand-600 transition-colors hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          {open ? 'Show fewer' : `Show all ${tests.length} tests`}
          <ChevronDown
            className={cn('h-3.5 w-3.5 transition-transform duration-200', open && 'rotate-180')}
            strokeWidth={2.4}
            aria-hidden="true"
          />
          <span className="sr-only"> in {name}</span>
        </button>
      )}
    </div>
  );
}
