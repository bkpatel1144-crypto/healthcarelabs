/**
 * The English editorial layer over the lab's long-form health features.
 *
 * These are the lab's own newspaper-style pages — full Gujarati articles set in
 * columns, each closing with a note from one of their consultant pathologists.
 * They are a different thing from the square social artwork in `awareness.ts`,
 * which is why they have their own collection and their own band rather than
 * being filed under "From our Instagram".
 *
 * The same rule applies to both, though: the artwork is reproduced unchanged,
 * and the English text beside it is a summary of what the feature says. It is
 * never a rewrite presented as the lab's own wording, and it never repeats the
 * bylined clinician's name or credential as site copy — that byline belongs to
 * the lab's own publication, not to text we write on their behalf.
 *
 * Keyed by the slug the image pipeline assigns, so the manifest stays generated
 * and this stays hand-written.
 */

export interface HealthReportNote {
  /** English rendering of the feature's own headline. */
  title: string;
  /** What the feature actually covers, in two or three sentences. */
  summary: string;
  /** Short subject chip. */
  topic: string;
  /** The points the feature is built around, as it sets them out. */
  covers: string[];
  /**
   * Where a reader who wants to act on it should go next. Only set where the
   * published catalogue genuinely answers the feature.
   */
  related?: { label: string; href: string };
}

export const HEALTH_REPORT_NOTES: Record<string, HealthReportNote> = {
  obesity: {
    title: 'Obesity is more than a matter of weight',
    summary:
      'The feature argues that obesity is not only a question of appearance or of the number on the scale. Fat carried over a long period can affect several of the body’s processes at once, and it works through what those are.',
    topic: 'Metabolic health',
    covers: [
      'Insulin resistance and the risk of type 2 diabetes',
      'Blood pressure, cholesterol and other metabolic problems',
      'Fat accumulating in the liver, and fatty liver disease',
      'Extra load on the knees and lower back, and joint pain',
      'Effects on hormonal balance and fertility',
    ],
    related: {
      label: 'Packages that cover sugar, lipids and liver',
      href: '/health-package?concern=diabetes',
    },
  },
  'health-checkup-by-age': {
    title: 'Which check-up is needed at which age',
    summary:
      'A guide to what is worth testing and when, split into three stages. It makes the point that age is only part of it — family history, lifestyle and existing symptoms change what any one person needs.',
    topic: 'Preventive testing',
    covers: [
      '20 to 35: a baseline — BP, BMI, CBC and a lipid profile',
      '35 to 50: metabolic health and preventive screening',
      '50 and over: comprehensive screening and monitoring',
      'What to do before a test: fasting, medicines, previous reports',
    ],
    related: {
      label: 'Browse the health packages',
      href: '/health-package',
    },
  },
  'kitchen-cancer-risk': {
    title: 'Five things in the kitchen worth a second look',
    summary:
      'Everyday storage and cooking habits, and where the evidence on cancer risk actually sits. It is careful about the distinction between a real association and a direct cause, and says so in the places where the link is not established.',
    topic: 'Everyday risk',
    covers: [
      'Mouldy grain and nuts, and the aflatoxin risk to the liver',
      'Heavily salted pickles and long-preserved foods',
      'Tea and coffee drunk very hot, above about 65°C',
      'Cold drinks and high-sugar beverages, through weight gain',
      'Fried and heavily browned starchy food, and acrylamide',
    ],
  },
};
