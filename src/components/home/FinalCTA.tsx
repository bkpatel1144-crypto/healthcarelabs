import { Phone } from 'lucide-react';
import { Container } from '@/components/common/Primitives';
import { Button, ButtonArrow } from '@/components/common/Button';
import { SITE_CONFIG, telHref } from '@/config/site';

export function FinalCTA() {
  return (
    <section aria-labelledby="cta-heading" className="relative overflow-hidden bg-navy-900">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#07133D_0%,#0B2058_52%,#0A1F5A_100%)]" />
        <div className="absolute inset-0 bg-grid-dark [background-size:72px_72px] [mask-image:radial-gradient(ellipse_60%_80%_at_75%_50%,#000,transparent_72%)]" />
        <div className="absolute -right-24 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(53,199,244,0.18),transparent_66%)] blur-2xl" />
        {/* Faint specimen silhouette echoing the hero. */}
        <svg
          className="absolute right-[8%] top-1/2 hidden h-[300px] -translate-y-1/2 opacity-[0.12] lg:block"
          viewBox="0 0 120 300"
          fill="none"
          stroke="#8FD9F7"
          strokeWidth="1.5"
        >
          <path d="M32 40 h56 v190 a28 28 0 0 1 -28 28 a28 28 0 0 1 -28 -28 z" />
          <rect x="30" y="18" width="60" height="24" rx="4" />
          <line x1="32" y1="140" x2="88" y2="140" strokeDasharray="4 4" />
          <line x1="10" y1="170" x2="110" y2="170" strokeOpacity="0.6" />
        </svg>
      </div>

      <Container className="relative py-20 sm:py-28">
        <div className="max-w-2xl">
          <h2
            id="cta-heading"
            className="text-balance text-[clamp(2rem,4.4vw,3.4rem)] font-extrabold leading-[1.04] tracking-editorial text-white"
          >
            Book the check you have been
            <span className="text-brand-400"> putting off.</span>
          </h2>
          <p className="mt-6 max-w-xl text-pretty text-[17px] leading-relaxed text-slate-300/90">
            Pick a package, choose a slot, and have the sample collected at home or at the centre.
            The lab confirms every booking by phone before the visit.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3.5">
            <Button to="/health-package" variant="onDark" size="lg">
              Explore Health Packages
              <ButtonArrow />
            </Button>
            <Button href={telHref()} variant="outlineDark" size="lg">
              <Phone className="h-[18px] w-[18px]" strokeWidth={2.1} aria-hidden="true" />
              {SITE_CONFIG.phoneDisplay}
            </Button>
          </div>

          <p className="mt-8 text-[13.5px] text-slate-400">
            {SITE_CONFIG.hours.map((h) => `${h.days}: ${h.time}`).join('  ·  ')}
          </p>
        </div>
      </Container>
    </section>
  );
}
