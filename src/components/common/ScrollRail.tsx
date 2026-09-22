import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * A two-pixel scroll indicator in the brand colours.
 *
 * It is drawn rather than styled because the browser will not do it. Chrome has
 * moved to the standard `scrollbar-width` / `scrollbar-color` properties, which
 * offer `auto | thin | none` and no pixel control at all — `thin` lands around
 * eleven pixels. The `::-webkit-scrollbar` pseudo-elements that used to give
 * exact widths are now ignored outright: measured in this browser, a styled
 * scrollbar reserved zero gutter at every declared width from 1px to 12px, so
 * the rules compiled, shipped, and did nothing.
 *
 * So the native bar is hidden and this takes its place. It is an indicator, not
 * a control — which costs nothing, because a two-pixel bar was never going to
 * be dragged. Scrolling by wheel, trackpad, touch, keyboard and find-in-page is
 * untouched, and the rail is aria-hidden because the scroll container it
 * describes is already reachable and announced on its own.
 */
export function ScrollRail({
  targetRef,
  axis = 'y',
  className,
}: {
  targetRef: React.RefObject<HTMLElement>;
  /** Which overflow the rail describes. */
  axis?: 'x' | 'y';
  className?: string;
}) {
  const [thumb, setThumb] = useState<{ top: number; height: number } | null>(null);

  const measure = useCallback(() => {
    const el = targetRef.current;
    if (!el) return;
    const total = axis === 'x' ? el.scrollWidth : el.scrollHeight;
    const visible = axis === 'x' ? el.clientWidth : el.clientHeight;
    const offset = axis === 'x' ? el.scrollLeft : el.scrollTop;
    // Nothing to indicate when everything already fits.
    if (total - visible < 2) {
      setThumb(null);
      return;
    }
    const ratio = visible / total;
    // A floor, so a long list does not reduce the thumb to an invisible speck.
    const height = Math.max(ratio * 100, 8);
    const top = (offset / total) * 100;
    setThumb({ top: Math.min(top, 100 - height), height });
  }, [targetRef, axis]);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    // The list reflows with the viewport, and its contents can change height.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => {
      el.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, [targetRef, measure]);

  if (!thumb) return null;

  return (
    <span
      aria-hidden="true"
      data-scroll-rail
      className={cn(
        'pointer-events-none absolute overflow-hidden rounded-full bg-brand-50',
        axis === 'x' ? 'inset-x-0 bottom-0 h-[2px] w-full' : 'right-0 top-0 h-full w-[2px]',
        className,
      )}
    >
      <span
        data-scroll-thumb
        className={cn(
          'absolute rounded-full transition-[top,left] duration-75 ease-linear',
          axis === 'x'
            ? 'top-0 h-full bg-gradient-to-r from-brand-400 to-mint-400'
            : 'left-0 w-full bg-gradient-to-b from-brand-400 to-mint-400',
        )}
        style={
          axis === 'x'
            ? { left: `${thumb.top}%`, width: `${thumb.height}%` }
            : { top: `${thumb.top}%`, height: `${thumb.height}%` }
        }
      />
    </span>
  );
}
