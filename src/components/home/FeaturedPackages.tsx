import { Container, Reveal, SectionHeading } from '@/components/common/Primitives';
import { Button, ButtonArrow } from '@/components/common/Button';
import { PackageCard } from '@/components/packages/PackageCard';
import { useContent } from '@/store/content';

export function FeaturedPackages() {
  const { livePackages } = useContent();
  const featured = livePackages.filter((p) => p.featured).slice(0, 6);

  if (featured.length === 0) return null;

  return (
    <section aria-labelledby="packages-heading" className="bg-mist py-20 sm:py-28">
      <Container>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Health Packages"
            title={<span id="packages-heading">Premium health packages</span>}
            description="Panels assembled the way physicians order them, with the full test list and preparation instructions published on every page."
            className="sm:max-w-xl"
          />
          <Button to="/health-package" variant="secondary" size="md" className="shrink-0">
            All packages
            <ButtonArrow />
          </Button>
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((pkg, i) => (
            <Reveal as="li" key={pkg.id} delay={i % 3}>
              <PackageCard pkg={pkg} variant={i === 0 ? 'feature' : 'default'} />
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
