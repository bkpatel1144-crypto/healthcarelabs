import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crosshair, Loader2, MapPin, Navigation, Phone, Search } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Container } from '@/components/common/Primitives';
import { BranchMap } from '@/components/common/BranchMap';
import { BRANCHES, branchTelHref, formatBranchPhone, type Branch } from '@/data/branches';
import { SITE_CONFIG } from '@/config/site';
import { useSeo } from '@/lib/seo';
import { cn } from '@/lib/cn';

/** Great-circle distance in kilometres. */
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

type Geo = { state: 'idle' } | { state: 'locating' } | { state: 'denied'; message: string } | { state: 'found'; lat: number; lng: number };

export default function LabLocations() {
  useSeo({
    title: 'Lab locations in Surat',
    description: `All ${BRANCHES.length} ${SITE_CONFIG.brandName} collection centres in Surat — find the nearest branch, call it or get directions.`,
    path: '/lab-locations',
  });

  const [query, setQuery] = useState('');
  const [geo, setGeo] = useState<Geo>({ state: 'idle' });
  const [activeId, setActiveId] = useState(BRANCHES[0].id);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = BRANCHES.filter((b) => !q || `${b.name} ${b.address}`.toLowerCase().includes(q)).map((b) => ({
      branch: b,
      km: geo.state === 'found' && b.coords ? distanceKm(geo, b.coords) : null,
    }));
    // Nearest first; a branch without a published pin goes last rather than
    // being given a guessed distance.
    if (geo.state === 'found') list.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
    return list;
  }, [query, geo]);

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setGeo({ state: 'denied', message: 'This browser cannot share its location.' });
      return;
    }
    setGeo({ state: 'locating' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const found = { state: 'found' as const, lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGeo(found);
        const nearest = BRANCHES.filter((b) => b.coords).sort(
          (a, b) => distanceKm(found, a.coords!) - distanceKm(found, b.coords!),
        )[0];
        if (nearest) setActiveId(nearest.id);
      },
      (err) =>
        setGeo({
          state: 'denied',
          message:
            err.code === err.PERMISSION_DENIED
              ? 'Location permission was declined. Allow it in the address bar, or search by area instead.'
              : 'Your location could not be found. Search by area instead.',
        }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Lab Locations"
        title={
          <>
            {BRANCHES.length} centres across{' '}
            <span className="bg-gradient-to-r from-brand-700 to-mint-600 bg-clip-text text-transparent">Surat.</span>
          </>
        }
        description="Find the branch nearest you, call it directly or open directions. Home collection is available across Surat."
        crumbs={[{ label: 'Lab Locations' }]}
      />

      <section className="bg-white pb-20 pt-10 sm:pb-28">
        <Container size="shell">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search by area or branch name</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search area or branch, e.g. Katargam"
                className="h-14 w-full rounded-2xl border border-ink-line bg-mist pl-12 pr-4 text-[15.5px] text-ink placeholder:text-ink-soft/70 focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
              />
            </label>
            <button
              type="button"
              onClick={locate}
              disabled={geo.state === 'locating'}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand-500 px-6 text-[15px] font-semibold text-white shadow-glow transition-colors hover:bg-brand-600 disabled:opacity-70"
            >
              {geo.state === 'locating' ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Crosshair className="h-5 w-5" aria-hidden="true" />}
              {geo.state === 'found' ? 'Sorted by distance' : 'Near me'}
            </button>
          </div>
          {geo.state === 'denied' && (
            <p role="alert" className="mt-3 text-[13.5px] text-amber-700">
              {geo.message}
            </p>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            <ul className="space-y-3 lg:col-span-6 xl:col-span-5" aria-live="polite">
              {rows.length === 0 && (
                <li className="rounded-3xl border border-dashed border-brand-100 p-8 text-center text-ink-muted">
                  No branch matches “{query}”.{' '}
                  <Link to="/contact-us#home-collection" className="font-semibold text-brand-600 hover:underline">
                    Book a home collection
                  </Link>{' '}
                  instead.
                </li>
              )}
              {rows.map(({ branch, km }) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  km={km}
                  active={branch.id === activeId}
                  onSelect={() => setActiveId(branch.id)}
                />
              ))}
            </ul>

            <div className="lg:col-span-6 xl:col-span-7">
              <div className="sticky top-28 overflow-hidden rounded-3xl ring-1 ring-ink-line">
                <BranchMap activeId={activeId} onSelect={setActiveId} load className="h-[380px] w-full lg:h-[560px]" />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function BranchCard({
  branch: b,
  km,
  active,
  onSelect,
}: {
  branch: Branch;
  km: number | null;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li
      className={cn(
        'rounded-3xl bg-white p-5 ring-1 transition-shadow',
        active ? 'shadow-card ring-brand-300' : 'ring-ink-line hover:ring-brand-200',
      )}
    >
      <button type="button" onClick={onSelect} className="w-full text-left" aria-pressed={active}>
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 text-[17px] font-bold text-ink">
            <MapPin className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            {SITE_CONFIG.brandName} {b.name}
          </p>
          {km !== null && (
            <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-bold tabular-nums text-brand-700">
              {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}
            </span>
          )}
        </div>
        {b.head && <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.1em] text-mint-700">Head office</p>}
        <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{b.address}</p>
      </button>
      <div className="mt-4 flex flex-wrap gap-2 text-[12.5px] font-semibold">
        {/* One branch has no published number; it gets no call button rather than a borrowed one. */}
        {b.phones[0] && (
          <a href={branchTelHref(b.phones[0])} className="inline-flex items-center gap-1.5 rounded-full bg-mist px-3 py-1.5 text-ink hover:text-brand-600">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            {formatBranchPhone(b.phones[0])}
          </a>
        )}
        <a href={b.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1.5 text-white hover:bg-brand-600">
          <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
          Directions
        </a>
      </div>
    </li>
  );
}
