import { Briefcase, Building2, Handshake, Stethoscope } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Container } from '@/components/common/Primitives';
import { RequestForm } from '@/components/common/RequestForm';
import { SITE_CONFIG } from '@/config/site';
import { useSeo } from '@/lib/seo';

/*
  The cards say what each kind of partner can ask about, not what terms they
  will get. Commercial terms are the lab's to state; the form's job is to put
  the right person in touch with them.
*/
const KINDS = [
  { value: 'Corporate health check-ups', Icon: Briefcase, text: 'Health check-up camps and annual screening for your employees.' },
  { value: 'Doctor or clinic tie-up', Icon: Stethoscope, text: 'Sample pick-up and reporting for your patients.' },
  { value: 'Hospital or lab referral', Icon: Building2, text: 'Referral testing and specialised panels for your facility.' },
  { value: 'Franchise or collection centre', Icon: Handshake, text: 'Open a collection centre with the lab’s processing behind it.' },
];

export default function Partner() {
  useSeo({
    title: 'Partner with us',
    description: `Corporate health check-ups, doctor and clinic tie-ups, referral testing and franchise enquiries for ${SITE_CONFIG.brandName}.`,
    path: '/partner-with-us',
  });

  return (
    <>
      <PageHeader
        eyebrow="Partnerships"
        title={
          <>
            Work with{' '}
            <span className="bg-gradient-to-r from-brand-700 to-mint-600 bg-clip-text text-transparent">
              {SITE_CONFIG.brandName}.
            </span>
          </>
        }
        description="Companies, doctors, hospitals and entrepreneurs — tell us what you have in mind and the right person from the lab will call you."
        crumbs={[{ label: 'Partner with us' }]}
      />

      <section className="bg-white pb-6 pt-10">
        <Container size="shell">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KINDS.map(({ value, Icon, text }) => (
              <li key={value} className="rounded-3xl bg-mist p-6 ring-1 ring-ink-line">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 ring-1 ring-brand-100">
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-[17px] font-bold text-ink">{value}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{text}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-white py-14 sm:py-20">
        <Container size="shell">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="text-[24px] font-extrabold tracking-editorial text-ink">Send an enquiry</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
                A few lines on your organisation and what you need is enough — the lab will follow up
                with the details.
              </p>
            </div>
            <div className="lg:col-span-8">
              <RequestForm
                type="partnership"
                topics={KINDS.map((k) => ({ value: k.value, label: k.value }))}
                topicLabel="Type of partnership"
                messageLabel="Tell us about it"
                messagePlaceholder="Organisation name, city, number of employees or patients, what you’re looking for…"
                submitLabel="Send enquiry"
                success={<><strong className="font-bold">Enquiry received.</strong> Someone from the lab will contact you.</>}
              />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
