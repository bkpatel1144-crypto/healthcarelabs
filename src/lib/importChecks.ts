/**
 * Shape checks for Admin → Settings → Import.
 *
 * The public pages read fields like `pkg.tests.length` and `post.sections`
 * without guarding them, because the editors always write complete records.
 * An imported file is not written by the editors, so it is checked here first:
 * one malformed item would otherwise take down every page that lists it.
 */

type Check = (x: Record<string, unknown>) => boolean;

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (v: unknown) => typeof v === 'string';
const optStr = (v: unknown) => v === undefined || typeof v === 'string';
const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const numOrNull = (v: unknown) => v === null || num(v);
const bool = (v: unknown) => typeof v === 'boolean';
const optBool = (v: unknown) => v === undefined || typeof v === 'boolean';
const strList = (v: unknown) => Array.isArray(v) && v.every((s) => typeof s === 'string');

const CHECKS: Record<string, { label: string; check: Check }> = {
  packages: {
    label: 'package',
    check: (p) =>
      str(p.id) && str(p.slug) && str(p.name) && str(p.summary) && str(p.overview) &&
      strList(p.tests) && numOrNull(p.price) && numOrNull(p.offerPrice) && strList(p.concerns) &&
      strList(p.suitableFor) && strList(p.preparation) && bool(p.homeCollection) &&
      str(p.reportTime) && bool(p.featured) && optBool(p.archived),
  },
  offers: {
    label: 'offer',
    check: (o) =>
      str(o.id) && str(o.slug) && str(o.title) && str(o.description) && optStr(o.packageSlug) &&
      numOrNull(o.originalPrice) && numOrNull(o.offerPrice) && str(o.validUntil) && strList(o.terms) &&
      optStr(o.highlight) && optBool(o.archived),
  },
  blogs: {
    label: 'article',
    check: (b) =>
      str(b.id) && str(b.slug) && str(b.title) && str(b.excerpt) && str(b.category) && str(b.author) &&
      str(b.publishedAt) && num(b.readingMinutes) && bool(b.featured) && optBool(b.archived) &&
      Array.isArray(b.sections) &&
      b.sections.every(
        (s) =>
          isObj(s) &&
          optStr(s.heading) &&
          (s.paragraphs === undefined || strList(s.paragraphs)) &&
          (s.bullets === undefined || strList(s.bullets)),
      ),
  },
  testimonials: {
    label: 'testimonial',
    check: (t) =>
      str(t.id) && str(t.name) && str(t.location) && num(t.rating) && str(t.quote) &&
      optStr(t.packageName) && optBool(t.archived),
  },
  appointments: { label: 'appointment', check: (a) => str(a.id) && str(a.name) && str(a.createdAt) },
  contacts: { label: 'message', check: (c) => str(c.id) && str(c.name) && str(c.createdAt) },
};

/** Returns the first problem found, or null when every provided list is valid. */
export function importProblem(parsed: Record<string, unknown>): string | null {
  const known = Object.keys(CHECKS).filter((k) => k in parsed);
  if (known.length === 0 && !('preferences' in parsed)) {
    return 'This file has none of the expected lists (packages, offers, blogs, testimonials). Is it a Healthcare Labs export?';
  }
  for (const key of known) {
    const list = parsed[key];
    const { label, check } = CHECKS[key];
    if (!Array.isArray(list)) return `“${key}” should be a list.`;
    const bad = list.findIndex((item) => !isObj(item) || !check(item));
    if (bad >= 0) return `${label[0].toUpperCase()}${label.slice(1)} #${bad + 1} in “${key}” is missing fields or has the wrong type. Nothing was imported.`;
    const ids = new Set<string>();
    for (const item of list as { id: string }[]) {
      if (ids.has(item.id)) return `Two ${label}s in “${key}” share the id “${item.id}”. Nothing was imported.`;
      ids.add(item.id);
    }
  }
  if ('preferences' in parsed && !isObj(parsed.preferences)) return '“preferences” should be an object.';
  return null;
}
