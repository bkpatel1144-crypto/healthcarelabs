import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';

/**
 * Drives the pointer-tracking specular highlight on `.glass-sheen` panes.
 *
 * Returns props to spread onto the pane. It writes three CSS custom
 * properties — `--sheen-x`, `--sheen-y` and `--sheen` — straight onto the
 * element's style, and the highlight itself is drawn by CSS. Nothing goes
 * through React state, so a pointer moving across a pane does not re-render
 * anything.
 *
 * Positions are written on the next animation frame rather than on every
 * pointermove, so a high-polling-rate mouse cannot queue more style writes
 * than the compositor will draw.
 *
 * The CSS hides the highlight entirely on coarse pointers and under
 * `prefers-reduced-motion`, so there is no need to branch here — the handlers
 * simply have nothing to show.
 */
export function useSheen<T extends HTMLElement = HTMLDivElement>() {
  const frame = useRef(0);
  const next = useRef<{ el: T; x: number; y: number } | null>(null);

  const onPointerMove = useCallback((e: ReactPointerEvent<T>) => {
    // Ignore emulated pointer events from touch: there is no hover to track.
    if (e.pointerType !== 'mouse') return;
    const el = e.currentTarget;
    const box = el.getBoundingClientRect();
    next.current = {
      el,
      x: ((e.clientX - box.left) / box.width) * 100,
      y: ((e.clientY - box.top) / box.height) * 100,
    };
    if (frame.current) return;
    frame.current = window.requestAnimationFrame(() => {
      frame.current = 0;
      const pending = next.current;
      if (!pending) return;
      pending.el.style.setProperty('--sheen-x', `${pending.x}%`);
      pending.el.style.setProperty('--sheen-y', `${pending.y}%`);
      pending.el.style.setProperty('--sheen', '1');
    });
  }, []);

  const onPointerLeave = useCallback((e: ReactPointerEvent<T>) => {
    if (frame.current) {
      window.cancelAnimationFrame(frame.current);
      frame.current = 0;
    }
    next.current = null;
    e.currentTarget.style.setProperty('--sheen', '0');
  }, []);

  return { onPointerMove, onPointerLeave };
}
