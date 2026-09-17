import { LAB_PHOTOS } from '@/data/labPhotos';
import type { BlogPost, SitePhoto } from '@/types';

/**
 * Which photograph banners which article.
 *
 * The blog banners were generated gradient plates with a seeded line pattern —
 * fine as a placeholder, and unmistakably a placeholder. These use the lab's
 * own photography instead, which is the only professional imagery this project
 * legitimately has: stock would be someone else's lab, and a generic picture of
 * a generic laboratory is worse than an honest abstract plate.
 *
 * The map is by slug, and it is topical rather than decorative wherever the
 * catalogue allows it — the HbA1c article gets the Bio-Rad D-10 that actually
 * runs HbA1c, the B12 article gets the immunoassay analyser that runs B12, the
 * lipid article gets the AU480. Eight photographs cover ten articles, so two
 * repeat; both repeats are on the analyser that genuinely performs the test in
 * question rather than being padding.
 *
 * Articles added later through /admin have no entry here, so they fall back to
 * their category and then to the generated plate. Nothing breaks, and no
 * article is ever banner-less.
 */

const BY_SLUG: Record<string, string> = {
  'how-to-read-your-blood-test-report': 'chemistry-analyser-operator',
  'fasting-before-a-blood-test': 'hematology-department',
  /*
    Not the signage shot: it is the one portrait frame in the set (720x1280),
    and cropped into a wide banner it becomes a near-black band of wall. Two
    photographs now repeat three times between them rather than four times
    between two, and no repeat lands adjacent in the grid.
  */
  'daily-habits-for-a-healthier-life': 'reception',
  'looking-after-your-mental-health': 'hba1c-analyser',
  'preventive-testing-by-age': 'biochemistry-department',
  'understanding-hba1c': 'hba1c-analyser',
  'the-heart-numbers-worth-knowing': 'chemistry-analyser',
  'iron-b12-and-persistent-fatigue': 'immunoassay-analyser',
  // Biochemistry rather than the immunoassay analyser, which the adjacent
  // nutrition article uses — the repeat is unavoidable, the collision is not.
  'womens-health-screening-essentials': 'biochemistry-department',
  'mens-health-screening-after-forty': 'chemistry-analyser-operator',
};

/** Fallback for posts written after this map — by subject area. */
const BY_CATEGORY: Record<string, string> = {
  'Lab Tests': 'chemistry-analyser-operator',
  'Preventive Health': 'biochemistry-department',
  Diabetes: 'hba1c-analyser',
  'Heart Health': 'chemistry-analyser',
  Nutrition: 'immunoassay-analyser',
  "Women's Health": 'immunoassay-analyser',
  "Men's Health": 'biochemistry-department',
  Wellness: 'reception',
};

const byId = (id: string | undefined): SitePhoto | null =>
  (id && LAB_PHOTOS.find((p) => p.id === id)) || null;

/** The banner photograph for a post, or null to fall back to the plate. */
export function getPostPhoto(post: Pick<BlogPost, 'slug' | 'category'>): SitePhoto | null {
  return byId(BY_SLUG[post.slug]) ?? byId(BY_CATEGORY[post.category]);
}
