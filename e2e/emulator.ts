/**
 * Helpers for talking to the local Firebase emulators from Node.
 *
 * Everything here targets the `demo-healthcarelabs` project on 127.0.0.1. A
 * `demo-` project ID cannot reach real Firebase, so nothing these tests do can
 * touch the live database.
 */
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';

export const PROJECT = 'demo-healthcarelabs';
export const DATABASE = 'healthcarelabs';
const FS = 'http://127.0.0.1:8080';
const AUTH = 'http://127.0.0.1:9099';

const apps: FirebaseApp[] = [];

/** A Firestore client acting as `uid`, or unauthenticated when uid is null. */
export function dbAs(uid: string | null, extraClaims: Record<string, unknown> = {}): Firestore {
  const app = initializeApp({ projectId: PROJECT, apiKey: 'fake-key' }, `as-${uid ?? 'guest'}-${apps.length}`);
  apps.push(app);
  const db = getFirestore(app, DATABASE);
  connectFirestoreEmulator(
    db,
    '127.0.0.1',
    8080,
    uid ? { mockUserToken: { user_id: uid, sub: uid, ...extraClaims } } : undefined,
  );
  return db;
}

export async function disposeClients() {
  await Promise.all(apps.splice(0).map((a) => deleteApp(a)));
}

/** Wipes every document in the named database and every auth user. */
export async function resetEmulators() {
  await fetch(`${FS}/emulator/v1/projects/${PROJECT}/databases/${DATABASE}/documents`, { method: 'DELETE' });
  await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' });
}

/** Writes admins/{uid} with rules bypassed — what the Firebase console does. */
export async function makeAdmin(uid: string) {
  const res = await fetch(
    `${FS}/v1/projects/${PROJECT}/databases/${DATABASE}/documents/admins/${uid}`,
    {
      method: 'PATCH',
      headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { role: { stringValue: 'admin' } } }),
    },
  );
  if (!res.ok) throw new Error(`makeAdmin failed: ${res.status} ${await res.text()}`);
}

/** Reads a document with rules bypassed, for asserting what actually got stored. */
export async function readRaw(path: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${FS}/v1/projects/${PROJECT}/databases/${DATABASE}/documents/${path}`, {
    headers: { Authorization: 'Bearer owner' },
  });
  if (res.status === 404) return null;
  const json = (await res.json()) as { fields?: Record<string, unknown> };
  return json.fields ?? {};
}

/** Lists a collection with rules bypassed. */
export async function listRaw(collection: string): Promise<{ name: string; fields: Record<string, any> }[]> {
  const res = await fetch(`${FS}/v1/projects/${PROJECT}/databases/${DATABASE}/documents/${collection}?pageSize=300`, {
    headers: { Authorization: 'Bearer owner' },
  });
  const json = (await res.json()) as { documents?: { name: string; fields: Record<string, any> }[] };
  return json.documents ?? [];
}

/** The SMS code the auth emulator "sent" to a phone number. */
export async function otpFor(phone: string): Promise<string> {
  const res = await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/verificationCodes`);
  const json = (await res.json()) as { verificationCodes: { phoneNumber: string; code: string }[] };
  const hit = json.verificationCodes.filter((c) => c.phoneNumber === phone).pop();
  if (!hit) throw new Error(`No OTP recorded for ${phone}`);
  return hit.code;
}

/** Looks up the auth UID for an email user created through the UI. */
export async function uidForEmail(email: string): Promise<string> {
  const res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:query`, {
    method: 'POST',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const json = (await res.json()) as { userInfo?: { localId: string; email?: string }[] };
  const user = json.userInfo?.find((u) => u.email === email);
  if (!user) throw new Error(`No auth user for ${email}`);
  return user.localId;
}
