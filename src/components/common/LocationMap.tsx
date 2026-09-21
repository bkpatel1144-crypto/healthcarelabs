import { useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { Clock, ExternalLink, Home, MapPin, Navigation, Phone } from 'lucide-react';
import { Container } from '@/components/common/Primitives';
import { SITE_CONFIG } from '@/config/site';
import {
  BRANCHES,
  HEAD_OFFICE,
  branchMapQuery,
  branchTelHref,
  formatBranchPhone,
} from '@/data/branches';
import { cn } from '@/lib/cn';

/**
 * Every collection centre, with the map following whichever one is selected.
 *
 * The lab runs seven centres and the site knew about one. This lists all of
 * them and moves the embedded map to the chosen branch, which is the honest
 * way to do a multi-site map without a Maps API key: the key-less embed takes
 * a single query, so a branch list that drives it beats a map that silently
 * shows only the head office.
 *
 * What each branch is queried with is deliberate. Two of the lab's links
 * carried a latitude and longitude, so those two are pinned exactly. The rest
 * are queried by street address and Google geocodes them, because a guessed
 * coordinate for a place people have to physically find is worse than letting
 * the address resolve. Either way the "Directions" button opens the lab's own
 * published link for that branch, so the visitor lands on the pin the lab
 * chose rather than on whatever the embed resolved.
 *
 * The frame's src is withheld until the band is near the viewport. `loading`
 * alone was not enough — measured on this page, two requests to Google went
 * out while the band was still below the fold.
 */
export function LocationMap() {
  const bandRef = useRef<HTMLDivElement>(null);
  const near = useInView(bandRef, { once: true, margin: '400px' });
  const [activeId, setActiveId] = useState(HEAD_OFFICE.id);
  const active = BRANCHES.find((b) => b.id === activeId) ?? HEAD_OFFICE;

  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    branchMapQuery(active),
  )}&output=embed`;

  return (
    <section aria-labelledby="location-heading" className="relative bg-surface-soft">
      <Container className="py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
            <Navigation className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
            Our centres
          </p>
          <h2
            id="location-heading"
            className="mt-5 text-balance text-[clamp(1.8rem,3.2vw,2.6rem)] font-extrabold leading-[1.1] tracking-editorial text-ink"
          >
            {BRANCHES.length} collection centres across{' '}
            <span className="bg-gradient-to-r from-brand-700 to-mint-600 bg-clip-text text-transparent">
              Surat
            </span>
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-ink-muted">
            Pick a centre to see it on the map. Directions open the lab&rsquo;s own pin for that
            branch.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-4xl bg-white shadow-card ring-1 ring-brand-50">
          <div className="grid lg:grid-cols-12">
            {/* ------------------------- Branch list ------------------------- */}
            <div className="order-2 lg:order-1 lg:col-span-5">
              <ul
                className="max-h-[560px] divide-y divide-brand-50 overflow-y-auto"
                aria-label="Healthcare Labs collection centres"
              >
                {BRANCHES.map((branch) => {
                  const selected = branch.id === active.id;
                  return (
                    <li key={branch.id}>
                      <div
                        className={cn(
                          'relative p-5 transition-colors sm:p-6',
                          selected ? 'bg-brand-50/60' : 'hover:bg-surface-soft',
                        )}
                      >
                        {selected && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-500 to-mint-500"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveId(branch.id)}
                          aria-pressed={selected}
                          className="group block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                        >
                          <span className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                'text-[16px] font-bold tracking-[-0.01em] transition-colors',
                                selected ? 'text-brand-700' : 'text-ink group-hover:text-brand-600',
                              )}
                            >
                              Healthcare Labs {branch.name}
                            </span>
                            {branch.head && (
                              <span className="rounded-full bg-mint-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-mint-600 ring-1 ring-inset ring-mint-100">
                                Main centre
                              </span>
                            )}
                          </span>
                          <span className="mt-1.5 flex gap-2.5 text-[13.5px] leading-relaxed text-ink-muted">
                            <MapPin
                              className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                            {branch.address}
                          </span>
                        </button>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 pl-[26px]">
                          {branch.phones.map((phone) => (
                            <a
                              key={phone}
                              href={branchTelHref(phone)}
                              className="flex items-center gap-1.5 text-[13px] font-semibold tabular-nums text-ink transition-colors hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                            >
                              <Phone className="h-3.5 w-3.5 text-brand-500" strokeWidth={2.2} aria-hidden="true" />
                              {formatBranchPhone(phone)}
                            </a>
                          ))}
                          {branch.landline && (
                            <a
                              href={branchTelHref(branch.landline)}
                              className="text-[13px] tabular-nums text-ink-muted transition-colors hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                            >
                              {branch.landline}
                            </a>
                          )}
                          <a
                            href={branch.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 transition-colors hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                          >
                            Directions
                            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                          </a>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* ------------------------------ Map ------------------------------ */}
            <div
              ref={bandRef}
              className="relative order-1 min-h-[340px] bg-surface-tint lg:order-2 lg:col-span-7 lg:min-h-[560px]"
            >
              {near && (
                <iframe
                  key={active.id}
                  title={`Map showing Healthcare Labs ${active.name} at ${active.address}`}
                  src={embedSrc}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              )}

              {/* Home collection, called out in colour as the lab asked. */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <p className="pointer-events-auto inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-mint-500 to-brand-500 px-4 py-2.5 text-[12.5px] font-bold text-white shadow-[0_16px_34px_-16px_rgba(6,122,104,0.9)]">
                  <Home className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  Home collection across Surat
                </p>
              </div>
            </div>
          </div>

          {/* ------------------------------ Hours ------------------------------ */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-brand-50 px-5 py-4 sm:px-6">
            {SITE_CONFIG.hours.map((h) => (
              <p key={h.days} className="flex items-center gap-2.5 text-[13.5px]">
                <Clock className="h-4 w-4 shrink-0 text-mint-500" strokeWidth={2} aria-hidden="true" />
                <span className="text-ink-muted">{h.days}</span>
                <span className="font-semibold tabular-nums text-ink">{h.time}</span>
              </p>
            ))}
            <p className="ml-auto flex items-center gap-2 text-[12px] text-ink-soft">
              <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
              Map served by Google
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
