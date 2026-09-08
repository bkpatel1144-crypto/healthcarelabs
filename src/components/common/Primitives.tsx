import { useState, type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';

/* ------------------------------------------------------------------ Container */

/**
 * Page container.
 *
 * `full` is the default: edge to edge with only fluid padding. A centred
 * 1360px column left ~270px of dead margin either side at 1920px and made the
 * whole page read as a narrow template — and mixing the two meant sections
 * below the hero were visibly indented relative to it.
 *
 * Going full-bleed is safe because every text block inside already constrains
 * itself with its own `max-w-*`, so line length stays readable even at 2560px.
 * `shell` remains for anything that genuinely wants a narrow measure.
 */
export function Container({
  children,
  className,
  as: As = 'div',
  size = 'full',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'header' | 'footer' | 'nav' | 'main';
  size?: 'shell' | 'full';
}) {
  return (
    <As
      className={cn(
        'mx-auto w-full',
        size === 'full'
          ? 'max-w-none px-5 sm:px-8 lg:px-[clamp(2.5rem,4.5vw,5.5rem)]'
          : 'max-w-shell px-5 sm:px-8 lg:px-12',
        className,
      )}
    >
      {children}
    </As>
  );
}

/* --------------------------------------------------------------------- Eyebrow */

export function Eyebrow({
  children,
  tone = 'light',
  className,
}: {
  children: ReactNode;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <p
      className={cn(
        'flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em]',
        tone === 'dark' ? 'text-brand-300' : 'text-brand-600',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'h-px w-7',
          tone === 'dark' ? 'bg-brand-400/70' : 'bg-brand-400',
        )}
      />
      {children}
    </p>
  );
}

/* -------------------------------------------------------------- SectionHeading */

export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = 'light',
  align = 'left',
  className,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: 'light' | 'dark';
  align?: 'left' | 'center';
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl',
        className,
      )}
    >
      {eyebrow && (
        <Eyebrow tone={tone} className={align === 'center' ? 'justify-center' : undefined}>
          {eyebrow}
        </Eyebrow>
      )}
      <h2
        className={cn(
          'mt-5 text-balance text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-[1.06] tracking-editorial',
          tone === 'dark' ? 'text-white' : 'text-ink',
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'mt-5 text-pretty text-[16px] leading-relaxed sm:text-[17px]',
            tone === 'dark' ? 'text-slate-300/90' : 'text-ink-muted',
          )}
        >
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------- Reveal */

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

/** Fade-and-rise on scroll into view. Collapses to a plain div under reduced motion. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'article' | 'section';
}) {
  const reduced = usePrefersReducedMotion();
  const MotionTag = motion[as];

  if (reduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      custom={delay}
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
    >
      {children}
    </MotionTag>
  );
}

/* ----------------------------------------------------------------------- Badge */

export function Badge({
  children,
  tone = 'brand',
  className,
}: {
  children: ReactNode;
  tone?: 'brand' | 'neutral' | 'dark' | 'success' | 'warn';
  className?: string;
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700 ring-brand-200',
    neutral: 'bg-slate-100 text-ink-muted ring-slate-200',
    dark: 'bg-white/10 text-brand-100 ring-white/20',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    warn: 'bg-amber-50 text-amber-700 ring-amber-200',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------------- FAQ */

export interface FaqItem {
  question: string;
  answer: string;
}

export function FAQ({ items, className }: { items: FaqItem[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className={cn('divide-y divide-ink-line border-y border-ink-line', className)}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                id={`faq-trigger-${i}`}
                className="flex w-full items-start justify-between gap-6 py-5 text-left transition-colors hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                <span className="text-[16px] font-semibold leading-snug text-ink">
                  {item.question}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 h-5 w-5 shrink-0 text-ink-soft transition-transform duration-300 ease-premium',
                    isOpen && 'rotate-180 text-brand-500',
                  )}
                />
              </button>
            </h3>
            <div
              id={`faq-panel-${i}`}
              role="region"
              aria-labelledby={`faq-trigger-${i}`}
              hidden={!isOpen}
              className="pb-6 pr-10 text-[15px] leading-relaxed text-ink-muted"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------- Ambient decor */

/** Barely-there technical grid used behind dark sections. */
export function TechGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 bg-grid-dark [background-size:72px_72px]',
        className,
      )}
    />
  );
}
