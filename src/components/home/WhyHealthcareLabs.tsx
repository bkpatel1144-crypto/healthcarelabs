import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Container, Reveal, SectionHeading } from '@/components/common/Primitives';
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
    <section aria-labelledby="why-heading" className="bg-white py-20 sm:py-28">
      <Container>
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          {/* ---- Claim ---- */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <SectionHeading
                eyebrow="Why Healthcare Labs"
                title={
                  <span id="why-heading">
                    Diagnostics is a craft.
                    <br />
                    <span className="text-brand-500">We treat it like one.</span>
                  </span>
                }
                description="Healthcare Labs is the diagnostics arm of Desai Healthcare Pathology Laboratory in Surat. The work is unglamorous and exacting: the right panel, prepared properly, processed carefully, and explained to the person it belongs to."
              />

              <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-ink-line pt-8">
                {FIGURES.map((f) => (
                  <div key={f.label}>
                    <dt className="sr-only">{f.label}</dt>
                    <dd>
                      <span className="block text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold leading-none tracking-tightest text-ink tabular-nums">
                        {f.value}
                        <span className="text-brand-500">{f.suffix}</span>
                      </span>
                      <span className="mt-2.5 block text-[12.5px] leading-snug text-ink-soft">
                        {f.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>

              <Link
                to="/about-us"
                className="group mt-10 inline-flex items-center gap-2 text-[15px] font-semibold text-brand-600 transition-colors hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
              >
                Read our story
                <ArrowUpRight
                  className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={2.2}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          {/* ---- Evidence ---- */}
          <ol className="lg:col-span-6 lg:col-start-7">
            {REASONS.map((r, i) => (
              <Reveal
                as="li"
                key={r.index}
                delay={i}
                className="group grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-b border-ink-line py-8 first:pt-0 last:border-b-0 last:pb-0 sm:gap-x-8"
              >
                <span className="font-mono text-[13px] font-medium tabular-nums text-brand-400 transition-colors group-hover:text-brand-600">
                  {r.index}
                </span>
                <h3 className="text-[19px] font-bold leading-snug tracking-[-0.02em] text-ink sm:text-[21px]">
                  {r.title}
                </h3>
                <p className="col-start-2 text-[15px] leading-relaxed text-ink-muted">{r.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
