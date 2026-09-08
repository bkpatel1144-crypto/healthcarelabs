import { useEffect, useState } from 'react';

export function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return defaultValue;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True when the visitor has asked the OS to reduce motion. */
export const usePrefersReducedMotion = () =>
  useMediaQuery('(prefers-reduced-motion: reduce)');

export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(max-width: 1023px)');
/** Coarse pointer = touch device: no hover parallax, cheaper 3D scene. */
export const useIsCoarsePointer = () => useMediaQuery('(pointer: coarse)');
