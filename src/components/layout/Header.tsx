import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronRight,
  Clock,
  CalendarClock,
  FileText,
  FlaskConical,
  HelpCircle,
  Home,
  Info,
  MapPin,
  MessageCircle,
  Menu,
  Newspaper,
  Phone,
  Handshake,
  Receipt,
  ShieldCheck,
  Tag,
  UploadCloud,
  UserRound,
  X,
} from 'lucide-react';
import { Button, ButtonArrow } from '@/components/common/Button';
import { NAV_LINKS, SERVICE_LINKS, SITE_CONFIG, telHref, whatsappHref } from '@/config/site';
import { cn } from '@/lib/cn';
import { useSheen } from '@/hooks/useSheen';
import { VisitButton } from '@/components/packages/VisitPlanner';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { useAuth } from '@/store/auth';
import { SiteSearchButton } from '@/components/layout/SiteSearch';
import { Avatar } from '@/components/account/AccountShell';

/**
 * Log in / My account. While Firebase is still loading it renders the
 * signed-out label, so the header never jumps between two widths for a
 * returning visitor beyond a single swap.
 */
/**
 * The icon a drawer row carries, by destination.
 *
 * Keyed by href rather than passed in from site.ts, because NAV_LINKS and
 * SERVICE_LINKS are plain data shared with the footer and the search panel —
 * putting React components in them would drag an icon library into places
 * that only want labels and URLs.
 */
const ROW_ICONS: Record<string, typeof Home> = {
  '/': Home,
  '/about-us': Info,
  '/health-package': FlaskConical,
  '/my-offers': Tag,
  '/blog': Newspaper,
  '/contact-us': Phone,
  '/upload-prescription': UploadCloud,
  '/lab-locations': MapPin,
  '/help': HelpCircle,
  '/partner-with-us': Handshake,
  '/account/reports': FileText,
  '/account/bookings': CalendarClock,
  '/account/requests': Receipt,
};

/** Account destinations, offered in the drawer only once there is a session. */
const ACCOUNT_LINKS = [
  { label: 'My Reports', href: '/account/reports' },
  { label: 'My Bookings', href: '/account/bookings' },
  { label: 'My Requests', href: '/account/requests' },
] as const;

/**
 * One row of the drawer: icon, label, chevron.
 *
 * The chevron replaced a right-aligned index number. The number was decoration
 * — it counted the items, which the reader can see — where a chevron says the
 * row goes somewhere, which is the only thing a menu row needs to say.
 */
function DrawerRow({ href, label, muted = false }: { href: string; label: string; muted?: boolean }) {
  const Icon = ROW_ICONS[href] ?? ChevronRight;
  return (
    <li>
      <NavLink
        to={href}
        end={href === '/'}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3.5 rounded-xl px-3 py-3 transition-colors',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
            isActive ? 'bg-brand-50' : 'hover:bg-slate-50',
          )
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors',
                isActive
                  ? 'bg-brand-100 text-brand-700 ring-brand-200'
                  : 'bg-white text-brand-600 ring-ink-line',
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
            </span>
            <span
              className={cn(
                'min-w-0 flex-1 truncate font-semibold',
                muted ? 'text-[15px]' : 'text-[16px]',
                isActive ? 'text-brand-700' : 'text-ink',
              )}
            >
              {label}
            </span>
            <ChevronRight
              className="h-[18px] w-[18px] shrink-0 text-ink-soft/70"
              strokeWidth={2.2}
              aria-hidden="true"
            />
          </>
        )}
      </NavLink>
    </li>
  );
}

function AccountButton({ className, withLabel = false }: { className?: string; withLabel?: boolean }) {
  const { status, profile, isAdmin } = useAuth();
  const signedIn = status === 'signed-in';
  const to = signedIn ? (isAdmin ? '/admin' : '/account') : '/login';
  const label = signedIn ? (isAdmin ? 'Admin' : profile?.name?.split(' ')[0] || 'My account') : 'Log in';

  return (
    <Link
      to={to}
      aria-label={signedIn ? `${label} — your account` : 'Log in or sign up'}
      className={cn(
        'flex h-10 items-center gap-2 rounded-full border border-brand-100 bg-white px-3.5 text-[13.5px] font-semibold text-ink-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        className,
      )}
    >
      {signedIn ? <Avatar size="sm" className="-ml-1.5" /> : <UserRound className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden="true" />}
      <span className={cn('max-w-[9rem] truncate', !withLabel && 'hidden 2xl:inline')}>{label}</span>
    </Link>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const sheen = useSheen<HTMLDivElement>();
  const [menuOpen, setMenuOpen] = useState(false);
  /* The drawer offers account rows only once there is a session to back them. */
  const { status: authStatus } = useAuth();
  const signedIn = authStatus === 'signed-in';
  const location = useLocation();
  const reduced = usePrefersReducedMotion();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /*
    Every public route opens on the deep navy hero or masthead, so the header
    can sit transparent on top of it and let the section run to the top edge.
    The admin area opens on a light background, where light-on-transparent
    would be unreadable — so it stays in the solid capsule state throughout.
  */
  const onLightPage = ['/admin', '/account', '/login'].some((p) => location.pathname.startsWith(p));
  const floating = scrolled || onLightPage;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the drawer on navigation.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Lock the page behind the drawer and restore focus when it closes.
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    // Move focus into the drawer for screen-reader and keyboard users.
    window.requestAnimationFrame(() =>
      panelRef.current?.querySelector<HTMLElement>('a[href], button')?.focus(),
    );

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      {/*
        Light header, two states: a glass bar at rest, contracting into a
        floating glass capsule on scroll.

        Both states use the shared `.glass` recipe — gradient fill, saturated
        backdrop, and the inset 1px specular lip along the top edge. The lip is
        what sells it: a flat translucent fill over the hero mesh reads as a
        grey band, whereas an edge that catches light reads as a pane sitting
        above the page. The capsule adds the pointer-tracking sheen, since a
        capsule is small enough for a highlight to cross it in one gesture.

        This was dark for as long as the hero was dark navy. Now the hero is
        white with a colour mesh, so a dark bar is the thing that cuts across
        it — the polarity flipped with the palette.
      */}
      <header className="fixed inset-x-0 top-0 z-50">
        {/*
          Utility strip.

          A clinic's phone number, hours and accreditation are the things
          visitors most often arrive looking for, and burying them in the
          footer means scrolling past a long page to reach them. The strip puts
          them at the very top at rest and collapses to nothing the moment the
          page moves, so it costs no height once you are reading. Desktop only:
          below xl there is no room beside the logo, and the drawer already
          carries the same details.
        */}
        <div
          data-header-strip=""
          aria-hidden={floating}
          className={cn(
            'hidden overflow-hidden transition-all duration-400 ease-premium xl:block',
            floating ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100',
          )}
        >
          <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-mint-600">
            <div className="mx-auto flex h-10 w-full max-w-shell items-center justify-between gap-6 px-[clamp(2.5rem,4.5vw,5.5rem)] text-white">
              <p className="flex min-w-0 items-center gap-2 text-[12px] font-semibold">
                <ShieldCheck className="h-[15px] w-[15px] shrink-0" strokeWidth={2.4} aria-hidden="true" />
                <span className="truncate uppercase tracking-[0.04em]">{SITE_CONFIG.legalName}</span>
              </p>

              <div className="flex items-center gap-6 text-[12px]">
                <p className="flex items-center gap-2 text-white/90">
                  <Clock className="h-[15px] w-[15px]" strokeWidth={2.2} aria-hidden="true" />
                  {SITE_CONFIG.hours[0].days}
                  <span className="font-semibold tabular-nums">{SITE_CONFIG.hours[0].time}</span>
                </p>
                <a
                  href={telHref()}
                  className="flex items-center gap-2 font-semibold tabular-nums underline-offset-4 transition-colors hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <Phone className="h-[15px] w-[15px]" strokeWidth={2.4} aria-hidden="true" />
                  {SITE_CONFIG.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div
          data-header-shell=""
          className={cn(
            'relative transition-all duration-400 ease-premium',
            floating
              ? 'px-3 pt-3 sm:px-6 sm:pt-4'
              : 'glass-bar rounded-none border-x-0 border-t-0 border-b-white/60 px-0 pt-0',
          )}
        >
          <div
            data-header-bar=""
            {...(floating ? sheen : {})}
            className={cn(
              'mx-auto flex w-full items-center justify-between gap-3 transition-all duration-400 ease-premium sm:gap-6',
              floating
                ? 'glass-bar glass-sheen h-[62px] rounded-full px-3 sm:px-5 lg:h-[68px] lg:px-6'
                : 'h-[74px] px-3.5 sm:px-8 lg:h-[76px] lg:px-[clamp(2.5rem,4.5vw,5.5rem)]',
            )}
          >
            <Link
              to="/"
              /*
                The percentage cap is what actually bounds the logo. `max-w-full`
                on the image resolves against this link, and the link was
                content-sized — so the image's own height-driven width (h-8 on a
                1400x223 file is ~200px) was the constraint, and nothing made it
                give way. At 320-360px with the accessibility panel's 140% text
                scale that left ~228px of layout space for a bar that wanted
                270px, and the page scrolled sideways. Capping the link gives
                `max-w-full` something real to clamp to; `object-contain`
                letterboxes rather than distorting.
              */
              className="min-w-0 max-w-[58%] rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500 sm:max-w-none"
              aria-label={`${SITE_CONFIG.brandName} — home`}
            >
              {/* Light variant: the bar is dark in both the resting and floating states. */}
              <img
                src="/brand/healthcare-labs-logo-460.png"
                alt={SITE_CONFIG.brandName}
                width={460}
                height={73}
                /*
                  The logo is 1400x223, so at h-8 it wants ~200px. At the
                  accessibility panel's 140% text zoom the effective viewport is
                  only ~279 CSS px, and logo + trigger + gaps + padding pushed
                  the fixed bar past the screen edge.

                  `max-w-full` plus a shrinkable parent fixes it where a `vw`
                  cap could not: `vw` resolves against the unzoomed viewport, so
                  it never engaged. `object-contain` keeps the aspect ratio while
                  the box narrows.
                */
                className="h-8 w-auto max-w-full object-contain lg:h-9"
                {...({ fetchpriority: 'high' } as Record<string, string>)} /* React 18 only knows the lowercase attribute */
              />
            </Link>

            {/*
              Desktop nav starts at xl, not lg. Six links plus two icon
              buttons plus the CTA do not fit between 1024 and 1180 — the link
              text wrapped to a second line and pushed the bar to 60px. Below
              xl the drawer handles it, which is the better experience anyway.
            */}
            <nav aria-label="Primary" className="hidden xl:block">
              <ul className="flex items-center gap-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.href} className="relative">
                    <NavLink
                      to={link.href}
                      end={link.href === '/'}
                      className={({ isActive }) =>
                        cn(
                          'relative block whitespace-nowrap rounded-full px-3.5 py-2 text-[14.5px] font-medium transition-colors duration-200',
                          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                          isActive ? 'text-brand-700' : 'text-ink-muted hover:text-ink',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {link.label}
                          {isActive && (
                            <motion.span
                              layoutId={reduced ? undefined : 'nav-active'}
                              aria-hidden="true"
                              className="absolute inset-0 -z-10 rounded-full bg-brand-50 ring-1 ring-inset ring-brand-200/70"
                              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            {/* ---- Desktop actions ---- */}
            <div className="hidden items-center gap-2 xl:flex">
              {/*
                The visit plan lives in the header rather than as a sixth
                floating dock. A cart belongs where people look for one.
              */}
              <SiteSearchButton className="border border-brand-100 bg-white" />
              <VisitButton className="border border-brand-100 bg-white" />
              <AccountButton />
              <a
                href={telHref()}
                aria-label={`Call ${SITE_CONFIG.brandName} on ${SITE_CONFIG.phoneDisplay}`}
                /*
                  Wide screens only. Search and account took the room below
                  1536px, and the number is in the utility strip above while
                  WhatsApp has its own floating button.
                */
                className="hidden h-10 w-10 items-center 2xl:flex justify-center rounded-full border border-brand-100 bg-white text-ink-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                <Phone className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
              </a>
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with Healthcare Labs on WhatsApp"
                className="hidden h-10 w-10 items-center 2xl:flex justify-center rounded-full border border-mint-100 bg-white text-ink-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-mint-300 hover:text-mint-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                <MessageCircle className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
              </a>
              <Button
                to="/contact-us#home-collection"
                size="md"
                className="ml-2 whitespace-nowrap !rounded-full shadow-glow"
              >
                Book a Health Check
                <ButtonArrow />
              </Button>
            </div>

            {/* ---- Mobile trigger ---- */}
            <SiteSearchButton className="ml-auto border border-brand-100 bg-white xl:hidden" />
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-100 bg-white text-ink transition-colors hover:border-brand-300 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 xl:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* ---- Mobile drawer ---- */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[60] xl:hidden"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 h-full w-full cursor-default bg-navy-950/45 backdrop-blur-md"
            />

            <motion.div
              ref={panelRef}
              id="mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={reduced ? false : { x: '100%' }}
              animate={{ x: 0 }}
              exit={reduced ? undefined : { x: '100%' }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="glass-solid absolute inset-y-0 right-0 flex w-[min(400px,88vw)] flex-col rounded-none border-y-0 border-r-0"
            >
              <div className="flex h-[74px] shrink-0 items-center justify-between border-b border-ink-line px-6">
                <img
                  src="/brand/healthcare-labs-logo-460.png"
                  alt={SITE_CONFIG.brandName}
                  className="h-7 w-auto"
                />
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-line text-ink transition-colors hover:border-brand-300 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                >
                  <X className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                </button>
              </div>

              {/*
                An icon-led list, the shape a phone menu is expected to take:
                one tappable row per destination, the icon carrying the
                recognition and the chevron saying it leads somewhere.

                The account group only appears once there is a session. Before
                that it would be three rows that bounce straight to the login
                page, which is a menu lying about what it can do.
              */}
              <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-4 py-4">
                <ul className="space-y-0.5">
                  {NAV_LINKS.map((link) => (
                    <DrawerRow key={link.href} href={link.href} label={link.label} />
                  ))}
                </ul>

                {signedIn && (
                  <>
                    <p className="mt-5 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-soft">
                      My account
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {ACCOUNT_LINKS.map((link) => (
                        <DrawerRow key={link.href} href={link.href} label={link.label} muted />
                      ))}
                    </ul>
                  </>
                )}

                <p className="mt-5 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-soft">
                  Services
                </p>
                <ul className="mt-1 space-y-0.5">
                  {SERVICE_LINKS.map((link) => (
                    <DrawerRow key={link.href} href={link.href} label={link.label} muted />
                  ))}
                </ul>
              </nav>

              <div className="shrink-0 space-y-3 border-t border-ink-line bg-mist px-6 py-6">
                <AccountButton withLabel className="h-11 w-full justify-center text-[14.5px]" />
                <Button to="/contact-us#home-collection" size="lg" className="w-full">
                  Book a Health Check
                  <ButtonArrow />
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button href={telHref()} variant="secondary" size="md">
                    <Phone className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    Call
                  </Button>
                  <Button href={whatsappHref()} variant="secondary" size="md">
                    <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    WhatsApp
                  </Button>
                </div>
                <p className="pt-1 text-center text-[12.5px] text-ink-soft">
                  {SITE_CONFIG.hours[0].days} · {SITE_CONFIG.hours[0].time}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
