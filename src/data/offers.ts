import type { Offer } from '@/types';
import { PACKAGES } from './packages';

/**
 * Offers are derived from the lab's own published pricing: every package on
 * healthcare-labs.com lists an original price and a current (offer) price.
 * Nothing here is invented — no fabricated discount, no fabricated deadline.
 *
 * `validUntil` is deliberately empty because the lab does not publish an expiry
 * date. The UI only renders a countdown when this field holds a real date, so
 * setting one in the admin panel is all that is needed to switch it on.
 */

const OFFER_HIGHLIGHTS: Record<string, { highlight: string; description: string }> = {
  'basic-health-check-up': {
    highlight: 'Best first step',
    description:
      'The seven-test starting panel at its lowest published price — the simplest way to establish a baseline before anything else.',
  },
  'general-health-check-up': {
    highlight: 'Most balanced',
    description:
      'Thyroid, vitamin B12 and uric acid added to the routine screen, at well under half the original price.',
  },
  'full-body-checkup': {
    highlight: 'Largest saving',
    description:
      'Twenty-six parameters across pathology, imaging, cardiac testing and an M.D. consultation — the biggest reduction in the catalogue.',
  },
  'premium-health-check-up': {
    highlight: 'Includes ECG & 2D Echo',
    description:
      'A complete pathology review with cardiac imaging and a doctor consultation included in the price.',
  },
  'heart-special-profile': {
    highlight: 'Complete cardiac review',
    description:
      'Troponin-T, homocysteine and CPK-MB with ECG, 2D Echo and TMT — the full cardiac work-up in a single visit.',
  },
  'diabetes-special-report': {
    highlight: 'For ongoing monitoring',
    description:
      'Fasting and post-meal sugar with HbA1c and kidney markers, priced for people who test several times a year.',
  },
  'health-special-profile': {
    highlight: 'Full organ profiles',
    description:
      'Complete liver and kidney panels rather than single markers, plus thyroid, calcium and B12.',
  },
  'anemia-profile-test': {
    highlight: 'Complete iron studies',
    description:
      'Iron, TIBC, ferritin, B12 and reticulocyte count together — the full anaemia investigation, not a partial one.',
  },
  'children-silver-health-check-up': {
    highlight: 'For children',
    description:
      'A paediatric routine check closing with a consultation, at less than half the original price.',
  },
  'cancer-profile-for-woman': {
    highlight: 'Screening panel',
    description:
      'Established tumour markers with chest X-ray and abdominal-pelvic ultrasound, reviewed by your physician.',
  },
  'cancer-profile-for-man': {
    highlight: 'Screening panel',
    description:
      'Established tumour markers with chest X-ray and abdominal-pelvic ultrasound, reviewed by your physician.',
  },
  'before-marriage-woman-check-up': {
    highlight: 'Pre-marital',
    description:
      'AMH, the FSH/LH/prolactin set, thyroid, haemoglobin electrophoresis and infection screening in one panel.',
  },
  'before-marriage-men-check-up': {
    highlight: 'Pre-marital',
    description:
      'Haemoglobin electrophoresis, seminal fluid examination, testosterone and infection screening in one panel.',
  },
  'advance-diabetes-special-profile': {
    highlight: 'Insulin & C-peptide',
    description:
      'The deeper metabolic panel, adding serum insulin, C-peptide and electrolytes to the standard diabetes review.',
  },
  'all-arthritis-profile': {
    highlight: 'Autoimmune markers',
    description: 'Anti-CCP and ANA auto-antibody testing alongside the full inflammatory panel.',
  },
  'general-arthritis-profile': {
    highlight: 'First-line joint panel',
    description: 'RA quantitative, uric acid, calcium, phosphorus and CRP for a first joint work-up.',
  },
};

const STANDARD_TERMS = [
  'Offer pricing is as published by Healthcare Labs and applies to the package exactly as listed.',
  'Applicable at the Healthcare Labs centre in Surat and on eligible home collections.',
  'Cannot be combined with any other running offer on the same package.',
  'Reports are shared once every included parameter has completed processing and verification.',
];

export const OFFERS: Offer[] = PACKAGES.filter(
  (p) => p.price !== null && p.offerPrice !== null && p.offerPrice < p.price,
)
  .sort((a, b) => (b.price! - b.offerPrice!) - (a.price! - a.offerPrice!))
  .map((p) => {
    const meta = OFFER_HIGHLIGHTS[p.slug];
    return {
      id: `offer-${p.slug}`,
      slug: p.slug,
      title: p.name,
      description: meta?.description ?? p.summary,
      packageSlug: p.slug,
      originalPrice: p.price,
      offerPrice: p.offerPrice,
      validUntil: '',
      terms: STANDARD_TERMS,
      highlight: meta?.highlight,
    } satisfies Offer;
  });

export const getOfferBySlug = (slug: string): Offer | undefined =>
  OFFERS.find((o) => o.slug === slug);
