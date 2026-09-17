import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';

/**
 * Shared motion primitives.
 *
 * The site read as a competent template rather than as a designed thing, and
 * the reason was structural: every section resolved to an even grid of white
 * cards that faded up together. These are the pieces that give it
 * choreography instead — headlines that arrive word by word, figures that
 * count, a ribbon that never stops moving, and edges between sections that are
 * not flat.
 *
 * Every one of them collapses to a static render under `prefers-reduced-motion`
 * rather than animating faster. Motion is the whole point of these components,
 * so "less of it" is not a meaningful setting; off is.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------- WordReveal */

/**
 * Rises a headline into place one word at a time.
 *
 * The words are wrapped in an overflow-hidden span so each one climbs out from
 * behind its own baseline rather than fading in on the spot — the difference
 * between a heading that appears and a heading that arrives.
 *
 * `text` is plain text so the words can be split. Anything that needs its own
 * markup — a gradient span, an underline — is passed as `tail` and revealed
 * after the words, as one unit.
 */
export function WordReveal({
  text,
  tail,
  className,
  delay = 0,
  id,
  as: Tag = 'span',
}: {
  text: string;
  tail?: ReactNode;
  className?: string;
  delay?: number;
  /** Needed when something else labels itself by this heading. */
  id?: string;
  as?: 'span' | 'h1' | 'h2';
}) {
  const reduced = usePrefersReducedMotion();
  const words = text.split(' ').filter(Boolean);

  if (reduced) {
    return (
      <Tag id={id} className={className}>
        {text}
        {tail ? <> {tail}</> : null}
      </Tag>
    );
  }

  return (
    <Tag id={id} className={className}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.85, delay: delay + i * 0.07, ease: EASE }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
      {tail ? (
        <motion.span
          className="inline-block"
          initial={{ opacity: 0, y: '40%' }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: delay + words.length * 0.07, ease: EASE }}
        >
          {' '}
          {tail}
        </motion.span>
      ) : null}
    </Tag>
  );
}

/* ----------------------------------------------------------------- CountUp */

/**
 * Counts a figure up when it scrolls into view.
 *
 * Values here are not all numeric — the published stats include "1K" and "15L"
 * — so the leading integer is animated and whatever follows is appended
 * unchanged. Counting from zero to one is not worth an animation, so anything
 * under 10 renders directly.
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-24px' });
  const match = /^(\d+)(.*)$/.exec(value.trim());
  const target = match ? Number(match[1]) : NaN;
  const rest = match ? match[2] : '';
  const animatable = !reduced && Number.isFinite(target) && target >= 10;
  const [shown, setShown] = useState(animatable ? 0 : target);

  useEffect(() => {
    if (!animatable || !inView) return;
    let raf = 0;
    const started = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      // Ease-out cubic: fast at the start, settling rather than stopping dead.
      setShown(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animatable, inView, target]);

  if (!match) return <span className={className}>{value}</span>;

  return (
    <span ref={ref} className={className}>
      <span className="tabular-nums">{animatable ? shown : target}</span>
      {rest}
    </span>
  );
}

/* ----------------------------------------------------------------- Marquee */

/**
 * An endless ribbon of text.
 *
 * The track is duplicated and translated by exactly -50%, so the second copy
 * is in the first one's place at the moment the loop restarts and the seam is
 * invisible. `aria-hidden` on the duplicate keeps a screen reader from
 * reading the list twice.
 */
export function Marquee({
  items,
  speed = 40,
  className,
}: {
  items: string[];
  speed?: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  if (items.length === 0) return null;

  const track = (
    <ul className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <li key={`${item}-${i}`} className="flex items-center whitespace-nowrap">
          <span className="px-6 text-[13px] font-bold uppercase tracking-[0.18em]">{item}</span>
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-45" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className={cn('flex overflow-hidden', className)}>
      {reduced ? (
        <div className="flex overflow-x-auto">{track}</div>
      ) : (
        <motion.div
          className="flex"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
        >
          {track}
          <div aria-hidden="true" className="flex">
            {track}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ MagneticCta */

/**
 * A button that leans towards the pointer.
 *
 * The pull is capped at 6px and spring-damped, so it reads as weight rather
 * than as the control running away from the cursor. Pointer type is checked
 * because a touch device reports a single synthetic move and the button would
 * stick in the offset position.
 */
export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 18, mass: 0.4 });
  const y = useSpring(my, { stiffness: 260, damping: 18, mass: 0.4 });

  if (reduced) return <span className={className}>{children}</span>;

  return (
    <motion.span
      ref={ref}
      style={{ x, y }}
      className={cn('inline-block', className)}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || !ref.current) return;
        const b = ref.current.getBoundingClientRect();
        mx.set(Math.max(-6, Math.min(6, (e.clientX - (b.left + b.width / 2)) / 5)));
        my.set(Math.max(-6, Math.min(6, (e.clientY - (b.top + b.height / 2)) / 5)));
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/* ---------------------------------------------------------------- PulseLine */

/**
 * The signature motif: a cardiac trace that draws itself across a section.
 *
 * It is the one mark on the site that belongs to this business specifically —
 * a lab that runs ECGs — rather than to any template, and it repeats at the
 * hero and at the closing band so the page reads as one piece.
 */
export function PulseLine({ className, delay = 0 }: { className?: string; delay?: number }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  /*
    The gradient id has to be unique per instance. With it hardcoded, the two
    traces on the homepage — the hero and the bento's lead tile — both emitted
    id="pulse-stroke", which is invalid and makes the second one resolve its
    `url(#…)` against the first element in the document.
  */
  const gradientId = useId();

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      className={cn('pointer-events-none', className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#35C7F4" stopOpacity="0" />
          <stop offset="18%" stopColor="#159BD3" stopOpacity="0.85" />
          <stop offset="62%" stopColor="#14C4A3" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FF7A45" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0 60 H300 l18 0 l14 -34 l16 68 l15 -47 l13 13 H600 l22 0 l12 -22 l14 44 l12 -30 l10 8 H1200"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
        animate={inView || reduced ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 2.4, delay, ease: 'easeInOut' }}
      />
    </svg>
  );
}

/* ------------------------------------------------------------- ParallaxY */

/**
 * Scroll-linked vertical drift. `range` is the travel in pixels.
 *
 * Typed against MotionValue<number> rather than inferred from useTransform:
 * `Parameters<typeof useTransform>[0]` picks the transformer-function overload,
 * not the input-value one.
 */
export function useParallaxY(progress: MotionValue<number>, range: number) {
  const reduced = usePrefersReducedMotion();
  return useTransform(progress, [0, 1], [0, reduced ? 0 : range]);
}
