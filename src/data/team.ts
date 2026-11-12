/**
 * The people the lab has published: who they are and what they are called.
 *
 * What is here is exactly what the lab supplied — a name and a role for each
 * of four people, and nothing else. What is deliberately absent is
 * qualifications, degrees, registration numbers, years of experience and
 * specialisms. None of that was given, and on a diagnostics site a credential
 * is the single worst thing to guess at: "MD Pathology" under a photograph is
 * a claim about a named individual that a reader is entitled to rely on.
 *
 * So each person carries a `role` and nothing more, and the section explains
 * what the role itself does rather than attributing anything to the person.
 * `summary` below describes the job, not the holder of it, which is why the
 * three pathologists share one — distinguishing them would mean inventing the
 * difference.
 *
 * To add real biographies, put them in `bio` and the card will render them.
 * They have to come from the lab in writing.
 */

export interface TeamMember {
  /** Id of the portrait in TEAM_PHOTOS, generated from assets-src/team/. */
  photoId: string;
  name: string;
  /** Exactly as the lab published it. */
  role: string;
  /**
   * A biography supplied by the lab. Nothing is invented to fill this — the
   * card simply omits it while it is absent.
   */
  bio?: string;
}

/** The lab director, shown ahead of the clinical team. */
export const TEAM_LEAD: TeamMember = {
  photoId: 'viral-desai',
  name: 'Viral A. Desai',
  role: 'Lab Director & Founder',
};

/**
 * The consultant pathologists, in the order the lab listed them.
 */
export const PATHOLOGISTS: TeamMember[] = [
  { photoId: 'dr-mayuri-thumar', name: 'Dr Mayuri Thumar', role: 'Consultant Pathologist' },
  { photoId: 'dr-bhoomika-narola', name: 'Dr Bhoomika Narola', role: 'Consultant Pathologist' },
  { photoId: 'dr-shruti-devani', name: 'Dr Shruti Devani', role: 'Consultant Pathologist' },
];

/**
 * What a consultant pathologist does — a description of the role, which is
 * checkable, rather than a claim about any of the three people above.
 */
export const PATHOLOGIST_ROLE =
  'A consultant pathologist is the doctor who reviews what the analysers produce and authorises '
  + 'the report before it is released. It is the point where a set of numbers becomes a finding '
  + 'someone is accountable for.';
