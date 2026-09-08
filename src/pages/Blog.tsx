import { useMemo, useState } from 'react';
import { Search, SearchX } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Container, Reveal } from '@/components/common/Primitives';
import { Button } from '@/components/common/Button';
import { BlogCard } from '@/components/blog/BlogCard';
import { useContent } from '@/store/content';
import { useSeo } from '@/lib/seo';
import { BLOG_CATEGORIES } from '@/data/blogs';
import { cn } from '@/lib/cn';
import type { BlogCategory } from '@/types';

export default function Blog() {
  const { livePosts } = useContent();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<BlogCategory | 'all'>('all');

  const sorted = useMemo(
    () =>
      [...livePosts].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      ),
    [livePosts],
  );

  const lead = sorted.find((p) => p.featured) ?? sorted[0];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (!q) return true;
      return `${p.title} ${p.excerpt} ${p.category}`.toLowerCase().includes(q);
    });
  }, [sorted, query, category]);

  const isFiltered = query !== '' || category !== 'all';
  const grid = isFiltered ? results : results.filter((p) => p.id !== lead?.id);

  // Only show categories that actually have articles.
  const availableCategories = useMemo(() => {
    const used = new Set(livePosts.map((p) => p.category));
    return BLOG_CATEGORIES.filter((c) => used.has(c));
  }, [livePosts]);

  useSeo({
    title: 'Health Insights & Lab Test Guides',
    description:
      'Plain-language writing on preventive testing, test preparation and what the numbers on a pathology report actually mean.',
    path: '/blog',
    jsonLd: {
      '@type': 'Blog',
      name: 'Healthcare Labs Health Insights',
      blogPost: sorted.slice(0, 10).map((p) => ({
        '@type': 'BlogPosting',
        headline: p.title,
        datePublished: p.publishedAt,
        author: { '@type': 'Organization', name: p.author },
      })),
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Health Insights"
        title={
          <>
            Understand the test
            <br />
            <span className="text-brand-400">before you take it.</span>
          </>
        }
        description="Preparation, interpretation and preventive practice, written plainly. Nothing here replaces a conversation with your physician — it is meant to make that conversation better."
        crumbs={[{ label: 'Blog' }]}
      />

      {/* ---- Featured article ---- */}
      {lead && !isFiltered && (
        <section aria-label="Featured article" className="bg-white py-14 sm:py-16">
          <Container>
            <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
              Featured
            </p>
            <BlogCard post={lead} variant="featured" />
          </Container>
        </section>
      )}

      {/* ---- Search + categories ---- */}
      <section className={cn('bg-white', lead && !isFiltered ? 'pt-0' : 'pt-14')}>
        <Container>
          <div className="flex flex-col gap-5 border-y border-ink-line py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-soft"
                strokeWidth={2}
                aria-hidden="true"
              />
              <label htmlFor="blog-search" className="sr-only">
                Search articles
              </label>
              <input
                id="blog-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles…"
                className="h-12 w-full rounded-xl border border-ink-line bg-mist pl-12 pr-4 text-[15px] text-ink placeholder:text-ink-soft/70 transition-colors focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <fieldset className="min-w-0">
              <legend className="sr-only">Filter by category</legend>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <CategoryChip
                  active={category === 'all'}
                  onClick={() => setCategory('all')}
                  label="All"
                />
                {availableCategories.map((c) => (
                  <CategoryChip
                    key={c}
                    active={category === c}
                    onClick={() => setCategory(c)}
                    label={c}
                  />
                ))}
              </div>
            </fieldset>
          </div>
        </Container>
      </section>

      {/* ---- Grid ---- */}
      <section aria-label="Articles" className="bg-mist py-14 sm:py-20">
        <Container>
          <p aria-live="polite" className="mb-8 text-[13.5px] text-ink-muted">
            <span className="font-bold tabular-nums text-ink">{results.length}</span>{' '}
            {results.length === 1 ? 'article' : 'articles'}
            {category !== 'all' && ` in ${category}`}
          </p>

          {grid.length === 0 ? (
            <div className="mx-auto max-w-md py-12 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-ink-soft ring-1 ring-ink-line">
                <SearchX className="h-6 w-6" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <h2 className="mt-6 text-[22px] font-bold tracking-editorial text-ink">
                No articles match that search.
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
                Try a different term, or browse everything we have published.
              </p>
              <Button
                variant="secondary"
                size="md"
                className="mt-7"
                onClick={() => {
                  setQuery('');
                  setCategory('all');
                }}
              >
                Show all articles
              </Button>
            </div>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {grid.map((post, i) => (
                <Reveal as="li" key={post.id} delay={i % 3}>
                  <BlogCard post={post} />
                </Reveal>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 whitespace-nowrap rounded-lg border px-3.5 py-2 text-[13.5px] font-semibold transition-all duration-200',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        active
          ? 'border-brand-500 bg-brand-500 text-white'
          : 'border-ink-line bg-white text-ink-muted hover:border-brand-200 hover:text-brand-600',
      )}
    >
      {label}
    </button>
  );
}
