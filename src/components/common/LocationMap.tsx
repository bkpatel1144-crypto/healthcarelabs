import { useRef } from 'react';
import { useInView } from 'framer-motion';
import { Clock, ExternalLink, MapPin, Navigation, Phone } from 'lucide-react';
import { Container } from '@/components/common/Primitives';
import { Button, ButtonArrow } from '@/components/common/Button';
import { SITE_CONFIG, mapHref, telHref } from '@/config/site';

/**
 * The centre, on a map, with the address card over it.
 *
 * This replaces a 256px click-to-load placeholder in the contact form's
 * sidebar. That version was defensible — no request reached Google until the
 * visitor asked — but what it actually showed was a grey grid with a "Load
 * map" button, and a visitor looking for directions had to work out that the
 * grey box was a map before they could see one.
 *
 * The frame loads on its own now — no button to find first. The privacy page
 * already states that the contact page embeds a Google Maps frame served by
 * Google and subject to Google's policy, so that statement stays true.
 *
 * The src is withheld until the band is within 400px of the viewport, which is
 * near enough that the map is always ready before it is looked at. `loading`
 * alone was not enough: measured on this page, two requests to Google had
 * already gone out while the band was still below the fold, because Chrome's
 * lazy threshold is generous and the contact page is short. Gating the src is
 * the only version of "deferred" that is actually true.
 *
 * No coordinates are hardcoded. The embed is queried with the same
 * `address.mapQuery` string that the "Get directions" link uses, so Google
 * geocodes it once and the pin and the directions link can never disagree —
 * and there is no invented lat/long to be quietly wrong about a place people
 * have to physically find.
 */
export function LocationMap() {
  const bandRef = useRef<HTMLDivElement>(null);
  const near = useInView(bandRef, { once: true, margin: '400px' });
  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    SITE_CONFIG.address.mapQuery,
  )}&output=embed`;

  return (
    <section aria-labelledby="location-heading" className="relative bg-surface-soft">
      <Container className="py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-4xl bg-white shadow-card ring-1 ring-brand-50">
          <div className="grid lg:grid-cols-12">
            {/* ---------------- Details ---------------- */}
            <div className="order-2 p-7 sm:p-10 lg:order-1 lg:col-span-5 lg:p-12">
              <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
                <Navigation className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                Find us
              </p>
              <h2
                id="location-heading"
                className="mt-5 text-balance text-[clamp(1.7rem,3vw,2.4rem)] font-extrabold leading-[1.1] tracking-editorial text-ink"
              >
                The centre at{' '}
                <span className="bg-gradient-to-r from-brand-700 to-mint-600 bg-clip-text text-transparent">
                  Utran
                </span>
              </h2>

              <address className="mt-6 flex gap-3.5 not-italic">
                <MapPin
                  className="mt-0.5 h-5 w-5 shrink-0 text-brand-500"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span className="text-[15.5px] leading-relaxed text-ink-muted">
                  <span className="block font-semibold text-ink">{SITE_CONFIG.legalName}</span>
                  {SITE_CONFIG.address.line1}
                  <br />
                  {SITE_CONFIG.address.city} — {SITE_CONFIG.address.postalCode}
                  <br />
                  {SITE_CONFIG.address.state}, {SITE_CONFIG.address.country}
                </span>
              </address>

              <dl className="mt-7 space-y-3 border-t border-brand-50 pt-6">
                {SITE_CONFIG.hours.map((h) => (
                  <div key={h.days} className="flex items-baseline justify-between gap-4 text-[14.5px]">
                    <dt className="flex items-center gap-2.5 text-ink-muted">
                      <Clock className="h-4 w-4 shrink-0 text-mint-500" strokeWidth={2} aria-hidden="true" />
                      {h.days}
                    </dt>
                    <dd className="font-semibold tabular-nums text-ink">{h.time}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href={mapHref()} size="md" className="!rounded-full whitespace-nowrap">
                  Get directions
                  <ButtonArrow />
                </Button>
                <Button
                  href={telHref()}
                  variant="secondary"
                  size="md"
                  className="!rounded-full whitespace-nowrap"
                >
                  <Phone className="h-[17px] w-[17px]" strokeWidth={2.1} aria-hidden="true" />
                  {SITE_CONFIG.phoneDisplay}
                </Button>
              </div>

              <p className="mt-6 flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-soft">
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
                The map is served by Google and subject to Google&rsquo;s privacy policy.
              </p>
            </div>

            {/* ---------------- Map ---------------- */}
            <div
              ref={bandRef}
              className="relative order-1 min-h-[320px] bg-surface-tint lg:order-2 lg:col-span-7 lg:min-h-[520px]"
            >
              {near && (
                <iframe
                  title={`Map showing ${SITE_CONFIG.brandName} at ${SITE_CONFIG.address.full}`}
                  src={embedSrc}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
