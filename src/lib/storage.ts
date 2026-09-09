/**
 * Safe localStorage wrapper.
 *
 * Every path is defensive: private-mode denials, quota errors, corrupted JSON
 * and SSR/prerender (no `window`) all degrade to an in-memory map instead of
 * throwing. Nothing in here may ever crash a render.
 */

export const STORAGE_KEYS = {
  packages: 'healthcare_labs_packages',
  offers: 'healthcare_labs_offers',
  blogs: 'healthcare_labs_blogs',
  testimonials: 'healthcare_labs_testimonials',
  appointments: 'healthcare_labs_appointments',
  contacts: 'healthcare_labs_contacts',
  preferences: 'healthcare_labs_preferences',
  accessibility: 'healthcare_labs_a11y',
  seedVersion: 'healthcare_labs_seed_version',
  /* Whether the visitor has dismissed the floating lab reel. */
  reelDismissed: 'healthcare_labs_reel_dismissed',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** Fallback used when localStorage is unavailable (Safari private mode, SSR). */
const memory = new Map<string, string>();

let available: boolean | null = null;

function isAvailable(): boolean {
  if (available !== null) return available;
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      available = false;
      return available;
    }
    const probe = '__hcl_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

function readRaw(key: string): string | null {
  try {
    return isAvailable() ? window.localStorage.getItem(key) : (memory.get(key) ?? null);
  } catch {
    return memory.get(key) ?? null;
  }
}

function writeRaw(key: string, value: string): boolean {
  memory.set(key, value);
  try {
    if (isAvailable()) window.localStorage.setItem(key, value);
    return true;
  } catch {
    // Quota exceeded or blocked — the in-memory copy above keeps the session working.
    return false;
  }
}

export const storage = {
  /** Reads and parses a key, returning `fallback` for missing or corrupt values. */
  get<T>(key: string, fallback: T): T {
    const raw = readRaw(key);
    if (raw === null || raw === '') return fallback;
    try {
      const parsed = JSON.parse(raw) as T;
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch {
      // Corrupt entry: drop it so the app self-heals on the next load.
      storage.remove(key);
      return fallback;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      return writeRaw(key, JSON.stringify(value));
    } catch {
      return false;
    }
  },

  remove(key: string): void {
    memory.delete(key);
    try {
      if (isAvailable()) window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },

  /** Removes only this app's keys — never wipes unrelated origin data. */
  clear(): void {
    Object.values(STORAGE_KEYS).forEach((k) => storage.remove(k));
  },

  has(key: string): boolean {
    return readRaw(key) !== null;
  },

  isAvailable,
};

/** Reads a key, seeding it with `seed` the first time it is requested. */
export function getOrSeed<T>(key: string, seed: T): T {
  if (!storage.has(key)) {
    storage.set(key, seed);
    return seed;
  }
  return storage.get<T>(key, seed);
}
