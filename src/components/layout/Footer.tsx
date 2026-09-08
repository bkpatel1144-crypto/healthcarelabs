import { Link } from 'react-router-dom';
import { Clock, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { Container } from '@/components/common/Primitives';
import { AccreditationBadge } from '@/components/common/AccreditationBadge';
import {
  NAV_LINKS,
  SITE_CONFIG,
  mailHref,
  mapHref,
  telHref,
} from '@/config/site';
import { PACKAGES } from '@/data/packages';
import { HEALTH_CONCERNS } from '@/data/healthConcerns';

const FEATURED_PACKAGE_LINKS = PACKAGES.filter((p) => p.featured).slice(0, 6);
const CONCERN_LINKS = HEALTH_CONCERNS.slice(0, 6);

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-navy-900 text-slate-300">
      {/* Scientific ground decoration — kept extremely low contrast. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid-dark [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,#000,transparent_65%)]" />
        <div className="absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(21,155,211,0.16),transparent_68%)] blur-2xl" />
        <svg
          className="absolute -right-24 bottom-0 h-[360px] w-[520px] opacity-[0.09]"
          viewBox="0 0 520 360"
          fill="none"
          stroke="#8FD9F7"
        >
          <ellipse cx="260" cy="180" rx="230" ry="70" />
          <ellipse cx="260" cy="180" rx="230" ry="70" transform="rotate(60 260 180)" />
          <ellipse cx="260" cy="180" rx="230" ry="70" transform="rotate(-60 260 180)" />
          <circle cx="260" cy="180" r="10" fill="#35C7F4" stroke="none" />
        </svg>
      </div>

      <Container className="relative">
        {/* ---- Brand + link columns ---- */}
        <div className="grid gap-12 pb-14 pt-16 lg:grid-cols-12 lg:gap-8 lg:pb-16 lg:pt-20">
          <div className="lg:col-span-4">
            <img
              src="/brand/healthcare-labs-logo-light.png"
              alt={SITE_CONFIG.brandName}
              width={1400}
              height={223}
              loading="lazy"
              className="h-9 w-auto"
            />
            <p className="mt-6 max-w-sm text-pretty text-[15px] leading-relaxed text-slate-400">
              Accurate, reliable health testing that helps people make informed decisions and put
              their wellbeing first.
            </p>

            <address className="mt-8 space-y-4 not-italic">
              <a
                href={mapHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-3 text-[14.5px] leading-relaxed text-slate-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-300"
              >
                <MapPin className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand-400" strokeWidth={2} aria-hidden="true" />
                <span>{SITE_CONFIG.address.full}</span>
              </a>
              <a
                href={telHref()}
                className="group flex items-center gap-3 text-[14.5px] text-slate-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-300"
              >
                <Phone className="h-[18px] w-[18px] shrink-0 text-brand-400" strokeWidth={2} aria-hidden="true" />
                <span className="tabular-nums">{SITE_CONFIG.phoneDisplay}</span>
                <span className="text-slate-600">·</span>
                <span className="tabular-nums">{SITE_CONFIG.emergencyLine}</span>
              </a>
              <a
                href={mailHref()}
                className="group flex items-center gap-3 text-[14.5px] text-slate-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-300"
              >
                <Mail className="h-[18px] w-[18px] shrink-0 text-brand-400" strokeWidth={2} aria-hidden="true" />
                <span>{SITE_CONFIG.email}</span>
              </a>
            </address>

            {SITE_CONFIG.accreditations.length > 0 && (
              <div className="mt-8">
                <AccreditationBadge variant="dark" />
              </div>
            )}

            {SITE_CONFIG.social.instagram && (
              <div className="mt-8 flex gap-2.5">
                <a
                  href={SITE_CONFIG.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${SITE_CONFIG.brandName} on Instagram`}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/12 text-slate-400 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-400/60 hover:text-brand-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300"
                >
                  <Instagram className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
                </a>
              </div>
            )}
          </div>

          <nav aria-label="Footer" className="grid gap-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-5">
            <FooterColumn title="Explore">
              {NAV_LINKS.map((l) => (
                <FooterLink key={l.href} to={l.href}>
                  {l.label}
                </FooterLink>
              ))}
            </FooterColumn>

            <FooterColumn title="Health Packages">
              {FEATURED_PACKAGE_LINKS.map((p) => (
                <FooterLink key={p.slug} to={`/health-package/${p.slug}`}>
                  {p.name}
                </FooterLink>
              ))}
            </FooterColumn>

            <FooterColumn title="By Concern">
              {CONCERN_LINKS.map((c) => (
                <FooterLink key={c.id} to={`/health-package?concern=${c.id}`}>
                  {c.label}
                </FooterLink>
              ))}
            </FooterColumn>
          </nav>

          <div className="lg:col-span-2 lg:col-start-11">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">
              Opening Hours
            </h2>
            <ul className="mt-5 space-y-4">
              {SITE_CONFIG.hours.map((h) => (
                <li key={h.days} className="flex gap-3 text-[14px]">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" strokeWidth={2} aria-hidden="true" />
                  <span>
                    <span className="block text-slate-400">{h.days}</span>
                    <span className="block font-semibold tabular-nums text-white">{h.time}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ---- Legal bar ---- */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-7 text-[13px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE_CONFIG.legalName}
          </p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <li>
              <Link
                to="/privacy-policy"
                className="transition-colors hover:text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-300"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                to="/terms"
                className="transition-colors hover:text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-300"
              >
                Terms of Use
              </Link>
            </li>
            <li>
              <Link
                to="/contact-us"
                className="transition-colors hover:text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-300"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <p className="border-t border-white/[0.06] py-6 text-[12px] leading-relaxed text-slate-600">
          Information on this site is provided for general awareness and does not constitute medical
          advice. Test results should always be interpreted by a qualified physician who knows your
          history.
        </p>
      </Container>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">{title}</h2>
      <ul className="mt-5 space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        to={to}
        className="group inline-flex text-[14px] text-slate-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-300"
      >
        <span className="border-b border-transparent transition-colors group-hover:border-brand-400/60">
          {children}
        </span>
      </Link>
    </li>
  );
}
