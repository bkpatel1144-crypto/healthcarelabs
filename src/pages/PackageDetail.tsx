import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Clock,
  Home,
  Info,
  ListChecks,
  Phone,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Container, FAQ, Reveal, SectionHeading, Badge } from '@/components/common/Primitives';
import { Button, ButtonArrow } from '@/components/common/Button';
import { PackageCard } from '@/components/packages/PackageCard';
import { HomeCollectionSection } from '@/components/home/HomeCollection';
import { useContent } from '@/store/content';
import { CompareToggle } from '@/components/packages/ComparePackages';
import { useSeo } from '@/lib/seo';
import { formatPrice, savings, savingsPercent } from '@/lib/format';
import { HEALTH_CONCERNS } from '@/data/healthConcerns';
import { SITE_CONFIG, telHref, whatsappHref } from '@/config/site';
import type { HealthPackage } from '@/types';

export default function PackageDetail() {
  const { slug = '' } = useParams();
  const { livePackages } = useContent();
  const pkg = livePackages.find((p) => p.slug === slug);

  if (!pkg) return <Navigate to="/health-package" replace />;
  return <PackageDetailView pkg={pkg} />;
}

function PackageDetailView({ pkg }: { pkg: HealthPackage }) {
  const { livePackages } = useContent();
  const pct = savingsPercent(pkg.price, pkg.offerPrice);
  const save = savings(pkg.price, pkg.offerPrice);

  const related = useMemo(
    () =>
      livePackages
        .filter((p) => p.slug !== pkg.slug && p.concerns.some((c) => pkg.concerns.includes(c)))
        .sort((a, b) => (a.offerPrice ?? a.price ?? 0) - (b.offerPrice ?? b.price ?? 0))
        .slice(0, 3),
    [livePackages, pkg],
  );

  const concerns = HEALTH_CONCERNS.filter((c) => pkg.concerns.includes(c.id));

  const faqs = useMemo(
    () => [
      {
        question: 'How do I prepare for this package?',
        answer: pkg.preparation.join(' '),
      },
      {
        question: 'Is home collection available for this package?',
        answer: pkg.homeCollection
          ? 'Yes. A trained phlebotomist can collect the sample at your address. Any parameter in this panel that needs equipment at the centre will be scheduled separately when you book.'
          : 'No. This package includes procedures that are performed at the centre, so the full visit takes place there. Call the lab to plan the appointment around your schedule.',
      },
      {
        question: 'When will the report be ready?',
        answer: `${pkg.reportTime}. The complete report is released once every parameter in the panel has finished processing and been verified — you will not receive it in fragments.`,
      },
      {
        question: 'Can I book this for someone else?',
        answer:
          'Yes. Enter the details of the person being tested when you book, and give a phone number the lab can reach for confirmation.',
      },
      {
        question: 'Who interprets the results?',
        answer: pkg.tests.some((t) => t.toLowerCase().includes('consultation'))
          ? 'This package includes a doctor consultation, so the report is reviewed with you as part of the visit.'
          : 'The report should be reviewed by your own physician, who can read it against your history. The lab can answer questions about the tests themselves and how the sample was handled.',
      },
    ],
    [pkg],
  );

  useSeo({
    title: `${pkg.name} — Tests, Price & Preparation`,
    description: `${pkg.summary} ${pkg.tests.length} tests. ${
      pkg.offerPrice !== null ? `${formatPrice(pkg.offerPrice)} at ${SITE_CONFIG.brandName}, Surat.` : ''
    }`.trim(),
    path: `/health-package/${pkg.slug}`,
    jsonLd: {
      '@type': 'Product',
      name: pkg.name,
      description: pkg.summary,
      brand: { '@type': 'Brand', name: SITE_CONFIG.brandName },
      ...(pkg.offerPrice !== null
        ? {
            offers: {
              '@type': 'Offer',
              price: pkg.offerPrice,
              priceCurrency: SITE_CONFIG.currency.code,
              availability: 'https://schema.org/InStock',
              url: `${SITE_CONFIG.url}/health-package/${pkg.slug}`,
            },
          }
        : {}),
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Health Package"
        title={pkg.name}
        description={pkg.summary}
        crumbs={[{ label: 'Health Packages', to: '/health-package' }, { label: pkg.name }]}
        aside={
          <div className="rounded-4xl bg-white p-7 shadow-card ring-1 ring-brand-50">
            {pkg.offerPrice !== null ? (
              <>
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-[40px] font-extrabold leading-none tracking-tightest text-brand-600 tabular-nums">
                    {formatPrice(pkg.offerPrice)}
                  </span>
                  {pkg.price !== null && (
                    <span className="text-[18px] font-medium text-ink-soft line-through tabular-nums">
                      {formatPrice(pkg.price)}
                    </span>
                  )}
                </div>
                {save !== null && pct !== null && (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-mint-50 px-3 py-1.5 text-[13px] font-semibold text-mint-600 ring-1 ring-inset ring-mint-100">
                    You save {formatPrice(save)} · {pct}% off
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-[26px] font-extrabold tracking-editorial text-ink">
                  Priced on request
                </p>
                {pkg.priceNote && (
                  <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">{pkg.priceNote}</p>
                )}
              </>
            )}

            <dl className="mt-7 space-y-3.5 border-t border-brand-50 pt-6 text-[14px]">
              <SpecRow Icon={ListChecks} label="Tests included" value={`${pkg.tests.length}`} />
              <SpecRow Icon={Clock} label="Report ready" value={pkg.reportTime} />
              <SpecRow
                Icon={Home}
                label="Home collection"
                value={pkg.homeCollection ? 'Available' : 'Centre visit required'}
              />
            </dl>

            <div className="mt-7 space-y-2.5">
              <Button to="/contact-us#home-collection" size="lg" className="w-full !rounded-full shadow-glow">
                Book this package
                <ButtonArrow />
              </Button>
              <CompareToggle slug={pkg.slug} variant="label" className="w-full justify-center" />
              <div className="grid grid-cols-2 gap-2.5">
                <Button href={telHref()} variant="secondary" size="md">
                  <Phone className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  Call
                </Button>
                <Button
                  href={whatsappHref(
                    `Hello Healthcare Labs, I would like to know more about the ${pkg.name} package.`,
                  )}
                  variant="secondary"
                  size="md"
                >
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>
        }
      >
        {concerns.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-2">
            {concerns.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/health-package?concern=${c.id}`}
                  className="inline-flex items-center rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-brand-700 shadow-soft ring-1 ring-brand-100 transition-colors hover:bg-brand-50 hover:ring-brand-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageHeader>

      {/* ---- Overview + tests ---- */}
      <section className="bg-white py-16 sm:py-20">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <h2 className="text-[26px] font-extrabold tracking-editorial text-ink">
                What this package covers
              </h2>
              <p className="mt-5 text-pretty text-[16.5px] leading-relaxed text-ink-muted">
                {pkg.overview}
              </p>

              <h3 className="mt-12 flex items-center gap-2.5 text-[19px] font-bold tracking-[-0.02em] text-ink">
                <ListChecks className="h-5 w-5 text-brand-500" strokeWidth={2} aria-hidden="true" />
                Included tests
                <span className="font-mono text-[13px] font-medium tabular-nums text-ink-soft">
                  ({pkg.tests.length})
                </span>
              </h3>
              <ul className="mt-6 grid gap-x-8 gap-y-0 sm:grid-cols-2">
                {pkg.tests.map((test) => (
                  <li
                    key={test}
                    className="flex items-start gap-3 border-b border-ink-line py-3.5 text-[14.5px] leading-relaxed text-ink"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
                      strokeWidth={2.6}
                      aria-hidden="true"
                    />
                    {test}
                  </li>
                ))}
              </ul>
            </div>

            {/* ---- Preparation + audience ---- */}
            <aside className="lg:col-span-5">
              <div className="lg:sticky lg:top-32 space-y-6">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-7">
                  <h3 className="flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.015em] text-ink">
                    <Info className="h-5 w-5 text-amber-600" strokeWidth={2} aria-hidden="true" />
                    How to prepare
                  </h3>
                  <ul className="mt-5 space-y-3.5">
                    {pkg.preparation.map((step) => (
                      <li key={step} className="flex gap-3 text-[14.5px] leading-relaxed text-ink-muted">
                        <span
                          aria-hidden="true"
                          className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                        />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-ink-line bg-mist p-7">
                  <h3 className="flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.015em] text-ink">
                    <Users className="h-5 w-5 text-brand-500" strokeWidth={2} aria-hidden="true" />
                    Who this is for
                  </h3>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {pkg.suitableFor.map((s) => (
                      <li key={s}>
                        <Badge tone="neutral">{s}</Badge>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 border-t border-ink-line pt-5 text-[13px] leading-relaxed text-ink-soft">
                    Not sure this is the right panel? Call the lab on{' '}
                    <a
                      href={telHref()}
                      className="font-semibold text-brand-600 underline-offset-2 hover:underline"
                    >
                      {SITE_CONFIG.phoneDisplay}
                    </a>{' '}
                    and describe what you want to look into.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {/* ---- FAQs ---- */}
      <section className="bg-mist py-16 sm:py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <SectionHeading
                eyebrow="Questions"
                title="Before you book"
                description="The things people most often ask about this package."
              />
            </div>
            <div className="lg:col-span-8">
              <FAQ items={faqs} />
            </div>
          </div>
        </Container>
      </section>

      <HomeCollectionSection />

      {/* ---- Related ---- */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="bg-mist py-16 sm:py-20">
          <Container>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                eyebrow="Related packages"
                title={<span id="related-heading">Others in the same area</span>}
              />
              <Link
                to="/health-package"
                className="group inline-flex shrink-0 items-center gap-2 text-[15px] font-semibold text-brand-600 transition-colors hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
              >
                <ArrowLeft
                  className="h-[18px] w-[18px] transition-transform duration-200 group-hover:-translate-x-0.5"
                  strokeWidth={2.2}
                  aria-hidden="true"
                />
                Back to all packages
              </Link>
            </div>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <Reveal as="li" key={p.id} delay={i}>
                  <PackageCard pkg={p} />
                </Reveal>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </>
  );
}

function SpecRow({
  Icon,
  label,
  value,
}: {
  Icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="flex items-center gap-2.5 text-ink-muted">
        <Icon className="h-[17px] w-[17px] shrink-0 text-brand-500" strokeWidth={2} aria-hidden="true" />
        {label}
      </dt>
      <dd className="text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}
