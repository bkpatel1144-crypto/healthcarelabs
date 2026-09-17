import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Container, Reveal, SectionHeading } from '@/components/common/Primitives';
import { CountUp, PulseLine } from '@/components/common/Motion';
import { PACKAGES } from '@/data/packages';

/**
 * Editorial two-column section — a claim on the left, evidence on the right —
 * with figures derived from the catalogue rather than invented.
 */

const testMenuSize = new Set(PACKAGES.flatMap((p) => p.tests)).size;
const homeCollectionCount = PACKAGES.filter((p) => p.homeCollection).length;

const REASONS = [
  {
    index: '01',
    title: 'One visit, one complete picture',
    body: 'Pathology, imaging, cardiac testing and consultation sit in the same catalogue, so a full review does not become four appointments at four places.',
  },
  {
    index: '02',
    title: 'Panels built the way physicians order them',
    body: 'Tests are grouped the way a doctor actually requests them — complete liver and kidney profiles rather than isolated markers, so a report answers the question it was asked.',
  },
  {
    index: '03',
    title: 'Preparation you are told about in advance',
    body: 'Fasting windows, cycle timing and sample requirements are published on every package page, because a mis-prepared sample wastes the visit and the money.',
  },
  {
    index: '04',
    title: 'Verified before it is released',
    body: 'A report leaves the lab once every parameter in the panel has completed processing and been checked — not parameter by parameter as each one finishes.',
  },
];

const FIGURES = [
  { value: String(PACKAGES.length), label: 'Health packages published', suffix: '' },
  { value: String(testMenuSize), label: 'Distinct tests across the catalogue', suffix: '+' },
  { value: String(homeCollectionCount), label: 'Packages eligible for home collection', suffix: '' },
];

export function WhyHealthcareLabs() {
  return (
    <section aria-labelledby="why-heading" className="relative overflow-hidden bg-white py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-20 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(53,199,244,0.18),transparent_68%)]"
      />

      <Container className="relative">
        <div className="max-w-3xl">
          <SectionHeading
            eyebrow="Why Healthcare Labs"
            title={
              <span id="why-heading">
                Diagnostics is a craft.
                <br />
                <span className="bg-gradient-to-r from-brand-700 to-mint-600 bg-clip-text text-transparent">
                  We treat it like one.
                </span>
              </span>
            }
            description="Healthcare Labs is the diagnostics arm of Desai Healthcare Pathology Laboratory in Surat. The work is unglamorous and exacting: the right panel, prepared properly, processed carefully, and explained to the person it belongs to."
          />
        </div>

        {/*
          A bento, not a two-column list.

          Every section on this page resolved to the same even grid of equal
          white cards, which is most of why the site read as a template rather
          than as a designed thing. Here the tiles are deliberately unequal —
          one wide, one tall, one saturated — so the eye has somewhere to land
          and an order to travel in.
        */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          {/* -- Lead tile: wide, carries the first and strongest claim -- */}
          <Reveal className="sm:col-span-2 lg:col-span-2 lg:row-span-2">
            <article className="group relative flex h-full flex-col justify-between overflow-hidden rounded-4xl bg-gradient-to-br from-brand-700 via-brand-600 to-mint-600 p-8 text-white shadow-card sm:p-10">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-grid-dark [background-size:48px_48px] opacity-50"
              />
              <PulseLine className="absolute inset-x-0 bottom-10 h-20 w-full opacity-60" />

              <div className="relative">
                <span className="font-mono text-[13px] tabular-nums text-white/70">
                  {REASONS[0].index}
                </span>
                <h3 className="mt-5 text-balance text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold leading-[1.08] tracking-editorial">
                  {REASONS[0].title}
                </h3>
                <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-white/85">
                  {REASONS[0].body}
                </p>
              </div>

              <dl className="relative mt-10 grid grid-cols-3 gap-4 border-t border-white/25 pt-7">
                {FIGURES.map((f) => (
                  <div key={f.label}>
                    <dt className="sr-only">{f.label}</dt>
                    <dd>
                      <span className="block text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold leading-none tracking-tightest">
                        <CountUp value={f.value} />
                        <span className="text-white/70">{f.suffix}</span>
                      </span>
                      <span className="mt-2 block text-[11.5px] leading-snug text-white/75">
                        {f.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          </Reveal>

          {/* -- The remaining claims, as unequal tiles -- */}
          {REASONS.slice(1).map((r, i) => (
            <Reveal
              key={r.index}
              delay={i + 1}
              className={i === 0 ? 'lg:col-span-2' : undefined}
            >
              <article className="group relative flex h-full flex-col overflow-hidden rounded-4xl bg-white p-7 shadow-card ring-1 ring-brand-50 transition-transform duration-300 hover:-translate-y-1 sm:p-8">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-6 -right-2 select-none text-[112px] font-extrabold leading-none tracking-tightest text-brand-50 transition-colors duration-300 group-hover:text-brand-100"
                >
                  {r.index}
                </span>
                <span className="relative font-mono text-[13px] tabular-nums text-brand-500 transition-colors group-hover:text-brand-700">
                  {r.index}
                </span>
                <h3 className="relative mt-4 text-[19px] font-bold leading-snug tracking-[-0.02em] text-ink sm:text-[20px]">
                  {r.title}
                </h3>
                <p className="relative mt-3 text-[14.5px] leading-relaxed text-ink-muted">{r.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Link
          to="/about-us"
          className="group mt-10 inline-flex items-center gap-2 text-[15px] font-semibold text-brand-600 transition-colors hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
        >
          Read our story
          <ArrowUpRight
            className="h-[18px] w-[18px] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            strokeWidth={2.2}
            aria-hidden="true"
          />
        </Link>
      </Container>
    </section>
  );
}
