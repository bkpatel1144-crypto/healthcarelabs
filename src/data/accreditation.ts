/**
 * The accreditation record.
 *
 * Every field here is evidenced: the certificate number was supplied by the
 * lab, and the ceremony details are read directly off the event backdrop in
 * the photographs. Nothing is inferred.
 */
export const ACCREDITATION = {
  body: 'National Accreditation Board for Testing and Calibration Laboratories',
  bodyShort: 'NABL',
  /** NABL is a constituent board of the QCI — worth stating, it adds context. */
  parentBody: 'Quality Council of India',
  certificateNumber: 'MC-6960',
  scope: 'Medical Testing',
  ceremony: {
    name: 'Felicitation Ceremony of Freshly Accredited Laboratories',
    venue: 'Hotel Radisson Blu, New Delhi',
    /** ISO date, from the ceremony backdrop. */
    date: '2024-12-09',
  },
  /** What accreditation actually means, in plain terms. No embellishment. */
  meaning: [
    'Assessed against ISO 15189, the international standard for medical laboratories.',
    'Covers the competence of the testing, the people and the equipment — not just the paperwork.',
    'Subject to periodic surveillance assessment to stay accredited.',
  ],
} as const;
