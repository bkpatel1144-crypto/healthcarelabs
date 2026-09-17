import { motion } from 'framer-motion';
import { CheckCircle2, FileCheck2, Home } from 'lucide-react';
import { LAB_PHOTOS } from '@/data/labPhotos';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';
import { useSheen } from '@/hooks/useSheen';

/**
 * The hero's visual: the lab's own reception photograph.
 *
 * People lead, equipment supports. The previous hero used a full-bleed video of
 * an analyser under a dark scrim; the client's preferred site leads with a
 * photograph of smiling faces, and their reception shot is the one asset with
 * real people in it.
 *
 * The small video inset that used to sit on this photograph is gone. It said
 * the same thing as the floating lab reel — "inside the lab" — and two videos
 * playing at once was the largest remaining cost on the homepage: a 3-second
 * scroll measured 33.4ms median frames with them and 16.7ms without, 56
 * rendered frames against 108.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

const BADGES = [
  {
    Icon: Home,
    title: 'Home collection',
    detail: 'Across Surat',
    tone: 'text-brand-700',
    position: '-left-3 top-8 sm:-left-6',
    float: 0,
  },
  {
    Icon: FileCheck2,
    title: 'Digital reports',
    detail: 'Shared securely',
    tone: 'text-mint-700',
    position: '-right-2 bottom-28 sm:-right-5',
    float: 1.6,
  },
] as const;

export function HeroMedia() {
  const reduced = usePrefersReducedMotion();
  const sheen = useSheen<HTMLDivElement>();

  // Reception is the lead photo in the lab collection; fall back to whatever is
  // first if that manifest entry has not been generated yet.
  const photo = LAB_PHOTOS.find((p) => p.id === 'reception') ?? LAB_PHOTOS[0];

  const float = (delay: number) =>
    reduced
      ? {}
      : {
          animate: { y: [0, -9, 0] },
          transition: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay },
        };

  return (
    <div className="relative lg:h-full">
      {/* Soft colour bloom behind the composition. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-[radial-gradient(ellipse_at_60%_40%,rgba(53,199,244,0.22),transparent_70%)]"
      />

      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.97, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.85, delay: 0.2, ease: EASE }}
        className="relative lg:h-full"
      >
        {/*
          Asymmetric rounding rather than a plain rectangle — a large radius on
          one corner is what stops a photo in a box looking like a stock frame.
        */}
        <div className="relative overflow-hidden rounded-[2rem] rounded-tr-[5rem] bg-surface-tint shadow-card ring-1 ring-white lg:h-full">
          {photo ? (
            <picture>
              <source type="image/avif" srcSet={photo.avif} sizes="(min-width:1024px) 52vw, 92vw" />
              <source type="image/webp" srcSet={photo.webp} sizes="(min-width:1024px) 52vw, 92vw" />
              <img
                src={photo.src}
                srcSet={photo.jpeg}
                sizes="(min-width:1024px) 52vw, 92vw"
                alt="The reception desk at the Healthcare Labs centre in Surat."
                width={photo.width}
                height={photo.height}
                fetchPriority="high"
                decoding="async"
                className="aspect-[4/3] w-full object-cover sm:aspect-[16/11] lg:aspect-auto lg:h-full"
              />
            </picture>
          ) : (
            <div className="aspect-[16/11] w-full bg-gradient-to-br from-brand-100 to-surface-sky lg:aspect-auto lg:h-full" />
          )}

          {/* Warm wash so the photo sits in the palette rather than beside it. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-brand-600/10 via-transparent to-coral-400/10"
          />
        </div>

        {/* ---------- Floating proof badges ---------- */}
        {BADGES.map(({ Icon, title, detail, tone, position, float: d }) => (
          <motion.div
            key={title}
            initial={reduced ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.75 + d * 0.15, ease: EASE }}
            className={cn('absolute hidden xl:block', position)}
          >
            <motion.div
              {...float(d)}
              className={cn(
                'glass-flat glass-sheen flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5',
                tone,
              )}
              {...sheen}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <Icon className="h-[17px] w-[17px]" strokeWidth={2.2} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[12.5px] font-bold leading-tight text-ink">{title}</span>
                <span className="block text-[11px] text-ink-soft">{detail}</span>
              </span>
            </motion.div>
          </motion.div>
        ))}

        {/* ---------- Accredited chip ---------- */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 1.05, ease: EASE }}
          className="absolute -right-1 top-4 hidden xl:block"
        >
          <div className="flex items-center gap-2 rounded-full bg-mint-500 px-3.5 py-2 shadow-[0_14px_30px_-14px_rgba(6,122,104,0.8),inset_0_1px_0_rgba(255,255,255,0.4)]">
            <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={2.6} aria-hidden="true" />
            <span className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-white">
              Verified reports
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
