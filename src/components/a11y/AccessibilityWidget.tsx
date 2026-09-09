import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Accessibility,
  AArrowDown,
  AArrowUp,
  Contrast,
  RotateCcw,
  Square,
  Type,
  Volume2,
  X,
} from 'lucide-react';
import {
  SCALE_STEPS,
  useAccessibilityPrefs,
  usePageSpeech,
} from '@/hooks/useAccessibilityPrefs';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';

/**
 * Accessibility panel with a launcher tab pinned to the left edge.
 *
 * Offers text scaling, a high-contrast mode, OpenDyslexic, and read-aloud.
 * Preferences persist per browser; the panel itself only renders the controls —
 * the preferences are applied to `<html>` and the styling lives in index.css.
 *
 * Everything degrades: read-aloud hides itself when the Web Speech API is
 * absent, and the whole panel is keyboard-operable with a focus trap and
 * Escape to close, because an accessibility control that cannot be reached
 * without a mouse is worse than none.
 */
export function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const { pathname } = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const a11y = useAccessibilityPrefs();
  const speech = usePageSpeech();

  // Reading the previous page aloud after navigating away is disorienting.
  useEffect(() => {
    speech.stop();
  }, [pathname, speech.stop]);

  // Escape closes, Tab is trapped inside the panel, focus returns to the tab.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        launcherRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href]',
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !launcherRef.current?.contains(t)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    window.requestAnimationFrame(() =>
      panelRef.current?.querySelector<HTMLElement>('button')?.focus(),
    );
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const scalePercent = Math.round(SCALE_STEPS[a11y.prefs.scaleStep] * 100);

  return (
    <>
      {/* ---------------- Launcher tab ---------------- */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="a11y-panel"
        aria-label={open ? 'Close accessibility options' : 'Open accessibility options'}
        className={cn(
          'flex items-center',
          'fixed bottom-5 left-4 z-[65] h-14 w-14 justify-center rounded-full bg-navy-900',
          'sm:bottom-auto sm:left-0 sm:top-1/2 sm:h-auto sm:w-auto sm:-translate-y-1/2',
          'sm:rounded-l-none sm:rounded-r-xl sm:py-4 sm:pl-2 sm:pr-2.5',
          'text-white shadow-[0_10px_30px_-10px_rgba(3,10,32,0.7)] ring-1 ring-inset ring-white/15',
          'transition-colors hover:bg-navy-800',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400',
        )}
      >
        <span className="flex flex-col items-center gap-2">
          <Accessibility
            className="h-6 w-6 text-brand-300 sm:h-5 sm:w-5"
            strokeWidth={2.2}
            aria-hidden="true"
          />
          <span
            aria-hidden="true"
            className="hidden text-[10px] font-bold uppercase tracking-[0.14em] [writing-mode:vertical-rl] sm:inline"
          >
            A11Y
          </span>
        </span>
      </button>

      {/* ---------------- Panel ---------------- */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id="a11y-panel"
            role="dialog"
            aria-modal="false"
            aria-label="Accessibility options"
            initial={reduced ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? undefined : { opacity: 0, x: -16 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'fixed bottom-24 left-3 z-[66] w-[264px] rounded-2xl border border-ink-line',
              'sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2',
              'bg-white p-5 shadow-[0_28px_70px_-24px_rgba(11,32,88,0.5)]',
              'sm:left-14',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.14em] text-brand-600">
                <Accessibility className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                Accessibility
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  launcherRef.current?.focus();
                }}
                aria-label="Close accessibility options"
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-mist hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                <X className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>

            {/* ---- Text size ---- */}
            <Group label="Text size">
              <div className="grid grid-cols-2 gap-2">
                <Control
                  onClick={a11y.shrink}
                  disabled={!a11y.canShrink}
                  icon={<AArrowDown className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />}
                  label="A−"
                  srLabel="Decrease text size"
                  center
                />
                <Control
                  onClick={a11y.grow}
                  disabled={!a11y.canGrow}
                  icon={<AArrowUp className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />}
                  label="A+"
                  srLabel="Increase text size"
                  center
                />
              </div>
              <p aria-live="polite" className="mt-2 text-center text-[11.5px] tabular-nums text-ink-soft">
                {scalePercent}%
              </p>
            </Group>

            {/* ---- Display ---- */}
            <Group label="Display">
              <Control
                onClick={a11y.toggleContrast}
                pressed={a11y.prefs.highContrast}
                icon={<Contrast className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />}
                label="High contrast"
              />
              <Control
                onClick={a11y.toggleDyslexic}
                pressed={a11y.prefs.dyslexicFont}
                icon={<Type className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />}
                label="Dyslexia font"
              />
            </Group>

            {/* ---- Audio ---- */}
            {speech.state !== 'unsupported' && (
              <Group label="Audio">
                <Control
                  onClick={speech.state === 'speaking' ? speech.stop : speech.speak}
                  pressed={speech.state === 'speaking'}
                  icon={
                    speech.state === 'speaking' ? (
                      <Square className="h-3.5 w-3.5" strokeWidth={0} fill="currentColor" aria-hidden="true" />
                    ) : (
                      <Volume2 className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                    )
                  }
                  label={speech.state === 'speaking' ? 'Stop reading' : 'Listen to page'}
                />
              </Group>
            )}

            {/* ---- Reset ---- */}
            <button
              type="button"
              onClick={() => {
                a11y.reset();
                speech.stop();
              }}
              disabled={a11y.isDefault && speech.state !== 'speaking'}
              className={cn(
                'mt-5 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5',
                'text-[13px] font-semibold transition-colors',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500',
                a11y.isDefault && speech.state !== 'speaking'
                  ? 'cursor-not-allowed border-ink-line bg-white text-ink-soft/60'
                  : 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100',
              )}
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
              Reset all
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ------------------------------------------------------------------ pieces */

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/**
 * A control that is either a toggle (`pressed` given, so it reports
 * aria-pressed) or a plain action (`pressed` omitted).
 */
function Control({
  onClick,
  label,
  icon,
  pressed,
  disabled = false,
  srLabel,
  center = false,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  pressed?: boolean;
  disabled?: boolean;
  /** Spoken name, where the visible label is a glyph like "A+". */
  srLabel?: string;
  center?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      aria-label={srLabel}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        center ? 'justify-center' : 'gap-2.5',
        disabled && 'cursor-not-allowed border-ink-line bg-white text-ink-soft/50',
        !disabled && pressed && 'border-brand-500 bg-brand-500 text-white',
        !disabled && !pressed && 'border-ink-line bg-white text-ink hover:border-brand-300 hover:bg-brand-50',
      )}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
