import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS, storage } from '@/lib/storage';

/**
 * Accessibility preferences, persisted per browser and applied to <html>.
 *
 * Everything is expressed as a data-attribute or an inline style on the root
 * element, so the CSS in index.css does the work and no component needs to know
 * a preference exists.
 */

const KEY = STORAGE_KEYS.accessibility;

/**
 * Text scale steps. Implemented with `zoom` rather than a root font-size,
 * because this design sets type in px throughout (`text-[15px]` and friends) —
 * a root font-size change would move nothing. `zoom` reflows properly, unlike
 * a transform, which would break the fixed header and every sticky element.
 */
export const SCALE_STEPS = [0.9, 1, 1.1, 1.25, 1.4] as const;
const DEFAULT_STEP = 1; // index into SCALE_STEPS -> 1.0

export interface A11yPrefs {
  /** Index into SCALE_STEPS. */
  scaleStep: number;
  highContrast: boolean;
  dyslexicFont: boolean;
}

export const DEFAULT_PREFS: A11yPrefs = {
  scaleStep: DEFAULT_STEP,
  highContrast: false,
  dyslexicFont: false,
};

function clampStep(n: unknown): number {
  const i = typeof n === 'number' ? Math.round(n) : DEFAULT_STEP;
  return Math.min(SCALE_STEPS.length - 1, Math.max(0, i));
}

function apply(prefs: A11yPrefs) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const scale = SCALE_STEPS[prefs.scaleStep];
  if (scale === 1) root.style.removeProperty('zoom');
  else root.style.setProperty('zoom', String(scale));

  root.toggleAttribute('data-a11y-contrast', prefs.highContrast);
  root.toggleAttribute('data-a11y-dyslexic', prefs.dyslexicFont);
}

export function useAccessibilityPrefs() {
  const [prefs, setPrefs] = useState<A11yPrefs>(() => {
    const stored = storage.get<Partial<A11yPrefs>>(KEY, {});
    return {
      scaleStep: clampStep(stored.scaleStep),
      highContrast: Boolean(stored.highContrast),
      dyslexicFont: Boolean(stored.dyslexicFont),
    };
  });

  useEffect(() => {
    apply(prefs);
    storage.set(KEY, prefs);
  }, [prefs]);

  const scale = SCALE_STEPS[prefs.scaleStep];

  return {
    prefs,
    scale,
    canGrow: prefs.scaleStep < SCALE_STEPS.length - 1,
    canShrink: prefs.scaleStep > 0,
    grow: useCallback(
      () => setPrefs((p) => ({ ...p, scaleStep: clampStep(p.scaleStep + 1) })),
      [],
    ),
    shrink: useCallback(
      () => setPrefs((p) => ({ ...p, scaleStep: clampStep(p.scaleStep - 1) })),
      [],
    ),
    toggleContrast: useCallback(
      () => setPrefs((p) => ({ ...p, highContrast: !p.highContrast })),
      [],
    ),
    toggleDyslexic: useCallback(
      () => setPrefs((p) => ({ ...p, dyslexicFont: !p.dyslexicFont })),
      [],
    ),
    reset: useCallback(() => setPrefs(DEFAULT_PREFS), []),
    isDefault:
      prefs.scaleStep === DEFAULT_PREFS.scaleStep &&
      !prefs.highContrast &&
      !prefs.dyslexicFont,
  };
}

/* ------------------------------------------------------------ read the page */

type SpeechState = 'unsupported' | 'idle' | 'speaking';

/**
 * Reads the page's main content aloud via the Web Speech API.
 *
 * Text is pulled from `<main>` with interactive chrome stripped out, so the
 * listener does not sit through every nav label and button before reaching the
 * content. Speech is cancelled on unmount and on navigation.
 */
export function usePageSpeech() {
  const [state, setState] = useState<SpeechState>('idle');

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setState('unsupported');
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setState('idle');
  }, []);

  const speak = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const main = document.querySelector('main') ?? document.body;
    const clone = main.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll('nav, button, script, style, [aria-hidden="true"], .sr-only, svg')
      .forEach((el) => el.remove());

    const text = (clone.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 20000);
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = document.documentElement.lang || 'en-IN';
    utterance.rate = 0.95;
    utterance.onend = () => setState('idle');
    utterance.onerror = () => setState('idle');

    setState('speaking');
    window.speechSynthesis.speak(utterance);
  }, []);

  return { state, speak, stop };
}
