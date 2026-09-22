import { useState } from 'react';
import { Cpu, FlaskConical } from 'lucide-react';
import { Container, Reveal, SectionHeading } from '@/components/common/Primitives';
import { PhotoTile } from '@/components/common/PhotoTile';
import { InstrumentArt } from '@/components/common/InstrumentArt';
import { PhotoLightbox } from '@/components/common/PhotoLightbox';
import { ANALYSER_COUNT, INSTRUMENTS_BY_DEPARTMENT } from '@/data/labFacility';
import type { Instrument } from '@/data/labFacility';
import { LAB_PHOTOS } from '@/data/labPhotos';
import { INSTRUMENT_PHOTOS } from '@/data/instrumentPhotos';
import { cn } from '@/lib/cn';

/**
 * "Inside the laboratory" — the facility, its departments and the analysers
 * actually installed in it.
 *
 * This is the section that replaces generic "advanced technology" copy with
 * something checkable: named instruments, named departments, and photographs of
 * both. Naming the analyser is the whole point — anyone in the field can weigh
 * an AU480 or a D-10, and a claim that specific is a claim you can stand behind.
 *
 * The instrument table always renders; the photographs appear once
 * `npm run images` has processed them, and the layout adapts either way.
 */
export function LabFacility() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const photos = LAB_PHOTOS;
  const hasPhotos = photos.length > 0;

  // Lead photo gets the wide slot; the rest tile beneath it.
  const [lead, ...rest] = photos;

  return (
    <section
      id="inside-the-lab"
      aria-labelledby="facility-heading"
      className="relative overflow-hidden bg-surface-soft py-20 sm:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-light [background-size:76px_76px] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_15%,#000,transparent_78%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(20,196,163,0.16),transparent_68%)]"
      />

      <Container className="relative">
        <SectionHeading
          eyebrow="Inside the laboratory"
                    title={<span id="facility-heading">The equipment behind the report</span>}
          description={`${INSTRUMENTS_BY_DEPARTMENT.length} departments under one roof in Utran, and the analysers each one runs. Named, because a named instrument is a claim you can check.`}
        />

        {/* ---------- Photographs ---------- */}
        {hasPhotos && (
          <div className="mt-14">
            <PhotoTile
              photo={lead}
              onOpen={() => setLightbox(0)}
              sizes="(min-width: 1024px) 88vw, 92vw"
              priority
              showTag
              className="aspect-[16/10] sm:aspect-[2/1] lg:aspect-[5/2]"
            />

            {/*
              Four columns with the last tile spanning two: with seven remaining
              photos a three-column grid left one stranded alone on a third row,
              which reads as a mistake rather than as a layout.
            */}
            {rest.length > 0 && (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {rest.map((photo, i) => {
                  const wide = i === rest.length - 1 && rest.length % 4 !== 0;
                  return (
                    <Reveal as="li" key={photo.id} delay={i % 4} className={cn(wide && 'lg:col-span-2')}>
                      <PhotoTile
                        photo={photo}
                        onOpen={() => setLightbox(i + 1)}
                        sizes={
                          wide
                            ? '(min-width: 1024px) 46vw, (min-width: 640px) 46vw, 92vw'
                            : '(min-width: 1024px) 23vw, (min-width: 640px) 46vw, 92vw'
                        }
                        showTag
                        // A two-column tile needs a proportionally wider ratio,
                        // or it stands twice as tall as the tiles beside it.
                        className={cn('aspect-[4/3]', wide && 'lg:aspect-[8/3]')}
                      />
                    </Reveal>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* ---------- Instruments ---------- */}
        {/*
          Eighteen entries grouped under the department that runs them.

          As one flat grid this was four cards; at eighteen it would be a wall
          of identical tiles with no way in. Grouping gives a reader the same
          route a sample takes, and it is the grouping that makes the breadth
          legible — four chemistry analysers under one heading says something a
          list of eighteen names does not.

          Every card carries the same plate rather than a photograph, and that
          is deliberate. Manufacturer product shots are copyrighted and putting
          them on a commercial site would hand the lab the risk; a photograph of
          the lab's own machine is both lawful and better evidence, and drops
          into this exact slot through `photoId` — two of them already do.
          Mixing a handful of real photographs with fourteen blanks would look
          half-finished, which is the opposite of what was asked for, so the
          plate is used consistently until a full set of photographs exists.
        */}
        <div className={hasPhotos ? 'mt-16' : 'mt-14'}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h3 className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft">
              <Cpu className="h-4 w-4 text-brand-500" strokeWidth={2.2} aria-hidden="true" />
              Installed analysers and procedures
            </h3>
            <p className="text-[12.5px] tabular-nums text-ink-soft">
              {ANALYSER_COUNT} named instruments across {INSTRUMENTS_BY_DEPARTMENT.length}{' '}
              departments
            </p>
          </div>

          <div className="mt-8 space-y-12">
            {INSTRUMENTS_BY_DEPARTMENT.map(({ department, instruments }) => (
              <section key={department.id} aria-labelledby={`dept-${department.id}`}>
                {/*
                  The department's description lives here rather than in a
                  separate grid above. It used to have one, which was fine for
                  three departments and became a duplicate set of headings at
                  seven — and seven cards do not divide into three columns
                  without leaving a hole.
                */}
                <div className="border-b border-brand-50 pb-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <h4
                      id={`dept-${department.id}`}
                      className="text-[19px] font-bold tracking-[-0.02em] text-ink"
                    >
                      {department.name}
                    </h4>
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold tabular-nums text-brand-700">
                      {instruments.length}
                    </span>
                  </div>
                  <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-muted">
                    {department.description}
                  </p>
                </div>

                <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {instruments.map((inst, i) => (
                    <Reveal as="li" key={inst.model} delay={i % 3}>
                      <InstrumentCard instrument={inst} />
                    </Reveal>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <p className="mt-9 max-w-2xl text-[13px] leading-relaxed text-ink-soft">
            This is what the lab has, not which machine runs your sample — that is decided on
            the day, and more than one of these can do the same test. If the method matters for a
            particular result, ask the lab and they will tell you which was used.
          </p>
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

/* -------------------------------------------------------- Instrument card */

/**
 * Every instrument has a render, so the cards show renders.
 *
 * These are generated images of the *class* of instrument, not photographs of
 * this lab's machines and not manufacturer product shots — the latter are
 * copyrighted, and using them would put the liability on the lab. They are
 * consistent by construction: one prompt style, flat white, no text, no logos,
 * nothing fetched from a third party at runtime.
 *
 * The drawn SVGs remain as the fallback. If a render is ever missing for an
 * entry, that card falls back to its drawing rather than to a hole, so the
 * section cannot end up half-rendered.
 */
const renderFor = (instrument: Instrument) =>
  INSTRUMENT_PHOTOS.find((p) => p.id === instrument.art);

/**
 * One card per instrument or procedure, identical in shape whichever it is, so
 * eighteen of them read as a set rather than as a pile.
 *
 * Where the lab has photographed its own machine, `photoId` names it and the
 * photograph fills the plate. Everything else gets the same tinted plate with
 * the maker's initials — not a placeholder for a manufacturer image we cannot
 * licence, but a treatment that holds on its own until the lab sends its own
 * photographs.
 */
function InstrumentCard({ instrument }: { instrument: Instrument }) {
  const photo = renderFor(instrument);
  const isProcedure = instrument.kind === 'procedure';
  const sizes = '(min-width: 1280px) 30vw, (min-width: 640px) 46vw, 92vw';

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-brand-50 transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-liftLg hover:ring-brand-200">
      <div
        className={cn(
          'relative aspect-[16/9] overflow-hidden',
          photo ? 'bg-white' : 'bg-gradient-to-br from-brand-50 via-surface-soft to-surface-tint',
        )}
      >
        {photo ? (
          <picture>
            <source type="image/avif" srcSet={photo.avif} sizes={sizes} />
            <source type="image/webp" srcSet={photo.webp} sizes={sizes} />
            <img
              src={photo.src}
              srcSet={photo.jpeg}
              sizes={sizes}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain transition-transform duration-500 ease-premium group-hover:scale-[1.04]"
            />
          </picture>
        ) : (
          <>
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-grid-light [background-size:24px_24px] opacity-60"
            />
            <span
              aria-hidden="true"
              className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(53,199,244,0.20),transparent_70%)]"
            />
            <InstrumentArt
              art={instrument.art}
              className="absolute inset-0 h-full w-full p-3 transition-transform duration-500 ease-premium group-hover:scale-[1.04]"
            />
          </>
        )}

        <span
          className={cn(
            'absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ring-1 ring-inset',
            isProcedure
              ? 'bg-mint-50 text-mint-700 ring-mint-200'
              : 'bg-white/90 text-brand-700 ring-brand-100',
          )}
        >
          {isProcedure ? (
            <FlaskConical className="h-3 w-3" strokeWidth={2.4} aria-hidden="true" />
          ) : (
            <Cpu className="h-3 w-3" strokeWidth={2.4} aria-hidden="true" />
          )}
          {isProcedure ? 'Procedure' : 'Analyser'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h5 className="text-balance text-[15.5px] font-bold leading-snug tracking-[-0.02em] text-ink">
          {instrument.make && <span className="text-ink-muted">{instrument.make} </span>}
          <span className="text-brand-700">{instrument.model}</span>
        </h5>
        <p className="mt-1.5 text-[12.5px] leading-snug text-ink-muted">{instrument.role}</p>

        {/*
          What the machine does, for the person whose sample is in it.

          The card used to carry a name, a one-line role and a row of chips,
          which told a visitor what the machine was called and nothing about
          why it mattered to them. "Chemiluminescent immunoassay on
          paramagnetic particles" is the right answer for a referring doctor
          and no answer at all for a patient, so the plain sentence leads and
          the technical pair sits under it for whoever wants it.

          What is deliberately absent is throughput, turnaround and accuracy.
          Those describe how this lab runs rather than what the machine is, and
          the site does not print a figure it cannot evidence.
        */}
        <p className="mt-3 text-[13px] leading-relaxed text-ink">{instrument.plain}</p>

        <dl className="mt-4 space-y-1.5 border-t border-brand-50 pt-3.5">
          <div className="grid grid-cols-[58px_1fr] gap-x-3">
            <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand-600">
              Method
            </dt>
            <dd className="text-[11.5px] leading-snug text-ink-soft">{instrument.method}</dd>
          </div>
          <div className="grid grid-cols-[58px_1fr] gap-x-3">
            <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand-600">
              Sample
            </dt>
            <dd className="text-[11.5px] leading-snug text-ink-soft">{instrument.sample}</dd>
          </div>
        </dl>

        <ul className="mt-auto flex flex-wrap gap-1.5 pt-4">
          {instrument.covers.map((c) => (
            <li
              key={c}
              className="rounded-lg bg-surface-soft px-2 py-1 text-[11.5px] leading-snug text-ink-muted ring-1 ring-inset ring-brand-50"
            >
              {c}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

