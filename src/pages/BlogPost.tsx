import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, PenLine } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Container, Reveal, SectionHeading } from '@/components/common/Primitives';
import { Button, ButtonArrow } from '@/components/common/Button';
import { BlogCard } from '@/components/blog/BlogCard';
import { useContent } from '@/store/content';
import { useSeo } from '@/lib/seo';
import { formatDate } from '@/lib/format';
import { SITE_CONFIG } from '@/config/site';
import type { BlogPost as Post } from '@/types';

export default function BlogPostPage() {
  const { slug = '' } = useParams();
  const { livePosts } = useContent();
  const post = livePosts.find((p) => p.slug === slug);

  if (!post) return <Navigate to="/blog" replace />;
  return <Article post={post} />;
}

function Article({ post }: { post: Post }) {
  const { livePosts, livePackages } = useContent();

  const related = useMemo(
    () =>
      livePosts
        .filter((p) => p.id !== post.id)
        .sort((a, b) => {
          const sameA = a.category === post.category ? 0 : 1;
          const sameB = b.category === post.category ? 0 : 1;
          if (sameA !== sameB) return sameA - sameB;
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        })
        .slice(0, 3),
    [livePosts, post],
  );

  const suggestedPackage = useMemo(
    () => livePackages.find((p) => p.featured) ?? livePackages[0],
    [livePackages],
  );

  useSeo({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    type: 'article',
    publishedAt: post.publishedAt,
    author: post.author,
    jsonLd: {
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      datePublished: post.publishedAt,
      articleSection: post.category,
      author: { '@type': 'Organization', name: post.author },
      publisher: { '@id': `${SITE_CONFIG.url}/#organization` },
      mainEntityOfPage: `${SITE_CONFIG.url}/blog/${post.slug}`,
    },
  });

  return (
    <>
      <PageHeader
        eyebrow={post.category}
        title={post.title}
        crumbs={[{ label: 'Blog', to: '/blog' }, { label: post.title }]}
      >
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-7 text-[14px] text-slate-400">
          <span className="flex items-center gap-2">
            <PenLine className="h-4 w-4 text-brand-400" strokeWidth={2} aria-hidden="true" />
            {post.author}
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-400" strokeWidth={2} aria-hidden="true" />
            {post.readingMinutes} min read
          </span>
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        </div>
      </PageHeader>

      <section className="bg-white py-16 sm:py-20">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            {/* ---- Body ---- */}
            <article className="lg:col-span-8">
              <p className="text-balance border-l-2 border-brand-400 pl-6 text-[19px] font-medium leading-relaxed text-ink sm:text-[21px]">
                {post.excerpt}
              </p>

              <div className="mt-12 space-y-10">
                {post.sections.map((section, i) => (
                  <section key={i}>
                    {section.heading && (
                      <h2 className="text-[24px] font-bold leading-snug tracking-editorial text-ink sm:text-[27px]">
                        {section.heading}
                      </h2>
                    )}
                    {section.paragraphs?.map((p, j) => (
                      <p
                        key={j}
                        className="mt-5 text-pretty text-[16.5px] leading-[1.75] text-ink-muted"
                      >
                        {p}
                      </p>
                    ))}
                    {section.bullets && (
                      <ul className="mt-6 space-y-3.5">
                        {section.bullets.map((b) => (
                          <li
                            key={b}
                            className="flex gap-3.5 text-[16px] leading-relaxed text-ink-muted"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400"
                            />
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>

              <div className="mt-14 rounded-2xl border border-ink-line bg-mist p-7 text-[14px] leading-relaxed text-ink-muted sm:p-8">
                <strong className="font-semibold text-ink">General information only.</strong> This
                article describes widely accepted preventive practice. It is not medical advice, it
                does not diagnose anything, and it cannot account for your history. Discuss your
                results and your testing schedule with a qualified physician.
              </div>

              <Link
                to="/blog"
                className="group mt-12 inline-flex items-center gap-2 text-[15px] font-semibold text-brand-600 transition-colors hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
              >
                <ArrowLeft
                  className="h-[18px] w-[18px] transition-transform duration-200 group-hover:-translate-x-0.5"
                  strokeWidth={2.2}
                  aria-hidden="true"
                />
                All articles
              </Link>
            </article>

            {/* ---- Sidebar ---- */}
            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-32 space-y-8">
                {suggestedPackage && (
                  <div className="rounded-2xl border border-ink-line bg-navy-900 p-7 text-white">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300">
                      Ready to test?
                    </p>
                    <h2 className="mt-4 text-[20px] font-bold leading-snug tracking-[-0.02em]">
                      {suggestedPackage.name}
                    </h2>
                    <p className="mt-3 text-[14px] leading-relaxed text-slate-400">
                      {suggestedPackage.summary}
                    </p>
                    <Button
                      to={`/health-package/${suggestedPackage.slug}`}
                      variant="onDark"
                      size="md"
                      className="mt-6 w-full"
                    >
                      View package
                      <ButtonArrow />
                    </Button>
                  </div>
                )}

                {related.length > 0 && (
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft">
                      Keep reading
                    </h2>
                    <ul className="mt-3 divide-y divide-ink-line border-t border-ink-line">
                      {related.map((p) => (
                        <li key={p.id}>
                          <BlogCard post={p} variant="compact" />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {/* ---- Related grid ---- */}
      {related.length > 0 && (
        <section aria-labelledby="related-articles" className="bg-mist py-16 sm:py-20">
          <Container>
            <SectionHeading
              eyebrow="Related reading"
              title={<span id="related-articles">More on this</span>}
            />
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <Reveal as="li" key={p.id} delay={i}>
                  <BlogCard post={p} />
                </Reveal>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </>
  );
}
