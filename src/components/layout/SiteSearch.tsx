import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, FlaskConical, HelpCircle, MapPin, Search, Upload, X } from 'lucide-react';
import { useContent } from '@/store/content';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { HealthPackage } from '@/types';

/**
 * Find a test or package from anywhere. Matches package names first, then
 * individual tests inside packages, so typing "HbA1c" surfaces every package
 * that includes it. Ctrl/⌘+K or "/" opens it from the keyboard.
 */

const SHORTCUTS = [
  { to: '/upload-prescription', label: 'Upload a prescription', Icon: Upload },
  { to: '/lab-locations', label: 'Find a lab near me', Icon: MapPin },
  { to: '/help', label: 'Help & support', Icon: HelpCircle },
];

interface Hit {
  pkg: HealthPackage;
  /** Test names that matched, when the match was inside the package. */
  tests: string[];
  score: number;
}

function search(packages: HealthPackage[], raw: string): Hit[] {
  const q = raw.trim().toLowerCase();
  if (q.length < 2) return [];
  const words = q.split(/\s+/);
  const hits: Hit[] = [];
  for (const pkg of packages) {
    const name = pkg.name.toLowerCase();
    const tests = pkg.tests.filter((t) => words.every((w) => t.toLowerCase().includes(w)));
    let score = 0;
    if (name.startsWith(q)) score = 100;
    else if (words.every((w) => name.includes(w))) score = 80;
    else if (tests.length > 0) score = 60;
    else if (words.every((w) => `${pkg.summary} ${pkg.concerns.join(' ')}`.toLowerCase().includes(w))) score = 30;
    if (score > 0) hits.push({ pkg, tests: tests.slice(0, 3), score });
  }
  return hits.sort((a, b) => b.score - a.score || a.pkg.name.localeCompare(b.pkg.name)).slice(0, 8);
}

export function SiteSearchButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest('input, textarea, [contenteditable="true"]');
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="Search tests and packages"
        title="Search (Ctrl+K)"
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-white hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
          className,
        )}
      >
        <Search className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
      </button>
      {open && <SearchDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const { livePackages } = useContent();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => search(livePackages, query), [livePackages, query]);

  useEffect(() => {
    inputRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);
  useEffect(() => setCursor(0), [query]);

  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') return onClose();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, Math.max(hits.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter' && hits[cursor]) {
      e.preventDefault();
      go(`/health-package/${hits[cursor].pkg.slug}`);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-start justify-center px-4 pt-[10vh]" onKeyDown={onKeyDown}>
      <button type="button" aria-label="Close search" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-navy-950/45 backdrop-blur-md" />
      <div role="dialog" aria-modal="true" aria-label="Search tests and packages" className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-[0_40px_90px_-30px_rgba(11,32,88,0.55)] ring-1 ring-brand-100">
        <div className="flex items-center gap-3 border-b border-ink-line px-5">
          <Search className="h-5 w-5 shrink-0 text-ink-soft" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a test or package — e.g. thyroid, HbA1c, vitamin D"
            aria-label="Search"
            aria-controls="search-results"
            className="h-16 min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-ink-soft/70 focus:outline-none"
          />
          <button type="button" onClick={onClose} aria-label="Close search" className="rounded-full p-1.5 text-ink-muted hover:bg-mist hover:text-ink">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div id="search-results" className="max-h-[60vh] overflow-y-auto p-3">
          {query.trim().length < 2 ? (
            <>
              <p className="px-3 pb-2 pt-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-ink-soft">Quick links</p>
              <ul>
                {SHORTCUTS.map(({ to, label, Icon }) => (
                  <li key={to}>
                    <Link to={to} onClick={onClose} className="flex items-center gap-3 rounded-xl px-3 py-3 text-[14.5px] font-semibold text-ink hover:bg-mist hover:text-brand-700">
                      <Icon className="h-[18px] w-[18px] text-brand-600" aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : hits.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="font-semibold text-ink">No package matches “{query.trim()}”.</p>
              <p className="mt-1.5 text-[14px] text-ink-muted">
                Can’t find it?{' '}
                <Link to="/upload-prescription" onClick={onClose} className="font-semibold text-brand-600 hover:underline">
                  Upload your prescription
                </Link>{' '}
                and the lab will tell you what to book.
              </p>
            </div>
          ) : (
            <ul role="listbox" aria-label="Results">
              {hits.map((h, i) => {
                const price = h.pkg.offerPrice ?? h.pkg.price;
                return (
                  <li key={h.pkg.id} role="option" aria-selected={i === cursor}>
                    <Link
                      to={`/health-package/${h.pkg.slug}`}
                      onClick={onClose}
                      onMouseEnter={() => setCursor(i)}
                      className={cn('flex items-start gap-3 rounded-xl px-3 py-3', i === cursor ? 'bg-brand-50' : 'hover:bg-mist')}
                    >
                      <FlaskConical className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand-600" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-semibold text-ink">{h.pkg.name}</span>
                        <span className="block truncate text-[12.5px] text-ink-muted">
                          {h.tests.length > 0 ? `Includes ${h.tests.join(', ')}` : `${h.pkg.tests.length} tests · report ${h.pkg.reportTime}`}
                        </span>
                      </span>
                      <span className="shrink-0 text-[13.5px] font-bold tabular-nums text-ink">
                        {price !== null ? formatPrice(price) : 'On request'}
                      </span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link to={`/health-package`} onClick={onClose} className="mt-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-brand-600 hover:bg-mist">
                  Browse all packages
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
