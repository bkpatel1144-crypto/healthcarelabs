import { Camera, PhoneCall, ShieldCheck, Home as HomeIcon } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Container } from '@/components/common/Primitives';
import { RequestForm } from '@/components/common/RequestForm';
import { SITE_CONFIG, telHref } from '@/config/site';
import { useSeo } from '@/lib/seo';

const STEPS = [
  { Icon: Camera, title: 'Upload the prescription', text: 'A clear photo of your doctor’s prescription, or the PDF they sent.' },
  { Icon: PhoneCall, title: 'The lab calls you back', text: 'We read it, confirm which tests it lists and tell you the price before anything is booked.' },
  { Icon: HomeIcon, title: 'Sample at home or at a branch', text: 'Choose a home collection slot or walk in. Pay at the time of collection.' },
];

export default function UploadPrescription() {
  useSeo({
    title: 'Upload a prescription',
    description: `Send your doctor’s prescription to ${SITE_CONFIG.brandName} and the lab will call back with the tests and the price.`,
    path: '/upload-prescription',
  });

  return (
    <>
      <PageHeader
        eyebrow="Upload Prescription"
        title={
          <>
            Not sure which tests to book?{' '}
            <span className="bg-gradient-to-r from-brand-700 to-mint-600 bg-clip-text text-transparent">
              Send us the prescription.
            </span>
          </>
        }
        description="Upload what your doctor wrote and the lab works out the tests for you — no need to match names on a long list."
        crumbs={[{ label: 'Upload Prescription' }]}
      />

      <section className="bg-white pb-20 pt-10 sm:pb-28">
        <Container size="shell">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <h2 className="text-[22px] font-extrabold tracking-editorial text-ink">How it works</h2>
              <ol className="mt-6 space-y-6">
                {STEPS.map(({ Icon, title, text }, i) => (
                  <li key={title} className="flex gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                      <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-bold text-ink">
                        <span className="mr-1.5 font-mono text-[12px] text-ink-soft">{String(i + 1).padStart(2, '0')}</span>
                        {title}
                      </p>
                      <p className="mt-1 text-[14.5px] leading-relaxed text-ink-muted">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-8 flex items-start gap-2.5 rounded-2xl bg-mist p-4 text-[13.5px] leading-relaxed text-ink-muted">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint-600" aria-hidden="true" />
                Your prescription is stored in your account and is visible only to you and the lab.
              </p>
              <p className="mt-4 text-[14px] text-ink-muted">
                Prefer to talk?{' '}
                <a href={telHref()} className="font-semibold text-brand-600 hover:underline">
                  {SITE_CONFIG.phoneDisplay}
                </a>
              </p>
            </div>

            <div className="lg:col-span-7">
              <RequestForm
                type="prescription"
                file="required"
                messageLabel="Anything we should know"
                messageRequired={false}
                messagePlaceholder="Preferred date for collection, home or branch visit, patient’s age…"
                submitLabel="Send prescription"
                success={
                  <>
                    <strong className="font-bold">Prescription received.</strong> The lab will call you to
                    confirm the tests and the price before booking anything.
                  </>
                }
              />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
