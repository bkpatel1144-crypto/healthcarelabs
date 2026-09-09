import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Package,
  Quote,
  Settings,
  Tag,
  TriangleAlert,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { SITE_CONFIG } from '@/config/site';
import { useContent } from '@/store/content';

export const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/packages', label: 'Packages', Icon: Package },
  { to: '/admin/offers', label: 'Offers', Icon: Tag },
  { to: '/admin/blog', label: 'Blog', Icon: FileText },
  { to: '/admin/testimonials', label: 'Testimonials', Icon: Quote },
  { to: '/admin/leads', label: 'Leads', Icon: MessageSquare },
  { to: '/admin/appointments', label: 'Appointments', Icon: CalendarClock },
  { to: '/admin/settings', label: 'Settings', Icon: Settings },
] as const;

/**
 * Client-side content manager. This is explicitly NOT a secure admin area —
 * there is no server, no authentication and no authorisation. It edits the copy
 * of the catalogue held in this browser's local storage, which is why the
 * banner below says so plainly and the routes are marked noindex.
 */
export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { appointments, contacts } = useContent();
  const newLeads =
    appointments.filter((a) => a.status === 'new').length +
    contacts.filter((c) => c.status === 'new').length;

  return (
    <div className="min-h-screen bg-mist pt-[74px] lg:pt-[84px]">
      <div className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-shell items-center gap-3 px-5 py-3 text-[13px] text-amber-800 sm:px-8 lg:px-12">
          <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
          <p>
            <strong className="font-semibold">Local content manager.</strong> There is no server and
            no authentication — everything you change here is stored in this browser only and is not
            published to anyone else.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-shell px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-10">
          {/* ---- Sidebar ---- */}
          <aside className="lg:col-span-3 xl:col-span-2">
            <Link
              to="/"
              className="group mb-6 inline-flex items-center gap-2 text-[13px] font-semibold text-ink-muted transition-colors hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
            >
              <ArrowLeft
                className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
                strokeWidth={2.2}
                aria-hidden="true"
              />
              Back to site
            </Link>

            <nav aria-label="Admin sections">
              <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-2 lg:mx-0 lg:block lg:space-y-0.5 lg:overflow-visible lg:px-0 lg:pb-0">
                {ADMIN_LINKS.map(({ to, label, Icon, ...rest }) => (
                  <li key={to} className="shrink-0">
                    <NavLink
                      to={to}
                      end={'end' in rest ? rest.end : undefined}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors',
                          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                          isActive
                            ? 'bg-white text-brand-600 shadow-sm ring-1 ring-ink-line'
                            : 'text-ink-muted hover:bg-white/60 hover:text-ink',
                        )
                      }
                    >
                      <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={2} aria-hidden="true" />
                      {label}
                      {(label === 'Leads' || label === 'Appointments') && newLeads > 0 && (
                        <span className="ml-auto hidden rounded-full bg-brand-500 px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums text-white lg:inline">
                          {newLeads}
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* ---- Content ---- */}
          <main className="mt-8 lg:col-span-9 lg:mt-0 xl:col-span-10">
            <header className="flex flex-col gap-4 border-b border-ink-line pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-[26px] font-extrabold tracking-editorial text-ink">{title}</h1>
                {description && (
                  <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-ink-muted">
                    {description}
                  </p>
                )}
              </div>
              {actions && <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div>}
            </header>
            <div className="pt-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ toolbar */

export function AdminToolbar({
  query,
  onQuery,
  placeholder,
  right,
}: {
  query: string;
  onQuery: (v: string) => void;
  placeholder: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <label htmlFor="admin-search" className="sr-only">
        {placeholder}
      </label>
      <input
        id="admin-search"
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-ink-line bg-white px-4 text-[14.5px] text-ink placeholder:text-ink-soft/70 transition-colors focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100 sm:max-w-sm"
      />
      {right && <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{right}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------- modal */

export function AdminModal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    window.requestAnimationFrame(() =>
      panelRef.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus(),
    );
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 h-full w-full cursor-default bg-navy-950/50 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative my-auto w-full max-w-2xl rounded-3xl bg-white shadow-[0_40px_90px_-30px_rgba(11,32,88,0.5)] ring-1 ring-brand-100"
      >
        <div className="border-b border-ink-line px-7 py-5">
          <h2 className="text-[19px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-7 py-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2.5 border-t border-ink-line px-7 py-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- confirm */

export function useConfirm() {
  const [pending, setPending] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const confirm = (message: string, onConfirm: () => void) => setPending({ message, onConfirm });

  const dialog = (
    <AdminModal
      open={pending !== null}
      onClose={() => setPending(null)}
      title="Please confirm"
      footer={
        <>
          <button
            type="button"
            onClick={() => setPending(null)}
            className="h-10 rounded-lg border border-ink-line px-4 text-[14px] font-semibold text-ink transition-colors hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              pending?.onConfirm();
              setPending(null);
            }}
            className="h-10 rounded-lg bg-rose-600 px-4 text-[14px] font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
          >
            Yes, do it
          </button>
        </>
      }
    >
      <p className="text-[15px] leading-relaxed text-ink-muted">{pending?.message}</p>
    </AdminModal>
  );

  return { confirm, dialog };
}

/* --------------------------------------------------------------- empty state */

export function AdminEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-brand-100 bg-white px-6 py-16 text-center">
      <p className="text-[15px] text-ink-muted">{message}</p>
    </div>
  );
}

/** Marks admin routes as noindex — they must never appear in search results. */
export function useAdminSeo(title: string) {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = `${title} — Admin | ${SITE_CONFIG.brandName}`;
    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = 'noindex, nofollow';
  }, [title, pathname]);
}
