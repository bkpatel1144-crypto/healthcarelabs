import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { STORAGE_KEYS, storage } from '@/lib/storage';
import { createId } from '@/lib/format';
import { importProblem } from '@/lib/importChecks';
import {
  deleteCatalogueItem,
  saveCatalogueItem,
  watchCatalogue,
  type CatalogueKind,
} from '@/lib/catalogueApi';
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
const SEED_VERSION = '2026-11-1';

const DEFAULT_PREFERENCES: Preferences = {
  lastConcern: null,
  reducedEffects: false,
  savedPackages: [],
  comparePackages: [],
  visitPackages: [],
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
  /** Adds or removes a package from the visit the visitor is planning. */
  toggleVisitPackage: (slug: string) => void;
  clearVisit: () => void;

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

  /*
    Persist each slice independently so one oversized slice cannot block another.

    Layout effects, not effects: they run inside the same commit as the click
    that changed the state. A plain effect runs a moment later, and an admin who
    clicked "Restore" and immediately navigated or closed the tab lost the
    change — the end-to-end tests caught exactly that.
  */
  useLayoutEffect(() => void storage.set(STORAGE_KEYS.packages, state.packages), [state.packages]);
  useLayoutEffect(() => void storage.set(STORAGE_KEYS.offers, state.offers), [state.offers]);
  useLayoutEffect(() => void storage.set(STORAGE_KEYS.blogs, state.posts), [state.posts]);
  useLayoutEffect(
    () => void storage.set(STORAGE_KEYS.testimonials, state.testimonials),
    [state.testimonials],
  );
  useLayoutEffect(
    () => void storage.set(STORAGE_KEYS.appointments, state.appointments),
    [state.appointments],
  );
  useLayoutEffect(() => void storage.set(STORAGE_KEYS.contacts, state.contacts), [state.contacts]);
  useLayoutEffect(
    () => void storage.set(STORAGE_KEYS.preferences, state.preferences),
    [state.preferences],
  );

  /*
    Firestore is the published catalogue; localStorage is a local cache and a
    fallback.

    These three slices used to live only in the editor's browser, which made
    the admin panel look like a publishing tool while changing nothing for
    visitors. Now a snapshot replaces them as soon as one arrives.

    An EMPTY collection is deliberately ignored rather than treated as "the
    catalogue is empty". Before the one-time publish, and any time rules are
    redeployed or the network is down, an empty snapshot would otherwise wipe
    a working site down to nothing. Nobody intends to publish zero packages;
    they intend to publish some, and until they do the shipped data stands.
  */
  useEffect(() => {
    const slices = ['packages', 'posts', 'testimonials'] as const;
    const stop = slices.map((slice) =>
      watchCatalogue<{ id: string }>(
        slice,
        (rows) => {
          if (rows.length === 0) return;
          setState((prev) => ({ ...prev, [slice]: rows }) as ContentState);
        },
        () => {
          /* Offline, or rules not deployed yet. Keep what is already shown. */
        },
      ),
    );
    return () => stop.forEach((unsub) => unsub());
  }, []);

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

  const publish = useCallback(
    async (kind: CatalogueKind, item: Parameters<typeof saveCatalogueItem>[1]) => {
      try {
        await saveCatalogueItem(kind, item);
      } catch {
        /* Not an admin, or offline. The local copy still updated. */
      }
    },
    [],
  );

  const unpublish = useCallback(async (kind: CatalogueKind, id: string) => {
    try {
      await deleteCatalogueItem(kind, id);
    } catch {
      /* As above. */
    }
  }, []);

  const api = useMemo<ContentApi>(() => {
    const notArchived = <T extends { archived?: boolean }>(x: T) => !x.archived;

    return {
      ...state,
      livePackages: state.packages.filter(notArchived),
      /*
        An offer whose package has since been archived or deleted keeps its
        price, but loses the link — otherwise "View package" opens a not-found
        page.
      */
      liveOffers: (() => {
        const live = new Set(state.packages.filter(notArchived).map((p) => p.slug));
        return state.offers
          .filter(notArchived)
          .map((o) => (o.packageSlug && !live.has(o.packageSlug) ? { ...o, packageSlug: undefined } : o));
      })(),
      livePosts: state.posts.filter(notArchived),
      liveTestimonials: state.testimonials.filter(notArchived),

      /*
        Each edit updates local state immediately and publishes in the
        background. The optimistic update is what keeps the admin panel
        responsive; the Firestore write is what makes the change real for
        everyone else. A failed write is swallowed here on purpose — a
        non-admin has no rights to this collection and should not be shown a
        permissions error for editing their own local copy.
      */
      savePackage: (pkg) => { upsert('packages', pkg); void publish('packages', pkg); },
      deletePackage: (id) => { removeFrom('packages', id); void unpublish('packages', id); },
      saveOffer: (offer) => upsert('offers', offer),
      deleteOffer: (id) => removeFrom('offers', id),
      savePost: (post) => { upsert('posts', post); void publish('posts', post); },
      deletePost: (id) => { removeFrom('posts', id); void unpublish('posts', id); },
      saveTestimonial: (t) => { upsert('testimonials', t); void publish('testimonials', t); },
      deleteTestimonial: (id) => { removeFrom('testimonials', id); void unpublish('testimonials', id); },

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

      toggleVisitPackage: (slug) =>
        setState((prev) => {
          const list = prev.preferences.visitPackages;
          return {
            ...prev,
            preferences: {
              ...prev.preferences,
              visitPackages: list.includes(slug)
                ? list.filter((s) => s !== slug)
                : [...list, slug],
            },
          };
        }),

      clearVisit: () =>
        setState((prev) => ({
          ...prev,
          preferences: { ...prev.preferences, visitPackages: [] },
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
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            return { ok: false, error: 'The file does not contain a JSON object.' };
          }
          const problem = importProblem(parsed as Record<string, unknown>);
          if (problem) return { ok: false, error: problem };
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
          return {
            ok: false,
            error:
              err instanceof SyntaxError
                ? 'That file is not valid JSON — it may be damaged or not an export from this site. Nothing was imported.'
                : 'That file could not be imported. Nothing was changed.',
          };
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
  }, [state, upsert, removeFrom, publish, unpublish, storageAvailable]);

  return <ContentContext.Provider value={api}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentApi {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used inside <ContentProvider>.');
  return ctx;
}
