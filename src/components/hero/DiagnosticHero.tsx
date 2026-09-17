import { useRef } from 'react';
import { motion, useScroll } from 'framer-motion';
import { Clock, Home, Phone, ShieldCheck, Star } from 'lucide-react';
import { Button, ButtonArrow } from '@/components/common/Button';
import { Container } from '@/components/common/Primitives';
import { HeroFinder } from './HeroFinder';
import { HeroMedia } from './HeroMedia';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { SITE_CONFIG, telHref } from '@/config/site';
import { ACCREDITATION } from '@/data/accreditation';
import { cn } from '@/lib/cn';
import { CountUp, Magnetic, PulseLine, WordReveal, useParallaxY } from '@/components/common/Motion';

/**
 * Bright, people-led hero on a light ground.
 *
 * This replaced a deep-navy, equipment-led hero. The client's existing site —
 * which they prefer — is white with vivid blue and a large photograph of
 * smiling people, and read as warm and approachable next to the dark version,
 * which read as cold. The palette here follows that: white and soft blue
 * grounds, a soft colour mesh, and their own staff photography as the subject.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export function DiagnosticHero() {
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  /*
    Scroll-linked depth. The copy, the photograph and the background blooms
    each leave the viewport at a different rate, which is what stops the hero
    reading as one flat sheet sliding away. Travel is small on purpose — a
    hero that detaches from the page is a trick, not a design.
  */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const copyY = useParallaxY(scrollYProgress, 64);
  const mediaY = useParallaxY(scrollYProgress, -46);
  const bloomY = useParallaxY(scrollYProgress, 120);

  const rise = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.75, delay, ease: EASE },
        };

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-white pt-[74px] lg:pt-[76px] xl:pt-[116px]"
      aria-labelledby="hero-heading"
    >
      {/* ---------- Light atmosphere: colour mesh, not a dark scrim ---------- */}
      <motion.div style={{ y: bloomY }} aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#FFFFFF_0%,#FFFFFF_38%,#F4F8FF_72%,#E9F2FF_100%)]" />
        <div className="absolute inset-0 bg-mesh-hero opacity-60" />
        {/* The signature trace, drawn once across the full width of the hero. */}
        <PulseLine
          className="absolute inset-x-0 bottom-0 h-[110px] w-full opacity-60"
          delay={0.6}
        />
        <motion.div
          className="absolute -right-24 -top-24 h-[46vh] w-[46vh] rounded-full bg-[radial-gradient(circle,rgba(255,122,69,0.22),transparent_68%)] blur-2xl"
          animate={reduced ? undefined : { x: [0, -34, 0], y: [0, 26, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -left-20 top-1/3 h-[42vh] w-[42vh] rounded-full bg-[radial-gradient(circle,rgba(20,196,163,0.20),transparent_66%)] blur-2xl"
          animate={reduced ? undefined : { x: [0, 30, 0], y: [0, -24, 0] }}
          transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      <Container size="full" className="relative pb-12 pt-8 sm:pt-10 lg:pb-14 lg:pt-12 lg:short:pb-10 lg:short:pt-8 lg:shorter:pb-8 lg:shorter:pt-6">
        <div className="grid gap-y-12 lg:grid-cols-12 lg:items-stretch lg:gap-x-14 xl:gap-x-20">
          {/* ---------------- Copy ---------------- */}
          <motion.div
            style={{ y: copyY }}
            className="flex flex-col justify-center lg:col-span-6 2xl:col-span-5"
          >
            <motion.div {...rise(0)} className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[11.5px] font-bold uppercase tracking-[0.14em] text-brand-700 shadow-soft ring-1 ring-brand-100">
                <ShieldCheck className="h-3.5 w-3.5 text-mint-500" strokeWidth={2.6} aria-hidden="true" />
                NABL Accredited
                <span className="font-mono text-[11px] text-brand-500">
                  {ACCREDITATION.certificateNumber}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-coral-50 px-3.5 py-2 text-[11.5px] font-bold uppercase tracking-[0.14em] text-coral-600 ring-1 ring-coral-100">
                <Star className="h-3.5 w-3.5 fill-coral-400 text-coral-400" strokeWidth={0} aria-hidden="true" />
                Trusted in Surat
              </span>
            </motion.div>

            {/*
              Editorial scale, and the words arrive one at a time.

              At clamp(2.35rem, 4.6vw, 3.9rem) this headline was the same
              weight as the section headings further down the page, which is
              most of why the hero read as ordinary. It now runs to 5.4rem and
              each word climbs out from behind its own baseline, so the first
              thing that happens on the page is the headline assembling itself.
            */}
            <WordReveal
              as="h1"
              id="hero-heading"
              text="Your trusted partner in"
              delay={0.15}
              className="mt-6 text-balance text-[clamp(2.6rem,5.6vw,5.4rem)] font-extrabold leading-[0.98] tracking-tightest text-ink lg:short:mt-4 lg:short:text-[clamp(2.4rem,4.6vw,4.4rem)] lg:shorter:mt-5 lg:shorter:text-[clamp(2.2rem,4vw,3.4rem)]"
              tail={
                <span className="relative whitespace-nowrap">
                  <span className="relative z-10 bg-gradient-to-r from-brand-700 via-brand-600 to-mint-600 bg-clip-text text-transparent">
                    health diagnostics
                  </span>
                  {/* Hand-drawn underline: warmth a flat colour change cannot give. */}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 300 14"
                    preserveAspectRatio="none"
                    className="absolute -bottom-1.5 left-0 h-3 w-full text-coral-400"
                  >
                    <motion.path
                      d="M2 9 C 60 3, 140 3, 298 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={4}
                      strokeLinecap="round"
                      initial={reduced ? false : { pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.9, delay: 0.95, ease: EASE }}
                    />
                  </svg>
                </span>
              }
            />

            <motion.p
              {...rise(0.16)}
              className="mt-5 max-w-xl text-pretty text-[16.5px] leading-relaxed text-ink-muted sm:text-[17.5px] lg:short:mt-4 lg:shorter:text-[16px]"
            >
              Advanced diagnostics, preventive health packages and trusted laboratory care —
              designed around you, with home collection across Surat.
            </motion.p>

            <motion.div
              {...rise(0.24)}
              className="mt-7 flex flex-col items-stretch gap-3.5 sm:flex-row sm:flex-wrap sm:items-center lg:short:mt-6"
            >
              <Magnetic>
                <Button
                  to="/health-package"
                  size="lg"
                  className="!rounded-full whitespace-nowrap shadow-glow"
                >
                  Explore Health Packages
                  <ButtonArrow />
                </Button>
              </Magnetic>
              <Button
                to="/contact-us#home-collection"
                variant="secondary"
                size="lg"
                className="!rounded-full whitespace-nowrap"
              >
                <Home className="h-[18px] w-[18px]" strokeWidth={2.1} aria-hidden="true" />
                Book Home Collection
              </Button>
            </motion.div>

            {/* ---------------- Published figures ---------------- */}
            {SITE_CONFIG.stats.length > 0 && (
              <motion.dl
                {...rise(0.32)}
                className="mt-8 grid max-w-xl grid-cols-3 gap-3 sm:gap-4 lg:short:mt-6 lg:short:gap-3"
              >
                {SITE_CONFIG.stats.map((stat, i) => (
                  <div
                    key={stat.label}
                    className={cn(
                      'rounded-2xl bg-white p-3.5 shadow-soft ring-1 ring-brand-50 transition-transform duration-300 hover:-translate-y-0.5 sm:p-4',
                    )}
                  >
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <span
                        className={cn(
                          'block text-[26px] font-extrabold leading-none tracking-tightest tabular-nums sm:text-[32px] lg:short:text-[28px]',
                          [
                            'text-brand-600',
                            'text-mint-500',
                            'text-coral-500',
                          ][i % 3],
                        )}
                      >
                        <CountUp value={stat.value} />
                        <span className="text-[0.7em]">{stat.suffix}</span>
                      </span>
                      <span className="mt-2 block text-[11.5px] leading-snug text-ink-soft">
                        {stat.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </motion.dl>
            )}

            <motion.div
              {...rise(0.4)}
              className="mt-7 flex flex-col items-start gap-3.5 text-sm sm:flex-row sm:items-center sm:gap-x-7 lg:short:mt-5"
            >
              <a
                href={telHref()}
                className="group flex items-center gap-2.5 font-semibold text-ink transition-colors hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white shadow-glow transition-transform group-hover:scale-105">
                  <Phone className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
                </span>
                <span className="tabular-nums">{SITE_CONFIG.phoneDisplay}</span>
              </a>
              <p className="flex items-center gap-2.5 text-ink-muted">
                <Clock className="h-4 w-4 shrink-0 text-mint-500" strokeWidth={2.2} aria-hidden="true" />
                <span>
                  Open today{' '}
                  <span className="font-semibold text-ink">{SITE_CONFIG.hours[0].time}</span>
                </span>
              </p>
            </motion.div>
          </motion.div>

          {/* ---------------- Media ---------------- */}
          <motion.div style={{ y: mediaY }} className="lg:col-span-6 2xl:col-start-7">
            <HeroMedia />
          </motion.div>
        </div>
      </Container>

      {/*
        One finder, full width, at every size. It was previously stacked inside
        the right column on desktop and repeated in a mobile-only band, which
        made the media column far taller than the copy and rendered the search
        twice in the document.
      */}
      <HeroFinder />
    </section>
  );
}
