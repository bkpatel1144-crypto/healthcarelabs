import { useCallback, useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { Container, SectionHeading } from '@/components/common/Primitives';
import { CARE_COMMITMENTS } from '@/data/testimonials';
import { useContent } from '@/store/content';
import { cn } from '@/lib/cn';
import type { Testimonial } from '@/types';

/**
 * Two modes, one section.
 *
 * When testimonials exist this renders the reviews Healthcare Labs publishes,
 * as a scrollable row of cards — showing several at once rather than one at a
 * time, because a row of named faces reads as social proof in a way a single
 * rotating quote does not. With no testimonials it falls back to the lab's own
 * published vision, mission and quality statements, clearly labelled as the
 * organisation's words rather than a patient's. Nothing here is fabricated in
 * either mode.
 */
export function Voices() {
  const { liveTestimonials } = useContent();
  return liveTestimonials.length > 0 ? (
    <TestimonialWall items={liveTestimonials} />
  ) : (
    <CommitmentsPanel />
  );
}

/* Rotating accents so a long row does not read as one card repeated. */
const ACCENTS = [
  { avatar: 'bg-brand-500', ring: 'ring-brand-100', quote: 'text-brand-200' },
  { avatar: 'bg-mint-500', ring: 'ring-mint-100', quote: 'text-mint-200' },
  { avatar: 'bg-coral-400', ring: 'ring-coral-100', quote: 'text-coral-200' },
] as const;

function initials(name: string) {
  return name
    .replace(/^(Dr|Mr|Mrs|Ms)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
}

function TestimonialWall({ items }: { items: Testimonial[] }) {
  const rowRef = useRef<HTMLUListElement>(null);

  const scrollRow = useCallback((direction: 1 | -1) => {
    const row = rowRef.current;
    if (!row) return;
    // One card plus its gap, so a click always lands on a card boundary.
    const step = (row.firstElementChild as HTMLElement | null)?.offsetWidth ?? 320;
    row.scrollBy({ left: direction * (step + 24), behavior: 'smooth' });
  }, []);

  const average = items.reduce((sum, t) => sum + t.rating, 0) / items.length;

  return (
    <section aria-labelledby="testimonials-heading" className="bg-surface-soft py-20 sm:py-28">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <SectionHeading
              eyebrow="Testimonials"
              title={<span id="testimonials-heading">In their words</span>}
              description="Reviews published by people who have tested with Healthcare Labs."
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <p className="flex max-w-full flex-wrap items-center gap-x-2.5 gap-y-1 rounded-3xl bg-white px-4 py-2.5 shadow-soft ring-1 ring-brand-50">
              <span className="flex gap-0.5" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-amber-400"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                ))}
              </span>
              <span className="text-[13.5px] font-bold tabular-nums text-ink">
                {average.toFixed(1)}
              </span>
              <span className="text-[13px] text-ink-soft">
                from {items.length} review{items.length === 1 ? '' : 's'}
              </span>
            </p>

            <div className="hidden gap-2 sm:flex">
              <RowButton label="Previous testimonials" onClick={() => scrollRow(-1)}>
                <ChevronLeft className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
              </RowButton>
              <RowButton label="More testimonials" onClick={() => scrollRow(1)}>
                <ChevronRight className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
              </RowButton>
            </div>
          </div>
        </div>

        {/* Negative margin so the row bleeds to the screen edge on mobile. */}
        <ul
          ref={rowRef}
          className="scroll-row -mx-5 mt-12 flex snap-x snap-mandatory gap-6 px-5 pb-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0"
        >
          {items.map((t, i) => {
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <motion.li
                key={t.id}
                className="w-[300px] shrink-0 snap-start sm:w-[360px]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{
                  duration: 0.5,
                  delay: Math.min(i, 3) * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <figure
                  className={cn(
                    'flex h-full flex-col rounded-4xl bg-white p-7 shadow-card ring-1 transition-transform duration-300 hover:-translate-y-1 sm:p-8',
                    accent.ring,
                  )}
                >
                  <Quote
                    className={cn('h-8 w-8', accent.quote)}
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />

                  <div className="mt-5 flex gap-1" aria-label={`Rated ${t.rating} out of 5`}>
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        className={cn(
                          'h-[17px] w-[17px]',
                          s < t.rating ? 'text-amber-400' : 'text-ink-line',
                        )}
                        fill="currentColor"
                        strokeWidth={0}
                        aria-hidden="true"
                      />
                    ))}
                  </div>

                  <blockquote className="mt-5 text-[15.5px] leading-relaxed text-ink-muted">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>

                  <figcaption className="mt-auto flex items-center gap-3.5 pt-8">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white',
                        accent.avatar,
                      )}
                    >
                      {initials(t.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[14.5px] font-bold text-ink">
                        {t.name}
                      </span>
                      <span className="block truncate text-[12.5px] text-ink-soft">
                        {[t.location, t.packageName].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </motion.li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

function RowButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-muted shadow-soft ring-1 ring-brand-50 transition-all duration-200 hover:-translate-y-0.5 hover:text-brand-600 hover:ring-brand-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
    >
      {children}
    </button>
  );
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

          <ul className="grid gap-6 lg:col-span-8 lg:grid-cols-3">
            {CARE_COMMITMENTS.map((c, i) => {
              const accent = ACCENTS[i % ACCENTS.length];
              return (
                <motion.li
                  key={c.id}
                  className={cn(
                    'flex flex-col rounded-4xl bg-white p-8 shadow-card ring-1 transition-transform duration-300 hover:-translate-y-1 sm:p-9',
                    accent.ring,
                  )}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Quote
                    className={cn('h-7 w-7', accent.quote)}
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
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
}
