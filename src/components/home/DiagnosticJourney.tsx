import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ClipboardCheck, FileText, FlaskConical, Syringe } from 'lucide-react';
import { Container, SectionHeading } from '@/components/common/Primitives';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';

/**
 * "From Sample to Insight" — the four stages, joined by a line that draws
 * itself as the section scrolls. Visually keyed to the hero: same navy ground,
 * same cyan analysis accent, same specimen language.
 */
const STAGES = [
  {
    index: '01',
    title: 'Sample Collection',
    Icon: Syringe,
    body: 'At the centre or at your address. The sample is labelled and sealed in front of you, and the requisition is checked against the panel booked.',
    detail: 'Home collection available',
  },
  {
    index: '02',
    title: 'Laboratory Processing',
    Icon: FlaskConical,
    body: 'Samples are separated and routed to the analysers each parameter requires. Panels that include imaging or cardiac testing run in parallel.',
    detail: 'Pathology · Imaging · Cardiac',
  },
  {
    index: '03',
    title: 'Quality Verification',
    Icon: ClipboardCheck,
    body: 'Results are reviewed before release. Anything that falls outside expected behaviour for the sample is re-run rather than reported.',
    detail: 'Reviewed before release',
  },
  {
    index: '04',
    title: 'Report Delivery',
    Icon: FileText,
    body: 'The complete report is shared digitally once every parameter has cleared. Packages that include a consultation close with a doctor walking you through it.',
    detail: 'Digital delivery',
  },
];

export function DiagnosticJourney() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 75%', 'end 55%'],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      aria-labelledby="journey-heading"
      className="relative overflow-hidden bg-surface-soft py-20 sm:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-light [background-size:80px_80px] [mask-image:linear-gradient(to_bottom,transparent,#000_18%,#000_82%,transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(53,199,244,0.14),transparent_68%)] blur-2xl"
      />

      <Container className="relative">
        <SectionHeading
          eyebrow="Diagnostic Journey"
                    align="center"
          title={
            <span id="journey-heading">
              From sample to <span className="text-brand-600">insight</span>
            </span>
          }
          description="Four stages, each with a checkpoint. This is what happens between the moment a sample is drawn and the moment a report reaches you."
        />

        <div ref={ref} className="relative mt-16 sm:mt-20">
          {/* ---- Connecting line ---- */}
          <div
            aria-hidden="true"
            className="absolute left-[27px] top-4 h-[calc(100%-2rem)] w-px bg-brand-100 lg:left-0 lg:top-[27px] lg:h-px lg:w-full"
          >
            <motion.span
              className="absolute inset-0 origin-top bg-gradient-to-b from-brand-500 via-mint-400 to-coral-300 lg:origin-left lg:bg-gradient-to-r"
              style={reduced ? { scaleY: 1, scaleX: 1 } : { scaleY: lineScale, scaleX: lineScale }}
            />
          </div>

          <ol className="grid gap-10 lg:grid-cols-4 lg:gap-8">
            {STAGES.map(({ index, title, Icon, body, detail }, i) => (
              <motion.li
                key={index}
                className="relative grid grid-cols-[56px_1fr] gap-x-5 lg:block"
                initial={reduced ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Node */}
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-soft ring-1 ring-brand-100 lg:mb-7">
                  <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} aria-hidden="true" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-500 px-1.5 font-mono text-[10.5px] font-bold tabular-nums text-white">
                    {index}
                  </span>
                </span>

                <div className="lg:pr-6">
                  <h3 className="text-[19px] font-bold tracking-[-0.02em] text-ink">{title}</h3>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">{body}</p>
                  <p className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-brand-600">
                    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-mint-400" />
                    {detail}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
