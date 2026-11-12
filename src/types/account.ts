/**
 * Records kept in Firestore (database `healthcarelabs`). Timestamps are ISO
 * strings rather than Firestore Timestamps so the same shapes work in the UI,
 * in JSON exports and in the security rules' simple type checks.
 */

export type Gender = 'male' | 'female' | 'other' | '';

/**
 * Version of the privacy notice a person agreed to. Bump it when the notice
 * changes materially; anyone whose recorded version differs is asked again.
 */
export const PRIVACY_VERSION = '2026-11';

/** What a profile must have before the account is ready to book. */
export function profileGaps(p: { name: string; phone: string; gender: string; dob: string; consent?: { privacyVersion: string } | null } | null): string[] {
  if (!p) return [];
  const gaps: string[] = [];
  if (p.name.trim().length < 2) gaps.push('name');
  if (!/^[6-9]\d{9}$/.test(p.phone)) gaps.push('phone');
  if (!p.gender) gaps.push('gender');
  if (!p.dob) gaps.push('dob');
  if (p.consent?.privacyVersion !== PRIVACY_VERSION) gaps.push('consent');
  return gaps;
}

/** Purpose-specific consent, as the DPDP Act expects: what, which version, when. */
export interface Consent {
  /** Processing personal and health data to book tests and deliver reports. */
  privacyVersion: string;
  at: string;
}

/** users/{uid} — one per signed-in person. Never carries a role. */
export interface PatientProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  gender: Gender;
  /** ISO date (YYYY-MM-DD) or empty. Age is derived from it for display. */
  dob: string;
  /** Profile photo from Google sign-in, or empty. */
  photoURL?: string;
  /** Absent on accounts created before consent capture; they are asked once. */
  consent?: Consent | null;
  /** Offers and health reminders — separate from the service consent, off by default. */
  marketingOptIn?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** users/{uid}/members/{id} — family members the account books for. */
export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  gender: Gender;
  dob: string;
  createdAt: string;
}

/** users/{uid}/addresses/{id} — saved collection addresses. */
export interface SavedAddress {
  id: string;
  label: string;
  line: string;
  landmark: string;
  city: string;
  pincode: string;
  createdAt: string;
}

/* ------------------------------------------------------------- bookings */

/**
 * The order lifecycle home-collection labs run on: booked, confirmed by the
 * lab, a phlebotomist assigned, the sample drawn and labelled, received and
 * accessioned at the lab, processed, report released. `rejected` covers a
 * sample that could not be collected or was unusable and must be redrawn.
 */
export type BookingStatus =
  | 'new'
  | 'confirmed'
  | 'assigned'
  | 'sample-collected'
  | 'received'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export const BOOKING_STEPS: { status: BookingStatus; label: string }[] = [
  { status: 'new', label: 'Booked' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'assigned', label: 'Phlebotomist assigned' },
  { status: 'sample-collected', label: 'Sample collected' },
  { status: 'received', label: 'Received at lab' },
  { status: 'processing', label: 'Processing' },
  { status: 'completed', label: 'Report ready' },
];

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  new: 'Booked',
  confirmed: 'Confirmed',
  assigned: 'Phlebotomist assigned',
  'sample-collected': 'Sample collected',
  received: 'Received at lab',
  processing: 'Processing',
  completed: 'Report ready',
  cancelled: 'Cancelled',
  rejected: 'Recollection needed',
};

/** Statuses in which the visit has not happened yet — the patient may still change it. */
export const PATIENT_CHANGEABLE: BookingStatus[] = ['new', 'confirmed'];
/** Statuses that hold a place in a time slot. */
export const HOLDS_SLOT = (s: BookingStatus) => s !== 'cancelled' && s !== 'rejected';

export type Actor = 'patient' | 'lab' | 'phlebotomist';

/** One line of a booking's audit trail, shown to the patient as a timeline. */
export interface StatusEvent {
  status: BookingStatus;
  at: string;
  by: Actor;
  note: string;
}

export type PaymentMode = '' | 'cash' | 'upi' | 'card';

export interface PaymentRecord {
  method: 'pay-at-collection';
  status: 'due' | 'paid';
  mode: PaymentMode;
  amountPaid: number;
  paidAt: string;
}

export interface AssignedStaff {
  uid: string;
  name: string;
  phone: string;
}

/** bookings/{id} — a home-collection order. `uid` is null for guests. */
export interface Booking {
  id: string;
  uid: string | null;
  /** Who the sample is taken from: the account holder or a family member. */
  patientName: string;
  phone: string;
  email: string;
  preferredDate: string;
  /** Key into config/booking.slots; the label is copied for display. */
  slotId: string;
  preferredTime: string;
  address: string;
  pincode: string;
  packageSlugs: string[];
  packageNames: string[];
  /** Sum of the priced packages at booking time; on-request items excluded. */
  total: number;
  payment: PaymentRecord;
  notes: string;
  status: BookingStatus;
  /** Why it was cancelled or rejected, when the lab says. */
  statusReason: string;
  /** Shown to the patient; written by the lab. */
  labNote?: string;
  phlebotomist: AssignedStaff | null;
  /** Copy of phlebotomist.uid ('' when unassigned), for queries and rules. */
  phlebotomistUid: string;
  /** Tube/barcode ID written at the draw, linking the sample to this order. */
  sampleId: string;
  collectedAt: string;
  history: StatusEvent[];
  /** When the booker accepted the privacy notice for this booking. */
  consentAt: string;
  createdAt: string;
  updatedAt: string;
}

/* ---------------------------------------------------- scheduling config */

export interface SlotConfig {
  label: string;
  /** How many visits the lab can make in this window on one day. */
  capacity: number;
  /** Sort order on the booking form. */
  order: number;
}

/** config/booking — set by admins, read by everyone. */
export interface BookingConfig {
  slots: Record<string, SlotConfig>;
  /** Empty list means every pincode is served. */
  servicePincodes: string[];
  /** YYYY-MM-DD dates with no home collection (holidays). */
  closedDates: string[];
  /** How far ahead a visit can be booked. */
  daysAhead: number;
  updatedAt: string;
}

/** slots/{date}__{slotId} — which bookings hold a place in one window. */
export interface SlotClaim {
  date: string;
  slotId: string;
  ids: string[];
}

export const slotKey = (date: string, slotId: string) => `${date}__${slotId}`;

/** Used until an admin saves config/booking for the first time. */
export const DEFAULT_BOOKING_CONFIG: BookingConfig = {
  slots: {
    s0700: { label: '07:00 – 08:00 AM', capacity: 6, order: 1 },
    s0800: { label: '08:00 – 09:00 AM', capacity: 6, order: 2 },
    s0900: { label: '09:00 – 10:00 AM', capacity: 6, order: 3 },
    s1000: { label: '10:00 – 11:00 AM', capacity: 6, order: 4 },
    s1100: { label: '11:00 AM – 12:00 PM', capacity: 6, order: 5 },
    s1600: { label: '04:00 – 05:00 PM', capacity: 6, order: 6 },
    s1700: { label: '05:00 – 06:00 PM', capacity: 6, order: 7 },
    s1800: { label: '06:00 – 07:00 PM', capacity: 6, order: 8 },
  },
  servicePincodes: [],
  closedDates: [],
  daysAhead: 14,
  updatedAt: '',
};

/* ---------------------------------------------------------------- staff */

/** staff/{uid} — field staff. Admins are separate (admins/{uid}, console only). */
export interface StaffMember {
  uid: string;
  name: string;
  phone: string;
  email: string;
  role: 'phlebotomist';
  active: boolean;
  createdAt: string;
}

/** audit/{id} — append-only record of staff actions on patient data. */
export interface AuditEntry {
  id: string;
  at: string;
  actorUid: string;
  actorRole: 'admin' | 'phlebotomist';
  action: string;
  target: string;
  detail: string;
}

/* ---------------------------------------------------------------- requests */

/**
 * requests/{id} — everything a visitor sends the lab that is not a booking:
 * contact messages, support questions, prescriptions to quote, partnership
 * enquiries. One collection, one staff inbox, one set of rules.
 */
export type RequestType = 'contact' | 'support' | 'prescription' | 'partnership' | 'data-request';
export type RequestStatus = 'open' | 'in-progress' | 'resolved';

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  contact: 'Contact message',
  support: 'Support request',
  prescription: 'Prescription',
  partnership: 'Partnership enquiry',
  'data-request': 'Data request',
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  open: 'Received',
  'in-progress': 'In progress',
  resolved: 'Resolved',
};

/** A file stored as chunks under requests/{id}/chunks. */
export interface Attachment {
  fileName: string;
  mime: string;
  sizeBytes: number;
  chunkCount: number;
}

export interface PatientRequest {
  id: string;
  type: RequestType;
  /** null when sent without logging in (prescriptions always need a login). */
  uid: string | null;
  name: string;
  phone: string;
  email: string;
  /** Support category, partnership kind, or empty. */
  topic: string;
  message: string;
  attachment: Attachment | null;
  status: RequestStatus;
  /** The lab's answer, shown to a logged-in sender under My requests. */
  reply: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * reports/{id} — metadata; the PDF itself lives in reports/{id}/chunks.
 *
 * Release follows ISO 15189 practice: every report names the authorised
 * signatory who reviewed it, and a correction is issued as a new version that
 * supersedes the old one rather than silently replacing the file.
 */
export interface LabReport {
  id: string;
  uid: string;
  bookingId: string;
  patientName: string;
  title: string;
  fileName: string;
  sizeBytes: number;
  chunkCount: number;
  /** Authorised signatory (consultant pathologist) who released it. */
  signedBy: string;
  version: number;
  /** Id of the report this one corrects, or empty. */
  supersedes: string;
  /** True once a newer version replaces it; kept for the record. */
  superseded: boolean;
  uploadedAt: string;
  uploadedBy: string;
}
