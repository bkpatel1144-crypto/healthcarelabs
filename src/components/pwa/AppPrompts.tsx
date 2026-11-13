import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { STORAGE_KEYS, storage } from '@/lib/storage';

/**
 * The two things an installable app has to say for itself: that a new version
 * is ready, and that it can be installed at all.
 *
 * Both are deliberately quiet. They sit above the footer rather than over the
 * content, they are dismissible, and neither appears on a first page view —
 * a site that asks to be installed before it has been read is asking for a
 * favour it has not earned.
 */

/* ------------------------------------------------------------ update ready */

/**
 * A new build is on the server and the waiting service worker has it.
 *
 * This is a prompt rather than an automatic reload. `registerType: 'autoUpdate'`
 * would swap the version and reload the page the moment the new worker
 * activates — on a site where people are halfway through a booking form, that
 * throws their answers away to save them a tap.
 */
export function UpdatePrompt() {
  const reduced = usePrefersReducedMotion();
  const [dismissed, setDismissed] = useState(false);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Look for a new build hourly, so a long-lived tab does not sit on a
      // stale version for a whole day.
      if (registration) {
        setInterval(() => void registration.update().catch(() => {}), 60 * 60 * 1000);
      }
    },
  });

  if (!needRefresh || dismissed) return null;

  return (
    <Bar
      reduced={reduced}
      icon={<RefreshCw className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />}
      title="A new version is ready"
      body="Refresh to get the latest packages, prices and fixes."
      actionLabel="Refresh"
      onAction={() => void updateServiceWorker(true)}
      onDismiss={() => setDismissed(true)}
    />
  );
}

/* ------------------------------------------------------------- install app */

/**
 * The event Chrome fires when the app meets the installability bar. It is not
 * in lib.dom, so it is described here rather than reached for with `any`.
 */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** How long a "not now" is respected before the offer comes back. */
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;
const SNOOZE_KEY = STORAGE_KEYS.installSnoozed;

export function InstallPrompt() {
  const reduced = usePrefersReducedMotion();
  const [ready, setReady] = useState(false);
  const [gone, setGone] = useState(false);
  const deferred = useRef<InstallPromptEvent | null>(null);

  useEffect(() => {
    /*
      Already installed? Then there is nothing to offer. Chrome does not fire
      the event for an installed app, but Safari has no event at all, so the
      display-mode check is what covers iOS.
    */
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari, which predates the standard and never adopted it.
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const snoozedAt = storage.get<number | null>(SNOOZE_KEY, null);
    if (typeof snoozedAt === 'number' && Date.now() - snoozedAt < SNOOZE_MS) return;

    const onPrompt = (event: Event) => {
      // Holding the event is what lets the page choose the moment to ask.
      event.preventDefault();
      deferred.current = event as InstallPromptEvent;
      setReady(true);
    };
    const onInstalled = () => {
      setGone(true);
      storage.remove(SNOOZE_KEY);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const event = deferred.current;
    if (!event) return;
    setReady(false);
    await event.prompt();
    const { outcome } = await event.userChoice;
    deferred.current = null;
    // A declined install is a "not now", not a "never" — snooze, do not nag.
    if (outcome === 'dismissed') storage.set(SNOOZE_KEY, Date.now());
  }, []);

  if (!ready || gone) return null;

  return (
    <Bar
      reduced={reduced}
      icon={<Download className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />}
      title="Install Healthcare Labs"
      body="Add it to your home screen — opens like an app, no browser bar."
      actionLabel="Install"
      onAction={() => void install()}
      onDismiss={() => {
        setReady(false);
        storage.set(SNOOZE_KEY, Date.now());
      }}
    />
  );
}

/* ------------------------------------------------------------------ shared */

function Bar({
  reduced,
  icon,
  title,
  body,
  actionLabel,
  onAction,
  onDismiss,
}: {
  reduced: boolean;
  icon: React.ReactNode;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        role="status"
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduced ? undefined : { opacity: 0, y: 12 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        /*
          Bottom-left. The assistant and the back-to-top button own the bottom
          right, and two things fighting for the same corner on a phone is how
          a tap lands on the wrong one.
        */
        className="fixed bottom-5 left-4 z-[45] w-[min(360px,calc(100vw-2rem))] rounded-2xl bg-white p-4 shadow-liftLg ring-1 ring-ink-line sm:bottom-7 sm:left-7"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold leading-tight text-ink">{title}</p>
            <p className="mt-1 text-[12.5px] leading-snug text-ink-muted">{body}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Not now"
            className="-mr-1 -mt-1 rounded-full p-1.5 text-ink-soft transition-colors hover:bg-mist hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            <X className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          onClick={onAction}
          className="mt-3 h-10 w-full rounded-xl bg-brand-600 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          {actionLabel}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
