import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Expand, Newspaper } from 'lucide-react';
import { Container, Reveal, SectionHeading } from '@/components/common/Primitives';
import { PhotoLightbox } from '@/components/common/PhotoLightbox';
import { HEALTH_REPORT_IMAGES } from '@/data/healthReportImages';
import { HEALTH_REPORT_NOTES } from '@/data/healthReports';
import type { SitePhoto } from '@/types';

/**
 * The lab's long-form health features.
 *
 * These are full newspaper-style pages in Gujarati — columns of body copy, a
 * pull-quote panel, an expert byline at the foot. They are not the square
 * social artwork that closes the About page, so they do not go in that grid:
 * filing a printed feature under "From our Instagram" would be mislabelling it,
 * and the section's Instagram call to action would be wrong for them.
 *
 * The layout is a magazine index rather than a poster grid, and that is the
 * point. Three 3:4 pages in a three-up grid with a five-item contents list
 * under each would run to a very tall card that nobody reads; as rows, the page
 * sits beside what it covers at a size that suits a thumbnail, and the same
 * markup stacks on a phone without changing.
 *
 * As with the posters, the page opens full size rather than linking away — the
 * text on it is the content and it is unreadable at thumbnail width. The
 * English note beside each one summarises what the feature says; it is never a
 * rewrite presented as the lab's own wording.
 */
export function HealthReports() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const reports = HEALTH_REPORT_IMAGES;
  if (reports.length === 0) return null;

  return (
    <section aria-labelledby="health-reports-heading" className="bg-white py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Health reports"
          title={<span id="health-reports-heading">Longer reads, in Gujarati</span>}
          description="Full-page health features the lab publishes for patients in Surat, reproduced here as they went out. Each one has an English summary beside it — open a page to read it at full size."
        />

        <ul className="mt-12 space-y-6">
          {reports.map((report, i) => {
            const note = HEALTH_REPORT_NOTES[report.id];
            return (
              <Reveal
                as="li"
                key={report.id}
                delay={i}
                className="group grid gap-6 overflow-hidden rounded-3xl bg-white p-5 shadow-card ring-1 ring-brand-50 transition-shadow duration-300 hover:shadow-lift sm:grid-cols-[168px_1fr] sm:gap-7 sm:p-6 lg:grid-cols-[208px_1fr]"
              >
                <ReportPage
                  report={report}
                  label={note?.title}
                  onOpen={() => setLightbox(i)}
                />

                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-600">
                    <Newspaper className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
                    {note?.topic ?? 'Health report'}
                  </p>

                  <h3 className="mt-3 text-balance text-[19px] font-bold leading-snug tracking-[-0.015em] text-ink sm:text-[21px]">
                    {note?.title ?? report.caption}
                  </h3>

                  {note?.summary && (
                    <p className="mt-3 text-pretty text-[14.5px] leading-relaxed text-ink-muted">
                      {note.summary}
                    </p>
                  )}

                  {note?.covers && note.covers.length > 0 && (
                    <>
                      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-soft">
                        What it covers
                      </p>
                      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {note.covers.map((point) => (
                          <li key={point} className="flex gap-2.5">
                            <Check
                              className="mt-[3px] h-3.5 w-3.5 shrink-0 text-mint-600"
                              strokeWidth={2.6}
                              aria-hidden="true"
                            />
                            <span className="text-[13.5px] leading-snug text-ink">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {note?.related && (
                    <Link
                      to={note.related.href}
                      className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-brand-600 transition-colors hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                    >
                      {note.related.label}
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                        strokeWidth={2.4}
                        aria-hidden="true"
                      />
                    </Link>
                  )}
                </div>
              </Reveal>
            );
          })}
        </ul>
      </Container>

      {lightbox !== null && (
        <PhotoLightbox
          photos={reports}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndexChange={setLightbox}
          noun="Health report"
        />
      )}
    </section>
  );
}

/**
 * The page thumbnail.
 *
 * No scrim and no caption across it, for the same reason the posters have none:
 * anything laid over the artwork sits on top of the feature's own headline.
 * The expand affordance sits in the corner instead.
 */
function ReportPage({
  report,
  label,
  onOpen,
}: {
  report: SitePhoto;
  label?: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open the full page: ${label ?? report.caption}`}
      className="relative block w-full max-w-[220px] overflow-hidden rounded-2xl bg-brand-50 ring-1 ring-ink-line/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:max-w-none"
    >
      <picture>
        <source type="image/avif" srcSet={report.avif} sizes="(min-width: 1024px) 208px, (min-width: 640px) 168px, 220px" />
        <source type="image/webp" srcSet={report.webp} sizes="(min-width: 1024px) 208px, (min-width: 640px) 168px, 220px" />
        <img
          src={report.src}
          srcSet={report.jpeg}
          sizes="(min-width: 1024px) 208px, (min-width: 640px) 168px, 220px"
          alt={report.alt}
          width={report.width}
          height={report.height}
          loading="lazy"
          decoding="async"
          className="w-full transition-transform duration-500 ease-premium group-hover:scale-[1.03]"
        />
      </picture>

      <span
        aria-hidden="true"
        className="glass-flat-dark absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        <Expand className="h-3.5 w-3.5" strokeWidth={2.2} />
      </span>
    </button>
  );
}
