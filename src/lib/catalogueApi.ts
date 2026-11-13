/**
 * The catalogue, in Firestore.
 *
 * Until now packages, posts and testimonials lived in the editor's own
 * localStorage. The admin panel looked like a publishing tool and was not one:
 * changing a price changed it in that browser and nowhere else, so the lab
 * could believe a price was live while every visitor still saw the old one.
 * This module is what makes those edits reach people.
 *
 * Reads are public — this is the shop window. Writes are admin-only and
 * validated in firestore.rules, because whatever lands here renders straight
 * onto the site.
 *
 * Nothing here deletes by default. Archiving is how the admin panel already
 * retires an item, and a soft flag keeps a booking that refers to a package
 * from pointing at nothing.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BlogPost, HealthPackage, Testimonial } from '@/types';

/** The three collections the admin panel publishes to. */
export type CatalogueKind = 'packages' | 'posts' | 'testimonials';

export interface CatalogueRow {
  id: string;
}

/**
 * Watch a collection.
 *
 * `onError` matters more than it looks: a visitor with no network, or rules
 * that have not been deployed yet, must leave the site rendering its shipped
 * catalogue rather than an empty one. The caller keeps whatever it had.
 */
export function watchCatalogue<T extends CatalogueRow>(
  kind: CatalogueKind,
  cb: (rows: T[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, kind),
    (snap) => cb(snap.docs.map((d) => d.data() as T)),
    (error) => onError?.(error),
  );
}

/** One-shot read, for code that does not want a subscription. */
export async function readCatalogue<T extends CatalogueRow>(kind: CatalogueKind): Promise<T[]> {
  const snap = await getDocs(collection(db, kind));
  return snap.docs.map((d) => d.data() as T);
}

/**
 * Write one item.
 *
 * `undefined` is stripped first: Firestore rejects it outright, and optional
 * fields like `priceNote` or `archived` arrive undefined from the admin forms
 * all the time. Dropping the key is also what the rules expect, since they
 * test `'archived' in d` rather than its value.
 */
export async function saveCatalogueItem(
  kind: CatalogueKind,
  item: HealthPackage | BlogPost | Testimonial,
): Promise<void> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    if (value !== undefined) clean[key] = value;
  }
  clean.updatedAt = new Date().toISOString();
  await setDoc(doc(db, kind, item.id), clean);
}

/** Remove one outright. Prefer archiving; this is for genuine mistakes. */
export async function deleteCatalogueItem(kind: CatalogueKind, id: string): Promise<void> {
  await deleteDoc(doc(db, kind, id));
}

/**
 * Push a whole set up at once — the one-time move from shipped data into
 * Firestore, and the "republish everything" the admin panel needs after it.
 *
 * Batched in chunks of 400 because a Firestore batch takes 500 writes and the
 * catalogue is allowed to grow past that.
 */
export async function publishCatalogue(
  kind: CatalogueKind,
  items: (HealthPackage | BlogPost | Testimonial)[],
): Promise<number> {
  const SIZE = 400;
  let written = 0;
  for (let i = 0; i < items.length; i += SIZE) {
    const batch = writeBatch(db);
    for (const item of items.slice(i, i + SIZE)) {
      const clean: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(item)) {
        if (value !== undefined) clean[key] = value;
      }
      clean.updatedAt = new Date().toISOString();
      batch.set(doc(db, kind, item.id), clean);
    }
    await batch.commit();
    written += Math.min(SIZE, items.length - i);
  }
  return written;
}
