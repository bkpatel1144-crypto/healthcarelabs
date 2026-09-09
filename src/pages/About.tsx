import {
  Building2,
  ClipboardCheck,
  Compass,
  FlaskConical,
  HeartHandshake,
  Target,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Container, Reveal, SectionHeading } from '@/components/common/Primitives';
import { Button, ButtonArrow } from '@/components/common/Button';
import { FinalCTA } from '@/components/home/FinalCTA';
import { AccreditationBadge } from '@/components/common/AccreditationBadge';
import { AccreditationSection } from '@/components/common/AccreditationSection';
import { CARE_COMMITMENTS } from '@/data/testimonials';
import { PACKAGES } from '@/data/packages';
import { useSeo } from '@/lib/seo';
import { SITE_CONFIG, mapHref } from '@/config/site';

/**
 * Brand story built strictly from what Healthcare Labs publishes about itself:
 * its vision, mission and quality statements, its catalogue, its address and
 * its opening hours. No invented history, no stock team, no fabricated metrics.
 */

const PILLARS = [
  {
    Icon: FlaskConical,
    title: 'Technology',
    body: 'Beckman Coulter AU480 and Access 2, a Bio-Rad D-10 for HbA1c and a Mindray haematology analyser, across biochemistry, hematology and immunology — plus imaging and cardiac testing on the same site.',
  },
  {
    Icon: ClipboardCheck,
    title: 'Quality & Process',
    body: 'Samples are tracked from collection through processing to verification. Results that fall outside expected behaviour for a sample are re-run rather than released.',
  },
  {
    Icon: HeartHandshake,
    title: 'Patient Experience',
    body: 'Preparation instructions published in advance, home collection where the panel allows it, and reports delivered complete rather than parameter by parameter.',
  },
];

const TIMELINE = [
  {
    marker: 'The practice',
    title: 'A pathology laboratory in Surat',
    body: `${SITE_CONFIG.legalName} operates as Healthcare Labs from Royal Square at VIP Circle, Utran, Mota Varachha. Diagnostics is the whole of the business, not a department inside something larger.`,
  },
  {
    marker: 'The catalogue',
    title: `${PACKAGES.length} packages, built around questions`,
    body: 'Panels are grouped the way physicians order them — complete liver and kidney profiles rather than isolated markers, diabetes reviews that include the kidney parameters, cardiac reviews that include function as well as chemistry.',
  },
  {
    marker: 'The reach',
    title: 'Testing that travels',
    body: `${PACKAGES.filter((p) => p.homeCollection).length} of those packages can be collected at your address. The rest include imaging or cardiac procedures that have to be done at the centre, and the package page says so before you book.`,
  },
  {
    marker: 'The hours',
    title: 'Open when people can actually come',
    body: SITE_CONFIG.hours.map((h) => `${h.days}, ${h.time}`).join('. ') + '. Early enough for a fasting sample before work.',
  },
];

export default function About() {
  useSeo({
    title: 'About Healthcare Labs — Diagnostics in Surat',
    description: `${SITE_CONFIG.legalName} operates Healthcare Labs in Surat, providing pathology, imaging and preventive health packages with a focus on quality and patient care.`,
    path: '/about-us',
  });

  return (
    <>
      <PageHeader
        eyebrow="About Us"
        title={
          <>
            Diagnostics done
            <br />
            <span className="bg-gradient-to-r from-brand-700 to-mint-600 bg-clip-text text-transparent">carefully.</span>
          </>
        }
        description={`Healthcare Labs is the diagnostics practice of ${SITE_CONFIG.legalName}, based in Surat. Pathology, imaging and cardiac testing under one roof, with preventive health packages built around the questions people actually bring in.`}
        crumbs={[{ label: 'About Us' }]}
        aside={
          <div className="rounded-4xl bg-white p-7 shadow-card ring-1 ring-brand-50">
            <h2 className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
              <Building2 className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
              Where we are
            </h2>
            <p className="mt-5 text-[15.5px] leading-relaxed text-ink-muted">
              {SITE_CONFIG.address.full}
            </p>
            <dl className="mt-7 space-y-4 border-t border-brand-50 pt-6 text-[14px]">
              {SITE_CONFIG.hours.map((h) => (
                <div key={h.days} className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-soft">{h.days}</dt>
                  <dd className="font-semibold tabular-nums text-ink">{h.time}</dd>
                </div>
              ))}
            </dl>
            <Button href={mapHref()} variant="secondary" size="md" className="mt-7 w-full">
              Open in Maps
              <ButtonArrow />
            </Button>
          </div>
        }
      />

      {/* ---- Story timeline ---- */}
      <section aria-labelledby="story-heading" className="bg-white py-20 sm:py-28">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-32">
                <SectionHeading
                  eyebrow="Our Story"
                  title={<span id="story-heading">What the practice is, in plain terms</span>}
                  description="Everything on this page is drawn from what the lab publishes about itself. Where we do not have a verified figure, we do not print one."
                />
              </div>
            </div>

            <ol className="relative lg:col-span-7 lg:col-start-6">
              {/* Vertical spine */}
              <span
                aria-hidden="true"
                className="absolute left-[7px] top-3 h-[calc(100%-2rem)] w-px bg-ink-line"
              />
              {TIMELINE.map((item, i) => (
                <Reveal
                  as="li"
                  key={item.marker}
                  delay={i}
                  className="relative grid grid-cols-[16px_1fr] gap-x-6 pb-12 last:pb-0"
                >
                  <span
                    aria-hidden="true"
                    className="relative z-10 mt-2 h-4 w-4 rounded-full border-[3px] border-white bg-brand-500 ring-1 ring-brand-200"
                  />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
                      {item.marker}
                    </p>
                    <h3 className="mt-3 text-[21px] font-bold leading-snug tracking-[-0.02em] text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-[15.5px] leading-relaxed text-ink-muted">{item.body}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {/* ---- Vision / Mission / Quality, verbatim ---- */}
      <section
        aria-labelledby="values-heading"
        className="relative overflow-hidden bg-surface-soft py-20 sm:py-28"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-grid-light [background-size:72px_72px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,#000,transparent_76%)]"
        />
        <Container className="relative">
          <SectionHeading
            eyebrow="Vision, Mission & Quality"
                        align="center"
            title={<span id="values-heading">The lab’s own words</span>}
            description="Published by Desai Healthcare Pathology Laboratory and reproduced here unchanged."
          />

          <ul className="mt-14 grid gap-6 lg:grid-cols-3">
            {CARE_COMMITMENTS.map((c, i) => {
              const Icon = [Compass, Target, ClipboardCheck][i] ?? Compass;
              return (
                <Reveal
                  as="li"
                  key={c.id}
                  delay={i}
                  className="flex flex-col rounded-4xl bg-white p-8 shadow-card ring-1 ring-brand-50 transition-transform duration-300 hover:-translate-y-1 sm:p-9"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                    <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
                    {c.label}
                  </p>
                  <p className="mt-4 text-balance text-[20px] font-bold leading-snug tracking-[-0.02em] text-ink">
                    {c.statement}
                  </p>
                  <p className="mt-3.5 text-[14.5px] leading-relaxed text-ink-muted">{c.detail}</p>
                </Reveal>
              );
            })}
          </ul>
        </Container>
      </section>

      <AccreditationSection />

      {/* ---- Pillars ---- */}
      <section aria-labelledby="pillars-heading" className="bg-white py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="How we work"
            title={<span id="pillars-heading">Three things we refuse to cut corners on</span>}
            description="Technology, process and experience are the parts of diagnostics a patient never sees and always feels."
          />

          <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-ink-line lg:grid-cols-3">
            {PILLARS.map(({ Icon, title, body }, i) => (
              <Reveal
                as="li"
                key={title}
                delay={i}
                className="group flex flex-col bg-white p-9 transition-colors duration-300 hover:bg-mist sm:p-10"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 transition-colors duration-300 group-hover:bg-brand-500 group-hover:text-white group-hover:ring-brand-500">
                  <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} aria-hidden="true" />
                </span>
                <h3 className="mt-7 text-[21px] font-bold tracking-[-0.02em] text-ink">{title}</h3>
                <p className="mt-3.5 text-[15px] leading-relaxed text-ink-muted">{body}</p>
              </Reveal>
            ))}
          </ul>

          <div className="mt-12 grid max-w-4xl gap-6 rounded-2xl border border-ink-line bg-mist p-7 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-8 sm:p-8">
            <AccreditationBadge variant="light" className="shrink-0" />
            <div className="text-[14px] leading-relaxed text-ink-muted">
              <p>
                <strong className="font-semibold text-ink">Accreditation.</strong> Healthcare Labs is
                NABL accredited for medical testing under certificate{' '}
                <span className="font-mono font-semibold text-ink">
                  {SITE_CONFIG.accreditations[0]?.registrationNumber}
                </span>
                —{' '}
                <a
                  href="#accreditation"
                  className="font-semibold text-brand-600 underline-offset-2 hover:underline"
                >
                  see the certificate and ceremony
                </a>
                .
              </p>
              <p className="mt-4">
                <strong className="font-semibold text-ink">A note on other claims.</strong> This site
                still does not publish patient counts, accuracy percentages or turnaround guarantees,
                because those cannot be evidenced the way an accreditation number can. Where a figure
                appears — package and test counts — it is computed from the published catalogue.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <FinalCTA />
    </>
  );
}
