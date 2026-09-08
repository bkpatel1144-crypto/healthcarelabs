import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Tag, Timer } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Container, Reveal, SectionHeading, Badge } from '@/components/common/Primitives';
import { Button, ButtonArrow } from '@/components/common/Button';
import { useContent } from '@/store/content';
import { useSeo } from '@/lib/seo';
import { formatPrice, savings, savingsPercent } from '@/lib/format';
import { SITE_CONFIG, telHref } from '@/config/site';
import { cn } from '@/lib/cn';
import type { Offer } from '@/types';

export default function Offers() {
  const { liveOffers } = useContent();

  const [lead, ...rest] = liveOffers;

  useSeo({
    title: 'My Offers — Current Health Package Pricing',
    description: `Current pricing across ${liveOffers.length} Healthcare Labs health packages, with the original price and the saving shown on every one.`,
    path: '/my-offers',
  });

  const biggestSaving = useMemo(
    () =>
      liveOffers.reduce(
        (max, o) => Math.max(max, savings(o.originalPrice, o.offerPrice) ?? 0),
        0,
      ),
    [liveOffers],
  );

  return (
    <>
      <PageHeader
        eyebrow="My Offers"
        title={
          <>
            Current pricing,
            <br />
            <span className="text-brand-400">published in full.</span>
          </>
        }
        description="Every package below shows what it originally cost and what it costs now. No countdown theatre, no invented deadlines — just the pricing the lab publishes."
        crumbs={[{ label: 'My Offers' }]}
        aside={
          <dl className="grid grid-cols-2 gap-x-6 gap-y-7 rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm">
            <div>
              <dt className="sr-only">Packages with reduced pricing</dt>
              <dd>
                <span className="block text-[30px] font-extrabold leading-none tracking-tightest text-white tabular-nums">
                  {liveOffers.length}
                </span>
                <span className="mt-2 block text-[12.5px] text-slate-400">
                  Packages with reduced pricing
                </span>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Largest single saving</dt>
              <dd>
                <span className="block text-[30px] font-extrabold leading-none tracking-tightest text-white tabular-nums">
                  {formatPrice(biggestSaving)}
                </span>
                <span className="mt-2 block text-[12.5px] text-slate-400">Largest single saving</span>
              </dd>
            </div>
          </dl>
        }
      />

      {liveOffers.length === 0 ? (
        <section className="bg-white py-24">
          <Container>
            <div className="mx-auto max-w-md text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mist text-ink-soft ring-1 ring-ink-line">
                <Tag className="h-6 w-6" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <h2 className="mt-6 text-[22px] font-bold tracking-editorial text-ink">
                No offers are running right now.
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
                Package pricing is always published on the packages page. Call the lab if you would
                like a quote for a panel that is not listed.
              </p>
              <Button to="/health-package" size="md" className="mt-7">
                Browse packages
                <ButtonArrow />
              </Button>
            </div>
          </Container>
        </section>
      ) : (
        <>
          {/* ---- Lead offer ---- */}
          {lead && (
            <section aria-label="Featured offer" className="bg-white py-16 sm:py-20">
              <Container>
                <LeadOffer offer={lead} />
              </Container>
            </section>
          )}

          {/* ---- Remaining offers ---- */}
          <section aria-labelledby="all-offers-heading" className="bg-mist py-16 sm:py-20">
            <Container>
              <SectionHeading
                eyebrow="All current pricing"
                title={<span id="all-offers-heading">Every package, every saving</span>}
                description="Sorted by the size of the reduction. Prices apply to the package exactly as listed."
              />

              <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((offer, i) => (
                  <Reveal as="li" key={offer.id} delay={i % 3}>
                    <OfferCard offer={offer} />
                  </Reveal>
                ))}
              </ul>

              <div className="mt-14 rounded-2xl border border-ink-line bg-white p-8 sm:p-10">
                <h2 className="text-[19px] font-bold tracking-[-0.02em] text-ink">
                  Terms that apply to all pricing on this page
                </h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {(lead?.terms ?? []).map((t) => (
                    <li key={t} className="flex gap-3 text-[14.5px] leading-relaxed text-ink-muted">
                      <span
                        aria-hidden="true"
                        className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brand-400"
                      />
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-7 border-t border-ink-line pt-6 text-[14px] text-ink-muted">
                  Questions about a package or its pricing?{' '}
                  <a
                    href={telHref()}
                    className="font-semibold text-brand-600 underline-offset-2 hover:underline"
                  >
                    {SITE_CONFIG.phoneDisplay}
                  </a>
                </p>
              </div>
            </Container>
          </section>
        </>
      )}
    </>
  );
}

function LeadOffer({ offer }: { offer: Offer }) {
  const pct = savingsPercent(offer.originalPrice, offer.offerPrice);
  const save = savings(offer.originalPrice, offer.offerPrice);

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white lg:grid lg:grid-cols-12">
      <div className="p-8 sm:p-11 lg:col-span-7">
        <div className="flex flex-wrap gap-2">
          {offer.highlight && <Badge tone="brand">{offer.highlight}</Badge>}
          {pct !== null && <Badge tone="success">Save {pct}%</Badge>}
        </div>
        <h2 className="mt-6 text-balance text-[clamp(1.75rem,3.4vw,2.6rem)] font-extrabold leading-[1.08] tracking-editorial text-ink">
          {offer.title}
        </h2>
        <p className="mt-5 max-w-xl text-pretty text-[16px] leading-relaxed text-ink-muted">
          {offer.description}
        </p>

        <Countdown validUntil={offer.validUntil} />

        <div className="mt-9 flex flex-wrap items-center gap-3.5">
          {offer.packageSlug && (
            <Button to={`/health-package/${offer.packageSlug}`} size="lg">
              View package details
              <ButtonArrow />
            </Button>
          )}
          <Button to="/contact-us#home-collection" variant="secondary" size="lg">
            Book now
          </Button>
        </div>
      </div>

      <div className="flex flex-col justify-center border-t border-brand-100 bg-navy-900 p-8 text-white sm:p-11 lg:col-span-5 lg:border-l lg:border-t-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300">
          Current price
        </p>
        <p className="mt-4 text-[clamp(2.5rem,5vw,3.5rem)] font-extrabold leading-none tracking-tightest tabular-nums">
          {formatPrice(offer.offerPrice)}
        </p>
        {offer.originalPrice !== null && (
          <p className="mt-3 text-[17px] text-slate-400">
            Originally{' '}
            <span className="line-through tabular-nums">{formatPrice(offer.originalPrice)}</span>
          </p>
        )}
        {save !== null && (
          <p className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-emerald-500/15 px-3.5 py-2 text-[14px] font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/25">
            You save {formatPrice(save)}
          </p>
        )}
      </div>
    </div>
  );
}

function OfferCard({ offer }: { offer: Offer }) {
  const pct = savingsPercent(offer.originalPrice, offer.offerPrice);
  const save = savings(offer.originalPrice, offer.offerPrice);

  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-ink-line bg-white p-6 transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-brand-200 hover:shadow-liftLg sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        {offer.highlight && <Badge tone="brand">{offer.highlight}</Badge>}
        {pct !== null && (
          <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-emerald-600">
            {pct}% off
          </span>
        )}
      </div>

      <h3 className="mt-4 text-[18px] font-bold leading-snug tracking-[-0.02em] text-ink">
        {offer.packageSlug ? (
          <Link
            to={`/health-package/${offer.packageSlug}`}
            className="before:absolute before:inset-0 before:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
          >
            {offer.title}
          </Link>
        ) : (
          offer.title
        )}
      </h3>

      <p className="mt-2.5 line-clamp-3 text-[14px] leading-relaxed text-ink-muted">
        {offer.description}
      </p>

      <Countdown validUntil={offer.validUntil} compact />

      <div className="mt-auto flex items-end justify-between gap-4 border-t border-ink-line pt-6">
        <div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[24px] font-extrabold leading-none tracking-tightest text-ink tabular-nums">
              {formatPrice(offer.offerPrice)}
            </span>
            {offer.originalPrice !== null && (
              <span className="text-[14px] text-ink-soft line-through tabular-nums">
                {formatPrice(offer.originalPrice)}
              </span>
            )}
          </div>
          {save !== null && (
            <p className="mt-1.5 text-[12.5px] font-semibold text-emerald-600">
              Save {formatPrice(save)}
            </p>
          )}
        </div>
        <span
          aria-hidden="true"
          className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mist text-ink-muted transition-all duration-300 group-hover:bg-brand-500 group-hover:text-white"
        >
          <ArrowRight className="h-[17px] w-[17px]" strokeWidth={2.2} />
        </span>
      </div>
    </article>
  );
}

/**
 * Only renders when the offer carries a genuine expiry date. Offers with no
 * published deadline show nothing at all rather than a manufactured timer.
 */
function Countdown({ validUntil, compact = false }: { validUntil: string; compact?: boolean }) {
  const target = validUntil ? new Date(validUntil).getTime() : NaN;
  const valid = !Number.isNaN(target);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!valid) return;
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [valid]);

  if (!valid || target <= now) return null;

  const remaining = target - now;
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);

  return (
    <p
      className={cn(
        'inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 font-semibold text-amber-700 ring-1 ring-inset ring-amber-200',
        compact ? 'mt-4 text-[12.5px]' : 'mt-7 text-[14px]',
      )}
    >
      <Timer className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
      <span>
        {days > 0 ? `${days} ${days === 1 ? 'day' : 'days'} ` : ''}
        {hours} {hours === 1 ? 'hour' : 'hours'} remaining
      </span>
    </p>
  );
}
