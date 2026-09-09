import { useState } from 'react';
import { Cpu } from 'lucide-react';
import { Container, Reveal, SectionHeading } from '@/components/common/Primitives';
import { PhotoTile } from '@/components/common/PhotoTile';
import { PhotoLightbox } from '@/components/common/PhotoLightbox';
import { DEPARTMENTS, INSTRUMENTS } from '@/data/labFacility';
import { LAB_PHOTOS } from '@/data/labPhotos';
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
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(20,196,163,0.16),transparent_68%)] blur-2xl"
      />

      <Container className="relative">
        <SectionHeading
          eyebrow="Inside the laboratory"
                    title={<span id="facility-heading">The equipment behind the report</span>}
          description="Three departments under one roof in Utran, and the analysers each one runs. Named, because a named instrument is a claim you can check."
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

        {/* ---------- Departments ---------- */}
        <ul
          className={cn(
            'grid gap-px overflow-hidden rounded-4xl bg-brand-50 shadow-card',
            hasPhotos ? 'mt-16' : 'mt-14',
            'lg:grid-cols-3',
          )}
        >
          {DEPARTMENTS.map((d, i) => (
            <Reveal
              as="li"
              key={d.id}
              delay={i}
              className="bg-white p-7 transition-colors duration-300 hover:bg-surface-soft sm:p-8"
            >
              <p className="font-mono text-[12px] tabular-nums text-brand-500">
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-4 text-[20px] font-bold tracking-[-0.02em] text-ink">{d.name}</h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">{d.description}</p>
            </Reveal>
          ))}
        </ul>

        {/* ---------- Instruments ---------- */}
        <div className="mt-14">
          <h3 className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft">
            <Cpu className="h-4 w-4 text-brand-500" strokeWidth={2.2} aria-hidden="true" />
            Installed analysers
          </h3>

          <ul className="mt-5 divide-y divide-brand-50 border-y border-brand-50">
            {INSTRUMENTS.map((inst, i) => (
              <Reveal
                as="li"
                key={`${inst.make}-${inst.model}`}
                delay={i}
                className="grid gap-x-8 gap-y-3 py-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:items-baseline"
              >
                <div>
                  <p className="text-[17px] font-bold leading-tight tracking-[-0.02em] text-ink">
                    {inst.make} <span className="text-brand-600">{inst.model}</span>
                  </p>
                  <p className="mt-1.5 text-[13px] text-ink-muted">{inst.role}</p>
                  <p className="mt-1 text-[11.5px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                    {inst.department}
                  </p>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {inst.covers.map((c) => (
                    <li
                      key={c}
                      className="rounded-lg bg-white px-2.5 py-1.5 text-[12.5px] text-ink-muted shadow-soft ring-1 ring-brand-50"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </ul>

          <p className="mt-7 max-w-2xl text-[13px] leading-relaxed text-ink-soft">
            Instrument capability, not test routing — which analyser handles a given sample is
            decided by the lab on the day. Ask the lab if you need to know the method used for a
            specific parameter.
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
