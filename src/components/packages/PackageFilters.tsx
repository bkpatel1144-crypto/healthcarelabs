import { Search, SlidersHorizontal, X } from 'lucide-react';
import { HEALTH_CONCERNS } from '@/data/healthConcerns';
import { ConcernIcon } from '@/components/common/ConcernIcon';
import { Select } from '@/components/common/Select';
import { cn } from '@/lib/cn';
import type { ConcernId } from '@/types';

export type SortKey = 'recommended' | 'price-asc' | 'price-desc' | 'tests-desc' | 'name-asc';

export interface PackageFilterState {
  query: string;
  concern: ConcernId | 'all';
  sort: SortKey;
  homeOnly: boolean;
  maxPrice: number | null;
}

export const DEFAULT_FILTERS: PackageFilterState = {
  query: '',
  concern: 'all',
  sort: 'recommended',
  homeOnly: false,
  maxPrice: null,
};

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'tests-desc', label: 'Most tests included' },
  { value: 'name-asc', label: 'Name: A–Z' },
];

const PRICE_BANDS = [
  { value: 1500, label: 'Under ₹1,500' },
  { value: 3000, label: 'Under ₹3,000' },
  { value: 5000, label: 'Under ₹5,000' },
];

export function PackageFilters({
  filters,
  onChange,
  resultCount,
  totalCount,
}: {
  filters: PackageFilterState;
  onChange: (next: PackageFilterState) => void;
  resultCount: number;
  totalCount: number;
}) {
  const set = <K extends keyof PackageFilterState>(key: K, value: PackageFilterState[K]) =>
    onChange({ ...filters, [key]: value });

  const isFiltered =
    filters.query !== '' ||
    filters.concern !== 'all' ||
    filters.homeOnly ||
    filters.maxPrice !== null ||
    filters.sort !== 'recommended';

  return (
    <div className="border-b border-ink-line bg-white">
      {/* ---- Search + sort ---- */}
      <div className="flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:gap-6">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-soft"
            strokeWidth={2}
            aria-hidden="true"
          />
          <label htmlFor="package-search" className="sr-only">
            Search health packages by name or test
          </label>
          <input
            id="package-search"
            type="search"
            value={filters.query}
            onChange={(e) => set('query', e.target.value)}
            placeholder="Search a package or a test — HbA1c, thyroid, lipid profile…"
            className="h-12 w-full rounded-xl border border-ink-line bg-mist pl-12 pr-4 text-[15px] text-ink placeholder:text-ink-soft/70 transition-colors focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
        </div>

        <div className="flex items-center gap-3">
          <label
            htmlFor="package-sort"
            className="flex shrink-0 items-center gap-2 text-[13px] font-semibold text-ink-muted"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Sort
          </label>
          <Select
            id="package-sort"
            value={filters.sort}
            onChange={(v) => set('sort', v as SortKey)}
            options={SORTS.map((s) => ({ value: s.value, label: s.label }))}
            size="lg"
            ariaLabel="Sort packages"
            className="flex-1 lg:w-56 lg:flex-none"
          />
        </div>
      </div>

      {/* ---- Concern chips ---- */}
      <div className="min-w-0 pb-5">
        {/*
          `min-w-0` on the fieldset is load-bearing. A fieldset defaults to
          `min-width: min-content`, so without it the element refuses to shrink
          below the intrinsic width of the whole chip row — which defeats the
          scroller inside and pushes the entire page into horizontal overflow.
        */}
        <fieldset className="min-w-0">
          <legend className="sr-only">Filter by health concern</legend>
          <div className="scroll-row -mx-1 flex snap-x gap-2 px-1 pb-3">
            <Chip
              active={filters.concern === 'all'}
              onClick={() => set('concern', 'all')}
              label={`All packages (${totalCount})`}
            />
            {HEALTH_CONCERNS.map((c) => (
              <Chip
                key={c.id}
                active={filters.concern === c.id}
                onClick={() => set('concern', c.id)}
                label={c.label}
                icon={c.icon}
              />
            ))}
          </div>
        </fieldset>
      </div>

      {/* ---- Secondary filters + result count ---- */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-ink-line py-5">
        <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-medium text-ink-muted">
          <input
            type="checkbox"
            checked={filters.homeOnly}
            onChange={(e) => set('homeOnly', e.target.checked)}
            className="h-4 w-4 rounded border-ink-line text-brand-500 focus:ring-2 focus:ring-brand-300 focus:ring-offset-1"
          />
          Home collection available
        </label>

        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-ink-soft">Budget</span>
          {PRICE_BANDS.map((b) => (
            <button
              key={b.value}
              type="button"
              onClick={() => set('maxPrice', filters.maxPrice === b.value ? null : b.value)}
              aria-pressed={filters.maxPrice === b.value}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                filters.maxPrice === b.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-mist text-ink-muted hover:bg-brand-50 hover:text-brand-600',
              )}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-4">
          <p aria-live="polite" className="text-[13.5px] text-ink-muted">
            <span className="font-bold tabular-nums text-ink">{resultCount}</span> of {totalCount}{' '}
            packages
          </p>
          {isFiltered && (
            <button
              type="button"
              onClick={() => onChange(DEFAULT_FILTERS)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-brand-600 transition-colors hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden="true" />
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-lg border px-3.5 py-2 text-[13.5px] font-semibold transition-all duration-200',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        active
          ? 'border-brand-500 bg-brand-500 text-white'
          : 'border-ink-line bg-white text-ink-muted hover:border-brand-200 hover:text-brand-600',
      )}
    >
      {icon && (
        <ConcernIcon
          name={icon}
          className={cn('h-[15px] w-[15px]', active ? 'text-white' : 'text-brand-500')}
        />
      )}
      {label}
    </button>
  );
}

/** Shared filtering + sorting so the page and any other consumer stay in step. */
export function applyPackageFilters<
  T extends {
    name: string;
    summary: string;
    tests: string[];
    concerns: ConcernId[];
    price: number | null;
    offerPrice: number | null;
    homeCollection: boolean;
    featured: boolean;
  },
>(packages: T[], filters: PackageFilterState): T[] {
  const q = filters.query.trim().toLowerCase();

  const filtered = packages.filter((p) => {
    if (filters.concern !== 'all' && !p.concerns.includes(filters.concern)) return false;
    if (filters.homeOnly && !p.homeCollection) return false;
    if (filters.maxPrice !== null) {
      const effective = p.offerPrice ?? p.price;
      if (effective === null || effective > filters.maxPrice) return false;
    }
    if (q) {
      const haystack = [p.name, p.summary, ...p.tests].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const effective = (p: T) => p.offerPrice ?? p.price ?? Number.POSITIVE_INFINITY;

  switch (filters.sort) {
    case 'price-asc':
      return [...filtered].sort((a, b) => effective(a) - effective(b));
    case 'price-desc':
      return [...filtered].sort((a, b) => effective(b) - effective(a));
    case 'tests-desc':
      return [...filtered].sort((a, b) => b.tests.length - a.tests.length);
    case 'name-asc':
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    default:
      // Featured first, then the largest saving.
      return [...filtered].sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        const sa = (a.price ?? 0) - (a.offerPrice ?? a.price ?? 0);
        const sb = (b.price ?? 0) - (b.offerPrice ?? b.price ?? 0);
        return sb - sa;
      });
  }
}
