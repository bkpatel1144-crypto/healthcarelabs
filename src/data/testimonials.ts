import type { Testimonial } from '@/types';

/**
 * Intentionally empty.
 *
 * Healthcare Labs does not publish attributed patient reviews, and inventing
 * them would be fabricating both people and medical experiences. The homepage
 * renders the lab's own published commitments instead, and switches to a
 * testimonial carousel automatically as soon as real entries are added through
 * /admin/testimonials.
 */
export const TESTIMONIALS: Testimonial[] = [];

/**
 * The lab's own published statements, transcribed from healthcare-labs.com.
 * These are the organisation's words about itself — not attributed patient
 * quotes — and are labelled as such in the UI.
 */
export const CARE_COMMITMENTS = [
  {
    id: 'commitment-vision',
    label: 'Vision',
    statement: 'Let us all be healthy.',
    detail: 'Let us all contribute towards a healthier India.',
  },
  {
    id: 'commitment-mission',
    label: 'Mission',
    statement: 'The patient’s comfort and care comes first, above all.',
    detail: 'To provide the best healthcare at an affordable cost.',
  },
  {
    id: 'commitment-quality',
    label: 'Quality Assurance',
    statement: 'Committed to meet and exceed the expectations of the community.',
    detail: 'By providing co-ordinated, compassionate and high-quality healthcare services.',
  },
];
