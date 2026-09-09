import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { STORAGE_KEYS, storage } from '@/lib/storage';
import { createId } from '@/lib/format';
import { PACKAGES } from '@/data/packages';
import { OFFERS } from '@/data/offers';
import { BLOG_POSTS } from '@/data/blogs';
import { TESTIMONIALS } from '@/data/testimonials';
import type {
  AppointmentLead,
  BlogPost,
  ContactLead,
  HealthPackage,
  Offer,
  Preferences,
  Testimonial,
} from '@/types';

/**
 * Bump when the shipped seed data changes shape so returning visitors pick up
 * the new catalogue instead of a stale copy. Content the visitor created
 * (appointments, contact messages) is never touched by a reseed.
 */
const SEED_VERSION = '2026-01-1';

const DEFAULT_PREFERENCES: Preferences = {
  lastConcern: null,
  reducedEffects: false,
  savedPackages: [],
  comparePackages: [],
};

/**
 * Three packages is the most that fits a readable comparison: at four the
 * columns are narrower than the test names that label the rows.
 */
export const COMPARE_LIMIT = 3;

export interface ContentState {
  packages: HealthPackage[];
  offers: Offer[];
  posts: BlogPost[];
  testimonials: Testimonial[];
  appointments: AppointmentLead[];
  contacts: ContactLead[];
  preferences: Preferences;
}

export interface ContentApi extends ContentState {
  /** Published (non-archived) subsets — what the public site renders. */
  livePackages: HealthPackage[];
  liveOffers: Offer[];
  livePosts: BlogPost[];
  liveTestimonials: Testimonial[];

  savePackage: (pkg: HealthPackage) => void;
  deletePackage: (id: string) => void;
  saveOffer: (offer: Offer) => void;
  deleteOffer: (id: string) => void;
  savePost: (post: BlogPost) => void;
  deletePost: (id: string) => void;
  saveTestimonial: (t: Testimonial) => void;
  deleteTestimonial: (id: string) => void;

  addAppointment: (input: Omit<AppointmentLead, 'id' | 'createdAt' | 'status'>) => AppointmentLead;
  updateAppointment: (id: string, patch: Partial<AppointmentLead>) => void;
  deleteAppointment: (id: string) => void;

  addContact: (input: Omit<ContactLead, 'id' | 'createdAt' | 'status'>) => ContactLead;
  updateContact: (id: string, patch: Partial<ContactLead>) => void;
  deleteContact: (id: string) => void;

  setPreferences: (patch: Partial<Preferences>) => void;
  toggleSavedPackage: (slug: string) => void;
  /** Adds or removes a slug from the comparison queue. Full queue is a no-op. */
  toggleComparePackage: (slug: string) => void;
  clearCompare: () => void;

  exportJson: () => string;
  importJson: (raw: string) => { ok: boolean; error?: string };
  resetDemoData: () => void;
  storageAvailable: boolean;
}

const ContentContext = createContext<ContentApi | null>(null);

function readSeeded<T>(key: string, seed: T[]): T[] {
  const stored = storage.get<T[] | null>(key, null);
  if (!Array.isArray(stored)) {
    storage.set(key, seed);
    return seed;
  }
  return stored;
}

function initialState(): ContentState {
  const seedVersion = storage.get<string>(STORAGE_KEYS.seedVersion, '');
  const stale = seedVersion !== SEED_VERSION;

  if (stale) {
    // Refresh catalogue content only; visitor-submitted records survive.
    storage.set(STORAGE_KEYS.packages, PACKAGES);
    storage.set(STORAGE_KEYS.offers, OFFERS);
    storage.set(STORAGE_KEYS.blogs, BLOG_POSTS);
    storage.set(STORAGE_KEYS.testimonials, TESTIMONIALS);
    storage.set(STORAGE_KEYS.seedVersion, SEED_VERSION);
  }

  return {
    packages: readSeeded(STORAGE_KEYS.packages, PACKAGES),
    offers: readSeeded(STORAGE_KEYS.offers, OFFERS),
    posts: readSeeded(STORAGE_KEYS.blogs, BLOG_POSTS),
    testimonials: readSeeded(STORAGE_KEYS.testimonials, TESTIMONIALS),
    appointments: readSeeded<AppointmentLead>(STORAGE_KEYS.appointments, []),
    contacts: readSeeded<ContactLead>(STORAGE_KEYS.contacts, []),
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...storage.get<Partial<Preferences>>(STORAGE_KEYS.preferences, {}),
    },
  };
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContentState>(initialState);
  const storageAvailable = storage.isAvailable();

  // Persist each slice independently so one oversized slice cannot block another.
  useEffect(() => void storage.set(STORAGE_KEYS.packages, state.packages), [state.packages]);
  useEffect(() => void storage.set(STORAGE_KEYS.offers, state.offers), [state.offers]);
  useEffect(() => void storage.set(STORAGE_KEYS.blogs, state.posts), [state.posts]);
  useEffect(
    () => void storage.set(STORAGE_KEYS.testimonials, state.testimonials),
    [state.testimonials],
  );
  useEffect(
    () => void storage.set(STORAGE_KEYS.appointments, state.appointments),
    [state.appointments],
  );
  useEffect(() => void storage.set(STORAGE_KEYS.contacts, state.contacts), [state.contacts]);
  useEffect(
    () => void storage.set(STORAGE_KEYS.preferences, state.preferences),
    [state.preferences],
  );

  const upsert = useCallback(
    <K extends 'packages' | 'offers' | 'posts' | 'testimonials'>(slice: K, item: ContentState[K][number]) => {
      setState((prev) => {
        const list = prev[slice] as { id: string }[];
        const idx = list.findIndex((x) => x.id === (item as { id: string }).id);
        const stamped = { ...item, updatedAt: new Date().toISOString() };
        const next = idx >= 0 ? list.map((x, i) => (i === idx ? stamped : x)) : [stamped, ...list];
        return { ...prev, [slice]: next } as ContentState;
      });
    },
    [],
  );

  const removeFrom = useCallback((slice: 'packages' | 'offers' | 'posts' | 'testimonials', id: string) => {
    setState((prev) => ({
      ...prev,
      [slice]: (prev[slice] as { id: string }[]).filter((x) => x.id !== id),
    }) as ContentState);
  }, []);

  const api = useMemo<ContentApi>(() => {
    const notArchived = <T extends { archived?: boolean }>(x: T) => !x.archived;

    return {
      ...state,
      livePackages: state.packages.filter(notArchived),
      liveOffers: state.offers.filter(notArchived),
      livePosts: state.posts.filter(notArchived),
      liveTestimonials: state.testimonials.filter(notArchived),

      savePackage: (pkg) => upsert('packages', pkg),
      deletePackage: (id) => removeFrom('packages', id),
      saveOffer: (offer) => upsert('offers', offer),
      deleteOffer: (id) => removeFrom('offers', id),
      savePost: (post) => upsert('posts', post),
      deletePost: (id) => removeFrom('posts', id),
      saveTestimonial: (t) => upsert('testimonials', t),
      deleteTestimonial: (id) => removeFrom('testimonials', id),

      addAppointment: (input) => {
        const record: AppointmentLead = {
          ...input,
          id: createId('appt'),
          status: 'new',
          createdAt: new Date().toISOString(),
        };
        setState((prev) => ({ ...prev, appointments: [record, ...prev.appointments] }));
        return record;
      },
      updateAppointment: (id, patch) =>
        setState((prev) => ({
          ...prev,
          appointments: prev.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),
      deleteAppointment: (id) =>
        setState((prev) => ({ ...prev, appointments: prev.appointments.filter((a) => a.id !== id) })),

      addContact: (input) => {
        const record: ContactLead = {
          ...input,
          id: createId('msg'),
          status: 'new',
          createdAt: new Date().toISOString(),
        };
        setState((prev) => ({ ...prev, contacts: [record, ...prev.contacts] }));
        return record;
      },
      updateContact: (id, patch) =>
        setState((prev) => ({
          ...prev,
          contacts: prev.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      deleteContact: (id) =>
        setState((prev) => ({ ...prev, contacts: prev.contacts.filter((c) => c.id !== id) })),

      setPreferences: (patch) =>
        setState((prev) => ({ ...prev, preferences: { ...prev.preferences, ...patch } })),

      toggleSavedPackage: (slug) =>
        setState((prev) => {
          const saved = prev.preferences.savedPackages;
          return {
            ...prev,
            preferences: {
              ...prev.preferences,
              savedPackages: saved.includes(slug)
                ? saved.filter((s) => s !== slug)
                : [...saved, slug],
            },
          };
        }),

      toggleComparePackage: (slug) =>
        setState((prev) => {
          const queue = prev.preferences.comparePackages;
          if (queue.includes(slug)) {
            return {
              ...prev,
              preferences: {
                ...prev.preferences,
                comparePackages: queue.filter((s) => s !== slug),
              },
            };
          }
          // Silently ignore an add past the cap; the UI disables the control,
          // so reaching here means a stale render or a restored over-long list.
          if (queue.length >= COMPARE_LIMIT) return prev;
          return {
            ...prev,
            preferences: { ...prev.preferences, comparePackages: [...queue, slug] },
          };
        }),

      clearCompare: () =>
        setState((prev) => ({
          ...prev,
          preferences: { ...prev.preferences, comparePackages: [] },
        })),

      exportJson: () =>
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            seedVersion: SEED_VERSION,
            packages: state.packages,
            offers: state.offers,
            blogs: state.posts,
            testimonials: state.testimonials,
            appointments: state.appointments,
            contacts: state.contacts,
            preferences: state.preferences,
          },
          null,
          2,
        ),

      importJson: (raw) => {
        try {
          const parsed = JSON.parse(raw) as Partial<Record<string, unknown>>;
          if (typeof parsed !== 'object' || parsed === null) {
            return { ok: false, error: 'The file does not contain a JSON object.' };
          }
          const arr = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback);
          setState((prev) => ({
            packages: arr<HealthPackage>(parsed.packages, prev.packages),
            offers: arr<Offer>(parsed.offers, prev.offers),
            posts: arr<BlogPost>(parsed.blogs, prev.posts),
            testimonials: arr<Testimonial>(parsed.testimonials, prev.testimonials),
            appointments: arr<AppointmentLead>(parsed.appointments, prev.appointments),
            contacts: arr<ContactLead>(parsed.contacts, prev.contacts),
            preferences: {
              ...prev.preferences,
              ...(typeof parsed.preferences === 'object' && parsed.preferences !== null
                ? (parsed.preferences as Partial<Preferences>)
                : {}),
            },
          }));
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : 'Invalid JSON.' };
        }
      },

      resetDemoData: () => {
        storage.clear();
        storage.set(STORAGE_KEYS.seedVersion, SEED_VERSION);
        setState({
          packages: PACKAGES,
          offers: OFFERS,
          posts: BLOG_POSTS,
          testimonials: TESTIMONIALS,
          appointments: [],
          contacts: [],
          preferences: DEFAULT_PREFERENCES,
        });
      },

      storageAvailable,
    };
  }, [state, upsert, removeFrom, storageAvailable]);

  return <ContentContext.Provider value={api}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentApi {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used inside <ContentProvider>.');
  return ctx;
}
