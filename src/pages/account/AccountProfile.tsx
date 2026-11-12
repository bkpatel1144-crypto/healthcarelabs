import { useEffect, useRef, useState, type FormEvent } from 'react';
import { localDateIso } from '@/lib/format';
import { BadgeCheck, CalendarClock, Download, FileText, Pencil, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AccountShell, Panel } from '@/components/account/AccountShell';
import { SelectField, TextField, isValidEmail, isValidPhone } from '@/components/common/Form';
import { Button } from '@/components/common/Button';
import { createRequest, exportMyData, localPhone, setMarketingOptIn, updateProfile } from '@/lib/accountApi';
import { ageFrom, useAuth } from '@/store/auth';
import type { Gender } from '@/types/account';

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const GENDER_LABEL: Record<string, string> = { male: 'Male', female: 'Female', other: 'Other' };

export default function AccountProfile() {
  const { profile, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const welcome = profile !== null && !profile.name;

  // A first-time sign-in with no name goes straight into the form.
  useEffect(() => {
    if (welcome) setEditing(true);
  }, [welcome]);

  const verifiedPhone = localPhone(user?.phoneNumber);
  const age = profile ? ageFrom(profile.dob) : null;

  return (
    <AccountShell
      title="My profile"
      description={welcome ? 'Welcome! Add your details so the lab can prepare your reports correctly.' : undefined}
      actions={
        !editing && (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
        )
      }
    >
      {!profile ? (
        <Panel>
          <p className="text-ink-muted">Loading your profile…</p>
        </Panel>
      ) : editing ? (
        <ProfileForm onDone={() => setEditing(false)} canCancel={!welcome} />
      ) : (
        <Panel>
          <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <Item label="Name" value={profile.name} />
            <Item
              label="Gender / Age"
              value={[GENDER_LABEL[profile.gender], age !== null ? `${age} years` : ''].filter(Boolean).join(' · ')}
            />
            <Item
              label="Mobile number"
              value={profile.phone ? `+91 ${profile.phone}` : ''}
              badge={profile.phone !== '' && profile.phone === verifiedPhone ? 'Verified' : undefined}
            />
            <Item label="Email" value={profile.email} />
          </dl>
        </Panel>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { to: '/account/bookings', label: 'My bookings', text: 'Track your home collections', Icon: CalendarClock },
          { to: '/account/reports', label: 'My reports', text: 'Download your lab reports', Icon: FileText },
          { to: '/account/family', label: 'Family members', text: 'Book tests for your family', Icon: Users },
        ].map(({ to, label, text, Icon }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-3xl bg-white p-5 ring-1 ring-ink-line transition-all hover:-translate-y-0.5 hover:ring-brand-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </span>
            <p className="mt-4 font-bold text-ink group-hover:text-brand-700">{label}</p>
            <p className="mt-1 text-[13.5px] text-ink-muted">{text}</p>
          </Link>
        ))}
      </div>

      {profile && <PrivacyPanel />}
    </AccountShell>
  );
}

/**
 * The data-principal rights the DPDP Act gives a patient, self-served:
 * see consent, change marketing preference, take a copy, ask for erasure.
 * Erasure goes to the lab as a request because medical records can carry
 * legal retention duties that a button should not silently override.
 */
function PrivacyPanel() {
  const { profile, user } = useAuth();
  const [busy, setBusy] = useState<'' | 'export' | 'erase' | 'marketing'>('');
  const [message, setMessage] = useState('');
  if (!profile || !user) return null;

  const run = async (kind: typeof busy, fn: () => Promise<void>) => {
    setBusy(kind);
    setMessage('');
    try {
      await fn();
    } catch {
      setMessage('That did not work. Please try again.');
    } finally {
      setBusy('');
    }
  };

  return (
    <Panel className="mt-6">
      <h2 className="flex items-center gap-2 text-[17px] font-bold text-ink">
        <ShieldCheck className="h-5 w-5 text-brand-600" aria-hidden="true" />
        Privacy &amp; your data
      </h2>
      <p className="mt-2 text-[14px] text-ink-muted">
        {profile.consent
          ? `You consented to the privacy notice (version ${profile.consent.privacyVersion}) on ${new Date(profile.consent.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`
          : 'You have not yet given consent for this account.'}{' '}
        <Link to="/privacy-policy" className="font-semibold text-brand-600 hover:underline">
          Read the privacy notice
        </Link>
      </p>

      <label className="mt-4 flex items-start gap-2.5 text-[14px] text-ink">
        <input
          type="checkbox"
          checked={profile.marketingOptIn ?? false}
          disabled={busy === 'marketing'}
          onChange={(e) => void run('marketing', () => setMarketingOptIn(user.uid, e.target.checked))}
          className="mt-0.5 h-4 w-4 accent-brand-500"
        />
        Send me offers and health check reminders
      </label>

      <div className="mt-5 flex flex-wrap gap-2.5">
        <Button
          size="sm"
          variant="secondary"
          disabled={busy === 'export'}
          onClick={() => void run('export', () => exportMyData(user.uid))}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {busy === 'export' ? 'Preparing…' : 'Download my data'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          disabled={busy === 'erase'}
          onClick={() => {
            if (!window.confirm('Ask the lab to delete your account and personal data? Records the lab must keep by law will be retained only as long as required.')) return;
            void run('erase', async () => {
              await createRequest({
                type: 'data-request',
                uid: user.uid,
                name: profile.name || 'Account holder',
                phone: profile.phone,
                email: profile.email,
                topic: 'Erasure',
                message: 'Please delete my account and personal data, keeping only what must be retained by law.',
              });
              setMessage('Your deletion request has been sent to the lab. You can follow it under My requests.');
            });
          }}
        >
          Request deletion of my data
        </Button>
      </div>
      {message && (
        <p role="status" className="mt-3 text-[13.5px] text-ink">
          {message}
        </p>
      )}
    </Panel>
  );
}

function Item({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div>
      <dt className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-soft">{label}</dt>
      <dd className="mt-1.5 flex items-center gap-2 text-[16px] text-ink">
        {value || <span className="text-ink-soft">Not added</span>}
        {badge && (
          <span className="inline-flex items-center gap-1 rounded-full bg-mint-50 px-2 py-0.5 text-[11.5px] font-semibold text-mint-700">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {badge}
          </span>
        )}
      </dd>
    </div>
  );
}

function ProfileForm({ onDone, canCancel }: { onDone: () => void; canCancel: boolean }) {
  const { profile, user } = useAuth();
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    gender: (profile?.gender ?? '') as Gender,
    dob: profile?.dob ?? '',
    phone: profile?.phone ?? '',
    email: profile?.email ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const today = localDateIso();
  const touched = useRef(new Set<string>());

  /*
    On a first sign-up the profile record is created a moment before the name
    the person typed is written to it, and this form can open in between. Fill
    any field that is still blank when the saved value arrives — never
    overwrite something the person has already typed.
  */
  useEffect(() => {
    if (!profile) return;
    const fill = <K extends keyof typeof form>(k: K, current: (typeof form)[K], saved: (typeof form)[K]) =>
      touched.current.has(k) ? current : current || saved;
    setForm((f) => ({
      ...f,
      name: fill('name', f.name, profile.name),
      phone: fill('phone', f.phone, profile.phone),
      email: fill('email', f.email, profile.email),
      gender: fill('gender', f.gender, profile.gender),
      dob: fill('dob', f.dob, profile.dob),
    }));
  }, [profile]);

  const set = (k: keyof typeof form, v: string) => {
    touched.current.add(k);
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = 'Enter your full name.';
    if (form.phone && !isValidPhone(form.phone)) next.phone = 'Enter a valid 10-digit mobile number.';
    if (form.email && !isValidEmail(form.email)) next.email = 'That email does not look right.';
    if (form.dob && form.dob > today) next.dob = 'Date of birth cannot be in the future.';
    if (Object.values(next).some(Boolean)) return setErrors(next);

    if (!user) return;
    setBusy(true);
    setSaveError('');
    try {
      await updateProfile(user.uid, {
        name: form.name.trim(),
        gender: form.gender,
        dob: form.dob,
        phone: localPhone(form.phone),
        email: form.email.trim(),
      });
      onDone();
    } catch (err) {
      console.error(err);
      setSaveError('Could not save. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel>
      <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
        <TextField label="Full name" name="name" maxLength={100} required value={form.name} error={errors.name} onChange={(e) => set('name', e.target.value)} className="sm:col-span-2" />
        <SelectField label="Gender" options={GENDER_OPTIONS} value={form.gender} onValueChange={(v) => set('gender', v)} placeholder="Select" />
        <TextField label="Date of birth" name="dob" type="date" max={today} value={form.dob} error={errors.dob} onChange={(e) => set('dob', e.target.value)} />
        <TextField label="Mobile number" name="phone" type="tel" inputMode="numeric" maxLength={10} value={form.phone} error={errors.phone} onChange={(e) => set('phone', e.target.value.replace(/[^\d]/g, ''))} />
        <TextField label="Email" name="email" type="email" maxLength={200} value={form.email} error={errors.email} onChange={(e) => set('email', e.target.value)} />
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save profile'}
          </Button>
          {canCancel && (
            <Button type="button" variant="ghost" onClick={onDone}>
              Cancel
            </Button>
          )}
          {saveError && (
            <p role="alert" className="text-[13px] font-medium text-rose-600">
              {saveError}
            </p>
          )}
        </div>
      </form>
    </Panel>
  );
}
