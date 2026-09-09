import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { BlogPost } from '@/types';

/**
 * Blog cards carry no photography — the site has no licensed image library and
 * stock imagery would cheapen it. Instead each card is typographic, with a
 * generated abstract plate derived from the post's category.
 */
/* Brighter, saturated plates — the light theme needs colour here, not shade. */
const CATEGORY_TINT: Record<string, string> = {
  'Preventive Health': 'from-brand-400 to-brand-600',
  Nutrition: 'from-mint-400 to-mint-600',
  "Women's Health": 'from-fuchsia-400 to-fuchsia-600',
  "Men's Health": 'from-indigo-400 to-indigo-600',
  Diabetes: 'from-amber-400 to-amber-600',
  'Heart Health': 'from-coral-400 to-coral-600',
  Wellness: 'from-teal-400 to-teal-600',
  'Lab Tests': 'from-brand-500 to-mint-500',
};

export function BlogCard({
  post,
  variant = 'default',
}: {
  post: BlogPost;
  variant?: 'default' | 'featured' | 'compact';
}) {
  if (variant === 'compact') {
    return (
      <article className="group relative flex items-start gap-5 py-6">
        <Plate post={post} className="h-[72px] w-[72px] shrink-0 rounded-lg" compact />
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
            {post.category}
          </p>
          <h3 className="mt-2 text-[16px] font-bold leading-snug tracking-[-0.015em] text-ink">
            <Link
              to={`/blog/${post.slug}`}
              className="before:absolute before:inset-0 before:content-[''] hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
            >
              {post.title}
            </Link>
          </h3>
          <p className="mt-2 text-[12.5px] text-ink-soft">
            {formatDate(post.publishedAt)} · {post.readingMinutes} min read
          </p>
        </div>
      </article>
    );
  }

  const featured = variant === 'featured';

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl border border-ink-line bg-white transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-brand-200 hover:shadow-liftLg',
        featured && 'lg:flex-row',
      )}
    >
      <Plate
        post={post}
        className={cn('shrink-0', featured ? 'h-56 lg:h-auto lg:w-[46%]' : 'h-44')}
      />

      <div className={cn('flex flex-1 flex-col p-6 sm:p-7', featured && 'lg:p-10')}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold uppercase tracking-[0.14em]">
          <span className="text-brand-600">{post.category}</span>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-ink-line" />
          <span className="text-ink-soft">{formatDate(post.publishedAt)}</span>
        </div>

        <h3
          className={cn(
            'mt-4 text-balance font-bold leading-snug tracking-[-0.02em] text-ink',
            featured ? 'text-[24px] sm:text-[30px]' : 'text-[19px]',
          )}
        >
          <Link
            to={`/blog/${post.slug}`}
            className="before:absolute before:inset-0 before:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
          >
            {post.title}
          </Link>
        </h3>

        <p
          className={cn(
            'mt-3 text-pretty leading-relaxed text-ink-muted',
            featured ? 'text-[15.5px]' : 'line-clamp-3 text-[14.5px]',
          )}
        >
          {post.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between gap-4 pt-7 text-[13px] text-ink-soft">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            {post.readingMinutes} min read
          </span>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-mist text-ink-muted transition-all duration-300 group-hover:bg-brand-500 group-hover:text-white"
          >
            <ArrowUpRight className="h-[17px] w-[17px]" strokeWidth={2.2} />
          </span>
        </div>
      </div>
    </article>
  );
}

/**
 * Generated cover plate: a tinted gradient with a deterministic scientific
 * line pattern seeded from the slug, so every post gets a distinct plate
 * without a single image request.
 */
function Plate({
  post,
  className,
  compact = false,
}: {
  post: BlogPost;
  className?: string;
  compact?: boolean;
}) {
  const tint = CATEGORY_TINT[post.category] ?? 'from-brand-400 to-brand-600';
  // Deterministic seed from the slug.
  const seed = post.slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const points = Array.from({ length: 9 }, (_, i) => {
    const x = (i / 8) * 100;
    const y = 50 + Math.sin((seed + i * 37) * 0.6) * 26;
    return `${x},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div
      aria-hidden="true"
      className={cn('relative overflow-hidden bg-gradient-to-br', tint, className)}
    >
      <div className="absolute inset-0 bg-grid-dark [background-size:24px_24px] opacity-60" />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <polyline
          points={points}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={compact ? 2.5 : 1.4}
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={points}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth={compact ? 9 : 7}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {!compact && (
        <span className="absolute bottom-4 left-5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/55">
          Healthcare Labs
        </span>
      )}
    </div>
  );
}
