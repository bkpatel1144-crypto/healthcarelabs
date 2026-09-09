import { motion } from 'framer-motion';
import { ArrowRight, Clock, Home, Phone, ShieldCheck, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, ButtonArrow } from '@/components/common/Button';
import { Container } from '@/components/common/Primitives';
import { HeroFinder } from './HeroFinder';
import { HeroMedia } from './HeroMedia';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { SITE_CONFIG, telHref } from '@/config/site';
import { PACKAGES } from '@/data/packages';
import { ACCREDITATION } from '@/data/accreditation';
import { cn } from '@/lib/cn';

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

const PACKAGE_COUNT = PACKAGES.length;
const TEST_COUNT = new Set(PACKAGES.flatMap((p) => p.tests)).size;

export function DiagnosticHero() {
  const reduced = usePrefersReducedMotion();

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
      className="relative isolate overflow-hidden bg-white pt-[74px] lg:pt-[84px]"
      aria-labelledby="hero-heading"
    >
      {/* ---------- Light atmosphere: colour mesh, not a dark scrim ---------- */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#FFFFFF_0%,#FFFFFF_38%,#F4F8FF_72%,#E9F2FF_100%)]" />
        <div className="absolute inset-0 bg-mesh-hero opacity-60" />
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
      </div>

      <Container size="full" className="relative pb-16 pt-10 sm:pt-14 lg:pb-24 lg:pt-16">
        <div className="grid items-center gap-y-12 lg:grid-cols-12 lg:gap-x-14 xl:gap-x-20">
          {/* ---------------- Copy ---------------- */}
          <div className="lg:col-span-6 xl:col-span-5">
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

            <motion.h1
              id="hero-heading"
              {...rise(0.08)}
              className="mt-7 text-balance text-[clamp(2.5rem,5.4vw,4.4rem)] font-extrabold leading-[1.02] tracking-tightest text-ink"
            >
              Your trusted partner in{' '}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 bg-gradient-to-r from-brand-700 via-brand-600 to-mint-600 bg-clip-text text-transparent">
                  health diagnostics
                </span>
                {/* Hand-drawn underline: warmth a flat colour change cannot give. */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 300 14"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1.5 left-0 h-3 w-full text-coral-300"
                >
                  <motion.path
                    d="M2 9 C 60 3, 140 3, 298 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={4}
                    strokeLinecap="round"
                    initial={reduced ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
                  />
                </svg>
              </span>
            </motion.h1>

            <motion.p
              {...rise(0.16)}
              className="mt-7 max-w-xl text-pretty text-[17px] leading-relaxed text-ink-muted sm:text-[18px]"
            >
              Advanced diagnostics, preventive health packages and trusted laboratory care —
              designed around you, with home collection across Surat.
            </motion.p>

            <motion.div
              {...rise(0.24)}
              className="mt-9 flex flex-col items-stretch gap-3.5 sm:flex-row sm:items-center"
            >
              <Button to="/health-package" size="lg" className="!rounded-full whitespace-nowrap shadow-glow">
                Explore Health Packages
                <ButtonArrow />
              </Button>
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
                className="mt-12 grid max-w-xl grid-cols-3 gap-3 sm:gap-4"
              >
                {SITE_CONFIG.stats.map((stat, i) => (
                  <div
                    key={stat.label}
                    className={cn(
                      'rounded-2xl bg-white p-4 shadow-soft ring-1 ring-brand-50 transition-transform duration-300 hover:-translate-y-0.5 sm:p-5',
                    )}
                  >
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <span
                        className={cn(
                          'block text-[26px] font-extrabold leading-none tracking-tightest tabular-nums sm:text-[32px]',
                          [
                            'text-brand-600',
                            'text-mint-500',
                            'text-coral-500',
                          ][i % 3],
                        )}
                      >
                        {stat.value}
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
              className="mt-8 flex flex-col items-start gap-3.5 text-sm sm:flex-row sm:items-center sm:gap-x-7"
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
          </div>

          {/* ---------------- Media + finder ---------------- */}
          <div className="lg:col-span-6 xl:col-span-6 xl:col-start-7">
            <HeroMedia />
            <div className="mt-5 hidden lg:block">
              <HeroFinder />
            </div>
          </div>
        </div>

        <motion.p {...rise(0.5)} className="mt-14 lg:hidden">
          <Link
            to="/health-package"
            className="inline-flex items-center gap-2 text-[15px] font-semibold text-brand-600"
          >
            Browse all {PACKAGE_COUNT} packages · {TEST_COUNT}+ tests
            <ArrowRight className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          </Link>
        </motion.p>
      </Container>

      {/* ---------- Finder below the hero on small screens ---------- */}
      <div className="relative overflow-hidden bg-surface-tint pb-14 pt-2 lg:hidden">
        <Container>
          <HeroFinder />
        </Container>
      </div>
    </section>
  );
}
