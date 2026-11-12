import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { CalendarClock, CheckCircle2, Loader2, LogIn, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { Container, Eyebrow } from '@/components/common/Primitives';
import { Button, ButtonArrow } from '@/components/common/Button';
import {
  SelectField,
  TextAreaField,
  TextField,
  isValidEmail,
  isValidPhone,
  required,
  type Errors,
} from '@/components/common/Form';
import { useContent } from '@/store/content';
import { useAuth } from '@/store/auth';
import { cn } from '@/lib/cn';
import { PRIVACY_VERSION, type FamilyMember, type SavedAddress } from '@/types/account';
import { useSlots } from '@/lib/useSlots';
import { VisitSummary } from '@/components/packages/VisitPlanner';
import { SITE_CONFIG, telHref } from '@/config/site';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';

interface FormState {
  name: string;
  phone: string;
  email: string;
  preferredDate: string;
  /** Slot id from config/booking. */
  preferredTime: string;
  address: string;
  pincode: string;
  packageSlug: string;
  notes: string;
  consent: boolean;
}

const EMPTY: FormState = {
  name: '',
  phone: '',
  email: '',
  preferredDate: '',
  preferredTime: '',
  address: '',
  pincode: '',
  packageSlug: '',
  notes: '',
  consent: false,
};


const ASSURANCES = [
  { Icon: ShieldCheck, text: 'Sample sealed and labelled in front of you' },
  { Icon: CalendarClock, text: 'Slot confirmed by phone before the visit' },
  { Icon: MapPin, text: 'Available across Surat and surrounding areas' },
];

export function HomeCollectionSection({
  compact = false,
  id = 'home-collection',
}: {
  compact?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby="home-collection-heading"
      className={compact ? 'py-4' : 'bg-white py-20 sm:py-28'}
    >
      <Container className={compact ? '!px-0' : undefined}>
        <div className="overflow-hidden rounded-4xl bg-white shadow-card ring-1 ring-brand-50 lg:grid lg:grid-cols-12">
          {/* ---- Pitch ---- */}
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-mint-400 p-8 text-white sm:p-11 lg:col-span-5">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-grid-dark [background-size:56px_56px] [mask-image:radial-gradient(ellipse_90%_70%_at_20%_0%,#000,transparent_72%)] opacity-70"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.30),transparent_66%)]"
            />

            <div className="relative">
              <Eyebrow tone="dark">Home Collection</Eyebrow>
              <h2
                id="home-collection-heading"
                className="mt-6 text-balance text-[clamp(1.75rem,3.2vw,2.5rem)] font-extrabold leading-[1.08] tracking-editorial"
              >
                Healthcare that comes to you.
              </h2>
              <p className="mt-5 max-w-sm text-[15.5px] leading-relaxed text-white/85">
                Tell us when and where. A trained phlebotomist collects the sample at your address,
                and the report reaches you the same way it would from the centre.
              </p>

              <ul className="mt-9 space-y-4 border-t border-white/25 pt-8">
                {ASSURANCES.map(({ Icon, text }) => (
                  <li key={text} className="flex items-start gap-3.5 text-[14.5px] text-white/90">
                    <span className="glass-flat-dark mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="h-[15px] w-[15px] text-white" strokeWidth={2.2} aria-hidden="true" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>

              <p className="mt-9 text-[13.5px] text-white/75">
                Prefer to talk it through?{' '}
                <a
                  href={telHref()}
                  className="font-semibold text-white underline underline-offset-4 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  {SITE_CONFIG.phoneDisplay}
                </a>
              </p>
            </div>
          </div>

          {/* ---- Form ---- */}
          <div className="p-8 sm:p-11 lg:col-span-7">
            <HomeCollectionForm />
          </div>
        </div>
      </Container>
    </section>
  );
}

export function HomeCollectionForm() {
  const { livePackages, preferences, clearVisit } = useContent();
  const { user, profile } = useAuth();
  const reduced = usePrefersReducedMotion();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors<FormState>>({});
  const [submitted, setSubmitted] = useState<{ name: string; date: string; tracked: boolean } | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [forWhom, setForWhom] = useState('self');
  const formRef = useRef<HTMLFormElement>(null);
  // Live slot availability loads once the form is close to the screen, so the
  // homepage does not fetch Firebase for visitors who never scroll this far.
  const near = useInView(formRef, { once: true, margin: '600px' });
  const consented = profile?.consent?.privacyVersion === PRIVACY_VERSION;

  /*
    Signed-in patients get their family members and saved addresses as
    one-tap choices. The Firebase SDK is imported on demand: this form sits on
    the homepage, and visitors who never log in should not download it here.
  */
  useEffect(() => {
    if (!user) {
      setMembers([]);
      setAddresses([]);
      return;
    }
    let cancelled = false;
    const stops: (() => void)[] = [];
    void import('@/lib/accountApi').then((api) => {
      if (cancelled) return;
      stops.push(api.watchMembers(user.uid, setMembers), api.watchAddresses(user.uid, setAddresses));
    });
    return () => {
      cancelled = true;
      stops.forEach((stop) => stop());
    };
  }, [user]);

  /*
    Prefill from the profile, but only fields the visitor has not touched.
    Firestore can deliver the profile twice (cache, then server), and a field
    someone deliberately cleared must not quietly refill itself.
  */
  const touched = useRef(new Set<keyof FormState>());
  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({
      ...f,
      name: touched.current.has('name') ? f.name : f.name || profile.name,
      phone: touched.current.has('phone') ? f.phone : f.phone || profile.phone,
      email: touched.current.has('email') ? f.email : f.email || profile.email,
    }));
  }, [profile]);

  const { cfg, options: slotOptions, today, lastDate } = useSlots(form.preferredDate, near);

  // Someone who already accepted the current privacy notice is not asked again.
  useEffect(() => {
    if (consented) setForm((f) => ({ ...f, consent: true }));
  }, [consented]);

  const pincodeServed = (pin: string) =>
    cfg.servicePincodes.length === 0 || cfg.servicePincodes.includes(pin);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    touched.current.add(key);
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const chooseFor = (value: string) => {
    setForWhom(value);
    const member = members.find((m) => m.id === value);
    set('name', member ? member.name : profile?.name ?? '');
  };

  const validate = (): Errors<FormState> => {
    const next: Errors<FormState> = {};
    next.name = required(form.name, 'Please tell us your name.');
    if (!next.name && form.name.trim().length < 2) next.name = 'Please enter your full name.';

    if (!form.phone.trim()) next.phone = 'A phone number is required to confirm the slot.';
    else if (!isValidPhone(form.phone)) next.phone = 'Enter a valid 10-digit mobile number.';

    if (form.email.trim() && !isValidEmail(form.email))
      next.email = 'That email address does not look right.';

    next.preferredDate = required(form.preferredDate, 'Choose a preferred date.');
    // `min` on the input only limits the picker; a typed date can still be past.
    if (!next.preferredDate && form.preferredDate < today)
      next.preferredDate = 'Choose today or a later date.';
    else if (!next.preferredDate && form.preferredDate > lastDate)
      next.preferredDate = `Visits can be booked up to ${cfg.daysAhead} days ahead.`;
    else if (!next.preferredDate && cfg.closedDates.includes(form.preferredDate))
      next.preferredDate = 'The lab does not collect at home on that date. Please choose another.';

    next.preferredTime = required(form.preferredTime, 'Choose a preferred time slot.');
    if (!next.preferredTime) {
      const slot = slotOptions.find((o) => o.value === form.preferredTime);
      if (!slot) next.preferredTime = 'That slot is not available for the chosen date. Choose another.';
      else if (slot.left <= 0) next.preferredTime = 'That slot is full. Choose another time.';
    }
    next.address = required(form.address, 'We need the collection address.');
    if (!next.address && form.address.trim().length < 12)
      next.address = 'Please include enough detail for the phlebotomist to find you.';
    if (!/^\d{6}$/.test(form.pincode)) next.pincode = 'Enter the 6-digit PIN code.';
    else if (!pincodeServed(form.pincode))
      next.pincode = `Home collection does not cover ${form.pincode} yet. Visit a branch or call ${SITE_CONFIG.phoneDisplay}.`;
    if (!form.consent) next.consent = 'Please accept the privacy notice so the lab can process your sample and report.';

    return Object.fromEntries(Object.entries(next).filter(([, v]) => v)) as Errors<FormState>;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      // Move focus to the first problem so keyboard users are not stranded.
      const firstKey = Object.keys(found)[0];
      // The custom Select renders a button trigger, so it has no [name] element.
      const target =
        document.querySelector<HTMLElement>(
          `input[name="${firstKey}"], textarea[name="${firstKey}"]`,
        ) ?? document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
      target?.focus();
      return;
    }
    /*
      The planned visit travels with the booking. `packageSlug` keeps its old
      meaning — one package, chosen in this form — so existing appointments and
      the admin list are unaffected; `packageSlugs` carries the whole plan when
      there is one, and the plan is cleared once it has been handed over.
    */
    const planned = preferences.visitPackages;
    const slugs = planned.length > 0 ? planned : form.packageSlug ? [form.packageSlug] : [];
    const chosen = slugs
      .map((slug) => livePackages.find((p) => p.slug === slug))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    setSending(true);
    setSendError('');
    try {
      const api = await import('@/lib/accountApi');
      await api.createBooking({
        uid: user?.uid ?? null,
        patientName: form.name.trim(),
        phone: api.localPhone(form.phone),
        email: form.email.trim(),
        preferredDate: form.preferredDate,
        slotId: form.preferredTime,
        preferredTime: cfg.slots[form.preferredTime]?.label ?? '',
        address: form.address.trim(),
        pincode: form.pincode,
        packageSlugs: chosen.map((p) => p.slug),
        packageNames: chosen.map((p) => p.name),
        total: chosen.reduce((sum, p) => sum + (p.offerPrice ?? p.price ?? 0), 0),
        notes: form.notes.trim(),
        consentAt: new Date().toISOString(),
      });
      // A signed-in patient's acceptance is kept on the account too.
      if (user && !consented) await api.recordConsent(user.uid, profile?.marketingOptIn ?? false).catch(() => {});
    } catch (err) {
      console.error('Booking failed', err);
      const api = await import('@/lib/accountApi');
      setSendError(
        err instanceof api.SlotUnavailableError
          ? err.message
          : `The booking could not be sent. Check your connection and try again, or call ${SITE_CONFIG.phoneDisplay}.`,
      );
      setSending(false);
      return;
    }
    if (planned.length > 0) clearVisit();
    setSubmitted({
      name: form.name.trim().split(' ')[0],
      date: form.preferredDate,
      tracked: Boolean(user),
    });
    setForm({ ...EMPTY, name: profile?.name ?? '', phone: profile?.phone ?? '', email: profile?.email ?? '', consent: consented });
    setForWhom('self');
    setSending(false);
    setErrors({});
  };

  if (submitted) {
    return (
      <motion.div
        role="status"
        initial={reduced ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex h-full min-h-[420px] flex-col items-start justify-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-50 text-mint-600 ring-1 ring-inset ring-mint-100">
          <CheckCircle2 className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
        </span>
        <h3 className="mt-6 text-[26px] font-extrabold tracking-editorial text-ink">
          Request received, {submitted.name}.
        </h3>
        <p className="mt-3.5 max-w-md text-[15.5px] leading-relaxed text-ink-muted">
          The lab will call you on the number you gave to confirm the slot for{' '}
          <strong className="font-semibold text-ink">
            {new Date(submitted.date).toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </strong>
          . Nothing is charged until the visit is confirmed.
        </p>

        <p className="mt-5 flex items-start gap-2 text-[13px] leading-relaxed text-ink-soft">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" strokeWidth={2} aria-hidden="true" />
          {submitted.tracked ? (
            <span>
              Follow its progress under{' '}
              <Link to="/account/bookings" className="font-semibold text-brand-600 hover:underline">
                My bookings
              </Link>
              . Pay at the time of collection.
            </span>
          ) : (
            <span>
              Pay at the time of collection.{' '}
              <Link to="/login" className="font-semibold text-brand-600 hover:underline">
                Log in
              </Link>{' '}
              next time to track bookings and download reports online.
            </span>
          )}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="secondary" size="md" onClick={() => setSubmitted(null)}>
            Book another visit
          </Button>
          <Button to="/health-package" size="md">
            Browse packages
            <ButtonArrow />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate>
      <VisitSummary />

      <h3 className="text-[20px] font-bold tracking-[-0.02em] text-ink">Book a home collection</h3>
      <p className="mt-2 text-[14.5px] text-ink-muted">
        Fields marked <span className="text-rose-500">*</span> are required.
      </p>

      {!user ? (
        <p className="mt-5 flex items-start gap-2 rounded-2xl bg-brand-50/70 px-4 py-3 text-[13.5px] text-ink-muted ring-1 ring-brand-100">
          <LogIn className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" strokeWidth={2.2} aria-hidden="true" />
          <span>
            <Link
              to={`/login?next=${encodeURIComponent('/contact-us#home-collection')}`}
              className="font-semibold text-brand-600 hover:underline"
            >
              Log in
            </Link>{' '}
            to track this booking and download the report online, or continue as a guest.
          </span>
        </p>
      ) : (
        members.length > 0 && (
          <fieldset className="mt-6">
            <legend className="mb-2 text-[13px] font-semibold text-ink">Booking for</legend>
            <div className="flex flex-wrap gap-2">
              {[{ id: 'self', name: 'Myself' }, ...members].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={forWhom === m.id}
                  onClick={() => chooseFor(m.id)}
                  className={cn(
                    'rounded-full px-4 py-2 text-[13.5px] font-semibold ring-1 transition-colors',
                    forWhom === m.id
                      ? 'bg-brand-500 text-white ring-brand-500'
                      : 'bg-white text-ink-muted ring-ink-line hover:text-brand-600 hover:ring-brand-300',
                  )}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </fieldset>
        )
      )}

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <TextField
          label="Full name"
          maxLength={100}
          name="name"
          autoComplete="name"
          required
          value={form.name}
          error={errors.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Your name"
        />
        <TextField
          label="Phone number"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          value={form.phone}
          error={errors.phone}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="10-digit mobile number"
        />
        <TextField
          label="Email"
          maxLength={200}
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          error={errors.email}
          hint="Optional — used to send the digital report."
          onChange={(e) => set('email', e.target.value)}
          placeholder="you@example.com"
        />
        <SelectField
          label="Package or test"
          name="packageSlug"
          value={form.packageSlug}
          onValueChange={(v) => set('packageSlug', v)}
          placeholder="Not decided yet"
          hint="Leave blank if you are not sure yet."
          options={[
            { value: '', label: 'Not decided yet' },
            ...livePackages.map((p) => ({
              value: p.slug,
              label: p.name,
              meta: p.tests.length + ' tests',
            })),
          ]}
        />
        <TextField
          label="Preferred date"
          name="preferredDate"
          type="date"
          required
          min={today}
          max={lastDate}
          value={form.preferredDate}
          error={errors.preferredDate}
          onChange={(e) => set('preferredDate', e.target.value)}
        />
        <SelectField
          label="Preferred time"
          name="preferredTime"
          required
          value={form.preferredTime}
          error={errors.preferredTime}
          onValueChange={(v) => set('preferredTime', v)}
          placeholder={form.preferredDate ? 'Choose a slot' : 'Choose a date first'}
          hint={form.preferredDate ? undefined : 'Availability shows once a date is chosen.'}
          options={slotOptions.map(({ value, label, meta }) => ({ value, label, meta }))}
        />
        {addresses.length > 0 && (
          <div className="-mb-2 flex flex-wrap items-center gap-2 sm:col-span-2">
            <span className="text-[13px] font-semibold text-ink">Use saved address:</span>
            {addresses.map((a) => (
              <button
                key={a.id}
                type="button"
                aria-label={`Use ${a.label} address`}
                onClick={() => {
                  set('address', [a.line, a.landmark, a.city].filter((x) => x.trim()).join(', '));
                  set('pincode', a.pincode);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-3 py-1.5 text-[12.5px] font-semibold text-mint-700 ring-1 ring-mint-100 hover:ring-mint-300"
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {a.label}
              </button>
            ))}
          </div>
        )}
        <TextAreaField
          label="Collection address"
          maxLength={600}
          name="address"
          required
          className="sm:col-span-2"
          value={form.address}
          error={errors.address}
          onChange={(e) => set('address', e.target.value)}
          placeholder="Flat / house number, building, street, area, landmark, city"
          rows={3}
        />
        <TextField
          label="PIN code"
          name="pincode"
          required
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          value={form.pincode}
          error={errors.pincode}
          onChange={(e) => set('pincode', e.target.value.replace(/[^\d]/g, ''))}
          placeholder="395009"
        />
        <TextAreaField
          label="Anything we should know"
          maxLength={1000}
          name="notes"
          className="sm:col-span-2"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Medication, mobility needs, a preferred entrance — anything that helps the visit go smoothly."
          rows={2}
          hint="Optional."
        />
      </div>

      {/*
        Consent under the DPDP Act: specific (what it is for), separate from
        marketing, and recorded with a timestamp on the booking.
      */}
      <div className="mt-7">
        <label className="flex items-start gap-3 text-[13.5px] leading-relaxed text-ink-muted">
          <input
            type="checkbox"
            name="consent"
            checked={form.consent}
            onChange={(e) => set('consent', e.target.checked)}
            aria-invalid={errors.consent ? true : undefined}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500"
          />
          <span>
            I agree to the{' '}
            <Link to="/privacy-policy" className="font-semibold text-brand-600 hover:underline">
              privacy notice
            </Link>{' '}
            and consent to {SITE_CONFIG.brandName} using these details and my sample to perform the tests and
            deliver the report. <span className="text-rose-500">*</span>
          </span>
        </label>
        {errors.consent && (
          <p role="alert" className="mt-2 text-[12.5px] font-medium text-rose-600">
            {errors.consent}
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={sending}>
          {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Request home collection
          {!sending && <ButtonArrow />}
        </Button>
        <p className="max-w-xs text-[12.5px] leading-relaxed text-ink-soft">
          The lab calls to confirm before any visit. Pay at the time of collection.
        </p>
      </div>
      {sendError && (
        <p role="alert" className="mt-4 text-[13.5px] font-medium text-rose-600">
          {sendError}
        </p>
      )}
    </form>
  );
}
