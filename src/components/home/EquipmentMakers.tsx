import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useInView } from 'framer-motion';
import { Container, Eyebrow } from '@/components/common/Primitives';
import { INSTRUMENTS } from '@/data/labFacility';
import { LAB_PHOTOS } from '@/data/labPhotos';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';

/**
 * The manufacturers behind the lab's instruments, at the foot of the homepage.
 *
 * A photograph of the lab's own biochemistry department sits beside a band of
 * plates, one per manufacturer, each carrying that company's logo (supplied by
 * the client, in public/media/makers/), its name and the models the lab runs.
 * The logos identify whose equipment is in use; the copy does not claim any
 * partnership or endorsement, and should not start to.
 *
 * Every make and model is read from INSTRUMENTS, the same data the facility
 * section renders, so the two cannot drift apart and nothing here is retyped
 * by hand. A make without an entry in MAKER_LOGOS falls back to its name in
 * the tile rather than an empty box.
 *
 * The plates scroll right to left, which is the shape the client asked for.
 * The animation is the same CSS keyframe the ribbon at the top of the page
 * uses, so it runs on the compositor rather than the main thread, and it stops
 * outright when the band is off screen instead of composing frames nobody is
 * looking at. Reduced motion gets a row the reader scrolls themselves.
 */

/**
 * Logo per make, keyed by the exact `make` string in INSTRUMENTS. Trimmed of
 * their white margins and saved as WebP so they all sit at the same scale.
 */
const MAKER_LOGOS: Record<string, string> = {
  'Beckman Coulter': '/media/makers/beckman-coulter.webp',
  'Ortho Clinical Diagnostics': '/media/makers/ortho-clinical-diagnostics.webp',
  'Bio-Rad': '/media/makers/bio-rad.webp',
  Mindray: '/media/makers/mindray.webp',
  Snibe: '/media/makers/snibe.webp',
  Meril: '/media/makers/meril.webp',
  'Tulip Diagnostics': '/media/makers/tulip-diagnostics.webp',
  'Thermo Fisher Scientific': '/media/makers/thermo-fisher-scientific.webp',
};

/** Makes the lab runs, each with its models, in catalogue order. */
const MAKERS = (() => {
  const byMake = new Map<string, string[]>();
  for (const instrument of INSTRUMENTS) {
    if (!instrument.make) continue;
    const models = byMake.get(instrument.make) ?? [];
    if (!models.includes(instrument.model)) models.push(instrument.model);
    byMake.set(instrument.make, models);
  }
  return [...byMake.entries()].map(([make, models]) => ({ make, models }));
})();

/*
  Twelve of the eighteen instruments carry a manufacturer; the other six are
  named by model alone, because the lab's own list did not attribute them and
  this site does not guess. The lede says twelve rather than eighteen for that
  reason — an earlier draft said "8 manufacturers, 18 instruments", which
  quietly credited all eighteen to these eight companies.
*/
const ATTRIBUTED = MAKERS.reduce((total, maker) => total + maker.models.length, 0);

/*
  The biochemistry department, shot by the lab. It earns the slot over the
  tighter analyser photographs because it shows people working rather than a
  machine sitting still — and because the AU480 in it is legible, which is what
  ties the photograph to the names beside it.
*/
const PHOTO =
  LAB_PHOTOS.find((photo) => photo.id === 'biochemistry-department') ?? LAB_PHOTOS[0] ?? null;

export function EquipmentMakers() {
  const reduced = usePrefersReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  /*
    A generous margin, so the band is already moving by the time it is read
    rather than starting from a standstill under the reader's eye.
  */
  const inView = useInView(trackRef, { margin: '160px' });

  if (MAKERS.length === 0) return null;

  const plates = (
    <ul className="flex shrink-0 items-stretch">
      {MAKERS.map(({ make, models }, index) => (
        <li key={make} className="px-2 sm:px-2.5">
          <article className="group flex h-full w-[232px] flex-col rounded-2xl bg-white/[0.045] p-4 ring-1 ring-white/10 transition-colors duration-300 hover:bg-white/[0.08] hover:ring-brand-300/40 sm:w-[264px] sm:p-5">
            {/*
              The logos are dark-on-white artwork, so each sits on its own white
              tile rather than straight on the navy. Decorative alt: the name
              is printed right below, and announcing it twice helps nobody.
            */}
            <div className="flex h-[76px] items-center justify-center rounded-xl bg-white px-5 sm:h-[84px]">
              {MAKER_LOGOS[make] ? (
                <img
                  src={MAKER_LOGOS[make]}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="max-h-[44px] w-auto max-w-full object-contain sm:max-h-[48px]"
                />
              ) : (
                <span className="text-center text-[15px] font-extrabold text-navy-950">{make}</span>
              )}
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-3 px-1">
              <h3 className="text-balance text-[16px] font-extrabold leading-[1.15] tracking-tightest text-white sm:text-[17px]">
                {make}
              </h3>
              <span
                aria-hidden="true"
                className="shrink-0 font-mono text-[11px] font-medium tracking-[0.1em] text-brand-300/70"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            {/* A hairline that warms on hover, so the plate has somewhere to go. */}
            <span
              aria-hidden="true"
              className="mx-1 mt-3 block h-px w-8 bg-white/25 transition-all duration-300 group-hover:w-14 group-hover:bg-brand-300"
            />
            <p className="mt-3 px-1 text-[12.5px] leading-relaxed text-white/55">
              {models.join(' · ')}
            </p>
          </article>
        </li>
      ))}
    </ul>
  );

  return (
    <section
      aria-labelledby="makers-heading"
      className="relative overflow-hidden bg-navy-950 py-20 sm:py-24"
    >
      {/* Ground: the same faint grid and cool glow the ribbon at the top uses. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-dark [background-size:72px_72px] [mask-image:radial-gradient(ellipse_72%_60%_at_50%_0%,#000,transparent_76%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-28 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(53,199,244,0.16),transparent_68%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 bottom-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(20,196,163,0.12),transparent_70%)]"
      />

      <Container className="relative">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* ------------------------------ Heading ----------------------------- */}
          <div className="min-w-0 lg:col-span-6">
            <Eyebrow tone="dark">Instrument manufacturers</Eyebrow>
            <h2
              id="makers-heading"
              className="mt-5 text-balance text-[clamp(1.9rem,3.4vw,2.9rem)] font-extrabold leading-[1.06] tracking-editorial text-white"
            >
              Built on instruments from
              <br />
              <span className="bg-gradient-to-r from-brand-300 via-brand-200 to-mint-200 bg-clip-text text-transparent">
                {MAKERS.length} manufacturers.
              </span>
            </h2>
            <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-white/60">
              {ATTRIBUTED} of our {INSTRUMENTS.length} named instruments come from these companies.
              The rest are listed by model in the facility section, because the lab named them
              without a manufacturer and we would rather print nothing than a guess.
            </p>

            <Link
              to="/#inside-the-lab"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-[13.5px] font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300"
            >
              See all {INSTRUMENTS.length} instruments
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={2.4}
                aria-hidden="true"
              />
            </Link>
          </div>

          {/* ---------------------------- Photograph ---------------------------- */}
          {PHOTO && (
            <figure className="min-w-0 lg:col-span-6">
              <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/15">
                <picture>
                  <source type="image/avif" srcSet={PHOTO.avif} sizes="(min-width: 1024px) 46vw, 92vw" />
                  <source type="image/webp" srcSet={PHOTO.webp} sizes="(min-width: 1024px) 46vw, 92vw" />
                  <img
                    src={PHOTO.src}
                    srcSet={PHOTO.jpeg}
                    sizes="(min-width: 1024px) 46vw, 92vw"
                    alt={PHOTO.alt}
                    width={PHOTO.width}
                    height={PHOTO.height}
                    loading="lazy"
                    decoding="async"
                    className="block h-full w-full object-cover"
                  />
                </picture>
                {/* A scrim, so the caption stays legible over a bright photograph. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-navy-950/85 to-transparent"
                />
                <figcaption className="absolute inset-x-0 bottom-0 p-5 text-[13px] font-medium leading-snug text-white/90 sm:p-6">
                  Our biochemistry department, mid-run. The Beckman Coulter AU480 is the analyser on
                  the right.
                </figcaption>
              </div>
            </figure>
          )}
        </div>

      </Container>

      {/*
        Full-bleed rather than inside the Container: a band that runs off both
        edges reads as continuous, and one that stops at the gutter reads as a
        row that failed to fit. The mask fades both ends so the plates arrive
        and leave rather than appearing and vanishing at a hard edge.
      */}
      <div
        ref={trackRef}
        className="relative mt-12 flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_5%,#000_95%,transparent)] lg:mt-14"
      >
        {reduced ? (
          /* No animation: a row the reader scrolls at their own pace. */
          <div className="flex overflow-x-auto px-4 pb-2">{plates}</div>
        ) : (
          <div
            className="flex animate-marquee will-change-transform"
            style={{ animationPlayState: inView ? 'running' : 'paused' }}
          >
            {plates}
            {/*
              The keyframe travels -50%, so the track has to hold exactly two
              copies for the loop to be seamless. The second is decorative and
              hidden from the accessibility tree, or every maker is announced
              twice.
            */}
            <div aria-hidden="true" className="flex">
              {plates}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
