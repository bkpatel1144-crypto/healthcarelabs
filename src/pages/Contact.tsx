import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Container, SectionHeading } from '@/components/common/Primitives';
import { Button, ButtonArrow } from '@/components/common/Button';
import {
  TextAreaField,
  TextField,
  isValidEmail,
  isValidPhone,
  required,
  type Errors,
} from '@/components/common/Form';
import { MapEmbed } from '@/components/common/MapEmbed';
import { HomeCollectionSection } from '@/components/home/HomeCollection';
import { useContent } from '@/store/content';
import { useSeo } from '@/lib/seo';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import {
  SITE_CONFIG,
  mailHref,
  mapHref,
  telHref,
  whatsappHref,
} from '@/config/site';

export default function Contact() {
  useSeo({
    title: 'Contact Healthcare Labs — Surat',
    description: `Call ${SITE_CONFIG.phoneDisplay}, message on WhatsApp, or visit ${SITE_CONFIG.address.full}. Book a home collection or ask about any health package.`,
    path: '/contact-us',
  });

  return (
    <>
      <PageHeader
        eyebrow="Contact Us"
        title={
          <>
            Talk to the lab
            <br />
            <span className="bg-gradient-to-r from-brand-700 to-mint-600 bg-clip-text text-transparent">directly.</span>
          </>
        }
        description="Questions about a package, a test, preparation or a report — the fastest route is a phone call. Everything else reaches the same team."
        crumbs={[{ label: 'Contact Us' }]}
      />

      {/* ---- Contact channels ---- */}
      <section aria-label="How to reach us" className="bg-white">
        <Container>
          <ul className="grid divide-ink-line border-b border-ink-line sm:grid-cols-2 lg:grid-cols-4 lg:divide-x">
            <Channel
              Icon={Phone}
              label="Call the lab"
              value={SITE_CONFIG.phoneDisplay}
              secondary={`Emergency line ${SITE_CONFIG.emergencyLine}`}
              href={telHref()}
            />
            <Channel
              Icon={MessageCircle}
              label="WhatsApp"
              value="Message us"
              secondary="Usually the quickest for quick questions"
              href={whatsappHref()}
              external
            />
            <Channel
              Icon={Mail}
              label="Email"
              value={SITE_CONFIG.email}
              secondary="For reports and documentation"
              href={mailHref()}
            />
            <Channel
              Icon={MapPin}
              label="Visit the centre"
              value={`${SITE_CONFIG.address.city}, ${SITE_CONFIG.address.state}`}
              secondary={SITE_CONFIG.address.line1}
              href={mapHref()}
              external
            />
          </ul>
        </Container>
      </section>

      {/* ---- Form + details ---- */}
      <section aria-labelledby="contact-form-heading" className="bg-white py-16 sm:py-20">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <SectionHeading
                eyebrow="Send a message"
                title={<span id="contact-form-heading">Write to us</span>}
                description="Tell us what you need and the team will get back to you. For anything urgent, please call."
              />
              <div className="mt-10">
                <ContactForm />
              </div>
            </div>

            <aside className="lg:col-span-5">
              <div className="lg:sticky lg:top-32 space-y-6">
                <div className="rounded-2xl border border-ink-line bg-mist p-7 sm:p-8">
                  <h2 className="flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.015em] text-ink">
                    <MapPin className="h-5 w-5 text-brand-500" strokeWidth={2} aria-hidden="true" />
                    The centre
                  </h2>
                  <address className="mt-5 not-italic text-[15px] leading-relaxed text-ink-muted">
                    {SITE_CONFIG.legalName}
                    <br />
                    {SITE_CONFIG.address.line1}
                    <br />
                    {SITE_CONFIG.address.city} — {SITE_CONFIG.address.postalCode}
                    <br />
                    {SITE_CONFIG.address.state}, {SITE_CONFIG.address.country}
                  </address>
                  <Button href={mapHref()} variant="secondary" size="md" className="mt-6 w-full">
                    Get directions
                    <ButtonArrow />
                  </Button>
                </div>

                <div className="rounded-2xl border border-ink-line bg-white p-7 sm:p-8">
                  <h2 className="flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.015em] text-ink">
                    <Clock className="h-5 w-5 text-brand-500" strokeWidth={2} aria-hidden="true" />
                    Opening hours
                  </h2>
                  <dl className="mt-5 space-y-3.5 text-[15px]">
                    {SITE_CONFIG.hours.map((h) => (
                      <div key={h.days} className="flex items-baseline justify-between gap-4">
                        <dt className="text-ink-muted">{h.days}</dt>
                        <dd className="font-semibold tabular-nums text-ink">{h.time}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-6 border-t border-ink-line pt-5 text-[13px] leading-relaxed text-ink-soft">
                    Fasting samples are best given early — the first slots of the day exist for
                    exactly that.
                  </p>
                </div>

                <MapEmbed />
              </div>
            </aside>
          </div>
        </Container>
      </section>

      <div className="bg-mist py-4">
        <HomeCollectionSection />
      </div>
    </>
  );
}

function Channel({
  Icon,
  label,
  value,
  secondary,
  href,
  external = false,
}: {
  Icon: typeof Phone;
  label: string;
  value: string;
  secondary: string;
  href: string;
  external?: boolean;
}) {
  return (
    <li className="border-b border-ink-line last:border-b-0 sm:border-b-0">
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="group flex h-full flex-col p-7 transition-colors duration-300 hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500 sm:p-8"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 transition-colors duration-300 group-hover:bg-brand-500 group-hover:text-white group-hover:ring-brand-500">
          <Icon className="h-[20px] w-[20px]" strokeWidth={1.9} aria-hidden="true" />
        </span>
        <span className="mt-6 block text-[11px] font-bold uppercase tracking-[0.16em] text-ink-soft">
          {label}
        </span>
        <span className="mt-2 block text-[16.5px] font-bold tracking-[-0.015em] text-ink">
          {value}
        </span>
        <span className="mt-1.5 block text-[13px] leading-relaxed text-ink-muted">{secondary}</span>
      </a>
    </li>
  );
}

interface ContactState {
  name: string;
  phone: string;
  email: string;
  message: string;
}

const EMPTY: ContactState = { name: '', phone: '', email: '', message: '' };

function ContactForm() {
  const { addContact, storageAvailable } = useContent();
  const reduced = usePrefersReducedMotion();
  const [form, setForm] = useState<ContactState>(EMPTY);
  const [errors, setErrors] = useState<Errors<ContactState>>({});
  const [sent, setSent] = useState(false);

  const set = <K extends keyof ContactState>(key: K, value: ContactState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors<ContactState> = {};
    next.name = required(form.name, 'Please tell us your name.');
    if (!form.phone.trim()) next.phone = 'A phone number lets us call you back.';
    else if (!isValidPhone(form.phone)) next.phone = 'Enter a valid 10-digit mobile number.';
    if (form.email.trim() && !isValidEmail(form.email))
      next.email = 'That email address does not look right.';
    next.message = required(form.message, 'Let us know what you need.');
    if (!next.message && form.message.trim().length < 10)
      next.message = 'A little more detail helps us answer properly.';

    const found = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v),
    ) as Errors<ContactState>;

    if (Object.keys(found).length > 0) {
      setErrors(found);
      const firstKey = Object.keys(found)[0];
      const target =
        document.querySelector<HTMLElement>(
          `input[name="${firstKey}"], textarea[name="${firstKey}"]`,
        ) ?? document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
      target?.focus();
      return;
    }

    addContact({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
    });
    setSent(true);
    setForm(EMPTY);
  };

  if (sent) {
    return (
      <motion.div
        role="status"
        initial={reduced ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 sm:p-10"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2 className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
        </span>
        <h3 className="mt-6 text-[24px] font-extrabold tracking-editorial text-ink">
          Thank you — your message is saved.
        </h3>
        <p className="mt-3.5 max-w-md text-[15.5px] leading-relaxed text-ink-muted">
          {storageAvailable
            ? 'It has been recorded in this browser and appears in the local admin panel. This site runs without a backend, so nothing is transmitted — for anything time-sensitive, please call the lab.'
            : 'Local storage is blocked in this browser, so the message is held only for this session. Please call the lab so nothing is missed.'}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button href={telHref()} size="md">
            <Phone className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            {SITE_CONFIG.phoneDisplay}
          </Button>
          <Button variant="secondary" size="md" onClick={() => setSent(false)}>
            Write another message
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-ink-line bg-mist p-7 sm:p-9">
      <div className="grid gap-5 sm:grid-cols-2">
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
          className="sm:col-span-2"
          value={form.email}
          error={errors.email}
          hint="Optional."
          onChange={(e) => set('email', e.target.value)}
          placeholder="you@example.com"
        />
        <TextAreaField
          label="Message"
          name="message"
          required
          className="sm:col-span-2"
          value={form.message}
          error={errors.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="Which package or test you are asking about, and anything else that helps us answer."
          rows={5}
        />
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg">
          Send message
          <ButtonArrow />
        </Button>
        <p className="max-w-xs text-[12.5px] leading-relaxed text-ink-soft">
          Please do not send medical records or report values through this form.
        </p>
      </div>
    </form>
  );
}
