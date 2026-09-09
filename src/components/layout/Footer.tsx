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

/**
 * Two-tone footer: a light link zone, then a slim deep bar for the legal text.
 *
 * This was a full slab of deep navy, and it sat directly beneath the closing
 * CTA's cyan-to-mint gradient. Two saturated colours from different families
 * met on a hard horizontal edge, which is the collision the client kept
 * pointing at — and the navy also belonged to the palette the rest of the site
 * had already moved away from.
 *
 * The link zone is now part of the light system, so the gradient above steps
 * down into it instead of stopping dead. The legal text keeps a dark ground,
 * because it should read as a base rather than as content — but in a deep
 * teal-blue drawn from the brand ramp, so it relates to the gradient rather
 * than arguing with it.
 *
 * The columns are also rebalanced. Four equal columns across the right span
 * fill the width; the previous 3-plus-1 arrangement left roughly 400px of dead
 * space to the right of the links at desktop widths.
 */

const FEATURED_PACKAGE_LINKS = PACKAGES.filter((p) => p.featured).slice(0, 6);
const CONCERN_LINKS = HEALTH_CONCERNS.slice(0, 6);

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative">
      {/* ------------------------------------------------ Light link zone */}
      <div className="relative overflow-hidden bg-surface-soft">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-grid-light [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,#000,transparent_70%)]" />
          <div className="absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(53,199,244,0.22),transparent_68%)] blur-2xl" />
          <div className="absolute -right-28 bottom-0 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(20,196,163,0.18),transparent_68%)] blur-2xl" />
        </div>

        <Container className="relative">
          <div className="grid gap-12 pb-14 pt-16 lg:grid-cols-12 lg:gap-10 lg:pb-16 lg:pt-20">
            {/* ---- Brand block ---- */}
            <div className="lg:col-span-4">
              <img
                src="/brand/healthcare-labs-logo.png"
                alt={SITE_CONFIG.brandName}
                width={1400}
                height={223}
                loading="lazy"
                className="h-9 w-auto max-w-[220px] object-contain object-left"
              />
              <p className="mt-6 max-w-sm text-pretty text-[15px] leading-relaxed text-ink-muted">
                Accurate, reliable health testing that helps people make informed decisions and put
                their wellbeing first.
              </p>

              <address className="mt-8 space-y-3 not-italic">
                <FooterContact href={mapHref()} external Icon={MapPin}>
                  {SITE_CONFIG.address.full}
                </FooterContact>
                <FooterContact href={telHref()} Icon={Phone}>
                  <span className="tabular-nums">{SITE_CONFIG.phoneDisplay}</span>
                  <span className="mx-2 text-ink-line">·</span>
                  <span className="tabular-nums">{SITE_CONFIG.emergencyLine}</span>
                </FooterContact>
                <FooterContact href={mailHref()} Icon={Mail}>
                  {SITE_CONFIG.email}
                </FooterContact>
              </address>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {SITE_CONFIG.accreditations.length > 0 && <AccreditationBadge variant="light" />}
                {SITE_CONFIG.social.instagram && (
                  <a
                    href={SITE_CONFIG.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${SITE_CONFIG.brandName} on Instagram`}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-ink-muted shadow-soft ring-1 ring-brand-100 transition-all duration-200 hover:-translate-y-0.5 hover:text-brand-600 hover:ring-brand-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                  >
                    <Instagram className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>

            {/* ---- Four equal link columns ---- */}
            <div className="grid gap-10 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-4">
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

              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
                  Opening Hours
                </h2>
                <ul className="mt-5 space-y-3">
                  {SITE_CONFIG.hours.map((h) => (
                    <li
                      key={h.days}
                      className="flex gap-3 rounded-2xl bg-white px-3.5 py-3 shadow-soft ring-1 ring-brand-50"
                    >
                      <Clock
                        className="mt-0.5 h-4 w-4 shrink-0 text-mint-500"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block text-[13px] text-ink-soft">{h.days}</span>
                        <span className="block text-[13.5px] font-semibold tabular-nums text-ink">
                          {h.time}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* --------------------------------------------------- Deep legal bar */}
      {/*
        A deep teal-blue from the brand ramp rather than the old navy: it shares
        a hue with the gradient two blocks up, so the page darkens towards the
        base instead of switching colour family at the seam.
      */}
      <div className="relative overflow-hidden bg-[#062A3D] text-white/70">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_100%_at_20%_0%,rgba(53,199,244,0.16),transparent_70%)]"
        />
        <Container className="relative">
          <div className="flex flex-col gap-4 py-7 text-[13px] sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} {SITE_CONFIG.legalName}
            </p>
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <li>
                <LegalLink to="/privacy-policy">Privacy Policy</LegalLink>
              </li>
              <li>
                <LegalLink to="/terms">Terms of Use</LegalLink>
              </li>
              <li>
                <LegalLink to="/contact-us">Contact</LegalLink>
              </li>
            </ul>
          </div>

          <p className="border-t border-white/10 py-6 text-[12px] leading-relaxed text-white/45">
            Information on this site is provided for general awareness and does not constitute
            medical advice. Test results should always be interpreted by a qualified physician who
            knows your history.
          </p>
        </Container>
      </div>
    </footer>
  );
}

function FooterContact({
  href,
  Icon,
  external = false,
  children,
}: {
  href: string;
  Icon: typeof MapPin;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group flex gap-3 rounded-xl text-[14.5px] leading-relaxed text-ink-muted transition-colors hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
    >
      <Icon
        className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand-500"
        strokeWidth={2}
        aria-hidden="true"
      />
      <span>{children}</span>
    </a>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink">{title}</h2>
      <ul className="mt-5 space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        to={to}
        className="group inline-flex text-[14px] text-ink-muted transition-colors hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
      >
        <span className="border-b border-transparent transition-colors group-hover:border-brand-400">
          {children}
        </span>
      </Link>
    </li>
  );
}

function LegalLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-300"
    >
      {children}
    </Link>
  );
}
