import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

/**
 * Firebase web config. These values are not secrets — every Firebase web app
 * ships them to the browser. What protects the data is `firestore.rules`, so
 * any change to who can read what belongs there, not here.
 *
 * Each value can be overridden with a VITE_FIREBASE_* variable (for a staging
 * project, say) without touching this file.
 */
const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? 'AIzaSyAVYmcEFuUlBaIIURbXKktEokuU8ga5-HQ',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? 'hotel-7ac9f.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? 'hotel-7ac9f',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? 'hotel-7ac9f.appspot.com',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '102297833385',
  appId: env.VITE_FIREBASE_APP_ID ?? '1:102297833385:web:d4082c79d3744543173eb8',
};

/** The project uses a named Firestore database, not `(default)`. */
export const FIRESTORE_DATABASE_ID = env.VITE_FIRESTORE_DATABASE_ID ?? 'healthcarelabs';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.useDeviceLanguage();
export const db = getFirestore(app, FIRESTORE_DATABASE_ID);

/*
  Tests run against the local Firebase emulators (see firebase.json and
  e2e/), never the live project. Set only by `npm run test:e2e`.
*/
/*
  Local OTP testing without SMS or billing: with VITE_PHONE_TEST_MODE=true in
  .env.local, the reCAPTCHA step is skipped so the fictional numbers listed
  under Firebase → Authentication → Phone → "Phone numbers for testing" can
  sign in. Real numbers do not work in this mode. `import.meta.env.DEV` keeps
  it out of production builds entirely.
*/
if (env.DEV && env.VITE_PHONE_TEST_MODE === 'true') {
  auth.settings.appVerificationDisabledForTesting = true;
}

if (env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
