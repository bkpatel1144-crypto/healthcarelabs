import { useState } from 'react';
import { ArrowUpRight, Cpu, FlaskConical } from 'lucide-react';
import { Container, Reveal } from '@/components/common/Primitives';
import { PhotoTile } from '@/components/common/PhotoTile';
import { InstrumentArt } from '@/components/common/InstrumentArt';
import { PhotoLightbox } from '@/components/common/PhotoLightbox';
import { ANALYSER_COUNT, INSTRUMENTS, INSTRUMENTS_BY_DEPARTMENT } from '@/data/labFacility';
import type { Instrument } from '@/data/labFacility';
import { LAB_PHOTOS } from '@/data/labPhotos';
import { INSTRUMENT_PHOTOS } from '@/data/instrumentPhotos';
import { cn } from '@/lib/cn';

/**
 * "Inside the laboratory" — the facility, its departments and the instruments
 * installed in it.
 *
 * Eighteen entries used to sit in a uniform three-column grid of white cards,
 * every tile the same size and weight, under seven repeated department
 * headings. It read as a spec table wearing card costumes. What fixed that was
 * not colour — a dark treatment was tried and rejected — it was structure:
 *
 *   1. An asymmetric grid. The first instrument in each department takes a
 *      wide landscape tile with its render beside the text; the rest stack the
 *      render above it. Unequal tiles give the eye somewhere to land and an
 *      order to travel in, which a grid of identical cards never does.
 *   2. One sticky rail instead of seven repeated headings. The department list
 *      moves to the side and holds while the instruments scroll past it, which
 *      is what turns documentation into a tour. Note that this section carries
 *      no overflow-hidden: the decorative glows are clipped by their own layer,
 *      because overflow:hidden on an ancestor silently disables sticky and had
 *      this rail sitting 2025px above the viewport when it was there.
 *   3. A figures strip, so the breadth registers as a number before it is a
 *      list of eighteen names.
 *
 * Everything the section claimed before, it still claims: named instruments, a
 * plain sentence per machine, method and sample, and no throughput, turnaround
 * or accuracy figure anywhere.
 */
export function LabFacility() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const photos = LAB_PHOTOS;
  const hasPhotos = photos.length > 0;
  const [lead, ...rest] = photos;

  return (
    <section
      id="inside-the-lab"
      aria-labelledby="facility-heading"
      /*
        No overflow-hidden here. The glows need clipping, but overflow:hidden on
        an ancestor silently disables position: sticky, so the clipping lives on
        the decoration layer below instead.
      */
      className="relative bg-surface-soft py-20 sm:py-28"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Ground: a faint grid and two cool glows. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-light [background-size:72px_72px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_8%,#000,transparent_76%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/3 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(53,199,244,0.18),transparent_66%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-10 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(20,196,163,0.16),transparent_68%)]"
      />
      </div>

      <Container className="relative">
        {/* ------------------------------ Heading ------------------------------ */}
        <div className="max-w-3xl">
          <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
            <Cpu className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
            Inside the laboratory
          </p>
          <h2
            id="facility-heading"
            className="mt-5 text-balance text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.06] tracking-editorial text-ink"
          >
            The equipment behind
            <br />
            <span className="bg-gradient-to-r from-brand-700 via-brand-600 to-mint-600 bg-clip-text text-transparent">
              every report we release.
            </span>
          </h2>
          <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-ink-muted">
            {INSTRUMENTS_BY_DEPARTMENT.length} departments under one roof in Utran, and the
            instruments each one runs. Named, because a named instrument is a claim you can check.
          </p>
        </div>

        {/* ------------------------------- Figures ------------------------------ */}
        <dl className="mt-12 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-3xl bg-brand-100 shadow-card sm:grid-cols-3">
          {[
            { value: ANALYSER_COUNT, label: 'Named analysers' },
            { value: INSTRUMENTS.length - ANALYSER_COUNT, label: 'Procedures performed here' },
            { value: INSTRUMENTS_BY_DEPARTMENT.length, label: 'Departments on one site' },
          ].map((f) => (
            <div key={f.label} className="bg-white px-6 py-5">
              <dt className="sr-only">{f.label}</dt>
              <dd>
                <span className="block text-[32px] font-extrabold leading-none tracking-tightest tabular-nums text-ink">
                  {f.value}
                </span>
                <span className="mt-2 block text-[12.5px] leading-snug text-ink-soft">
                  {f.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        {/* ----------------------------- Photographs ---------------------------- */}
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
                        className={cn('aspect-[4/3]', wide && 'lg:aspect-[8/3]')}
                      />
                    </Reveal>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* ----------------------------- Instruments ---------------------------- */}
        <div className="mt-20 grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/*
            The department rail. Seven repeated headings above seven grids is
            what made this read as documentation; one list that stays put while
            the instruments scroll past it reads as a tour instead.
          */}
          <nav aria-label="Departments" className="lg:col-span-3">
            <div className="lg:sticky lg:top-28">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft">
                Departments
              </p>
              <ul className="mt-5 space-y-1">
                {INSTRUMENTS_BY_DEPARTMENT.map(({ department, instruments }, i) => (
                  <li key={department.id}>
                    <a
                      href={`#dept-${department.id}`}
                      className="group flex items-baseline gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                    >
                      <span className="font-mono text-[11px] tabular-nums text-ink-soft transition-colors group-hover:text-brand-600">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1 text-[14px] font-semibold leading-snug text-ink-muted transition-colors group-hover:text-ink">
                        {department.name}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-ink-soft">
                        {instruments.length}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="space-y-14 lg:col-span-9">
            {INSTRUMENTS_BY_DEPARTMENT.map(({ department, instruments }) => (
              <section
                key={department.id}
                id={`dept-${department.id}`}
                aria-labelledby={`dept-${department.id}-heading`}
                className="scroll-mt-28"
              >
                <div className="border-b border-brand-100 pb-4">
                  <h4
                    id={`dept-${department.id}-heading`}
                    className="text-[20px] font-bold tracking-editorial text-ink"
                  >
                    {department.name}
                  </h4>
                  <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
                    {department.description}
                  </p>
                </div>

                {/*
                  Unequal tiles. The first instrument takes a landscape tile
                  with its render beside the text; the rest stack the render
                  above it. A department of one gets the wide tile to itself,
                  which is better than a lone narrow card in a dead row.
                */}
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {instruments.map((inst, i) => (
                    <Reveal
                      as="li"
                      key={inst.model}
                      delay={i % 2}
                      className={cn(i === 0 && 'sm:col-span-2')}
                    >
                      <InstrumentCard instrument={inst} wide={i === 0} />
                    </Reveal>
                  ))}
                </ul>
              </section>
            ))}

            <p className="max-w-2xl border-t border-brand-100 pt-6 text-[13px] leading-relaxed text-ink-soft">
              This is what the lab has, not which machine runs your sample — that is decided on the
              day, and more than one of these can do the same test. If the method matters for a
              particular result, ask the lab and they will tell you which was used.
            </p>
          </div>
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
 * The generated render for this instrument class, where one exists.
 *
 * These are images of the *class* of instrument — not photographs of this
 * lab's bench, and not manufacturer product shots, which are copyrighted and
 * would put the liability on the lab. The drawn SVG stays as the fallback so a
 * missing render degrades to a diagram rather than to a hole.
 */
const renderFor = (instrument: Instrument) =>
  INSTRUMENT_PHOTOS.find((p) => p.id === instrument.art);

function InstrumentCard({ instrument, wide }: { instrument: Instrument; wide: boolean }) {
  const photo = renderFor(instrument);
  const isProcedure = instrument.kind === 'procedure';
  const sizes = wide
    ? '(min-width: 1024px) 34vw, (min-width: 640px) 46vw, 92vw'
    : '(min-width: 1024px) 24vw, (min-width: 640px) 44vw, 92vw';

  return (
    <article
      className={cn(
        'group relative flex h-full overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-brand-50',
        'transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-liftLg hover:ring-brand-200',
        wide ? 'flex-col sm:flex-row' : 'flex-col',
      )}
    >
      {/* An accent that draws in along the top edge on hover. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-10 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-brand-500 to-mint-500 transition-transform duration-500 ease-premium group-hover:scale-x-100"
      />

      {/*
        The plate carries a faint tint rather than plain white. The renders are
        white machines on white, so on a white card they would float with
        nothing framing them.
      */}
      <div
        className={cn(
          'relative shrink-0 overflow-hidden bg-gradient-to-br from-surface-soft via-white to-surface-tint',
          wide ? 'aspect-[16/9] sm:aspect-auto sm:w-[44%]' : 'aspect-[16/9]',
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
              className="h-full w-full object-contain transition-transform duration-500 ease-premium group-hover:scale-[1.05]"
            />
          </picture>
        ) : (
          <InstrumentArt art={instrument.art} className="absolute inset-0 h-full w-full p-3" />
        )}
      </div>

      <div className={cn('flex min-w-0 flex-1 flex-col p-5', wide && 'sm:p-6')}>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ring-1 ring-inset',
              isProcedure
                ? 'bg-mint-50 text-mint-700 ring-mint-200'
                : 'bg-brand-50 text-brand-700 ring-brand-200',
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

        <h5
          className={cn(
            'mt-3 text-balance font-bold leading-snug tracking-[-0.02em] text-ink',
            wide ? 'text-[19px]' : 'text-[16px]',
          )}
        >
          {instrument.make && <span className="text-ink-muted">{instrument.make} </span>}
          {instrument.model}
        </h5>
        <p className="mt-1.5 text-[12.5px] leading-snug text-brand-600">{instrument.role}</p>

        <p
          className={cn(
            'mt-3 leading-relaxed text-ink',
            wide ? 'max-w-xl text-[14px]' : 'text-[13px]',
          )}
        >
          {instrument.plain}
        </p>

        <dl className="mt-4 space-y-1.5 border-t border-brand-50 pt-3.5">
          <div className="grid grid-cols-[58px_1fr] gap-x-3">
            <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-600">
              Method
            </dt>
            <dd className="text-[11.5px] leading-snug text-ink-muted">{instrument.method}</dd>
          </div>
          <div className="grid grid-cols-[58px_1fr] gap-x-3">
            <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-600">
              Sample
            </dt>
            <dd className="text-[11.5px] leading-snug text-ink-muted">{instrument.sample}</dd>
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

      <ArrowUpRight
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-4 h-4 w-4 text-brand-500 opacity-0 transition-all duration-300 group-hover:opacity-100"
        strokeWidth={2.4}
      />
    </article>
  );
}
