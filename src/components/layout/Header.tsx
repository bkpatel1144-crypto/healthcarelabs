import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Menu, Phone, X } from 'lucide-react';
import { Button, ButtonArrow } from '@/components/common/Button';
import { NAV_LINKS, SITE_CONFIG, telHref, whatsappHref } from '@/config/site';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
  const onLightPage = location.pathname.startsWith('/admin');
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
        Light header, two states: a clean white bar at rest, contracting into a
        floating white capsule on scroll.

        This was dark for as long as the hero was dark navy. Now the hero is
        white with a colour mesh, so a dark bar is the thing that cuts across
        it — the polarity flipped with the palette.
      */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div
          className={cn(
            'relative transition-all duration-400 ease-premium',
            floating
              ? 'px-3 pt-3 sm:px-6 sm:pt-4'
              : 'border-b border-brand-50 bg-white/80 px-0 pt-0 backdrop-blur-md',
          )}
        >
          <div
            className={cn(
              'mx-auto flex w-full items-center justify-between gap-3 transition-all duration-400 ease-premium sm:gap-6',
              floating
                ? 'h-[62px] rounded-full bg-white/85 px-4 shadow-card ring-1 ring-brand-50 backdrop-blur-xl backdrop-saturate-150 sm:px-5 lg:h-[68px] lg:px-6'
                : 'h-[74px] px-5 sm:px-8 lg:h-[84px] lg:px-[clamp(2.5rem,4.5vw,5.5rem)]',
            )}
          >
            <Link
              to="/"
              className="min-w-0 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
              aria-label={`${SITE_CONFIG.brandName} — home`}
            >
              {/* Light variant: the bar is dark in both the resting and floating states. */}
              <img
                src="/brand/healthcare-labs-logo.png"
                alt={SITE_CONFIG.brandName}
                width={1400}
                height={223}
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
                fetchPriority="high"
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
                  <li key={link.href}>
                    <NavLink
                      to={link.href}
                      end={link.href === '/'}
                      className={({ isActive }) =>
                        cn(
                          'relative block whitespace-nowrap rounded-lg px-3.5 py-2 text-[14.5px] font-medium transition-colors duration-200',
                          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                          isActive ? 'text-brand-600' : 'text-ink-muted hover:text-ink',
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
                              className="absolute inset-x-3.5 -bottom-px h-[2px] rounded-full bg-brand-500"
                              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
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
              <a
                href={telHref()}
                aria-label={`Call ${SITE_CONFIG.brandName} on ${SITE_CONFIG.phoneDisplay}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-100 bg-white text-ink-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                <Phone className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
              </a>
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with Healthcare Labs on WhatsApp"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-mint-100 bg-white text-ink-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-mint-300 hover:text-mint-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
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
              className="absolute inset-0 h-full w-full cursor-default bg-navy-950/55 backdrop-blur-sm"
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
              className="absolute inset-y-0 right-0 flex w-[min(400px,88vw)] flex-col bg-white shadow-2xl"
            >
              <div className="flex h-[74px] shrink-0 items-center justify-between border-b border-ink-line px-6">
                <img
                  src="/brand/healthcare-labs-logo.png"
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

              <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-4 py-5">
                <ul className="space-y-0.5">
                  {NAV_LINKS.map((link, i) => (
                    <li key={link.href}>
                      <NavLink
                        to={link.href}
                        end={link.href === '/'}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center justify-between rounded-xl px-4 py-3.5 text-[17px] font-semibold transition-colors',
                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                            isActive
                              ? 'bg-brand-50 text-brand-700'
                              : 'text-ink hover:bg-slate-50',
                          )
                        }
                      >
                        {link.label}
                        <span className="font-mono text-[11px] tabular-nums text-ink-soft/60">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="shrink-0 space-y-3 border-t border-ink-line bg-mist px-6 py-6">
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
