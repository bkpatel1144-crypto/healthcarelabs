import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ClipboardCheck, FileText, FlaskConical, Syringe } from 'lucide-react';
import { Container, SectionHeading } from '@/components/common/Primitives';
import { useMediaQuery, usePrefersReducedMotion } from '@/hooks/useMediaQuery';

/**
 * "From sample to insight" — the four stages, as a pinned horizontal journey.
 *
 * This was four columns in a row under a heading: 741px of band that was
 * mostly whitespace, and the one section on the page whose content is
 * literally a sequence and was presented as a static list.
 *
 * Scroll-driven horizontal movement is the right pattern for it rather than a
 * fashionable one — the section is describing a sample travelling through
 * stages, so the sample travels. The section is 300vh tall; the inner frame
 * pins to the viewport and the track moves left as you pass through, one stage
 * at a time, with a progress bar keeping the position legible.
 *
 * Two deliberate limits, both from the same reasoning: this pattern is good
 * for a showcase and bad for everything else.
 *
 *  - Desktop only. Below lg it renders as the plain vertical list, because
 *    hijacking 300vh of a phone's scroll to move something sideways is
 *    hostile, and the list reads perfectly well.
 *  - `prefers-reduced-motion` gets the same vertical list. A pinned section is
 *    a large sustained movement, which is precisely what that setting is
 *    asking us not to do.
 *
 * The panels hold no interactive elements, so nothing can be focused while it
 * is translated off-screen — the usual keyboard trap for this pattern does not
 * arise here, and it is worth keeping it that way.
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

const HEADING = (
  <SectionHeading
    eyebrow="Diagnostic Journey"
    title={
      <span id="journey-heading">
        From sample to <span className="text-brand-600">insight</span>
      </span>
    }
    description="Four stages, each with a checkpoint. This is what happens between the moment a sample is drawn and the moment a report reaches you."
  />
);

export function DiagnosticJourney() {
  const reduced = usePrefersReducedMotion();
  const wide = useMediaQuery('(min-width: 1024px)');
  const pinned = wide && !reduced;

  return pinned ? <PinnedJourney /> : <StackedJourney />;
}

/* ------------------------------------------------------- Pinned, horizontal */

function PinnedJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const [travel, setTravel] = useState(0);

  /*
    The distance to travel is measured, not assumed. A percentage translate
    would depend on the panel count and the viewport agreeing, and they do not
    at every width — this is simply how much wider the track is than its frame.
  */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setTravel(Math.max(0, track.scrollWidth - track.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });
  const x = useTransform(scrollYProgress, [0, 1], [0, -travel]);
  const progress = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="journey-heading"
      className="relative h-[300vh] bg-surface-soft"
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-grid-light [background-size:80px_80px] [mask-image:linear-gradient(to_bottom,transparent,#000_18%,#000_82%,transparent)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/4 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(53,199,244,0.16),transparent_68%)]"
        />

        <Container className="relative">
          <div className="max-w-2xl">{HEADING}</div>
        </Container>

        {/*
          Bottom padding inside the clip, not decoration.

          This box hides the cards as they translate sideways, so it has to
          clip horizontally — but its height was exactly the card's height, and
          shadow-card is a downward shadow (0 20px 48px -20px). The shadow was
          being sliced off flat at the card's bottom edge, which is what took
          the definition out of the bottom corners and made a rounded card look
          cut off square. The top never showed it because that shadow barely
          reaches upward.
        */}
        <div className="relative mt-10 overflow-hidden pb-10">
          <Container>
            <motion.ol ref={trackRef} style={{ x }} className="flex gap-6 will-change-transform">
              {STAGES.map(({ index, title, Icon, body, detail }) => (
                <li
                  key={index}
                  className="w-[min(78vw,460px)] shrink-0 rounded-4xl bg-white p-8 shadow-card ring-1 ring-brand-50"
                >
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                    <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} aria-hidden="true" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-500 px-1.5 font-mono text-[10.5px] font-bold tabular-nums text-white">
                      {index}
                    </span>
                  </span>
                  <h3 className="mt-7 text-[21px] font-bold tracking-[-0.02em] text-ink">{title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{body}</p>
                  <p className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-brand-600">
                    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-mint-400" />
                    {detail}
                  </p>
                </li>
              ))}
            </motion.ol>
          </Container>
        </div>

        <Container className="relative mt-2">
          <div
            aria-hidden="true"
            className="h-1 w-full max-w-md overflow-hidden rounded-full bg-brand-100"
          >
            <motion.span
              style={{ width: progress }}
              className="block h-full rounded-full bg-gradient-to-r from-brand-500 via-mint-400 to-coral-400"
            />
          </div>
        </Container>
      </div>
    </section>
  );
}

/* ----------------------------------- Stacked list: small screens and reduced motion */

function StackedJourney() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 55%'] });
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

      <Container className="relative">
        {HEADING}

        <div ref={ref} className="relative mt-14">
          <div
            aria-hidden="true"
            className="absolute left-[27px] top-4 h-[calc(100%-2rem)] w-px bg-brand-100"
          >
            <motion.span
              className="absolute inset-0 origin-top bg-gradient-to-b from-brand-500 via-mint-400 to-coral-300"
              style={reduced ? { scaleY: 1 } : { scaleY: lineScale }}
            />
          </div>

          <ol className="grid gap-10">
            {STAGES.map(({ index, title, Icon, body, detail }, i) => (
              <motion.li
                key={index}
                className="relative grid grid-cols-[56px_1fr] gap-x-5"
                initial={reduced ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-soft ring-1 ring-brand-100">
                  <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} aria-hidden="true" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-500 px-1.5 font-mono text-[10.5px] font-bold tabular-nums text-white">
                    {index}
                  </span>
                </span>

                <div>
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
