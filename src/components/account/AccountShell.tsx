import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Navigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  FileText,
  Home,
  LogOut,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { SITE_CONFIG } from '@/config/site';
import { cn } from '@/lib/cn';
import { PRIVACY_VERSION } from '@/types/account';

export const ACCOUNT_LINKS = [
  { to: '/account', label: 'My profile', Icon: UserRound, end: true },
  { to: '/account/bookings', label: 'My bookings', Icon: CalendarClock },
  { to: '/account/reports', label: 'My reports', Icon: FileText },
  { to: '/account/requests', label: 'My requests', Icon: MessageSquare },
  { to: '/account/family', label: 'Family members', Icon: Users },
  { to: '/account/addresses', label: 'Addresses', Icon: MapPin },
] as const;

export function FullPageSpinner() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center" role="status">
      <span className="sr-only">Loading</span>
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-500"
      />
    </div>
  );
}

/** Sends signed-out visitors to /login and brings them back afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'signed-out') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
}

export function useAccountSeo(title: string) {
  useEffect(() => {
    document.title = `${title} | ${SITE_CONFIG.brandName}`;
    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = 'noindex, nofollow';
  }, [title]);
}

export function AccountShell({
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
  const { profile, user, signOut, isAdmin, staff } = useAuth();
  useAccountSeo(title);

  const name = profile?.name || user?.displayName || 'Guest';
  const contact =
    (profile?.phone && `+91 ${profile.phone}`) || profile?.email || user?.email || '';

  return (
    <div className="min-h-screen bg-mist pt-[90px] lg:pt-[100px] xl:pt-[110px]">
      <div className="mx-auto max-w-shell px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-10">
          {/* ---- Sidebar ---- */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <Link
              to="/"
              className="group mb-5 inline-flex items-center gap-2 text-[13px] font-semibold text-ink-muted transition-colors hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.2} aria-hidden="true" />
              Back to site
            </Link>

            <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-ink-line">
              <div className="flex items-center gap-4 bg-gradient-to-br from-brand-50 to-mint-50 p-5">
                <Avatar />
                <div className="min-w-0">
                  <p className="truncate text-[17px] font-bold text-ink">{name}</p>
                  {contact && <p className="truncate text-[13.5px] text-ink-muted">{contact}</p>}
                </div>
              </div>

              <nav aria-label="My account" className="p-2">
                <ul className="flex gap-1 overflow-x-auto lg:block lg:space-y-0.5 lg:overflow-visible">
                  {ACCOUNT_LINKS.map(({ to, label, Icon, ...rest }) => (
                    <li key={to} className="shrink-0">
                      <NavLink
                        to={to}
                        end={'end' in rest ? rest.end : undefined}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-3 text-[14.5px] font-medium transition-colors',
                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                            isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-mist hover:text-ink',
                          )
                        }
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden="true" />
                        {label}
                      </NavLink>
                    </li>
                  ))}
                  {isAdmin && (
                    <li className="shrink-0">
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-3 text-[14.5px] font-medium text-ink-muted hover:bg-mist hover:text-ink"
                      >
                        <Home className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden="true" />
                        Lab admin panel
                      </Link>
                    </li>
                  )}
                  {staff && (
                    <li className="shrink-0">
                      <Link
                        to="/staff"
                        className="flex items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-3 text-[14.5px] font-medium text-ink-muted hover:bg-mist hover:text-ink"
                      >
                        <Stethoscope className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden="true" />
                        My collections
                      </Link>
                    </li>
                  )}
                  <li className="shrink-0">
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="flex w-full items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-3 text-[14.5px] font-medium text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                    >
                      <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden="true" />
                      Log out
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </aside>

          {/* ---- Content ---- */}
          <main id="main" className="mt-8 lg:col-span-8 lg:mt-0 xl:col-span-9">
            <header className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-[28px] font-extrabold tracking-editorial text-ink">{title}</h1>
                {description && (
                  <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-ink-muted">{description}</p>
                )}
              </div>
              {actions && <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div>}
            </header>
            <ConsentPrompt />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * Asks once for consent to the current privacy notice — affirmatively, with
 * marketing as a separate unticked choice. Accounts made before consent
 * capture, or after the notice changes, see it until they answer.
 */
function ConsentPrompt() {
  const { user, profile } = useAuth();
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!user || !profile || profile.consent?.privacyVersion === PRIVACY_VERSION) return null;

  return (
    <section aria-labelledby="consent-title" className="mb-6 rounded-3xl bg-brand-50/70 p-5 ring-1 ring-brand-100 sm:p-6">
      <h2 id="consent-title" className="flex items-center gap-2 text-[16px] font-bold text-ink">
        <ShieldCheck className="h-5 w-5 text-brand-600" aria-hidden="true" />
        Your consent
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
        To keep your bookings and reports in this account, {SITE_CONFIG.brandName} needs your consent to process your
        personal and health information for testing and reporting, as set out in the{' '}
        <Link to="/privacy-policy" className="font-semibold text-brand-600 hover:underline">
          privacy notice
        </Link>
        . You can withdraw it at any time from My profile.
      </p>
      <label className="mt-3 flex items-start gap-2.5 text-[13.5px] text-ink-muted">
        <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-500" />
        Also send me offers and health check reminders (optional)
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const api = await import('@/lib/accountApi');
          await api.recordConsent(user.uid, marketing).finally(() => setBusy(false));
        }}
        className="mt-4 h-10 rounded-lg bg-brand-500 px-4 text-[14px] font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
      >
        I agree
      </button>
    </section>
  );
}

/**
 * The signed-in person's picture: their Google photo when they have one,
 * otherwise their initial. A broken photo link falls back to the initial.
 */
export function Avatar({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const { profile, user } = useAuth();
  const [broken, setBroken] = useState(false);
  const photo = !broken ? profile?.photoURL || user?.photoURL || '' : '';
  const name = profile?.name || user?.displayName || '';
  const box = size === 'sm' ? 'h-7 w-7 text-[12px]' : size === 'lg' ? 'h-16 w-16 text-[24px]' : 'h-14 w-14 text-[20px]';
  return photo ? (
    <img
      src={photo}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      className={cn('shrink-0 rounded-2xl object-cover ring-1 ring-brand-100', size === 'sm' && 'rounded-full', box, className)}
    />
  ) : (
    <span aria-hidden="true" className={cn('flex shrink-0 items-center justify-center rounded-2xl bg-white font-extrabold text-brand-600 ring-1 ring-brand-100', size === 'sm' && 'rounded-full bg-brand-50', box, className)}>
      {name.trim().charAt(0).toUpperCase() || <UserRound className="h-1/2 w-1/2" aria-hidden="true" />}
    </span>
  );
}

/** White card used by every account page. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-3xl bg-white p-6 ring-1 ring-ink-line sm:p-7', className)}>{children}</div>;
}

export function EmptyPanel({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-brand-100 bg-white px-6 py-14 text-center">
      <p className="text-[16px] font-semibold text-ink">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-[14px] text-ink-muted">{children}</div>}
    </div>
  );
}
