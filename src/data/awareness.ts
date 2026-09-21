/**
 * The English editorial layer over the lab's own awareness posters.
 *
 * The posters themselves are artwork the lab publishes on Instagram, and they
 * are written in Gujarati. They are reproduced here unchanged — retyping a
 * clinical message into English and presenting it as the lab's own wording
 * would be putting words in their mouth. What sits alongside each one instead
 * is a faithful English summary, so a reader who does not read Gujarati still
 * knows what the poster says before deciding to open it.
 *
 * Keyed by the slug the image pipeline assigns, so the manifest stays
 * generated and this stays hand-written.
 */

export interface AwarenessNote {
  /** English rendering of the poster's own headline. */
  title: string;
  /** What the poster actually says, in one or two sentences. */
  summary: string;
  /** Short subject chip. */
  topic: string;
  /**
   * Where a reader who wants to act on it should go next. Only set where the
   * catalogue genuinely answers the poster — the lab's list does not include a
   * urine culture, for example, so that post points at the urine tests the
   * packages do contain rather than at something we cannot supply.
   */
  related?: { label: string; href: string };
}

export const AWARENESS_NOTES: Record<string, AwarenessNote> = {
  'pcos-one-sign': {
    title: 'Is an irregular period the only sign of PCOS?',
    summary:
      'A change in the cycle is the sign almost everyone knows. The poster makes the point that it is not the only one worth paying attention to.',
    topic: 'PCOS',
  },
  'pcos-other-signs': {
    title: 'The other signs that can come with PCOS',
    summary:
      'Irregular or absent periods, acne or oily skin, extra facial or body hair, weight that will not shift, and thinning hair — with the caveat that nobody has all of them.',
    topic: 'PCOS',
    related: { label: "Women's health packages", href: '/health-package?concern=womens-health' },
  },
  'burning-urination': {
    title: 'Burning when you urinate — is drinking more water enough?',
    summary:
      'Burning that keeps coming back has several possible causes, a urinary tract infection among them. The usual first step is a urine routine and microscopy, with a culture where one is called for.',
    topic: 'Urinary health',
    related: { label: 'Packages that include a urine test', href: '/health-package?q=urine' },
  },
  'choosing-a-lab': {
    title: 'Choose a laboratory on reliability, not on distance',
    summary:
      'A quick report is not the only thing that matters. Accuracy and reliability matter as much — which is the whole point of accreditation.',
    topic: 'Choosing a lab',
    related: { label: 'See the accreditation', href: '/about-us#accreditation' },
  },
};
