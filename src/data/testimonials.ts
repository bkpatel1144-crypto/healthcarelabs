import type { Testimonial } from '@/types';

/**
 * Patient reviews, transcribed verbatim from the testimonials Healthcare Labs
 * publishes on healthcare-labs.com. These are the lab's own published words
 * from named reviewers — nothing here is written or embellished.
 */
export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'tst-harshil-patel',
    name: 'Harshil Patel',
    location: 'Surat',
    rating: 5,
    quote:
      "The team's prompt response in collecting and reporting has been exceptional. Your dedication and hard work are truly appreciated. Thank you for your consistent efforts and commitment to excellence.",
  },
  {
    id: 'tst-abhishek-malaviya',
    name: 'Abhishek Malaviya',
    location: 'Surat',
    rating: 5,
    quote:
      'I had a great experience with this firm for my body check-up. The service was professional, efficient, and thorough. I highly recommend them for anyone looking for quality healthcare services.',
    packageName: 'Full Body Checkup',
  },
  {
    id: 'tst-kishan-kalariya',
    name: 'Kishan Kalariya',
    location: 'Surat',
    rating: 5,
    quote:
      'The healthcare experience was excellent, with a smooth and timely collection process. Staff were professional, and the overall service was efficient and pleasant. Highly recommend for its reliability and care.',
  },
  {
    id: 'tst-jinkal-kunjadiya',
    name: 'Dr. Jinkal Kunjadiya',
    location: 'Surat',
    rating: 5,
    quote:
      'Great service! Quick response times and very cost-effective. The staff is friendly and professional, making the overall experience excellent. Highly recommend for anyone seeking efficient and reliable service!',
  },
  {
    id: 'tst-kheni-digvisha',
    name: 'Kheni Digvisha',
    location: 'Surat',
    rating: 5,
    quote:
      'The staff is friendly and cooperative, with excellent communication. Reports are provided promptly, and there’s no waiting time. Overall, a smooth and efficient experience with great service.',
  },
  {
    id: 'tst-patel-chintan',
    name: 'Patel Chintan',
    location: 'Surat',
    rating: 5,
    quote:
      'The lab management and administration are excellent, and the staff is professional and courteous. They explain everything to patients clearly, making the experience comfortable and reassuring. Highly recommended!',
  },
  {
    id: 'tst-pankaj-vaghasiya',
    name: 'Pankaj Vaghasiya',
    location: 'Surat',
    rating: 5,
    quote:
      'I had a great experience with Healthcare Laboratory. The place was clean, well-organized, and the staff were knowledgeable and helpful. I received my reports on time. Keep up the excellent work!',
  },
];

/**
 * The lab's own published statements, transcribed from healthcare-labs.com.
 * These are the organisation's words about itself — not attributed patient
 * quotes — and are labelled as such wherever they appear.
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
