import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Expand, Instagram } from 'lucide-react';
import { Container, Reveal, SectionHeading } from '@/components/common/Primitives';
import { PhotoLightbox } from '@/components/common/PhotoLightbox';
import { AWARENESS_POSTS } from '@/data/awarenessPosts';
import { AWARENESS_NOTES } from '@/data/awareness';
import { SITE_CONFIG } from '@/config/site';
import type { SitePhoto } from '@/types';

/**
 * The lab's own awareness posters, as published.
 *
 * These are Gujarati artwork made for Instagram, and they belong on the blog
 * rather than on the homepage because they do the same job the articles do:
 * they are for the visitor who is reading, not booking. Presenting them as
 * what they are — the lab's social posts — is also the honest framing; dressing
 * a square social graphic up as a website banner would fool nobody.
 *
 * The tile opens the poster full-size instead of linking away, because the
 * text on it is the content and it is unreadable at card width. The English
 * note under each one comes from AWARENESS_NOTES, so a reader who does not
 * read Gujarati knows what a poster says before deciding to open it.
 */
export function AwarenessPosts() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const posts = AWARENESS_POSTS;
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="awareness-heading" className="bg-white py-16 sm:py-20">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="From our Instagram"
            title={<span id="awareness-heading">Health awareness, in Gujarati</span>}
            description="Posters the lab publishes for patients in Surat, reproduced here as they went out. Each one has an English summary underneath — open a poster to read it at full size."
          />
          {SITE_CONFIG.social.instagram && (
            <a
              href={SITE_CONFIG.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2.5 self-start rounded-full bg-gradient-to-r from-brand-500 to-mint-500 px-5 py-3 text-[13.5px] font-bold text-white shadow-[0_16px_34px_-16px_rgba(6,90,200,0.85)] transition-transform duration-200 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 lg:self-auto"
            >
              <Instagram className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
              Follow on Instagram
            </a>
          )}
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((post, i) => {
            const note = AWARENESS_NOTES[post.id];
            return (
              <Reveal
                as="li"
                key={post.id}
                delay={i % 4}
                className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-brand-50 transition-shadow duration-300 hover:shadow-lift"
              >
                <PosterTile post={post} label={note?.title} onOpen={() => setLightbox(i)} />

                <div className="flex flex-1 flex-col p-5">
                  {note?.topic && (
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-600">
                      {note.topic}
                    </p>
                  )}
                  <h3 className="mt-2.5 text-balance text-[16px] font-bold leading-snug tracking-[-0.015em] text-ink">
                    {note?.title ?? post.caption}
                  </h3>
                  {note?.summary && (
                    <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-muted">
                      {note.summary}
                    </p>
                  )}
                  {note?.related && (
                    <Link
                      to={note.related.href}
                      /* mt-auto: the summaries are different lengths, so without
                         it the links land at four different heights across the
                         row. */
                      className="mt-auto inline-flex items-center gap-1.5 self-start pt-4 text-[13px] font-semibold text-brand-600 transition-colors hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
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
          photos={posts}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndexChange={setLightbox}
          noun="Poster"
        />
      )}
    </section>
  );
}

/**
 * Deliberately not PhotoTile: that one lays a scrim and a caption across the
 * bottom of the image, which on a poster would sit on top of the poster's own
 * wording. Here the artwork is left alone and the caption lives in the card.
 */
function PosterTile({
  post,
  label,
  onOpen,
}: {
  post: SitePhoto;
  label?: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open the full poster: ${label ?? post.caption}`}
      className="relative block w-full overflow-hidden bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500"
    >
      <picture>
        <source type="image/avif" srcSet={post.avif} sizes="(min-width: 1024px) 24vw, (min-width: 640px) 46vw, 92vw" />
        <source type="image/webp" srcSet={post.webp} sizes="(min-width: 1024px) 24vw, (min-width: 640px) 46vw, 92vw" />
        <img
          src={post.src}
          srcSet={post.jpeg}
          sizes="(min-width: 1024px) 24vw, (min-width: 640px) 46vw, 92vw"
          alt={post.alt}
          width={post.width}
          height={post.height}
          loading="lazy"
          decoding="async"
          className="w-full transition-transform duration-500 ease-premium group-hover:scale-[1.03]"
        />
      </picture>

      <span
        aria-hidden="true"
        className="glass-flat-dark absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        <Expand className="h-4 w-4" strokeWidth={2.2} />
      </span>
    </button>
  );
}
