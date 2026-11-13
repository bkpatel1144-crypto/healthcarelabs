import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, KeyRound, Loader2, Mail, ShieldCheck, Smartphone } from 'lucide-react';
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  type ConfirmationResult,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { ensureProfile, updateProfile } from '@/lib/accountApi';
import { useAuth } from '@/store/auth';
import { profileGaps } from '@/types/account';
import { TextField, isValidEmail, isValidPhone } from '@/components/common/Form';
import { Button } from '@/components/common/Button';
import { SITE_CONFIG } from '@/config/site';
import { useSeo } from '@/lib/seo';
import { cn } from '@/lib/cn';

/** Turns Firebase error codes into sentences a patient can act on. */
function friendly(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-phone-number': 'That mobile number is not valid.',
    'auth/missing-phone-number': 'Enter your mobile number.',
    'auth/too-many-requests':
      'Too many OTP attempts from this device or number. For security, please wait about an hour before trying again — or log in with email or Google now.',
    'auth/quota-exceeded': 'The daily OTP limit has been reached. Please try email login or call the lab.',
    'auth/invalid-verification-code': 'That OTP is incorrect. Check the SMS and try again.',
    'auth/code-expired': 'That OTP has expired. Send a new one.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/user-not-found': 'No account uses that email. Create one below.',
    'auth/email-already-in-use': 'An account already uses that email. Sign in instead.',
    'auth/weak-password': 'Use at least 6 characters for the password.',
    'auth/popup-closed-by-user': 'The Google window was closed before signing in.',
    'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups and try again.',
    'auth/operation-not-allowed':
      'This sign-in method is not switched on yet. The lab needs to enable it in Firebase.',
    'auth/unauthorized-domain':
      'This website address is not authorised for sign-in yet. Add it under Firebase → Authentication → Settings → Authorized domains.',
    'auth/network-request-failed': 'No connection. Check your internet and try again.',
    'auth/invalid-app-credential':
      'The security check before sending the OTP did not pass. Refresh the page and try again, or log in with email or Google.',
    'auth/captcha-check-failed':
      'The security check before sending the OTP did not pass. Refresh the page and try again, or log in with email or Google.',
    'auth/billing-not-enabled':
      'SMS sign-in is not available on the lab’s current Firebase plan. Please log in with email or Google.',
  };
  return map[code] ?? 'Something went wrong. Please try again.';
}

type Tab = 'phone' | 'email';

export default function Login() {
  useSeo({
    title: 'Log in',
    description: `Log in to ${SITE_CONFIG.brandName} to book tests, track samples and download reports.`,
    path: '/login',
    noindex: true,
  });

  const { status, isAdmin, profile } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const [tab, setTab] = useState<Tab>('phone');

  // Once Firebase reports a session, send the person where they were going.
  // A first sign-in (or an account missing what booking needs) goes through
  // "Complete your profile" first, then on to where the person was heading.
  useEffect(() => {
    if (status !== 'signed-in' || !profile) return;
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
    const target = safeNext ?? (isAdmin ? '/admin' : '/account');
    if (profileGaps(profile).length > 0) {
      navigate(`/account/welcome?next=${encodeURIComponent(target)}`, { replace: true });
    } else {
      navigate(target, { replace: true });
    }
  }, [status, isAdmin, profile, next, navigate]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-white pb-20 pt-[110px] xl:pt-[140px]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(175deg,#FFFFFF_0%,#F4F8FF_60%,#E9F2FF_100%)]" />
        <div className="absolute inset-0 bg-mesh-hero opacity-70" />
      </div>

      <div className="relative mx-auto w-full max-w-[440px] px-4">
        <Link
          to="/"
          className="group mb-6 inline-flex items-center gap-2 text-[13px] font-semibold text-ink-muted transition-colors hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.2} aria-hidden="true" />
          Back to site
        </Link>

        <div className="rounded-3xl bg-white p-6 shadow-[0_40px_90px_-40px_rgba(11,32,88,0.45)] ring-1 ring-brand-100 sm:p-8">
          <h1 className="text-[26px] font-extrabold tracking-editorial text-ink">Log in or sign up</h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-ink-muted">
            Book home collections, track your sample and download reports in one place.
          </p>

          <div role="tablist" aria-label="Sign-in method" className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-mist p-1">
            {(
              [
                { id: 'phone', label: 'Mobile OTP', Icon: Smartphone },
                { id: 'email', label: 'Email', Icon: Mail },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  'flex h-10 items-center justify-center gap-2 rounded-lg text-[13.5px] font-semibold transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                  tab === id ? 'bg-white text-brand-700 shadow-sm ring-1 ring-ink-line' : 'text-ink-muted hover:text-ink',
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6">{tab === 'phone' ? <PhoneLogin onUseEmail={() => setTab('email')} /> : <EmailLogin />}</div>

          <div className="my-6 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            <span className="h-px flex-1 bg-ink-line" />
            or
            <span className="h-px flex-1 bg-ink-line" />
          </div>

          <GoogleLogin />

          <p className="mt-6 flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-soft">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint-600" strokeWidth={2.2} aria-hidden="true" />
            Your reports are visible only to you and the lab. Lab staff use this same page with
            their staff account.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- mobile OTP */

function PhoneLogin({ onUseEmail }: { onUseEmail: () => void }) {
  // Set when SMS cannot be sent at all for this project, as opposed to a typo.
  const [smsUnavailable, setSmsUnavailable] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => () => verifierRef.current?.clear(), []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const sendOtp = async () => {
    setError('');
    setSmsUnavailable(false);
    if (!isValidPhone(phone)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    const digits = phone.replace(/[^\d]/g, '').slice(-10);
    setBusy(true);
    try {
      /*
        A reCAPTCHA token is good for one attempt, and re-rendering into an
        element that already held a widget leaves a stale one behind — both
        surface as auth/invalid-app-credential. So every attempt gets a brand
        new container and a freshly rendered verifier.
      */
      verifierRef.current?.clear();
      const anchor = document.getElementById('recaptcha-anchor');
      if (!anchor) throw new Error('reCAPTCHA container missing');
      anchor.replaceChildren();
      const holder = document.createElement('div');
      anchor.appendChild(holder);
      verifierRef.current = new RecaptchaVerifier(auth, holder, { size: 'invisible' });
      await verifierRef.current.render();
      const result = await signInWithPhoneNumber(auth, `+91${digits}`, verifierRef.current);
      setConfirmation(result);
      setCode('');
      setCooldown(30);
    } catch (err) {
      console.error(err);
      verifierRef.current?.clear();
      verifierRef.current = null;
      setError(friendly(err));
      const code = (err as { code?: string })?.code ?? '';
      setSmsUnavailable(['auth/invalid-app-credential', 'auth/captcha-check-failed', 'auth/billing-not-enabled', 'auth/quota-exceeded', 'auth/operation-not-allowed', 'auth/too-many-requests'].includes(code));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    if (!confirmation) return;
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit OTP from the SMS.');
      return;
    }
    setBusy(true);
    try {
      const cred = await confirmation.confirm(code);
      await ensureProfile(cred.user);
      // Navigation happens in <Login> once the session is picked up.
    } catch (err) {
      setError(friendly(err));
      setBusy(false);
    }
  };

  return (
    <div>
      {!confirmation ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendOtp();
          }}
          noValidate
        >
          <label htmlFor="login-phone" className="mb-2 block text-[13px] font-semibold text-ink">
            Mobile number
          </label>
          <div className="flex h-12 overflow-hidden rounded-xl border border-ink-line bg-white focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-100">
            <span className="flex items-center border-r border-ink-line bg-mist px-3.5 text-[15px] font-semibold text-ink-muted">
              +91
            </span>
            <input
              id="login-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="98765 43210"
              className="w-full px-4 text-[15px] tracking-wide text-ink placeholder:text-ink-soft/60 focus:outline-none"
            />
          </div>
          {/*
            New numbers register themselves — Firebase creates the account on
            the first verified OTP, and profileGaps() then routes the person
            through "Complete your profile" for their name, date of birth and
            consent. That works, but nothing on this tab said so: the email tab
            carries a visible "Sign up" toggle, so beside it this one read as
            login-only and a first-time visitor had no reason to think entering
            their number would do anything. The mechanism was never the gap,
            the sentence was.
          */}
          <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
            First time here? Just enter your number. We will create your account once the OTP is
            verified, then ask for your name and a few details.
          </p>
          <Button type="submit" size="lg" className="mt-4 w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Send OTP
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} noValidate>
          <p className="mb-4 text-[14px] text-ink-muted">
            OTP sent to <strong className="font-semibold text-ink">+91 {phone}</strong>.{' '}
            <button
              type="button"
              onClick={() => {
                setConfirmation(null);
                setError('');
              }}
              className="font-semibold text-brand-600 hover:underline"
            >
              Change
            </button>
          </p>
          <TextField
            label="Enter OTP"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="6-digit code"
            autoFocus
          />
          <Button type="submit" size="lg" className="mt-4 w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Verify &amp; continue
          </Button>
          <button
            type="button"
            disabled={cooldown > 0 || busy}
            onClick={() => void sendOtp()}
            className="mt-3 w-full text-[13px] font-semibold text-brand-600 disabled:text-ink-soft"
          >
            {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-3 text-[13px] font-medium text-rose-600">
          {error}
        </p>
      )}
      {smsUnavailable && (
        <div className="mt-3 rounded-xl bg-mist p-3.5 text-[13.5px] text-ink">
          <p>You can still log in now — your account works the same with any method.</p>
          <button type="button" onClick={onUseEmail} className="mt-2 font-semibold text-brand-600 hover:underline">
            Use email instead
          </button>
          <span className="text-ink-muted"> or choose “Continue with Google” below.</span>
        </div>
      )}
      {/* Invisible reCAPTCHA mounts here; Firebase requires it for SMS. */}
      <div id="recaptcha-anchor" />
    </div>
  );
}

/* ------------------------------------------------------------------ email */

function EmailLogin() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    if (mode === 'signup' && name.trim().length < 2) return setError('Enter your full name.');
    if (mode !== 'reset' && password.length < 6)
      return setError('Password must be at least 6 characters.');

    setBusy(true);
    try {
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email.trim());
        setInfo('If an account uses that email, a reset link is on its way.');
        setBusy(false);
        return;
      }
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await ensureProfile(cred.user);
        await updateProfile(cred.user.uid, { name: name.trim(), email: email.trim() });
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        await ensureProfile(cred.user);
      }
    } catch (err) {
      setError(friendly(err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {mode === 'signup' && (
        <TextField
          label="Full name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {mode !== 'reset' && (
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      )}

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {mode === 'signin' ? 'Log in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
      </Button>

      {error && (
        <p role="alert" className="text-[13px] font-medium text-rose-600">
          {error}
        </p>
      )}
      {info && (
        <p role="status" className="text-[13px] font-medium text-mint-700">
          {info}
        </p>
      )}

      <div className="flex flex-wrap justify-between gap-2 text-[13px] font-semibold">
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signup' ? 'signin' : 'signup');
            setError('');
          }}
          className="text-brand-600 hover:underline"
        >
          {mode === 'signup' ? 'I already have an account' : 'Create an account'}
        </button>
        {mode !== 'reset' ? (
          <button
            type="button"
            onClick={() => {
              setMode('reset');
              setError('');
            }}
            className="flex items-center gap-1 text-ink-muted hover:text-ink"
          >
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
            Forgot password?
          </button>
        ) : (
          <button type="button" onClick={() => setMode('signin')} className="text-ink-muted hover:text-ink">
            Back to log in
          </button>
        )}
      </div>
    </form>
  );
}

/* ----------------------------------------------------------------- google */

function GoogleLogin() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setError('');
    setBusy(true);
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureProfile(cred.user);
    } catch (err) {
      setError(friendly(err));
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => void go()}
        disabled={busy}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-ink-line bg-white text-[14.5px] font-semibold text-ink transition-colors hover:border-brand-300 hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" />
          </svg>
        )}
        Continue with Google
      </button>
      {error && (
        <p role="alert" className="mt-3 text-[13px] font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
