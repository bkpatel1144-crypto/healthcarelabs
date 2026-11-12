/**
 * Security-rule tests: every collection, every role, allowed and refused.
 * Runs against the Firestore emulator with firestore.rules loaded.
 */
import { test, expect } from '@playwright/test';
import {
  Bytes,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { dbAs, disposeClients, makeAdmin, resetEmulators } from './emulator';

test.describe.configure({ mode: 'serial' });

const now = () => new Date().toISOString();
const ALICE = 'alice-uid';
const BOB = 'bob-uid';
const ADMIN = 'admin-uid';
const PHLEBO = 'phlebo-uid';
const PHLEBO2 = 'phlebo2-uid';

let alice: Firestore;
let bob: Firestore;
let admin: Firestore;
let guest: Firestore;
let phlebo: Firestore;
let phlebo2: Firestore;

async function allowed(p: Promise<unknown>) {
  await expect(p).resolves.not.toThrow();
}
async function denied(p: Promise<unknown>) {
  const err = await p.then(
    () => null,
    (e: { code?: string }) => e,
  );
  expect(err, 'expected the rules to refuse this').not.toBeNull();
  expect(err?.code).toBe('permission-denied');
}

/** Local YYYY-MM-DD, `offset` days from today. */
const day = (offset: number) => {
  const d = new Date(Date.now() + offset * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const D1 = day(2);
const D2 = day(3);

const profile = (uid: string, extra: Record<string, unknown> = {}) => ({
  uid,
  name: 'Alice Patel',
  phone: '9876543210',
  email: 'alice@example.com',
  gender: 'female',
  dob: '1990-04-12',
  createdAt: now(),
  updatedAt: now(),
  ...extra,
});

const booking = (id: string, uid: string | null, extra: Record<string, unknown> = {}) => ({
  id,
  uid,
  patientName: 'Alice Patel',
  phone: '9876543210',
  email: '',
  preferredDate: D1,
  slotId: 's0700',
  preferredTime: '07:00 – 08:00 AM',
  address: '12 Rose Villa, Adajan, Surat',
  pincode: '395009',
  packageSlugs: ['full-body'],
  packageNames: ['Full Body Checkup'],
  total: 1499,
  payment: { method: 'pay-at-collection', status: 'due', mode: '', amountPaid: 0, paidAt: '' },
  notes: '',
  status: 'new',
  statusReason: '',
  phlebotomist: null,
  phlebotomistUid: '',
  sampleId: '',
  collectedAt: '',
  history: [{ status: 'new', at: now(), by: 'patient', note: '' }],
  consentAt: now(),
  createdAt: now(),
  updatedAt: now(),
  ...extra,
});

type Rec = ReturnType<typeof booking>;

/** Books like the app does: claim a place in the slot and write the booking together. */
function book(db: Firestore, rec: Rec, opts: { claim?: boolean } = {}) {
  return runTransaction(db, async (tx) => {
    const ref = doc(db, 'slots', `${rec.preferredDate}__${rec.slotId}`);
    const snap = await tx.get(ref);
    const ids: string[] = snap.exists() ? snap.data().ids : [];
    if (opts.claim !== false) tx.set(ref, { date: rec.preferredDate, slotId: rec.slotId, ids: [...ids, rec.id], last: { op: 'add', bookingId: rec.id } });
    tx.set(doc(db, 'bookings', rec.id), rec);
  });
}

/** Moves a booking to a new status the way the app does, releasing or claiming its slot. */
function transition(
  db: Firestore,
  id: string,
  patch: (b: Rec) => Partial<Rec>,
  slot: 'keep' | 'release' | 'claim' = 'keep',
) {
  return runTransaction(db, async (tx) => {
    const b = (await tx.get(doc(db, 'bookings', id))).data() as Rec;
    const ref = doc(db, 'slots', `${b.preferredDate}__${b.slotId}`);
    const s = await tx.get(ref);
    const ids: string[] = s.exists() ? s.data().ids : [];
    if (slot === 'release') tx.set(ref, { date: b.preferredDate, slotId: b.slotId, ids: ids.filter((x) => x !== id), last: { op: 'remove', bookingId: id } });
    if (slot === 'claim') tx.set(ref, { date: b.preferredDate, slotId: b.slotId, ids: [...ids, id], last: { op: 'add', bookingId: id } });
    tx.update(doc(db, 'bookings', id), { ...patch(b), updatedAt: now() });
  });
}

const ev = (status: string, by: string, note = '') => ({ status, at: now(), by, note });
const staffDoc = (uid: string, active = true) => ({ uid, name: 'Ravi Kumar', phone: '9000000001', email: '', role: 'phlebotomist', active, createdAt: now() });
const auditDoc = (id: string, actorUid: string, actorRole: string) => ({ id, at: now(), actorUid, actorRole, action: 'booking.status', target: 'bookings/x', detail: 'test' });

test.beforeAll(async () => {
  await resetEmulators();
  alice = dbAs(ALICE);
  bob = dbAs(BOB);
  admin = dbAs(ADMIN);
  guest = dbAs(null);
  phlebo = dbAs(PHLEBO);
  phlebo2 = dbAs(PHLEBO2);
  await makeAdmin(ADMIN);
});

test.afterAll(async () => {
  await disposeClients();
});

/* ---------------------------------------------------------- admins, staff */

test('nobody can make themselves an admin or a phlebotomist', async () => {
  await denied(setDoc(doc(alice, 'admins', ALICE), { role: 'admin' }));
  await allowed(getDoc(doc(alice, 'admins', ALICE)));
  await denied(getDoc(doc(alice, 'admins', ADMIN)));
  await denied(setDoc(doc(phlebo, 'staff', PHLEBO), staffDoc(PHLEBO)));
  await denied(setDoc(doc(admin, 'staff', PHLEBO), { ...staffDoc(PHLEBO), role: 'admin' }));
  await allowed(setDoc(doc(admin, 'staff', PHLEBO), staffDoc(PHLEBO)));
  await allowed(setDoc(doc(admin, 'staff', PHLEBO2), staffDoc(PHLEBO2)));
  await allowed(getDoc(doc(phlebo, 'staff', PHLEBO)));
  await denied(getDoc(doc(phlebo, 'staff', PHLEBO2)));
  await denied(getDocs(collection(phlebo, 'staff')));
});

/* ------------------------------------------------------------- profiles */

test('profile: owner creates, consent shape enforced, others cannot', async () => {
  await denied(setDoc(doc(guest, 'users', ALICE), profile(ALICE)));
  await denied(setDoc(doc(bob, 'users', ALICE), profile(ALICE)));
  await denied(setDoc(doc(alice, 'users', ALICE), profile(ALICE, { role: 'admin' })));
  await denied(setDoc(doc(alice, 'users', ALICE), profile(ALICE, { consent: { privacyVersion: 'x', at: now(), extra: 1 } })));
  await denied(setDoc(doc(alice, 'users', ALICE), profile(ALICE, { marketingOptIn: 'yes' })));
  await allowed(setDoc(doc(alice, 'users', ALICE), profile(ALICE)));
  await allowed(updateDoc(doc(alice, 'users', ALICE), { consent: { privacyVersion: '2026-11', at: now() }, marketingOptIn: false }));
  await allowed(setDoc(doc(bob, 'users', BOB), profile(BOB, { name: 'Bob Mehta' })));
  await denied(getDoc(doc(bob, 'users', ALICE)));
  await denied(getDocs(collection(alice, 'users')));
  expect((await getDocs(collection(admin, 'users'))).size).toBe(2);
  await denied(updateDoc(doc(alice, 'users', ALICE), { uid: BOB }));
  await denied(updateDoc(doc(alice, 'users', ALICE), { createdAt: '2000-01-01T00:00:00.000Z' }));
});

test('family members and addresses: owner only', async () => {
  const m = { id: 'm1', name: 'Kiran Patel', relation: 'Mother', gender: 'female', dob: '1962-01-01', createdAt: now() };
  await allowed(setDoc(doc(alice, 'users', ALICE, 'members', 'm1'), m));
  await denied(setDoc(doc(bob, 'users', ALICE, 'members', 'm3'), { ...m, id: 'm3' }));
  await denied(getDocs(collection(bob, 'users', ALICE, 'members')));
  const a = { id: 'a1', label: 'Home', line: '12 Rose Villa, Adajan', landmark: '', city: 'Surat', pincode: '395009', createdAt: now() };
  await allowed(setDoc(doc(alice, 'users', ALICE, 'addresses', 'a1'), a));
  await denied(setDoc(doc(bob, 'users', ALICE, 'addresses', 'a3'), { ...a, id: 'a3' }));
});

/* ---------------------------------------------------- scheduling config */

test('config: everyone reads, only admins write sensible values', async () => {
  const cfg = {
    slots: { s0700: { label: '07:00 – 08:00 AM', capacity: 2, order: 1 }, s0800: { label: '08:00 – 09:00 AM', capacity: 1, order: 2 } },
    servicePincodes: ['395009', '395007'],
    closedDates: [day(5)],
    daysAhead: 7,
    updatedAt: now(),
  };
  await denied(setDoc(doc(alice, 'config', 'booking'), cfg));
  await denied(setDoc(doc(admin, 'config', 'booking'), { ...cfg, daysAhead: 400 }));
  await denied(setDoc(doc(admin, 'config', 'booking'), { ...cfg, slots: {} }));
  await denied(setDoc(doc(admin, 'config', 'other'), cfg));
  await allowed(setDoc(doc(admin, 'config', 'booking'), cfg));
  await allowed(getDoc(doc(guest, 'config', 'booking')));
});

/* ------------------------------------------------------------- bookings */

test('bookings: a booking must hold a place in an offered, open slot', async () => {
  await allowed(book(guest, booking('g1', null)));
  await allowed(book(alice, booking('b1', ALICE)));
  // Without claiming a place, the booking is refused.
  await denied(book(alice, booking('b-noclaim', ALICE), { claim: false }));
  // A claim with no matching booking (inflating the count) is refused.
  await denied(setDoc(doc(bob, 'slots', `${D1}__s0800`), { date: D1, slotId: 's0800', ids: ['ghost'], last: { op: 'add', bookingId: 'ghost' } }));
  // Capacity of 2 for s0700 is now used up.
  await denied(book(bob, booking('b-full', BOB)));
  // Slot, PIN code, closed date and date window are all checked on the server.
  await denied(book(alice, booking('b-slot', ALICE, { slotId: 's2300' })));
  await denied(book(alice, booking('b-pin', ALICE, { slotId: 's0800', pincode: '110001' })));
  await denied(book(alice, booking('b-closed', ALICE, { slotId: 's0800', preferredDate: day(5) })));
  await denied(book(alice, booking('b-past', ALICE, { slotId: 's0800', preferredDate: day(-3) })));
  await denied(book(alice, booking('b-far', ALICE, { slotId: 's0800', preferredDate: day(20) })));
});

test('bookings: the client cannot pre-fill what the lab decides', async () => {
  const s = { slotId: 's0800', preferredDate: D2 };
  await denied(book(alice, booking('x1', ALICE, { ...s, status: 'confirmed' })));
  await denied(book(alice, booking('x2', ALICE, { ...s, payment: { method: 'pay-at-collection', status: 'paid', mode: 'cash', amountPaid: 1499, paidAt: now() } })));
  await denied(book(alice, booking('x3', ALICE, { ...s, phlebotomist: { uid: PHLEBO, name: 'R', phone: '' }, phlebotomistUid: PHLEBO })));
  await denied(book(alice, booking('x4', ALICE, { ...s, history: [ev('new', 'lab')] })));
  await denied(book(alice, booking('x5', ALICE, { ...s, labNote: 'free' })));
  await denied(book(alice, booking('x6', ALICE, { ...s, consentAt: '' })));
  await denied(book(alice, booking('x7', ALICE, { ...s, phone: '12345' })));
  await denied(book(bob, booking('x8', ALICE, s))); // booking as someone else
  await denied(book(alice, { ...booking('x9', ALICE, s), discount: 100 } as Rec));
});

test('bookings: reading', async () => {
  expect((await getDocs(query(collection(alice, 'bookings'), where('uid', '==', ALICE)))).size).toBe(1);
  await denied(getDocs(collection(alice, 'bookings')));
  await denied(getDoc(doc(guest, 'bookings', 'g1')));
  await denied(getDoc(doc(bob, 'bookings', 'b1')));
  await denied(getDoc(doc(phlebo, 'bookings', 'b1'))); // not assigned yet
  expect((await getDocs(collection(admin, 'bookings'))).size).toBe(2);
});

test('bookings: patient reschedules and cancels, keeping slots in step', async () => {
  // Reschedule b1 from D1/s0700 to D2/s0700, releasing the old place.
  const reschedule = (db: Firestore, release: boolean) =>
    runTransaction(db, async (tx) => {
      const b = (await tx.get(doc(db, 'bookings', 'b1'))).data() as Rec;
      const oldRef = doc(db, 'slots', `${b.preferredDate}__${b.slotId}`);
      const newRef = doc(db, 'slots', `${D2}__s0700`);
      const [o, n] = [await tx.get(oldRef), await tx.get(newRef)];
      if (release) tx.set(oldRef, { date: b.preferredDate, slotId: b.slotId, ids: (o.data()?.ids ?? []).filter((x: string) => x !== 'b1'), last: { op: 'remove', bookingId: 'b1' } });
      tx.set(newRef, { date: D2, slotId: 's0700', ids: [...(n.data()?.ids ?? []), 'b1'], last: { op: 'add', bookingId: 'b1' } });
      tx.update(doc(db, 'bookings', 'b1'), { preferredDate: D2, slotId: 's0700', status: 'new', history: [...b.history, ev('new', 'patient', 'Rescheduled')], updatedAt: now() });
    });
  await denied(reschedule(alice, false)); // must free the old place
  await denied(reschedule(bob, true));
  await allowed(reschedule(alice, true));

  // Now the old D1/s0700 place is free again for Bob.
  await allowed(book(bob, booking('b2', BOB)));

  // Patients may not touch price, payment or rewrite history.
  await denied(updateDoc(doc(alice, 'bookings', 'b1'), { total: 0, updatedAt: now() }));
  await denied(updateDoc(doc(alice, 'bookings', 'b1'), { history: [ev('new', 'patient')], updatedAt: now() }));
  await denied(transition(alice, 'b1', (b) => ({ status: 'confirmed', history: [...b.history, ev('confirmed', 'patient')] })));

  // Cancelling must release the slot.
  await denied(transition(alice, 'b1', (b) => ({ status: 'cancelled', history: [...b.history, ev('cancelled', 'patient')] })));
  await allowed(transition(alice, 'b1', (b) => ({ status: 'cancelled', history: [...b.history, ev('cancelled', 'patient')] }), 'release'));
});

test('bookings: lab moves the lifecycle, appending history only', async () => {
  await denied(transition(admin, 'b2', () => ({ status: 'confirmed' }))); // no history line
  await denied(transition(admin, 'b2', () => ({ status: 'confirmed', history: [ev('confirmed', 'lab')] }))); // rewrote history
  await allowed(transition(admin, 'b2', (b) => ({ status: 'confirmed', history: [...b.history, ev('confirmed', 'lab')] })));
  await denied(updateDoc(doc(admin, 'bookings', 'b2'), { uid: ALICE }));
  await denied(updateDoc(doc(admin, 'bookings', 'b2'), { preferredDate: D2 })); // moving date without the slot
  await allowed(updateDoc(doc(admin, 'bookings', 'b2'), { labNote: 'Keep ID ready', updatedAt: now() }));
  // Once confirmed, the patient can still cancel; once assigned, they cannot.
  await allowed(transition(admin, 'b2', (b) => ({
    status: 'assigned', phlebotomist: { uid: PHLEBO, name: 'Ravi Kumar', phone: '9000000001' }, phlebotomistUid: PHLEBO,
    history: [...b.history, ev('assigned', 'lab', 'Ravi Kumar')],
  })));
  await denied(transition(bob, 'b2', (b) => ({ status: 'cancelled', history: [...b.history, ev('cancelled', 'patient')] }), 'release'));
  // Lab cancelling must also free the place.
  await denied(transition(admin, 'g1', (b) => ({ status: 'cancelled', statusReason: 'Duplicate', history: [...b.history, ev('cancelled', 'lab')] })));
});

test('phlebotomist: sees and records only their own visits', async () => {
  await allowed(getDoc(doc(phlebo, 'bookings', 'b2')));
  expect((await getDocs(query(collection(phlebo, 'bookings'), where('phlebotomistUid', '==', PHLEBO)))).size).toBe(1);
  await denied(getDoc(doc(phlebo2, 'bookings', 'b2')));
  await denied(getDocs(collection(phlebo, 'bookings')));

  await denied(transition(phlebo, 'b2', (b) => ({ status: 'sample-collected', sampleId: 'HL-1', collectedAt: now(), total: 0, history: [...b.history, ev('sample-collected', 'phlebotomist')] })));
  await denied(transition(phlebo, 'b2', (b) => ({ status: 'sample-collected', sampleId: '', collectedAt: now(), history: [...b.history, ev('sample-collected', 'phlebotomist')] })));
  await denied(transition(phlebo, 'b2', (b) => ({ status: 'completed', history: [...b.history, ev('completed', 'phlebotomist')] })));
  await denied(transition(phlebo2, 'b2', (b) => ({ status: 'sample-collected', sampleId: 'HL-1', collectedAt: now(), history: [...b.history, ev('sample-collected', 'phlebotomist')] })));
  await allowed(transition(phlebo, 'b2', (b) => ({ status: 'sample-collected', sampleId: 'HL-24-0001', collectedAt: now(), history: [...b.history, ev('sample-collected', 'phlebotomist', 'Sample ID HL-24-0001')] })));
  // Already collected: no second change from the field.
  await denied(transition(phlebo, 'b2', (b) => ({ status: 'rejected', statusReason: 'oops', history: [...b.history, ev('rejected', 'phlebotomist')] }), 'release'));

  // A deactivated phlebotomist loses access.
  await allowed(setDoc(doc(admin, 'staff', PHLEBO), staffDoc(PHLEBO, false)));
  await denied(getDoc(doc(phlebo, 'bookings', 'b2')));
  await allowed(setDoc(doc(admin, 'staff', PHLEBO), staffDoc(PHLEBO, true)));
});

test('payment is recorded by the lab only', async () => {
  const paid = { method: 'pay-at-collection', status: 'paid', mode: 'upi', amountPaid: 1499, paidAt: now() };
  await denied(updateDoc(doc(bob, 'bookings', 'b2'), { payment: paid, updatedAt: now() }));
  await denied(updateDoc(doc(phlebo, 'bookings', 'b2'), { payment: paid, updatedAt: now() }));
  await denied(updateDoc(doc(admin, 'bookings', 'b2'), { payment: { ...paid, mode: 'crypto' }, updatedAt: now() }));
  await allowed(updateDoc(doc(admin, 'bookings', 'b2'), { payment: paid, updatedAt: now() }));
});

/* ---------------------------------------------------------------- audit */

test('audit log: append-only, actor must be the writer', async () => {
  await allowed(setDoc(doc(admin, 'audit', 'a1'), auditDoc('a1', ADMIN, 'admin')));
  await allowed(setDoc(doc(phlebo, 'audit', 'a2'), auditDoc('a2', PHLEBO, 'phlebotomist')));
  await denied(setDoc(doc(admin, 'audit', 'a3'), auditDoc('a3', PHLEBO, 'admin'))); // impersonation
  await denied(setDoc(doc(phlebo, 'audit', 'a4'), auditDoc('a4', PHLEBO, 'admin'))); // role inflation
  await denied(setDoc(doc(alice, 'audit', 'a5'), auditDoc('a5', ALICE, 'admin')));
  await denied(updateDoc(doc(admin, 'audit', 'a1'), { detail: 'edited' }));
  await denied(deleteDoc(doc(admin, 'audit', 'a1')));
  await denied(getDocs(collection(phlebo, 'audit')));
  expect((await getDocs(collection(admin, 'audit'))).size).toBe(2);
});

/* -------------------------------------------------------------- reports */

const report = (id: string, uid: string, extra: Record<string, unknown> = {}) => ({
  id, uid, bookingId: 'b2', patientName: 'Bob Mehta', title: 'CBC', fileName: 'cbc.pdf',
  sizeBytes: 3, chunkCount: 1, signedBy: 'Dr Mayuri Thumar', version: 1, supersedes: '', superseded: false,
  uploadedAt: now(), uploadedBy: ADMIN, ...extra,
});

test('reports: signed release, revisions, owner-only reading', async () => {
  await denied(setDoc(doc(bob, 'reports', 'r0'), report('r0', BOB)));
  await denied(setDoc(doc(admin, 'reports', 'r0'), report('r0', BOB, { signedBy: '' })));
  await denied(setDoc(doc(admin, 'reports', 'r0'), report('r0', BOB, { uploadedBy: 'someone-else' })));
  await allowed(setDoc(doc(admin, 'reports', 'r1', 'chunks', '0'), { index: 0, data: Bytes.fromUint8Array(new Uint8Array([37, 80, 68])) }));
  await allowed(setDoc(doc(admin, 'reports', 'r1'), report('r1', BOB)));
  await denied(updateDoc(doc(admin, 'reports', 'r1'), { title: 'Changed after release' }));
  await allowed(setDoc(doc(admin, 'reports', 'r2'), report('r2', BOB, { version: 2, supersedes: 'r1' })));
  await allowed(updateDoc(doc(admin, 'reports', 'r1'), { superseded: true }));
  expect((await getDocs(query(collection(bob, 'reports'), where('uid', '==', BOB)))).size).toBe(2);
  await allowed(getDocs(collection(bob, 'reports', 'r1', 'chunks')));
  await denied(getDoc(doc(alice, 'reports', 'r1')));
  await denied(getDocs(collection(alice, 'reports', 'r1', 'chunks')));
  await denied(getDoc(doc(phlebo, 'reports', 'r1')));
});

/* ------------------------------------------------------------- requests */

const request = (id: string, uid: string | null, extra: Record<string, unknown> = {}) => ({
  id, type: 'contact', uid, name: 'Ravi Shah', phone: '9898989898', email: '', topic: '',
  message: 'Please call me about a thyroid test.', attachment: null, status: 'open', reply: '',
  createdAt: now(), updatedAt: now(), ...extra,
});
const attachment = { fileName: 'rx.jpg', mime: 'image/jpeg', sizeBytes: 3, chunkCount: 1 };

test('requests: sending, attachments, data requests, replies', async () => {
  await allowed(setDoc(doc(guest, 'requests', 'q1'), request('q1', null)));
  await allowed(setDoc(doc(alice, 'requests', 'q3'), request('q3', ALICE, { type: 'prescription', attachment })));
  await denied(setDoc(doc(guest, 'requests', 'q4'), request('q4', null, { type: 'prescription', attachment })));
  await denied(setDoc(doc(guest, 'requests', 'q5'), request('q5', null, { type: 'data-request', topic: 'Erasure' })));
  await allowed(setDoc(doc(alice, 'requests', 'q6'), request('q6', ALICE, { type: 'data-request', topic: 'Erasure' })));
  await denied(setDoc(doc(guest, 'requests', 'q7'), request('q7', null, { status: 'resolved' })));
  await allowed(setDoc(doc(alice, 'requests', 'q3', 'chunks', '0'), { index: 0, data: Bytes.fromUint8Array(new Uint8Array([255, 216])) }));
  await denied(setDoc(doc(alice, 'requests', 'q3', 'chunks', '1'), { index: 1, data: Bytes.fromUint8Array(new Uint8Array([1])) }));
  await denied(setDoc(doc(bob, 'requests', 'q3', 'chunks', '0'), { index: 0, data: Bytes.fromUint8Array(new Uint8Array([1])) }));
  await denied(updateDoc(doc(alice, 'requests', 'q6'), { reply: 'self-answer', updatedAt: now() }));
  await allowed(updateDoc(doc(admin, 'requests', 'q6'), { reply: 'Deleted.', status: 'resolved', updatedAt: now() }));
  await denied(getDoc(doc(guest, 'requests', 'q1')));
});

test('anything outside the known collections is closed', async () => {
  await denied(setDoc(doc(admin, 'secrets', 'x'), { a: 1 }));
  await denied(getDoc(doc(admin, 'secrets', 'x')));
  await denied(deleteDoc(doc(admin, 'slots', `${D1}__s0700`)));
});
