import { Container, Reveal, SectionHeading } from '@/components/common/Primitives';
import { Button, ButtonArrow } from '@/components/common/Button';
import { BlogCard } from '@/components/blog/BlogCard';
import { useContent } from '@/store/content';

export function BlogTeaser() {
  const { livePosts } = useContent();
  const sorted = [...livePosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  const lead = sorted.find((p) => p.featured) ?? sorted[0];
  const rest = sorted.filter((p) => p.id !== lead?.id).slice(0, 4);

  if (!lead) return null;

  return (
    <section aria-labelledby="insights-heading" className="bg-mist py-20 sm:py-28">
      <Container>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Health Insights"
            title={<span id="insights-heading">Understand the test before you take it</span>}
            description="Plain-language writing on preventive testing, preparation and what the numbers on a report actually mean."
            className="sm:max-w-xl"
          />
          <Button to="/blog" variant="secondary" size="md" className="shrink-0">
            All articles
            <ButtonArrow />
          </Button>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <Reveal className="lg:col-span-7">
            <BlogCard post={lead} variant="featured" />
          </Reveal>

          <div className="lg:col-span-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft">
              Latest articles
            </p>
            <ul className="mt-3 divide-y divide-ink-line border-t border-ink-line">
              {rest.map((post, i) => (
                <Reveal as="li" key={post.id} delay={i}>
                  <BlogCard post={post} variant="compact" />
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
