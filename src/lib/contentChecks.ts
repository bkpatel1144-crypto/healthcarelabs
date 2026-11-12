import { slugify } from '@/lib/format';

/**
 * Checks shared by the admin editors for packages, offers and blog posts.
 * Each returns an error sentence for the editor to show, or null when fine.
 */

/** Turns whatever was typed (or the title) into a clean URL segment. */
export function cleanSlug(typed: string, fallbackTitle: string): string {
  return slugify(typed.trim() || fallbackTitle);
}

/**
 * Two items with one slug means one of them can never be opened — the public
 * page finds the first match. Archived items count too, because restoring one
 * would bring the clash back.
 */
export function slugError(
  slug: string,
  selfId: string,
  items: { id: string; slug: string }[],
  noun: string,
  base: string,
): string | null {
  if (!slug) return `Give the ${noun} a name made of letters or numbers so it gets a web address.`;
  const clash = items.find((x) => x.slug === slug && x.id !== selfId);
  return clash ? `Another ${noun} already uses the address ${base}/${slug}. Change the name or the slug.` : null;
}

export function priceError(price: number | null, offerPrice: number | null): string | null {
  if ((price !== null && price < 0) || (offerPrice !== null && offerPrice < 0)) {
    return 'A price cannot be negative.';
  }
  if (price !== null && offerPrice !== null && offerPrice > price) {
    return 'The offer price cannot be higher than the original price.';
  }
  return null;
}
