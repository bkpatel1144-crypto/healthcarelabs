import {
  Bytes,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Transaction,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { localDateIso } from '@/lib/format';
import {
  DEFAULT_BOOKING_CONFIG,
  HOLDS_SLOT,
  PATIENT_CHANGEABLE,
  PRIVACY_VERSION,
  slotKey,
  type Actor,
  type AssignedStaff,
  type Attachment,
  type AuditEntry,
  type Booking,
  type BookingConfig,
  type BookingStatus,
  type Consent,
  type FamilyMember,
  type LabReport,
  type PatientProfile,
  type PatientRequest,
  type PaymentMode,
  type RequestStatus,
  type SavedAddress,
  type SlotClaim,
  type StaffMember,
  type StatusEvent,
} from '@/types/account';

/*
  Every Firestore read and write the site makes goes through this file, so the
  shapes here and the checks in firestore.rules can be kept in step. If you add
  a field, add it to the rules' allowed key list too or writes will be refused.
*/

const now = () => new Date().toISOString();
const newId = (col: string) => doc(collection(db, col)).id;

/** "+919876543210" → "9876543210"; anything else is returned trimmed. */
export function localPhone(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/[^\d]/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits || '';
}

/* ------------------------------------------------------------------ admins */

/** True when admins/{uid} exists. Patients get permission-denied → false. */
export async function checkIsAdmin(uid: string): Promise<boolean> {
  try {
    return (await getDoc(doc(db, 'admins', uid))).exists();
  } catch {
    return false;
  }
}

/* ----------------------------------------------------------------- profile */

/** Creates users/{uid} on first sign-in, seeded from what the provider knows. */
export async function ensureProfile(user: User): Promise<void> {
  /*
    A transaction, because the login form and the session listener both call
    this on a first sign-in. With a plain get-then-set, the slower one could
    overwrite the name the sign-up form had just saved.
  */
  const ref = doc(db, 'users', user.uid);
  // What the sign-in provider knows: Google gives name, email and photo; phone
  // sign-in gives a verified mobile number.
  const google = user.providerData.find((p) => p.providerId === 'google.com');
  const known = {
    name: (user.displayName ?? google?.displayName ?? '').slice(0, 100),
    phone: localPhone(user.phoneNumber),
    email: (user.email ?? google?.email ?? '').slice(0, 200),
    photoURL: (user.photoURL ?? google?.photoURL ?? '').slice(0, 1000),
  };
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const stamp = now();
    if (!snap.exists()) {
      const profile: PatientProfile = {
        uid: user.uid,
        ...known,
        gender: '',
        dob: '',
        createdAt: stamp,
        updatedAt: stamp,
      };
      tx.set(ref, profile);
      return;
    }
    // On later sign-ins, fill only what is still blank — never overwrite
    // something the patient typed themselves.
    const current = snap.data() as PatientProfile;
    const patch: Partial<PatientProfile> = {};
    if (!current.name && known.name) patch.name = known.name;
    if (!current.phone && known.phone) patch.phone = known.phone;
    if (!current.email && known.email) patch.email = known.email;
    if (!current.photoURL && known.photoURL) patch.photoURL = known.photoURL;
    if (Object.keys(patch).length) tx.update(ref, { ...patch, updatedAt: stamp });
  });
}

export function watchProfile(
  uid: string,
  cb: (p: PatientProfile | null) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => cb(snap.exists() ? (snap.data() as PatientProfile) : null),
    onError,
  );
}

export async function updateProfile(
  uid: string,
  patch: Partial<Pick<PatientProfile, 'name' | 'phone' | 'email' | 'gender' | 'dob' | 'marketingOptIn'>>,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { ...patch, updatedAt: now() });
}

/* ---------------------------------------------- family members & addresses */

function watchSub<T>(uid: string, sub: string, cb: (rows: T[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'users', uid, sub), (snap) => {
    const rows = snap.docs.map((d) => d.data() as T & { createdAt: string });
    rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    cb(rows);
  });
}

export const watchMembers = (uid: string, cb: (rows: FamilyMember[]) => void) =>
  watchSub<FamilyMember>(uid, 'members', cb);

export const watchAddresses = (uid: string, cb: (rows: SavedAddress[]) => void) =>
  watchSub<SavedAddress>(uid, 'addresses', cb);

export async function saveMember(
  uid: string,
  input: Omit<FamilyMember, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
): Promise<void> {
  const id = input.id ?? newId(`users/${uid}/members`);
  await setDoc(doc(db, 'users', uid, 'members', id), {
    ...input,
    id,
    createdAt: input.createdAt ?? now(),
  } satisfies FamilyMember);
}

export async function saveAddress(
  uid: string,
  input: Omit<SavedAddress, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
): Promise<void> {
  const id = input.id ?? newId(`users/${uid}/addresses`);
  await setDoc(doc(db, 'users', uid, 'addresses', id), {
    ...input,
    id,
    createdAt: input.createdAt ?? now(),
  } satisfies SavedAddress);
}

export const deleteMember = (uid: string, id: string) =>
  deleteDoc(doc(db, 'users', uid, 'members', id));
export const deleteAddress = (uid: string, id: string) =>
  deleteDoc(doc(db, 'users', uid, 'addresses', id));

export function formatAddress(a: Pick<SavedAddress, 'line' | 'landmark' | 'city' | 'pincode'>): string {
  return [a.line, a.landmark, a.city, a.pincode].map((s) => s.trim()).filter(Boolean).join(', ');
}

/* ---------------------------------------------------- scheduling config */

const configRef = () => doc(db, 'config', 'booking');

function withDefaults(raw: Partial<BookingConfig> | undefined): BookingConfig {
  return { ...DEFAULT_BOOKING_CONFIG, ...(raw ?? {}) };
}

export function watchBookingConfig(cb: (cfg: BookingConfig) => void): Unsubscribe {
  return onSnapshot(
    configRef(),
    (snap) => cb(withDefaults(snap.exists() ? (snap.data() as BookingConfig) : undefined)),
    () => cb(DEFAULT_BOOKING_CONFIG),
  );
}

export async function saveBookingConfig(cfg: BookingConfig, actor: Actor_): Promise<void> {
  const batch = writeBatch(db);
  batch.set(configRef(), { ...cfg, updatedAt: now() });
  audit(batch, actor, 'config.booking', 'config/booking', `${Object.keys(cfg.slots).length} slots, ${cfg.servicePincodes.length || 'all'} pincodes`);
  await batch.commit();
}

/** Bookings held per slot over a date range, for showing "full" on the form. */
export function watchSlotClaims(from: string, to: string, cb: (claims: Record<string, number>) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'slots'), where('date', '>=', from), where('date', '<=', to)),
    (snap) => {
      const out: Record<string, number> = {};
      snap.docs.forEach((d) => {
        out[d.id] = ((d.data() as SlotClaim).ids ?? []).length;
      });
      cb(out);
    },
    () => cb({}),
  );
}

/** Thrown when a booking cannot take the slot it asked for. */
export class SlotUnavailableError extends Error {}

/* ------------------------------------------------------------------ audit */

/** Who is acting, for audit entries and history lines. */
export interface Actor_ {
  uid: string;
  role: 'admin' | 'phlebotomist';
}

function audit(
  writer: { set: (ref: ReturnType<typeof doc>, data: AuditEntry) => unknown },
  actor: Actor_,
  action: string,
  target: string,
  detail: string,
) {
  const id = newId('audit');
  writer.set(doc(db, 'audit', id), {
    id,
    at: now(),
    actorUid: actor.uid,
    actorRole: actor.role,
    action,
    target,
    detail: detail.slice(0, 300),
  });
}

export function watchAudit(cb: (rows: AuditEntry[]) => void, onError?: (e: Error) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'audit'), orderBy('at', 'desc'), limit(300)),
    (snap) => cb(snap.docs.map((d) => d.data() as AuditEntry)),
    onError,
  );
}

/* ---------------------------------------------------------------- bookings */

export type NewBooking = Pick<
  Booking,
  | 'uid' | 'patientName' | 'phone' | 'email' | 'preferredDate' | 'slotId' | 'preferredTime'
  | 'address' | 'pincode' | 'packageSlugs' | 'packageNames' | 'total' | 'notes' | 'consentAt'
>;

const slotRef = (date: string, slotId: string) => doc(db, 'slots', slotKey(date, slotId));
const event = (status: BookingStatus, by: Actor, note = ''): StatusEvent => ({ status, at: now(), by, note });

/**
 * Checks the slot is offered, open and has room, inside the transaction, so
 * two people cannot both take the last place. The security rules repeat the
 * capacity check on the server.
 */
async function claimSlot(
  tx: Transaction,
  date: string,
  slotId: string,
  bookingId: string,
): Promise<{ ref: ReturnType<typeof slotRef>; ids: string[] }> {
  const [cfgSnap, slotSnap] = await Promise.all([tx.get(configRef()), tx.get(slotRef(date, slotId))]);
  const cfg = withDefaults(cfgSnap.exists() ? (cfgSnap.data() as BookingConfig) : undefined);
  const slot = cfg.slots[slotId];
  if (!slot) throw new SlotUnavailableError('That time slot is no longer offered. Please choose another.');
  if (cfg.closedDates.includes(date)) throw new SlotUnavailableError('The lab is closed for home collection on that date.');
  const ids = slotSnap.exists() ? ((slotSnap.data() as SlotClaim).ids ?? []) : [];
  if (!ids.includes(bookingId) && ids.length >= slot.capacity) {
    throw new SlotUnavailableError('That time slot has just filled up. Please choose another.');
  }
  return { ref: slotRef(date, slotId), ids };
}

async function readSlot(tx: Transaction, date: string, slotId: string) {
  const snap = await tx.get(slotRef(date, slotId));
  return { ref: slotRef(date, slotId), ids: snap.exists() ? ((snap.data() as SlotClaim).ids ?? []) : [] };
}

function writeAdd(tx: Transaction, slot: { ref: ReturnType<typeof slotRef>; ids: string[] }, date: string, slotId: string, id: string) {
  tx.set(slot.ref, { date, slotId, ids: [...slot.ids.filter((x) => x !== id), id], last: { op: 'add', bookingId: id } });
}

function writeRemove(tx: Transaction, slot: { ref: ReturnType<typeof slotRef>; ids: string[] }, date: string, slotId: string, id: string) {
  if (!slot.ids.includes(id)) return;
  tx.set(slot.ref, { date, slotId, ids: slot.ids.filter((x) => x !== id), last: { op: 'remove', bookingId: id } });
}

export async function createBooking(input: NewBooking): Promise<string> {
  const id = newId('bookings');
  const stamp = now();
  const record: Booking = {
    ...input,
    id,
    status: 'new',
    statusReason: '',
    payment: { method: 'pay-at-collection', status: 'due', mode: '', amountPaid: 0, paidAt: '' },
    phlebotomist: null,
    phlebotomistUid: '',
    sampleId: '',
    collectedAt: '',
    history: [{ status: 'new', at: stamp, by: 'patient', note: '' }],
    createdAt: stamp,
    updatedAt: stamp,
  };
  await runTransaction(db, async (tx) => {
    const slot = await claimSlot(tx, input.preferredDate, input.slotId, id);
    writeAdd(tx, slot, input.preferredDate, input.slotId, id);
    tx.set(doc(db, 'bookings', id), record);
  });
  return id;
}

/** A patient's own bookings, newest first (sorted here to avoid an index). */
export function watchMyBookings(uid: string, cb: (rows: Booking[]) => void): Unsubscribe {
  return onSnapshot(query(collection(db, 'bookings'), where('uid', '==', uid)), (snap) => {
    const rows = snap.docs.map((d) => d.data() as Booking);
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    cb(rows);
  });
}

async function readBooking(tx: Transaction, id: string): Promise<Booking> {
  const snap = await tx.get(doc(db, 'bookings', id));
  if (!snap.exists()) throw new Error('This booking no longer exists.');
  return snap.data() as Booking;
}

/** Patients may cancel until a phlebotomist has been assigned. */
export async function cancelMyBooking(id: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const b = await readBooking(tx, id);
    if (!PATIENT_CHANGEABLE.includes(b.status)) throw new Error('This visit can no longer be cancelled online. Please call the lab.');
    const slot = await readSlot(tx, b.preferredDate, b.slotId);
    writeRemove(tx, slot, b.preferredDate, b.slotId, id);
    tx.update(doc(db, 'bookings', id), {
      status: 'cancelled',
      history: [...b.history, event('cancelled', 'patient')],
      updatedAt: now(),
    });
  });
}

/** Moves the visit to another date or slot; the lab confirms it again. */
export async function rescheduleMyBooking(id: string, date: string, slotId: string, slotLabel: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const b = await readBooking(tx, id);
    if (!PATIENT_CHANGEABLE.includes(b.status)) throw new Error('This visit can no longer be rescheduled online. Please call the lab.');
    if (b.preferredDate === date && b.slotId === slotId) throw new Error('That is already the booked slot.');
    const target = await claimSlot(tx, date, slotId, id);
    const old = await readSlot(tx, b.preferredDate, b.slotId);
    writeRemove(tx, old, b.preferredDate, b.slotId, id);
    writeAdd(tx, target, date, slotId, id);
    tx.update(doc(db, 'bookings', id), {
      preferredDate: date,
      slotId,
      preferredTime: slotLabel,
      status: 'new',
      history: [...b.history, event('new', 'patient', `Rescheduled to ${date}, ${slotLabel}`)],
      updatedAt: now(),
    });
  });
}

/* ------------------------------------------------------------- lab side */

export function watchAllBookings(
  cb: (rows: Booking[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(500)),
    (snap) => cb(snap.docs.map((d) => d.data() as Booking)),
    onError,
  );
}

/**
 * Moves a booking to a new status. Leaving a slot-holding status frees the
 * place; returning to one (e.g. re-opening a cancelled visit) claims it again.
 */
export async function labSetStatus(
  id: string,
  status: BookingStatus,
  actor: Actor_,
  opts: { note?: string; reason?: string } = {},
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const b = await readBooking(tx, id);
    if (b.status === status) return;
    const wasHolding = HOLDS_SLOT(b.status);
    const willHold = HOLDS_SLOT(status);
    if (wasHolding !== willHold) {
      const slot = willHold ? await claimSlot(tx, b.preferredDate, b.slotId, id) : await readSlot(tx, b.preferredDate, b.slotId);
      if (willHold) writeAdd(tx, slot, b.preferredDate, b.slotId, id);
      else writeRemove(tx, slot, b.preferredDate, b.slotId, id);
    }
    tx.update(doc(db, 'bookings', id), {
      status,
      statusReason: opts.reason ?? (willHold ? '' : b.statusReason),
      history: [...b.history, event(status, actor.role === 'admin' ? 'lab' : 'phlebotomist', opts.note ?? opts.reason ?? '')],
      updatedAt: now(),
    });
    audit(tx, actor, 'booking.status', `bookings/${id}`, `${b.status} → ${status}${opts.reason ? ` (${opts.reason})` : ''}`);
  });
}

export async function labAssign(id: string, staff: AssignedStaff, actor: Actor_): Promise<void> {
  await runTransaction(db, async (tx) => {
    const b = await readBooking(tx, id);
    if (!['new', 'confirmed', 'assigned', 'rejected'].includes(b.status)) {
      throw new Error('A phlebotomist can only be assigned before the sample is collected.');
    }
    if (!HOLDS_SLOT(b.status)) {
      const slot = await claimSlot(tx, b.preferredDate, b.slotId, id);
      writeAdd(tx, slot, b.preferredDate, b.slotId, id);
    }
    tx.update(doc(db, 'bookings', id), {
      status: 'assigned',
      statusReason: '',
      phlebotomist: staff,
      phlebotomistUid: staff.uid,
      history: [...b.history, event('assigned', 'lab', `${staff.name} will collect the sample`)],
      updatedAt: now(),
    });
    audit(tx, actor, 'booking.assign', `bookings/${id}`, `assigned ${staff.name} (${staff.uid})`);
  });
}

export async function labUpdateNote(id: string, labNote: string, actor: Actor_): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'bookings', id), { labNote, updatedAt: now() });
  audit(batch, actor, 'booking.note', `bookings/${id}`, labNote);
  await batch.commit();
}

export async function labRecordPayment(id: string, mode: Exclude<PaymentMode, ''>, amount: number, actor: Actor_): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'bookings', id), {
    payment: { method: 'pay-at-collection', status: 'paid', mode, amountPaid: amount, paidAt: now() },
    updatedAt: now(),
  });
  audit(batch, actor, 'booking.payment', `bookings/${id}`, `₹${amount} by ${mode}`);
  await batch.commit();
}

/** For junk or duplicate entries. Real visits should be cancelled, not deleted. */
export async function labDeleteBooking(id: string, actor: Actor_): Promise<void> {
  await runTransaction(db, async (tx) => {
    const b = await readBooking(tx, id);
    if (HOLDS_SLOT(b.status)) {
      const slot = await readSlot(tx, b.preferredDate, b.slotId);
      writeRemove(tx, slot, b.preferredDate, b.slotId, id);
    }
    tx.delete(doc(db, 'bookings', id));
    audit(tx, actor, 'booking.delete', `bookings/${id}`, `${b.patientName}, ${b.preferredDate}`);
  });
}

/* ------------------------------------------------------- phlebotomist side */

export function watchAssignedBookings(uid: string, cb: (rows: Booking[]) => void, onError?: (e: Error) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'bookings'), where('phlebotomistUid', '==', uid)),
    (snap) => {
      const rows = snap.docs.map((d) => d.data() as Booking);
      rows.sort((a, b) => `${a.preferredDate}${a.slotId}`.localeCompare(`${b.preferredDate}${b.slotId}`));
      cb(rows);
    },
    onError,
  );
}

export async function phleboMarkCollected(id: string, sampleId: string, actor: Actor_): Promise<void> {
  await runTransaction(db, async (tx) => {
    const b = await readBooking(tx, id);
    if (b.status !== 'assigned') throw new Error('Only an assigned visit can be marked collected.');
    const at = now();
    tx.update(doc(db, 'bookings', id), {
      status: 'sample-collected',
      sampleId,
      collectedAt: at,
      history: [...b.history, { status: 'sample-collected', at, by: 'phlebotomist', note: `Sample ID ${sampleId}` }],
      updatedAt: at,
    });
    audit(tx, actor, 'booking.collected', `bookings/${id}`, `sample ${sampleId}`);
  });
}

export async function phleboMarkNotCollected(id: string, reason: string, actor: Actor_): Promise<void> {
  await labSetStatus(id, 'rejected', actor, { reason });
}

/* ------------------------------------------------------------------ staff */

export async function checkStaff(uid: string): Promise<StaffMember | null> {
  try {
    const snap = await getDoc(doc(db, 'staff', uid));
    const s = snap.exists() ? (snap.data() as StaffMember) : null;
    return s?.active ? s : null;
  } catch {
    return null;
  }
}

export function watchStaff(cb: (rows: StaffMember[]) => void, onError?: (e: Error) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'staff'),
    (snap) => cb(snap.docs.map((d) => d.data() as StaffMember).sort((a, b) => a.name.localeCompare(b.name))),
    onError,
  );
}

export async function saveStaff(member: StaffMember, actor: Actor_): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, 'staff', member.uid), member);
  audit(batch, actor, member.active ? 'staff.save' : 'staff.deactivate', `staff/${member.uid}`, `${member.name}, ${member.role}`);
  await batch.commit();
}

export function watchPatients(
  cb: (rows: PatientProfile[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(1000)),
    (snap) => cb(snap.docs.map((d) => d.data() as PatientProfile)),
    onError,
  );
}

/* ------------------------------------------------------------ consent & data */

export async function recordConsent(uid: string, marketingOptIn: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    consent: { privacyVersion: PRIVACY_VERSION, at: now() } satisfies Consent,
    marketingOptIn,
    updatedAt: now(),
  });
}

export async function setMarketingOptIn(uid: string, marketingOptIn: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { marketingOptIn, updatedAt: now() });
}

/**
 * "Download my data": everything the account holds, as one JSON file —
 * the right of access under the DPDP Act, without having to ask the lab.
 * Report PDFs are listed by title; each downloads from My reports.
 */
export async function exportMyData(uid: string): Promise<void> {
  const [profile, members, addresses, bookings, requests, reports] = await Promise.all([
    getDoc(doc(db, 'users', uid)),
    getDocs(collection(db, 'users', uid, 'members')),
    getDocs(collection(db, 'users', uid, 'addresses')),
    getDocs(query(collection(db, 'bookings'), where('uid', '==', uid))),
    getDocs(query(collection(db, 'requests'), where('uid', '==', uid))),
    getDocs(query(collection(db, 'reports'), where('uid', '==', uid))),
  ]);
  const data = {
    exportedAt: now(),
    profile: profile.data() ?? null,
    familyMembers: members.docs.map((d) => d.data()),
    addresses: addresses.docs.map((d) => d.data()),
    bookings: bookings.docs.map((d) => d.data()),
    requests: requests.docs.map((d) => d.data()),
    reports: reports.docs.map((d) => {
      const { id, title, patientName, signedBy, version, uploadedAt, fileName } = d.data() as LabReport;
      return { id, title, patientName, signedBy, version, uploadedAt, fileName };
    }),
  };
  saveBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `my-healthcare-labs-data-${localDateIso()}.json`);
}

/* ----------------------------------------------------------------- reports */

/*
  Report PDFs are stored in Firestore, split into ~900 KB binary chunks under
  reports/{id}/chunks/{n}. Cloud Storage would be the textbook home, but it now
  needs the paid Blaze plan, and its rules cannot reliably check the admin list
  in this project's named database. Firestore keeps it on the free plan with a
  single set of rules guarding both the record and the file.
*/

export const MAX_REPORT_BYTES = 5 * 1024 * 1024;
const CHUNK_BYTES = 900_000;

export function watchReports(
  filter: { uid: string } | 'all',
  cb: (rows: LabReport[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  const base = collection(db, 'reports');
  const q = filter === 'all' ? query(base, orderBy('uploadedAt', 'desc'), limit(500)) : query(base, where('uid', '==', filter.uid));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => d.data() as LabReport);
      rows.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
      cb(rows);
    },
    onError,
  );
}

/**
 * Releases a signed report. In one transaction: the record goes live, a
 * report it corrects is marked superseded, the linked booking moves to
 * "Report ready", and the release is written to the audit log.
 */
export async function uploadReport(
  file: File,
  meta: { uid: string; bookingId: string; patientName: string; title: string; signedBy: string; supersedes?: LabReport | null },
  actor: Actor_,
): Promise<string> {
  if (file.type !== 'application/pdf') throw new Error('Only PDF files can be uploaded.');
  if (file.size > MAX_REPORT_BYTES) throw new Error('The PDF is larger than 5 MB.');
  if (!meta.signedBy) throw new Error('Choose the authorised signatory who released this report.');

  const bytes = new Uint8Array(await file.arrayBuffer());
  const chunkCount = chunkCountFor(bytes);
  const id = newId('reports');

  // Chunks first, record last: a patient never sees a report whose file is
  // still half-written.
  await writeChunks(['reports', id], bytes);

  const prior = meta.supersedes ?? null;
  const record: LabReport = {
    id,
    uid: meta.uid,
    bookingId: meta.bookingId,
    patientName: meta.patientName,
    title: meta.title,
    fileName: file.name,
    sizeBytes: file.size,
    chunkCount,
    signedBy: meta.signedBy,
    version: prior ? prior.version + 1 : 1,
    supersedes: prior?.id ?? '',
    superseded: false,
    uploadedAt: now(),
    uploadedBy: actor.uid,
  };
  await runTransaction(db, async (tx) => {
    const booking = meta.bookingId ? await tx.get(doc(db, 'bookings', meta.bookingId)) : null;
    tx.set(doc(db, 'reports', id), record);
    if (prior) tx.update(doc(db, 'reports', prior.id), { superseded: true });
    if (booking?.exists()) {
      const b = booking.data() as Booking;
      if (b.status !== 'completed') {
        tx.update(booking.ref, {
          status: 'completed',
          history: [...b.history, event('completed', 'lab', prior ? `Revised report v${record.version}` : `Signed by ${meta.signedBy}`)],
          updatedAt: now(),
        });
      }
    }
    audit(tx, actor, prior ? 'report.revise' : 'report.release', `reports/${id}`, `${meta.title} for ${meta.patientName}, signed by ${meta.signedBy}`);
  });
  return id;
}

/** Reassembles the PDF and hands the browser a download. */
export async function downloadReport(report: LabReport): Promise<void> {
  const parts = await readChunks(['reports', report.id], report.chunkCount);
  saveBlob(new Blob(parts as BlobPart[], { type: 'application/pdf' }), report.fileName || `${report.title}.pdf`);
}

/* ----------------------------------------------------------- file chunks */

function chunkCountFor(bytes: Uint8Array): number {
  return Math.max(1, Math.ceil(bytes.length / CHUNK_BYTES));
}

/** One batch per chunk keeps each request well under Firestore's 10 MB cap. */
async function writeChunks(parent: [string, string], bytes: Uint8Array): Promise<void> {
  const count = chunkCountFor(bytes);
  for (let i = 0; i < count; i += 1) {
    const batch = writeBatch(db);
    batch.set(doc(db, parent[0], parent[1], 'chunks', String(i)), {
      index: i,
      data: Bytes.fromUint8Array(bytes.subarray(i * CHUNK_BYTES, (i + 1) * CHUNK_BYTES)),
    });
    await batch.commit();
  }
}

async function readChunks(parent: [string, string], expected: number): Promise<Uint8Array[]> {
  const snap = await getDocs(collection(db, parent[0], parent[1], 'chunks'));
  const parts = snap.docs
    .map((d) => d.data() as { index: number; data: Bytes })
    .sort((a, b) => a.index - b.index)
    .map((c) => c.data.toUint8Array());
  if (parts.length !== expected) {
    throw new Error('This file is incomplete. Please upload it again.');
  }
  return parts;
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/* --------------------------------------------------------------- requests */

export const ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

/**
 * Phone photos of a prescription are routinely 4–8 MB. Anything over ~1.2 MB
 * is redrawn at a maximum of 2000px as JPEG, which keeps handwriting legible
 * and usually lands under 600 KB. PDFs are passed through untouched.
 */
export async function prepareAttachment(file: File): Promise<{ bytes: Uint8Array; meta: Omit<Attachment, 'chunkCount'> }> {
  if (!ATTACHMENT_TYPES.includes(file.type)) {
    throw new Error('Upload a photo (JPG, PNG, WebP) or a PDF.');
  }
  let blob: Blob = file;
  let mime = file.type;
  let fileName = file.name;

  if (file.type.startsWith('image/') && file.size > 1_200_000) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const compressed = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (compressed) {
      blob = compressed;
      mime = 'image/jpeg';
      fileName = fileName.replace(/\.[^.]+$/, '') + '.jpg';
    }
  }

  if (blob.size > MAX_REPORT_BYTES) throw new Error('The file is larger than 5 MB.');
  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    meta: { fileName, mime, sizeBytes: blob.size },
  };
}

export type NewRequest = Omit<PatientRequest, 'id' | 'attachment' | 'status' | 'reply' | 'createdAt' | 'updatedAt'>;

/**
 * The record is written before its file because the rules let the sender add
 * chunks only to a request that already names them as owner. If the upload
 * breaks halfway, staff see "file incomplete" on download rather than nothing.
 */
export async function createRequest(
  input: NewRequest,
  file?: Awaited<ReturnType<typeof prepareAttachment>>,
): Promise<string> {
  const id = newId('requests');
  const stamp = now();
  const record: PatientRequest = {
    ...input,
    id,
    attachment: file ? { ...file.meta, chunkCount: chunkCountFor(file.bytes) } : null,
    status: 'open',
    reply: '',
    createdAt: stamp,
    updatedAt: stamp,
  };
  await setDoc(doc(db, 'requests', id), record);
  if (file) await writeChunks(['requests', id], file.bytes);
  return id;
}

export function watchMyRequests(uid: string, cb: (rows: PatientRequest[]) => void): Unsubscribe {
  return onSnapshot(query(collection(db, 'requests'), where('uid', '==', uid)), (snap) => {
    const rows = snap.docs.map((d) => d.data() as PatientRequest);
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    cb(rows);
  });
}

export function watchAllRequests(
  cb: (rows: PatientRequest[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'requests'), orderBy('createdAt', 'desc'), limit(500)),
    (snap) => cb(snap.docs.map((d) => d.data() as PatientRequest)),
    onError,
  );
}

export async function adminUpdateRequest(
  id: string,
  patch: { status?: RequestStatus; reply?: string },
): Promise<void> {
  await updateDoc(doc(db, 'requests', id), { ...patch, updatedAt: now() });
}

export async function adminDeleteRequest(request: PatientRequest): Promise<void> {
  await deleteDoc(doc(db, 'requests', request.id));
  if (request.attachment) {
    const chunks = await getDocs(collection(db, 'requests', request.id, 'chunks'));
    await Promise.all(chunks.docs.map((d) => deleteDoc(d.ref)));
  }
}

/** Opens an image or PDF attachment in a new tab (falls back to download). */
export async function openAttachment(request: PatientRequest): Promise<void> {
  const att = request.attachment;
  if (!att) return;
  // Open the tab synchronously so pop-up blockers treat it as user-initiated.
  const tab = window.open('', '_blank');
  try {
    const parts = await readChunks(['requests', request.id], att.chunkCount);
    const blob = new Blob(parts as BlobPart[], { type: att.mime });
    const url = URL.createObjectURL(blob);
    if (tab) {
      tab.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } else {
      saveBlob(blob, att.fileName);
    }
  } catch (err) {
    tab?.close();
    throw err;
  }
}

/** Withdraws a report uploaded in error. Corrections should use a revision instead. */
export async function deleteReport(report: LabReport, actor: Actor_): Promise<void> {
  // Record first so the patient stops seeing it even if a chunk delete fails.
  const batch = writeBatch(db);
  batch.delete(doc(db, 'reports', report.id));
  audit(batch, actor, 'report.withdraw', `reports/${report.id}`, `${report.title} for ${report.patientName}`);
  await batch.commit();
  const chunks = await getDocs(collection(db, 'reports', report.id, 'chunks'));
  await Promise.all(chunks.docs.map((d) => deleteDoc(d.ref)));
}
