import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Clock, Home, Phone, Star } from 'lucide-react';
import { Button, ButtonArrow } from '@/components/common/Button';
import { Container } from '@/components/common/Primitives';
import { AccreditationPill } from '@/components/common/AccreditationBadge';
import { HeroFinder } from './HeroFinder';
import { HeroVideo } from './HeroVideo';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { SITE_CONFIG, telHref } from '@/config/site';
import { PACKAGES } from '@/data/packages';

/**
 * Two-column hero: editorial copy on the left, a working test finder on the
 * right, over a deep navy ground.
 *
 * The background is real laboratory footage under a left-weighted overlay (see
 * HeroVideo). The right column earns its space by doing something — searching
 * the real catalogue — rather than holding a decorative graphic, and its glass
 * panel reads well against the moving image behind it.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Derived from the catalogue, so these can never drift from reality. */
const PACKAGE_COUNT = PACKAGES.length;
const TEST_COUNT = new Set(PACKAGES.flatMap((p) => p.tests)).size;

const PROOF = [
  { label: 'Health packages', value: String(PACKAGE_COUNT) },
  { label: 'Distinct tests', value: `${TEST_COUNT}+` },
  { label: 'Open 7 days', value: '7AM' },
];

export function DiagnosticHero() {
  const reduced = usePrefersReducedMotion();

  const rise = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: EASE },
        };

  return (
    <>
    <section
      className={cn(
        'relative isolate flex items-center overflow-hidden bg-navy-950',
        // Fills the screen at any size; the top padding clears the fixed header
        // so the content centres in the space that is actually left.
        'hero-viewport pt-[74px] lg:pt-[84px]',
      )}
      aria-labelledby="hero-heading"
    >
      <HeroVideo />

      <Container size="full" className="relative py-10 sm:py-12 lg:py-14">
        <div className="grid items-center gap-y-14 lg:grid-cols-12 lg:gap-x-16 xl:gap-x-24">
          {/* ---------- Copy ---------- */}
          <div className="lg:col-span-6 xl:col-span-6 2xl:col-span-5">
            <motion.div {...rise(0)} className="flex flex-wrap items-center gap-2.5">
              <p className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.06] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-300 ring-1 ring-inset ring-white/10">
                <Star className="h-3.5 w-3.5 fill-brand-400 text-brand-400" strokeWidth={0} aria-hidden="true" />
                Precision Diagnostics · Surat
              </p>
              <AccreditationPill />
            </motion.div>

            <motion.h1
              id="hero-heading"
              {...rise(0.08)}
              className="mt-6 text-balance text-[clamp(2.4rem,5.6vw,4.4rem)] font-extrabold leading-[1.02] tracking-tightest text-white"
            >
              Your Health.
              <br />
              <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-brand-300 bg-clip-text text-transparent">
                Decoded With
              </span>{' '}
              Precision.
            </motion.h1>

            <motion.p
              {...rise(0.16)}
              className="mt-6 max-w-lg text-pretty text-[16.5px] leading-relaxed text-slate-300/90 sm:text-[17.5px]"
            >
              Advanced diagnostics, preventive health packages and trusted laboratory care —
              designed around you.
            </motion.p>

            <motion.div
              {...rise(0.24)}
              className="mt-9 flex flex-col items-stretch gap-3.5 sm:flex-row sm:items-center"
            >
              <Button to="/health-package" variant="onDark" size="lg">
                Explore Health Packages
                <ButtonArrow />
              </Button>
              <Button to="/contact-us#home-collection" variant="outlineDark" size="lg">
                <Home className="h-[18px] w-[18px]" strokeWidth={2.1} aria-hidden="true" />
                Book Home Collection
              </Button>
            </motion.div>

            {/* ---------- Proof row ---------- */}
            <motion.dl
              {...rise(0.34)}
              className="mt-11 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-8"
            >
              {PROOF.map((p) => (
                <div key={p.label}>
                  <dt className="sr-only">{p.label}</dt>
                  <dd>
                    <span className="block text-[26px] font-extrabold leading-none tracking-tightest text-white tabular-nums sm:text-[30px]">
                      {p.value}
                    </span>
                    <span className="mt-2 block text-[12px] leading-snug text-slate-400">
                      {p.label}
                    </span>
                  </dd>
                </div>
              ))}
            </motion.dl>

            <motion.div
              {...rise(0.42)}
              className="mt-8 flex flex-col items-start gap-3.5 text-sm sm:flex-row sm:items-center sm:gap-x-7"
            >
              <a
                href={telHref()}
                className="group flex items-center gap-2.5 text-slate-300 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-300"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] ring-1 ring-white/15 transition-colors group-hover:bg-brand-500 group-hover:ring-brand-400">
                  <Phone className="h-4 w-4" strokeWidth={2.1} aria-hidden="true" />
                </span>
                <span className="font-semibold tabular-nums">{SITE_CONFIG.phoneDisplay}</span>
              </a>
              <p className="flex items-center gap-2.5 text-slate-400">
                <Clock className="h-4 w-4 shrink-0 text-brand-400" strokeWidth={2.1} aria-hidden="true" />
                <span>
                  Open today{' '}
                  <span className="font-semibold text-slate-200">{SITE_CONFIG.hours[0].time}</span>
                </span>
              </p>
            </motion.div>
          </div>

          {/*
            Finder, desktop only. On a phone the copy alone already fills the
            screen, so stacking a search panel under it made the hero roughly
            twice the viewport. It moves to its own band directly below instead
            — nothing is lost, and both read as full-screen.
          */}
          <div className="hidden lg:col-span-6 lg:block xl:col-span-5 xl:col-start-8 2xl:col-span-4 2xl:col-start-9">
            <HeroFinder />
          </div>
        </div>
      </Container>
    </section>

    {/* ---------- Finder, below the hero on small screens ---------- */}
    {/*
      overflow-hidden matters here: the finder's own glow is an `-inset-10`
      absolute layer, so without clipping its 40px overhang widened the
      document by 8px at 768. The hero clips it; this band has to as well.
    */}
    <section
      aria-label="Find your test"
      className="relative overflow-hidden bg-navy-900 py-12 sm:py-14 lg:hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-dark [background-size:64px_64px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_0%,#000,transparent_78%)]"
      />
      <Container className="relative">
        <HeroFinder />
      </Container>
    </section>
    </>
  );
}
