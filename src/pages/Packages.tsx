import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Container, Reveal } from '@/components/common/Primitives';
import { Button } from '@/components/common/Button';
import { PackageCard } from '@/components/packages/PackageCard';
import {
  DEFAULT_FILTERS,
  PackageFilters,
  applyPackageFilters,
  type PackageFilterState,
} from '@/components/packages/PackageFilters';
import { HomeCollectionSection } from '@/components/home/HomeCollection';
import { useContent } from '@/store/content';
import { useSeo } from '@/lib/seo';
import { HEALTH_CONCERNS } from '@/data/healthConcerns';
import { SITE_CONFIG } from '@/config/site';
import type { ConcernId } from '@/types';

const CONCERN_IDS = new Set(HEALTH_CONCERNS.map((c) => c.id));

export default function Packages() {
  const { livePackages, preferences } = useContent();
  const [searchParams, setSearchParams] = useSearchParams();

  const paramConcern = searchParams.get('concern');
  const initialConcern: ConcernId | 'all' =
    paramConcern && CONCERN_IDS.has(paramConcern as ConcernId)
      ? (paramConcern as ConcernId)
      : 'all';

  const [filters, setFilters] = useState<PackageFilterState>({
    ...DEFAULT_FILTERS,
    concern: initialConcern,
    // The hero's test finder links here with ?q= when nothing matched inline.
    query: searchParams.get('q') ?? '',
  });

  // Keep the concern filter and the URL in step so the view is shareable.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (filters.concern === 'all') next.delete('concern');
    else next.set('concern', filters.concern);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // searchParams is intentionally omitted: this effect writes to it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.concern]);

  const results = useMemo(
    () => applyPackageFilters(livePackages, filters),
    [livePackages, filters],
  );

  const activeConcern = HEALTH_CONCERNS.find((c) => c.id === filters.concern);

  useSeo({
    title: activeConcern
      ? `${activeConcern.label} Health Packages`
      : 'Health Packages & Preventive Check-Ups',
    description: activeConcern
      ? `${activeConcern.description} Compare Healthcare Labs packages, included tests and pricing.`
      : `Compare ${livePackages.length} health packages from ${SITE_CONFIG.brandName} — full test lists, preparation instructions and transparent pricing.`,
    path: '/health-package',
    jsonLd: {
      '@type': 'ItemList',
      name: 'Health Packages',
      numberOfItems: results.length,
      itemListElement: results.slice(0, 20).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.name,
        url: `${SITE_CONFIG.url}/health-package/${p.slug}`,
      })),
    },
  });

  const savedCount = preferences.savedPackages.length;

  return (
    <>
      <PageHeader
        eyebrow="Health Packages"
        title={
          <>
            Find the panel that answers
            <br />
            <span className="text-brand-400">your question.</span>
          </>
        }
        description="Every package lists the tests it includes, who it suits, how to prepare and when the report is ready. Filter by concern, budget or home collection."
        crumbs={[{ label: 'Health Packages' }]}
        aside={
          <dl className="grid grid-cols-2 gap-x-6 gap-y-7 rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm">
            <Stat value={String(livePackages.length)} label="Packages published" />
            <Stat
              value={String(new Set(livePackages.flatMap((p) => p.tests)).size)}
              label="Distinct tests"
            />
            <Stat
              value={String(livePackages.filter((p) => p.homeCollection).length)}
              label="Home collection eligible"
            />
            <Stat value={savedCount > 0 ? String(savedCount) : '—'} label="Saved by you" />
          </dl>
        }
      />

      <div className="bg-white">
        <Container>
          <PackageFilters
            filters={filters}
            onChange={setFilters}
            resultCount={results.length}
            totalCount={livePackages.length}
          />
        </Container>
      </div>

      <section aria-label="Health packages" className="bg-mist py-14 sm:py-16">
        <Container>
          {results.length === 0 ? (
            <div className="mx-auto max-w-md py-16 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-ink-soft ring-1 ring-ink-line">
                <SearchX className="h-6 w-6" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <h2 className="mt-6 text-[22px] font-bold tracking-editorial text-ink">
                Nothing matches that combination.
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
                Try widening the budget or clearing the concern filter. If you are looking for a
                specific test that is not listed, the lab can quote it directly.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button variant="secondary" size="md" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  Clear all filters
                </Button>
                <Button to="/contact-us" size="md">
                  Ask the lab
                </Button>
              </div>
            </div>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((pkg, i) => (
                <Reveal as="li" key={pkg.id} delay={i % 3}>
                  <PackageCard pkg={pkg} variant={pkg.featured ? 'feature' : 'default'} />
                </Reveal>
              ))}
            </ul>
          )}
        </Container>
      </section>

      <HomeCollectionSection />
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block text-[30px] font-extrabold leading-none tracking-tightest text-white tabular-nums">
          {value}
        </span>
        <span className="mt-2 block text-[12.5px] leading-snug text-slate-400">{label}</span>
      </dd>
    </div>
  );
}
