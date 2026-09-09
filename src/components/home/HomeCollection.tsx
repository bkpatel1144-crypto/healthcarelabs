import { useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, CheckCircle2, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
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
import { SITE_CONFIG, telHref } from '@/config/site';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';

interface FormState {
  name: string;
  phone: string;
  email: string;
  preferredDate: string;
  preferredTime: string;
  address: string;
  packageSlug: string;
  notes: string;
}

const EMPTY: FormState = {
  name: '',
  phone: '',
  email: '',
  preferredDate: '',
  preferredTime: '',
  address: '',
  packageSlug: '',
  notes: '',
};

const TIME_SLOTS = [
  '07:00 – 08:00 AM',
  '08:00 – 09:00 AM',
  '09:00 – 10:00 AM',
  '10:00 – 11:00 AM',
  '11:00 AM – 12:00 PM',
  '04:00 – 05:00 PM',
  '05:00 – 06:00 PM',
  '06:00 – 07:00 PM',
];

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
              className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.30),transparent_66%)] blur-2xl"
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
                    <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-white" strokeWidth={2} aria-hidden="true" />
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
  const { livePackages, addAppointment, storageAvailable } = useContent();
  const reduced = usePrefersReducedMotion();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors<FormState>>({});
  const [submitted, setSubmitted] = useState<{ name: string; date: string } | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
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
    next.preferredTime = required(form.preferredTime, 'Choose a preferred time slot.');
    next.address = required(form.address, 'We need the collection address.');
    if (!next.address && form.address.trim().length < 12)
      next.address = 'Please include enough detail for the phlebotomist to find you.';

    return Object.fromEntries(Object.entries(next).filter(([, v]) => v)) as Errors<FormState>;
  };

  const onSubmit = (e: FormEvent) => {
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
    addAppointment({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      preferredDate: form.preferredDate,
      preferredTime: form.preferredTime,
      address: form.address.trim(),
      packageSlug: form.packageSlug,
      notes: form.notes.trim(),
    });
    setSubmitted({ name: form.name.trim().split(' ')[0], date: form.preferredDate });
    setForm(EMPTY);
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
          {storageAvailable
            ? 'Your request is saved in this browser and appears in the local admin panel. This site has no backend, so it is not transmitted anywhere.'
            : 'Your browser is blocking local storage, so this request is held only for this session. Please call the lab to confirm.'}
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
    <form onSubmit={onSubmit} noValidate>
      <h3 className="text-[20px] font-bold tracking-[-0.02em] text-ink">Book a home collection</h3>
      <p className="mt-2 text-[14.5px] text-ink-muted">
        Fields marked <span className="text-rose-500">*</span> are required.
      </p>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <TextField
          label="Full name"
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
          placeholder="Choose a slot"
          options={TIME_SLOTS.map((slot) => ({ value: slot, label: slot }))}
        />
        <TextAreaField
          label="Collection address"
          name="address"
          required
          className="sm:col-span-2"
          value={form.address}
          error={errors.address}
          onChange={(e) => set('address', e.target.value)}
          placeholder="Flat / house number, building, street, area, landmark, city and pincode"
          rows={3}
        />
        <TextAreaField
          label="Anything we should know"
          name="notes"
          className="sm:col-span-2"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Medication, mobility needs, a preferred entrance — anything that helps the visit go smoothly."
          rows={2}
          hint="Optional."
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg">
          Request home collection
          <ButtonArrow />
        </Button>
        <p className="max-w-xs text-[12.5px] leading-relaxed text-ink-soft">
          The lab calls to confirm before any visit. No payment is taken through this form.
        </p>
      </div>
    </form>
  );
}
