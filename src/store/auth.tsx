import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PatientProfile, StaffMember } from '@/types/account';

/**
 * Who is signed in, and whether they are lab staff.
 *
 * Firebase is imported dynamically here, after first paint, so the ~150 KB SDK
 * never sits in the homepage's entry chunk. The header only needs to know
 * "signed in or not", and it can show its neutral state for the few hundred
 * milliseconds the SDK takes to arrive.
 *
 * Admin is decided by the existence of admins/{uid} in Firestore, which only
 * the Firebase console can create — the client cannot grant itself the role,
 * and the security rules repeat the same check on every admin read and write.
 */

export interface SessionUser {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  emailVerified: boolean;
  photoURL: string | null;
}

export interface AuthApi {
  status: 'loading' | 'signed-out' | 'signed-in';
  user: SessionUser | null;
  profile: PatientProfile | null;
  isAdmin: boolean;
  /** Active field-staff record (phlebotomist), or null. */
  staff: StaffMember | null;
  /** The identity staff actions are recorded under, or null for patients. */
  actor: { uid: string; role: 'admin' | 'phlebotomist' } | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthApi['status']>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [staff, setStaff] = useState<StaffMember | null>(null);

  useEffect(() => {
    let cancelled = false;
    let stopAuth: (() => void) | undefined;
    let stopProfile: (() => void) | undefined;

    (async () => {
      const [{ auth }, { onAuthStateChanged }, api] = await Promise.all([
        import('@/lib/firebase'),
        import('firebase/auth'),
        import('@/lib/accountApi'),
      ]);
      if (cancelled) return;

      stopAuth = onAuthStateChanged(auth, async (fbUser) => {
        stopProfile?.();
        stopProfile = undefined;

        if (!fbUser) {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setStaff(null);
          setStatus('signed-out');
          return;
        }

        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          phoneNumber: fbUser.phoneNumber,
          displayName: fbUser.displayName,
          emailVerified: fbUser.emailVerified,
          photoURL: fbUser.photoURL,
        });

        try {
          await api.ensureProfile(fbUser);
        } catch (err) {
          console.error('Could not create the patient profile', err);
        }
        const [admin, staffRecord] = await Promise.all([api.checkIsAdmin(fbUser.uid), api.checkStaff(fbUser.uid)]);
        if (cancelled) return;
        setIsAdmin(admin);
        setStaff(staffRecord);

        stopProfile = api.watchProfile(
          fbUser.uid,
          (p) => setProfile(p),
          (err) => console.error('Profile listener failed', err),
        );
        setStatus('signed-in');
      });
    })().catch((err) => {
      console.error('Firebase failed to load', err);
      if (!cancelled) setStatus('signed-out');
    });

    return () => {
      cancelled = true;
      stopProfile?.();
      stopAuth?.();
    };
  }, []);

  const api = useMemo<AuthApi>(
    () => ({
      status,
      user,
      profile,
      isAdmin,
      staff,
      actor: user && isAdmin ? { uid: user.uid, role: 'admin' } : user && staff ? { uid: user.uid, role: 'phlebotomist' } : null,
      signOut: async () => {
        const [{ auth }, { signOut }] = await Promise.all([
          import('@/lib/firebase'),
          import('firebase/auth'),
        ]);
        await signOut(auth);
      },
    }),
    [status, user, profile, isAdmin, staff],
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.');
  return ctx;
}

/** Years since an ISO date, or null when there is no usable date. */
export function ageFrom(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}
