import { useState } from 'react';
import { BadgeCheck, CalendarDays, MapPin, ShieldCheck } from 'lucide-react';
import { Container, Eyebrow } from '@/components/common/Primitives';
import { PhotoLightbox } from '@/components/common/PhotoLightbox';
import { PhotoTile } from '@/components/common/PhotoTile';
import { ACCREDITATION } from '@/data/accreditation';
import { ACCREDITATION_PHOTOS } from '@/data/accreditationPhotos';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';

/**
 * The accreditation section.
 *
 * What was here before was a document: a heading, a paragraph, a three-row
 * label-and-value table, a bulleted list and a footnote, stacked down the left
 * of an oversized photograph. The strongest facts a diagnostics lab has — the
 * standard it was assessed against, the date, the awarding body — were being
 * rendered as a form, and the credential itself had no visual presence at all
 * on a page claiming it.
 *
 * Three changes:
 *
 *   1. The credential is a card, not a table. One saturated panel carrying the
 *      mark, the body, the scope and the ceremony, which is the anchor the
 *      section never had.
 *   2. What accreditation covers becomes three cards stacked under the
 *      credential, so it reads as three things rather than as more prose, and
 *      so that column fills rather than leaving the card stretched against the
 *      photographs with empty gradient under it.
 *   3. The photographs stop being a wall. The handover shot still leads,
 *      because it is the one that actually evidences the claim, but at a size
 *      that sits beside the credential rather than dwarfing it.
 *
 * Hierarchy on the credential card comes from size and weight rather than
 * opacity. On that gradient even white at 90% blends to 4.19:1 against the
 * brand-600 stop and 75% to 3.40:1, so anything under 24px has to be fully
 * opaque to clear 4.5:1.
 *
 * Both halves still degrade independently: the record is always shown, because
 * those are known facts, and the photographs appear only once `npm run images`
 * has generated them. There is never a broken image or an empty grid.
 */
export function AccreditationSection() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const photos = ACCREDITATION_PHOTOS;
  const [lead, ...rest] = photos;
  const hasPhotos = photos.length > 0;

  const awarded = formatDate(ACCREDITATION.ceremony.date, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <section
      id="accreditation"
      aria-labelledby="accreditation-heading"
      className="relative overflow-hidden bg-white py-20 sm:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-light [background-size:72px_72px] [mask-image:radial-gradient(ellipse_70%_70%_at_30%_10%,#000,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-1/4 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(20,196,163,0.18),transparent_66%)]"
      />

      <Container className="relative">
        {/* ------------------------------ Heading ------------------------------ */}
        <div className="max-w-3xl">
          <Eyebrow>Accreditation</Eyebrow>
          <h2
            id="accreditation-heading"
            className="mt-6 text-balance text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-[1.06] tracking-editorial text-ink"
          >
            NABL accredited,
            <br />
            <span className="bg-gradient-to-r from-brand-700 to-mint-600 bg-clip-text text-transparent">
              {ACCREDITATION.scope.toLowerCase()}.
            </span>
          </h2>
          <p className="mt-6 text-pretty text-[16px] leading-relaxed text-ink-muted">
            Accredited by the {ACCREDITATION.body} ({ACCREDITATION.bodyShort}), a constituent board
            of the {ACCREDITATION.parentBody}, for {ACCREDITATION.scope.toLowerCase()}.
          </p>
        </div>

        <div className={cn('mt-12 grid gap-6', hasPhotos && 'lg:grid-cols-12')}>
          {/* --------------------------- The credential --------------------------- */}
          <div className={hasPhotos ? 'lg:col-span-4' : ''}>
            <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-700 via-brand-600 to-mint-600 p-7 text-white shadow-card sm:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-grid-dark [background-size:40px_40px] opacity-40"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10"
              />

              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/25 backdrop-blur-sm">
                <BadgeCheck className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
              </span>

              <p className="relative mt-6 text-[34px] font-extrabold leading-none tracking-tightest">
                {ACCREDITATION.bodyShort}
              </p>
              <p className="relative mt-2 text-[15px] font-semibold text-white">
                {ACCREDITATION.scope}
              </p>

              <dl className="relative mt-7 space-y-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-inset ring-white/15">
                <Fact Icon={ShieldCheck} label="Scope" value={ACCREDITATION.scope} />
                <Fact Icon={CalendarDays} label="Awarded" value={awarded} />
                <Fact Icon={MapPin} label="Ceremony" value={ACCREDITATION.ceremony.venue} />
              </dl>

              <p className="relative mt-6 text-[12.5px] leading-relaxed text-white">
                A copy of the certificate is available from the lab on request.
              </p>
            </div>

            {/*
              These sit under the credential rather than in a full-width row
              beneath both columns. As a list under a table they were the
              fourth stacked text block in an already deep column; as a row of
              their own they left the credential card stretching to match the
              photographs beside it with about 450px of empty gradient under
              its content. Here they fill that column and the two sides come
              out level.
            */}
            <div className="mt-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft">
                What that covers
              </p>
              <ul className="mt-4 space-y-3">
                {ACCREDITATION.meaning.map((point, i) => (
                  <li
                    key={point}
                    className="flex gap-4 rounded-2xl bg-surface-soft p-5 ring-1 ring-inset ring-brand-50 transition-all duration-300 ease-premium hover:bg-white hover:shadow-card hover:ring-brand-200"
                  >
                    <span className="font-mono text-[12px] tabular-nums text-brand-500">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-[14px] leading-relaxed text-ink">{point}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ---------------------------- The evidence ---------------------------- */}
          {hasPhotos && (
            <div className="lg:col-span-8">
              <figure>
                <PhotoTile
                  photo={lead}
                  onOpen={() => setLightbox(0)}
                  sizes="(min-width: 1024px) 62vw, 92vw"
                  priority
                  showCaption={false}
                  className="aspect-[16/10] w-full"
                />
                <figcaption className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13.5px]">
                  <span className="font-semibold text-ink">{lead.caption}</span>
                  <span className="text-ink-soft">
                    {ACCREDITATION.ceremony.venue} ·{' '}
                    {formatDate(ACCREDITATION.ceremony.date, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </figcaption>
              </figure>

              {rest.length > 0 && (
                <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                  {rest.map((photo, i) => (
                    <li key={photo.id}>
                      <PhotoTile
                        photo={photo}
                        onOpen={() => setLightbox(i + 1)}
                        sizes="(min-width: 1024px) 31vw, 46vw"
                        className="aspect-[3/2] w-full"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

      </Container>

      {lightbox !== null && (
        <PhotoLightbox
          photos={photos}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndexChange={setLightbox}
          noun="Photograph"
        />
      )}
    </section>
  );
}

/** One line of the credential record, on the tinted panel inside the card. */
function Fact({
  Icon,
  label,
  value,
}: {
  Icon: typeof ShieldCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 bg-white/5 px-4 py-3">
      <dt className="flex items-center gap-2 text-[12.5px] text-white">
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
        {label}
      </dt>
      <dd className="text-right text-[13px] font-semibold text-white">{value}</dd>
    </div>
  );
}
