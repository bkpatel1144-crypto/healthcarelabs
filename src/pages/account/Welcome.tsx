import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BadgeCheck, Loader2, ShieldCheck } from 'lucide-react';
import { SelectField, TextField, isValidEmail, isValidPhone } from '@/components/common/Form';
import { Button } from '@/components/common/Button';
import { Avatar, useAccountSeo } from '@/components/account/AccountShell';
import { localPhone, recordConsent, updateProfile } from '@/lib/accountApi';
import { localDateIso } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { SITE_CONFIG } from '@/config/site';
import { PRIVACY_VERSION, type Gender } from '@/types/account';
import { GENDER_OPTIONS } from '@/pages/account/AccountProfile';

/**
 * First sign-in: one short step to make the account usable for booking.
 * Whatever the sign-in method already knows is filled in and marked verified
 * — the mobile number from OTP, name, email and photo from Google — and only
 * the gaps are asked for. Consent is taken here, specifically and once.
 */
export default function Welcome() {
  useAccountSeo('Complete your profile');
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const [form, setForm] = useState({ name: '', phone: '', email: '', gender: '' as Gender, dob: '', consent: false, marketing: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const touched = useRef(new Set<string>());
  const today = localDateIso();

  const phoneVerified = Boolean(user?.phoneNumber);
  const emailVerified = Boolean(user?.email && user.emailVerified);

  /*
    Fill from the profile as it arrives — and again as it changes, because on
    an email sign-up the record is created a moment before the typed name is
    written to it. Only blank, untouched fields are filled.
  */
  useEffect(() => {
    if (!profile) return;
    // A field the profile has just filled no longer needs its "missing" error.
    setErrors((e) => (e.name && profile.name ? { ...e, name: '' } : e));
    setForm((f) => {
      const fill = <K extends keyof typeof f>(k: K, saved: (typeof f)[K]) =>
        touched.current.has(k) || f[k] ? f[k] : saved;
      return {
        name: fill('name', profile.name),
        phone: fill('phone', profile.phone),
        email: fill('email', profile.email),
        gender: fill('gender', profile.gender),
        dob: fill('dob', profile.dob),
        consent: fill('consent', profile.consent?.privacyVersion === PRIVACY_VERSION),
        marketing: fill('marketing', profile.marketingOptIn ?? false),
      };
    });
  }, [profile]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    touched.current.add(k);
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const n: Record<string, string> = {};
    if (form.name.trim().length < 2) n.name = 'Enter your full name as it should appear on reports.';
    if (!isValidPhone(form.phone)) n.phone = 'Enter a valid 10-digit mobile number — the lab calls it to confirm visits.';
    if (form.email && !isValidEmail(form.email)) n.email = 'That email does not look right.';
    if (!form.gender) n.gender = 'Choose one — reference ranges on reports depend on it.';
    if (!form.dob) n.dob = 'Enter your date of birth — reference ranges depend on age.';
    else if (form.dob > today) n.dob = 'Date of birth cannot be in the future.';
    if (!form.consent) n.consent = 'Consent is needed to keep bookings and reports in your account.';
    if (Object.values(n).some(Boolean)) return setErrors(n);
    if (!user) return;

    setBusy(true);
    setSaveError('');
    try {
      await updateProfile(user.uid, {
        name: form.name.trim(),
        phone: localPhone(form.phone),
        email: form.email.trim(),
        gender: form.gender,
        dob: form.dob,
      });
      await recordConsent(user.uid, form.marketing);
      const safeNext = next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/account/welcome') ? next : null;
      navigate(safeNext ?? (isAdmin ? '/admin' : '/account'), { replace: true });
    } catch (err) {
      console.error(err);
      setSaveError('Could not save. Check your connection and try again.');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-mist px-4 pb-20 pt-[110px] xl:pt-[130px]">
      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl bg-white p-6 shadow-[0_40px_90px_-40px_rgba(11,32,88,0.35)] ring-1 ring-brand-100 sm:p-8">
          <div className="flex items-center gap-4">
            <Avatar size="lg" />
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brand-600">Welcome to {SITE_CONFIG.brandName}</p>
              <h1 className="mt-1 text-[24px] font-extrabold tracking-editorial text-ink">Complete your profile</h1>
            </div>
          </div>
          <p className="mt-4 text-[14.5px] leading-relaxed text-ink-muted">
            The lab needs these details to identify your sample and print the right reference ranges on your report.
            It takes a minute, once.
          </p>

          <form onSubmit={submit} noValidate className="mt-6 grid gap-5 sm:grid-cols-2">
            <TextField label="Full name" required maxLength={100} autoComplete="name" value={form.name} error={errors.name} onChange={(e) => set('name', e.target.value)} className="sm:col-span-2" hint="As it should appear on your reports." />
            <div>
              <TextField label="Mobile number" required type="tel" inputMode="numeric" maxLength={10} value={form.phone} error={errors.phone}
                readOnly={phoneVerified} onChange={(e) => set('phone', e.target.value.replace(/[^\d]/g, ''))} />
              {phoneVerified && <Verified text="Verified by OTP" />}
            </div>
            <div>
              <TextField label="Email" type="email" maxLength={200} autoComplete="email" value={form.email} error={errors.email}
                readOnly={emailVerified} hint={emailVerified ? undefined : 'Optional — for a copy of your reports.'} onChange={(e) => set('email', e.target.value)} />
              {emailVerified && <Verified text="Verified by Google" />}
            </div>
            <SelectField label="Gender" required options={GENDER_OPTIONS} value={form.gender} error={errors.gender} onValueChange={(v) => set('gender', v as Gender)} placeholder="Select" />
            <TextField label="Date of birth" required type="date" max={today} value={form.dob} error={errors.dob} onChange={(e) => set('dob', e.target.value)} />

            <div className="space-y-3 rounded-2xl bg-mist p-4 sm:col-span-2">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />
                Your consent
              </p>
              <label className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-ink-muted">
                <input type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500" aria-invalid={errors.consent ? true : undefined} />
                <span>
                  I agree to the{' '}
                  <Link to="/privacy-policy" target="_blank" className="font-semibold text-brand-600 hover:underline">privacy notice</Link>{' '}
                  and consent to {SITE_CONFIG.brandName} processing my personal and health information to book tests and
                  deliver reports. <span className="text-rose-500">*</span>
                </span>
              </label>
              {errors.consent && <p role="alert" className="text-[12.5px] font-medium text-rose-600">{errors.consent}</p>}
              <label className="flex items-start gap-2.5 text-[13.5px] text-ink-muted">
                <input type="checkbox" checked={form.marketing} onChange={(e) => set('marketing', e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500" />
                Send me offers and health check reminders (optional)
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <Button type="submit" size="lg" disabled={busy || !profile}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Save and continue
              </Button>
              {saveError && <p role="alert" className="text-[13px] font-medium text-rose-600">{saveError}</p>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Verified({ text }: { text: string }) {
  return (
    <p className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-mint-700">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      {text}
    </p>
  );
}
