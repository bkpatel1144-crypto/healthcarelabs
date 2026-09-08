import { Link } from 'react-router-dom';
import { Container } from '@/components/common/Primitives';
import { Button, ButtonArrow } from '@/components/common/Button';
import { useSeo } from '@/lib/seo';
import { NAV_LINKS } from '@/config/site';

export default function NotFound() {
  useSeo({
    title: 'Page not found',
    description: 'The page you were looking for is not here.',
    path: '/404',
    noindex: true,
  });

  return (
    <section className="relative flex min-h-[calc(100vh-84px)] items-center overflow-hidden bg-navy-900 pt-[74px] lg:pt-[84px]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(150deg,#050E2E_0%,#07133D_45%,#0B2058_100%)]" />
        <div className="absolute inset-0 bg-grid-dark [background-size:76px_76px] [mask-image:radial-gradient(ellipse_70%_70%_at_35%_45%,#000,transparent_78%)]" />
      </div>

      {/* A flatlined trace — the hero's pulse line, with nothing to report. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 lg:block"
      >
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="h-24 w-full" role="presentation">
          <defs>
            <linearGradient id="nf-fade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#35C7F4" stopOpacity="0" />
              <stop offset="45%" stopColor="#35C7F4" stopOpacity="0.3" />
              <stop offset="72%" stopColor="#8FD9F7" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#35C7F4" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 60 H820 l14 -3 l12 6 l16 -3 H1200"
            fill="none"
            stroke="url(#nf-fade)"
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </svg>
      </div>

      <Container className="relative py-20">
        <div className="max-w-xl">
          <p className="font-mono text-[13px] uppercase tracking-[0.28em] text-brand-400">
            Error 404
          </p>
          <h1 className="mt-7 text-balance text-[clamp(2.1rem,5vw,3.4rem)] font-extrabold leading-[1.06] tracking-tightest text-white">
            Looks like this path doesn’t contain the result you’re looking for.
          </h1>
          <p className="mt-6 text-pretty text-[16.5px] leading-relaxed text-slate-300/90">
            The page has either moved or never existed. Everything else is exactly where you left
            it.
          </p>

          <div className="mt-10 flex flex-wrap gap-3.5">
            <Button to="/" variant="onDark" size="lg">
              Return Home
              <ButtonArrow />
            </Button>
            <Button to="/health-package" variant="outlineDark" size="lg">
              Browse health packages
            </Button>
          </div>

          <nav aria-label="Site sections" className="mt-12 border-t border-white/10 pt-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Or try one of these
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    to={l.href}
                    className="text-[14.5px] text-slate-400 underline-offset-4 transition-colors hover:text-brand-300 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-300"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </section>
  );
}
