import { useState } from 'react';
import { Award, CalendarDays, MapPin, ShieldCheck } from 'lucide-react';
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
 * Two halves that degrade independently: the record on the left is always
 * shown, because the certificate number and ceremony details are known facts.
 * The photographs on the right only appear once `npm run images` has generated
 * them — so the section is meaningful before the photos exist and richer after,
 * and there is never a broken image or an empty grid.
 *
 * The lead photo is given the editorial weight (the certificate handover is the
 * one that actually evidences the claim); the others sit under it as a strip.
 */
export function AccreditationSection() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const photos = ACCREDITATION_PHOTOS;
  const [lead, ...rest] = photos;
  const stacked = photos.length === 0;

  return (
    <section
      id="accreditation"
      aria-labelledby="accreditation-heading"
      className="relative overflow-hidden bg-navy-900 py-20 text-white sm:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-dark [background-size:72px_72px] [mask-image:radial-gradient(ellipse_70%_70%_at_30%_20%,#000,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-1/3 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(21,155,211,0.16),transparent_66%)] blur-2xl"
      />

      <Container className="relative">
        <div
          className={cn(
            'grid gap-14 lg:gap-16',
            // Without photos there is nothing to fill a second column, so the
            // record runs wider instead of leaving a lopsided gap.
            photos.length > 0 ? 'lg:grid-cols-12' : 'lg:grid-cols-1',
          )}
        >
          {/* ---------- The record ---------- */}
          <div className={photos.length > 0 ? 'lg:col-span-5' : 'max-w-3xl'}>
            <Eyebrow tone="dark">Accreditation</Eyebrow>
            <h2
              id="accreditation-heading"
              className="mt-6 text-balance text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-[1.06] tracking-editorial"
            >
              NABL accredited,
              <br />
              <span className="text-brand-400">certificate {ACCREDITATION.certificateNumber}.</span>
            </h2>
            <p className="mt-6 text-pretty text-[16px] leading-relaxed text-slate-300/90">
              Accredited by the {ACCREDITATION.body} ({ACCREDITATION.bodyShort}), a constituent
              board of the {ACCREDITATION.parentBody}, for {ACCREDITATION.scope.toLowerCase()}.
            </p>

            <dl
              className={cn(
                'mt-9 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]',
                photos.length > 0
                  ? 'space-y-px'
                  : 'grid gap-px sm:grid-cols-2 lg:grid-cols-4',
              )}
            >
              <Row Icon={Award} label="Certificate" value={ACCREDITATION.certificateNumber} mono stacked={stacked} />
              <Row Icon={ShieldCheck} label="Scope" value={ACCREDITATION.scope} stacked={stacked} />
              <Row
                Icon={CalendarDays}
                label="Awarded"
                stacked={stacked}
                value={formatDate(ACCREDITATION.ceremony.date, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              />
              <Row Icon={MapPin} label="Ceremony" value={ACCREDITATION.ceremony.venue} stacked={stacked} />
            </dl>

            <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              What that covers
            </p>
            <ul className="mt-3 space-y-2.5">
              {ACCREDITATION.meaning.map((point) => (
                <li key={point} className="flex gap-3 text-[14.5px] leading-relaxed text-slate-300">
                  <span
                    aria-hidden="true"
                    className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brand-400"
                  />
                  {point}
                </li>
              ))}
            </ul>

            <p className="mt-8 border-t border-white/10 pt-6 text-[13.5px] leading-relaxed text-slate-400">
              A copy of the certificate is available from the lab on request.
            </p>
          </div>

          {/* ---------- The evidence ---------- */}
          {photos.length > 0 && (
            <div className="lg:col-span-7">
              <figure>
                <PhotoTile
                  photo={lead}
                  onOpen={() => setLightbox(0)}
                  sizes="(min-width: 1024px) 56vw, 92vw"
                  priority
                  showCaption={false}
                  className="aspect-[4/3] w-full sm:aspect-[16/10]"
                />
                <figcaption className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13.5px]">
                  <span className="font-semibold text-white">{lead.caption}</span>
                  <span className="text-slate-400">
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
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {rest.map((photo, i) => (
                    <li key={photo.id}>
                      <PhotoTile
                        photo={photo}
                        onOpen={() => setLightbox(i + 1)}
                        sizes="(min-width: 1024px) 28vw, 46vw"
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
        />
      )}
    </section>
  );
}

function Row({
  Icon,
  label,
  value,
  mono = false,
  stacked = false,
}: {
  Icon: typeof Award;
  label: string;
  value: string;
  mono?: boolean;
  /** Stack label above value — used when rows sit side by side in a grid. */
  stacked?: boolean;
}) {
  return (
    <div
      className={cn(
        'bg-white/[0.02] px-5 py-4',
        stacked ? 'block' : 'flex items-center justify-between gap-4',
      )}
    >
      <dt className="flex items-center gap-2.5 text-[13.5px] text-slate-400">
        <Icon className="h-4 w-4 shrink-0 text-brand-400" strokeWidth={2} aria-hidden="true" />
        {label}
      </dt>
      <dd
        className={cn(
          'text-[14px] font-semibold text-white',
          stacked ? 'mt-1.5' : 'text-right',
          mono && 'font-mono tabular-nums',
        )}
      >
        {value}
      </dd>
    </div>
  );
}
