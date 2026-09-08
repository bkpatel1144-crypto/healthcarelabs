import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { Container, SectionHeading } from '@/components/common/Primitives';
import { CARE_COMMITMENTS } from '@/data/testimonials';
import { useContent } from '@/store/content';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';

/**
 * Two modes, one section.
 *
 * Healthcare Labs does not publish attributed patient reviews, so by default
 * this renders the lab's own published vision, mission and quality statements —
 * clearly labelled as the organisation's words, not a patient's. The moment a
 * real testimonial is added through /admin/testimonials the section switches to
 * a carousel. Nothing here is fabricated in either mode.
 */
export function Voices() {
  const { liveTestimonials } = useContent();
  return liveTestimonials.length > 0 ? <TestimonialCarousel /> : <CommitmentsPanel />;
}

function CommitmentsPanel() {
  return (
    <section aria-labelledby="commitments-heading" className="bg-white py-20 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <SectionHeading
              eyebrow="What we stand for"
              title={<span id="commitments-heading">The commitments behind every report</span>}
              description="Published by Desai Healthcare Pathology Laboratory. These are the lab's own words about how it intends to work."
            />
          </div>

          <ul className="grid gap-px overflow-hidden rounded-2xl bg-ink-line lg:col-span-8 lg:grid-cols-3">
            {CARE_COMMITMENTS.map((c, i) => (
              <motion.li
                key={c.id}
                className="group relative flex flex-col bg-white p-8 transition-colors duration-300 hover:bg-mist sm:p-9"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
              >
                <Quote
                  className="h-7 w-7 text-brand-200 transition-colors duration-300 group-hover:text-brand-400"
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
                <p className="mt-6 text-balance text-[19px] font-bold leading-snug tracking-[-0.02em] text-ink">
                  {c.statement}
                </p>
                <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">{c.detail}</p>
                <p className="mt-auto pt-8 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">
                  {c.label}
                </p>
              </motion.li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

function TestimonialCarousel() {
  const { liveTestimonials } = useContent();
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const total = liveTestimonials.length;
  const current = liveTestimonials[index];

  const go = (delta: number) => setIndex((i) => (i + delta + total) % total);

  return (
    <section
      aria-labelledby="testimonials-heading"
      aria-roledescription="carousel"
      className="bg-white py-20 sm:py-28"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <SectionHeading
              eyebrow="Testimonials"
              title={<span id="testimonials-heading">In their words</span>}
              description="Experiences shared by people who have tested with Healthcare Labs."
            />
            <div className="mt-9 flex items-center gap-3">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous testimonial"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-ink-line text-ink-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next testimonial"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-ink-line text-ink-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
              </button>
              <p className="ml-2 font-mono text-[13px] tabular-nums text-ink-soft">
                {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </p>
            </div>
          </div>

          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.figure
                key={current.id}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-ink-line bg-mist p-8 sm:p-11"
                aria-live="polite"
              >
                <div className="flex gap-1" aria-label={`Rated ${current.rating} out of 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-[18px] w-[18px]',
                        i < current.rating ? 'text-amber-400' : 'text-ink-line',
                      )}
                      fill="currentColor"
                      strokeWidth={0}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <blockquote className="mt-7 text-balance text-[20px] font-semibold leading-relaxed tracking-[-0.015em] text-ink sm:text-[23px]">
                  “{current.quote}”
                </blockquote>
                <figcaption className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink-line pt-6 text-[14px]">
                  <span className="font-bold text-ink">{current.name}</span>
                  {current.location && <span className="text-ink-soft">{current.location}</span>}
                  {current.packageName && (
                    <span className="text-ink-muted">· {current.packageName}</span>
                  )}
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </section>
  );
}
