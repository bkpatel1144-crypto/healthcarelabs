import { PageHeader } from '@/components/common/PageHeader';
import { Container } from '@/components/common/Primitives';
import { useSeo } from '@/lib/seo';
import { SITE_CONFIG, mailHref, telHref } from '@/config/site';

interface Clause {
  heading: string;
  paragraphs: string[];
}

/**
 * Privacy and terms describe how *this website* behaves, which is something we
 * can state accurately. Every factual sentence below matches what the code
 * does (src/lib/accountApi.ts, firestore.rules). Anything that is the lab's own
 * policy rather than the website's — retention periods for medical records,
 * sample handling — points the reader to the lab, because it is the lab's to
 * set and should be reviewed by its legal adviser before publishing changes.
 *
 * When this notice changes materially, bump PRIVACY_VERSION in
 * src/types/account.ts so signed-in patients are asked to consent again.
 */

const PRIVACY: Clause[] = [
  {
    heading: 'Who is responsible',
    paragraphs: [
      `${SITE_CONFIG.legalName}, trading as ${SITE_CONFIG.brandName}, decides how the information described here is used and is responsible for it (the “data fiduciary” under India’s Digital Personal Data Protection Act, 2023).`,
    ],
  },
  {
    heading: 'What we collect, and why',
    paragraphs: [
      'Account: your name, mobile number, email address, gender and date of birth, and the family members and addresses you choose to save — so you can book tests for yourself and your family and the lab can identify each sample correctly.',
      'Bookings: who the sample is for, the tests chosen, the visit date, time, address and PIN code, any notes you add, and each step of the visit (confirmation, the phlebotomist assigned, the sample ID and collection time, processing, payment received) — so the visit can happen and you can follow it.',
      'Reports: the PDF reports the lab releases to you, with the name of the pathologist who signed them — so you can download them at any time.',
      'Messages and prescriptions: what you send through the contact, support, partnership and prescription forms, including any photo or PDF you attach — so the lab can answer you.',
      'We do not use your health information for advertising. Offers and reminders are sent only if you switch them on, and you can switch them off at any time.',
    ],
  },
  {
    heading: 'Your consent',
    paragraphs: [
      'We ask for your consent before processing your information: when you book, and once for your account. It covers only the purposes above. You can withdraw it at any time by asking for your data to be deleted (see “Your rights”); this does not affect anything done before you withdrew it, and the lab may then be unable to provide further tests through the website.',
    ],
  },
  {
    heading: 'Who can see it',
    paragraphs: [
      'Only you and authorised laboratory staff. Our security rules allow a patient to see only their own records, a phlebotomist to see only the visits assigned to them, and laboratory administrators to manage bookings and reports. Staff actions on patient records are written to an audit log that cannot be edited.',
      'Information is stored with Google Firebase (Google Cloud), which processes it on the lab’s behalf. It is not sold or shared with anyone else, except where the law requires it.',
    ],
  },
  {
    heading: 'How long it is kept',
    paragraphs: [
      'For as long as your account is open and for as long afterwards as the law requires the laboratory to keep medical records. Please ask the lab for its current retention periods.',
    ],
  },
  {
    heading: 'Your rights',
    paragraphs: [
      'Access: in My profile, “Download my data” gives you a copy of everything your account holds.',
      'Correction: you can edit your profile, family members and addresses yourself. For anything else, contact the lab.',
      'Erasure: in My profile, “Request deletion of my data” asks the lab to delete your account and personal data. Records the lab must keep by law are retained only for as long as required.',
      `Grievances: write to ${SITE_CONFIG.email} or call ${SITE_CONFIG.phoneDisplay}. If you are not satisfied with the response, you may complain to the Data Protection Board of India.`,
    ],
  },
  {
    heading: 'Cookies and storage on your device',
    paragraphs: [
      'This site runs no advertising or analytics trackers. It stores your sign-in session and site preferences (such as your visit plan and accessibility settings) in your browser so the site works between visits.',
    ],
  },
  {
    heading: 'Third-party services',
    paragraphs: [
      'Signing in uses Google Firebase Authentication; if you choose “Continue with Google”, Google shares your name and email with us. Maps on the contact and locations pages are served by OpenStreetMap and Google Maps. WhatsApp and telephone links hand you off to those applications, which are governed by their own terms.',
    ],
  },
];

const TERMS: Clause[] = [
  {
    heading: 'About this site',
    paragraphs: [
      `This website is operated for ${SITE_CONFIG.legalName}, trading as ${SITE_CONFIG.brandName}. Using it means accepting the terms on this page.`,
    ],
  },
  {
    heading: 'Not medical advice',
    paragraphs: [
      'Everything published here — package descriptions, preparation notes and articles — is general information about widely accepted pathology practice. It does not diagnose any condition, does not constitute medical advice, and cannot account for your individual history.',
      'Test results must be interpreted by a qualified physician. Never delay seeking medical attention because of something you read on this site.',
    ],
  },
  {
    heading: 'Pricing and availability',
    paragraphs: [
      'Package contents and prices are published as supplied by the laboratory and may change. The total shown when you book is recorded on your booking; the lab confirms the final amount before the visit.',
      'Some packages include procedures that can only be performed at the centre. Where that is the case, the package page says so.',
    ],
  },
  {
    heading: 'Bookings, rescheduling and cancellation',
    paragraphs: [
      'A booking reserves a place in a home-collection time slot, subject to confirmation by the lab. Payment is taken at the time of collection.',
      'You can reschedule or cancel online from My bookings until a phlebotomist has been assigned. After that, please call the lab.',
      'If a sample cannot be collected or cannot be used, the lab will tell you why and arrange for it to be taken again.',
    ],
  },
  {
    heading: 'Your account',
    paragraphs: [
      'Keep access to your mobile number and email secure; anyone who can sign in to your account can see its bookings and reports. Tell the lab straight away if you think someone else has accessed it.',
    ],
  },
  {
    heading: 'Intellectual property',
    paragraphs: [
      `The ${SITE_CONFIG.brandName} name, logo and the content of this site belong to ${SITE_CONFIG.legalName} and may not be reproduced without permission.`,
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [
      `For anything relating to these terms, write to ${SITE_CONFIG.email} or call ${SITE_CONFIG.phoneDisplay}.`,
    ],
  },
];

function LegalPage({
  kind,
}: {
  kind: 'privacy' | 'terms';
}) {
  const isPrivacy = kind === 'privacy';
  const clauses = isPrivacy ? PRIVACY : TERMS;
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Use';

  useSeo({
    title,
    description: isPrivacy
      ? `What ${SITE_CONFIG.brandName} collects through this website, why, who can see it, and your rights under the DPDP Act.`
      : 'The terms that apply to using the Healthcare Labs website, including that nothing published here is medical advice.',
    path: isPrivacy ? '/privacy-policy' : '/terms',
  });

  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title={title}
        description={
          isPrivacy
            ? 'A short policy, because this site does very little with data.'
            : 'What you can and cannot rely on from the information published here.'
        }
        crumbs={[{ label: title }]}
      />

      <section className="bg-white py-16 sm:py-20">
        <Container>
          <div className="max-w-3xl">
            <ol className="space-y-12">
              {clauses.map((c, i) => (
                <li key={c.heading}>
                  <h2 className="flex items-baseline gap-4 text-[22px] font-bold leading-snug tracking-editorial text-ink">
                    <span className="font-mono text-[13px] font-medium tabular-nums text-brand-500">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {c.heading}
                  </h2>
                  <div className="mt-4 space-y-4 pl-10">
                    {c.paragraphs.map((p, j) => (
                      <p key={j} className="text-pretty text-[16px] leading-[1.75] text-ink-muted">
                        {p}
                      </p>
                    ))}
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-14 rounded-2xl border border-ink-line bg-mist p-7 text-[14.5px] leading-relaxed text-ink-muted sm:p-8">
              <p>
                <strong className="font-semibold text-ink">Need a person?</strong> Call{' '}
                <a
                  href={telHref()}
                  className="font-semibold text-brand-600 underline-offset-2 hover:underline"
                >
                  {SITE_CONFIG.phoneDisplay}
                </a>{' '}
                or write to{' '}
                <a
                  href={mailHref()}
                  className="font-semibold text-brand-600 underline-offset-2 hover:underline"
                >
                  {SITE_CONFIG.email}
                </a>
                .
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

export function PrivacyPolicy() {
  return <LegalPage kind="privacy" />;
}

export function TermsOfUse() {
  return <LegalPage kind="terms" />;
}
