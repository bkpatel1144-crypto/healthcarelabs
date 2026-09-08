import { useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { SITE_CONFIG, mapHref } from '@/config/site';

/**
 * Click-to-load map.
 *
 * The iframe is only mounted once the visitor asks for it, so no request
 * reaches Google — and no third-party cookie is set — merely by opening the
 * contact page. That keeps the behaviour consistent with what the privacy
 * page states, and keeps a ~300 KB third-party embed off the critical path.
 *
 * The placeholder is a real control, not a decorative overlay, and the
 * "open in Maps" link is always available so the address is reachable even if
 * the visitor never loads the embed.
 */
export function MapEmbed() {
  const [loaded, setLoaded] = useState(false);
  const src = `https://www.google.com/maps?q=${encodeURIComponent(
    SITE_CONFIG.address.mapQuery,
  )}&output=embed`;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-line bg-mist">
      {loaded ? (
        <iframe
          title={`Map showing the location of ${SITE_CONFIG.brandName}`}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-64 w-full border-0"
        />
      ) : (
        <div className="relative h-64 w-full">
          {/* Schematic stand-in — no tiles fetched, no request made. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-grid-light [background-size:28px_28px] opacity-70"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(21,155,211,0.16),transparent_62%)]"
          />
          <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-600 ring-1 ring-ink-line">
              <MapPin className="h-[20px] w-[20px]" strokeWidth={2} aria-hidden="true" />
            </span>
            <p className="mt-4 text-[14px] font-semibold text-ink">
              {SITE_CONFIG.address.city} — {SITE_CONFIG.address.postalCode}
            </p>
            <p className="mt-1 max-w-xs text-[12.5px] leading-relaxed text-ink-soft">
              The map is loaded from Google. It stays off until you ask for it.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setLoaded(true)}
                className="h-9 rounded-lg bg-brand-500 px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                Load map
              </button>
              <a
                href={mapHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-line bg-white px-3.5 text-[13px] font-semibold text-ink-muted transition-colors hover:border-brand-300 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                Open in Maps
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
