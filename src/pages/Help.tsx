import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, FileText, MessageCircle, Phone, Upload } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Container, FAQ, type FaqItem } from '@/components/common/Primitives';
import { RequestForm } from '@/components/common/RequestForm';
import { SITE_CONFIG, telHref, whatsappHref } from '@/config/site';
import { useSeo } from '@/lib/seo';
import { cn } from '@/lib/cn';

/*
  Answers describe how this website and its booking flow work. Anything that
  is the lab's own policy — turnaround for a specific test, fasting rules,
  refunds — is pointed at the package page or the phone line rather than
  written here, so the page can never contradict what the lab actually does.
*/
const FAQS: Record<string, FaqItem[]> = {
  Booking: [
    {
      question: 'How do I book a home sample collection?',
      answer:
        'Open any health package and add it to your visit, or go straight to the booking form on the Contact page. Choose a date and time slot and give the collection address. The lab calls you to confirm the slot before the visit.',
    },
    {
      question: 'Can I book several tests in one visit?',
      answer:
        'Yes. Use “Add to visit” on as many packages as you need; they collect in the visit plan in the header, and one booking covers all of them.',
    },
    {
      question: 'Can I book for a family member?',
      answer:
        'Yes. Log in, add them under My account → Family members, and pick their name in the booking form. Their bookings and reports stay in your account.',
    },
    {
      question: 'How do I cancel a booking?',
      answer:
        'While the request still shows “Requested” in My bookings, you can cancel it there yourself. Once the lab has confirmed the slot, please call the lab to change or cancel it.',
    },
    {
      question: 'I have a prescription but don’t know which tests to book.',
      answer:
        'Use Upload prescription. The lab reads it, calls you with the tests and the price, and books the collection with you.',
    },
  ],
  'Reports': [
    {
      question: 'Where do I find my report?',
      answer:
        'Log in and open My reports. Each report the lab uploads appears there as a PDF you can download. If you booked as a guest, log in with the same mobile number next time so future reports reach your account.',
    },
    {
      question: 'How long does a report take?',
      answer:
        'Each package page shows its own report time, because it differs from test to test. Your booking in My bookings moves to “Report ready” when it is uploaded.',
    },
    {
      question: 'Who can see my reports?',
      answer:
        'Only you and the lab’s staff. Reports are stored in your account, and the site’s security rules refuse anyone else.',
    },
  ],
  'Payment': [
    {
      question: 'How do I pay?',
      answer:
        'Payment is taken at the time of sample collection, at home or at the branch. Nothing is charged when you book online.',
    },
    {
      question: 'Why does a package say “price on request”?',
      answer:
        'Some panels are priced by the tests you choose. The lab confirms the exact amount when it calls to confirm your booking.',
    },
  ],
  'Account': [
    {
      question: 'How do I log in?',
      answer:
        'With your mobile number and a one-time code by SMS, with email and a password, or with Google. The first login creates your account.',
    },
    {
      question: 'I didn’t receive the OTP.',
      answer:
        'Wait for the 30-second timer and tap Resend. Check the number has 10 digits. If it still doesn’t arrive, log in with email or Google instead, or call the lab.',
    },
    {
      question: 'How do I change my name or mobile number?',
      answer: 'Open My account → My profile and tap Edit.',
    },
  ],
};

const TOPICS = ['Booking', 'Sample collection', 'Report', 'Payment', 'Account or login', 'Feedback', 'Other'].map(
  (t) => ({ value: t, label: t }),
);

export default function Help() {
  useSeo({
    title: 'Help & Support',
    description: `Answers about booking, reports, payment and your ${SITE_CONFIG.brandName} account — and a direct line to the lab.`,
    path: '/help',
  });
  const categories = Object.keys(FAQS);
  const [active, setActive] = useState(categories[0]);

  const quick = [
    { to: '/account/bookings', label: 'Track a booking', Icon: CalendarClock },
    { to: '/account/reports', label: 'Download a report', Icon: FileText },
    { to: '/upload-prescription', label: 'Upload prescription', Icon: Upload },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Help & Support"
        title={
          <>
            How can we{' '}
            <span className="bg-gradient-to-r from-brand-700 to-mint-600 bg-clip-text text-transparent">help?</span>
          </>
        }
        description="Quick answers to the common questions, and a direct way to reach the team for everything else."
        crumbs={[{ label: 'Help & Support' }]}
      />

      <section className="bg-white pb-6 pt-10">
        <Container size="shell">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {quick.map(({ to, label, Icon }) => (
              <li key={to}>
                <Link to={to} className="flex h-full items-center gap-3 rounded-2xl bg-mist p-4 font-semibold text-ink ring-1 ring-ink-line transition-all hover:-translate-y-0.5 hover:text-brand-700 hover:ring-brand-200">
                  <Icon className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <a href={telHref()} className="flex h-full items-center gap-3 rounded-2xl bg-mist p-4 font-semibold text-ink ring-1 ring-ink-line transition-all hover:-translate-y-0.5 hover:text-brand-700 hover:ring-brand-200">
                <Phone className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                Call {SITE_CONFIG.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={whatsappHref('Hello Healthcare Labs, I need help with…')} target="_blank" rel="noopener noreferrer" className="flex h-full items-center gap-3 rounded-2xl bg-mist p-4 font-semibold text-ink ring-1 ring-ink-line transition-all hover:-translate-y-0.5 hover:text-mint-700 hover:ring-mint-200">
                <MessageCircle className="h-5 w-5 shrink-0 text-mint-600" aria-hidden="true" />
                WhatsApp us
              </a>
            </li>
          </ul>
        </Container>
      </section>

      <section className="bg-white py-14">
        <Container size="shell">
          <h2 className="text-[24px] font-extrabold tracking-editorial text-ink">Frequently asked questions</h2>
          <div role="tablist" aria-label="Question categories" className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={active === c}
                onClick={() => setActive(c)}
                className={cn(
                  'rounded-full px-4 py-2 text-[14px] font-semibold ring-1 transition-colors',
                  active === c ? 'bg-brand-500 text-white ring-brand-500' : 'bg-white text-ink-muted ring-ink-line hover:text-brand-600',
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <FAQ key={active} items={FAQS[active]} className="mt-6" />
        </Container>
      </section>

      <section id="support-form" className="bg-mist py-16 sm:py-20">
        <Container size="shell">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="text-[24px] font-extrabold tracking-editorial text-ink">Still need help?</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
                Send the team a message. If you’re logged in, the reply appears under My requests as
                well as by phone.
              </p>
            </div>
            <div className="lg:col-span-8">
              <RequestForm
                type="support"
                topics={TOPICS}
                topicLabel="What is it about?"
                messageLabel="Describe the problem"
                messagePlaceholder="Booking number, date, what happened…"
                submitLabel="Send to support"
                success={<><strong className="font-bold">Thanks — your request is with the team.</strong> They will get back to you shortly.</>}
              />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
