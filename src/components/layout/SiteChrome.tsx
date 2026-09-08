import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, MessageCircle } from 'lucide-react';
import { SITE_CONFIG, whatsappHref } from '@/config/site';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';

/**
 * Restores scroll position on navigation. React Router keeps the scroll offset
 * between routes by default, which lands visitors halfway down a new page.
 * Hash targets are honoured so in-page anchors keep working.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (hash) {
      // Wait a frame so the target has been rendered.
      const id = window.requestAnimationFrame(() => {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
          return;
        }
        window.scrollTo(0, 0);
      });
      return () => window.cancelAnimationFrame(id);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash, reduced]);

  return null;
}

/** Announces route changes to assistive technology. */
export function RouteAnnouncer() {
  const { pathname } = useLocation();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const id = window.setTimeout(() => setMessage(`${document.title} — page loaded`), 220);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}

export function FloatingActions() {
  const [showTop, setShowTop] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > window.innerHeight * 1.2);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-7 sm:right-7">
      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            onClick={() =>
              window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
            }
            aria-label="Back to top"
            initial={reduced ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.22 }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-line bg-white text-ink-muted shadow-lift transition-all duration-200 hover:-translate-y-0.5 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>

      <a
        href={whatsappHref()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Message ${SITE_CONFIG.brandName} on WhatsApp`}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_32px_-10px_rgba(37,211,102,0.75)] transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_rgba(37,211,102,0.9)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
      >
        {!reduced && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-[#25D366]/40 animate-pulse-ring"
          />
        )}
        <MessageCircle className="relative h-[26px] w-[26px]" strokeWidth={2} aria-hidden="true" />
        <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-navy-900 px-3 py-2 text-[13px] font-medium text-white opacity-0 shadow-lift transition-opacity duration-200 group-hover:opacity-100 lg:block">
          Chat with us
        </span>
      </a>
    </div>
  );
}
