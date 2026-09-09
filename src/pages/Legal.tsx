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
 * can state accurately: it is a static site with no backend, and form data
 * never leaves the visitor's own browser. Nothing here invents a policy the
 * business has not agreed to — anything about the laboratory's own handling of
 * samples and records points the reader to the lab directly.
 */

const PRIVACY: Clause[] = [
  {
    heading: 'What this website collects',
    paragraphs: [
      'This site is a static application with no backend server, no database and no analytics account. There is nowhere for it to send information to.',
      'When you complete the home collection or contact form, the details you type are written to your own browser’s local storage on your own device. They are not transmitted to Healthcare Labs, to us, or to any third party. If you clear your browser data, they are gone.',
      'Because of this, submitting a form here does not by itself notify the laboratory. For anything you need acted on, please call the lab.',
    ],
  },
  {
    heading: 'Cookies',
    paragraphs: [
      'This site sets no cookies and runs no advertising or analytics trackers. It uses browser local storage only, and only for the content and form records described above.',
    ],
  },
  {
    heading: 'Third-party embeds',
    paragraphs: [
      'The contact page embeds a Google Maps frame so you can find the centre. That embed is served by Google and is subject to Google’s own privacy policy. WhatsApp and telephone links hand you off to those applications, which are likewise governed by their own terms.',
    ],
  },
  {
    heading: 'Information you give the laboratory directly',
    paragraphs: [
      'Anything you share with Healthcare Labs by phone, by email, on WhatsApp or in person — including personal details, samples and reports — is handled by the laboratory under its own procedures, not by this website. Please contact the lab directly for details of how that information is stored and for how long.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [
      `Questions about this policy can be directed to ${SITE_CONFIG.email} or ${SITE_CONFIG.phoneDisplay}.`,
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
      'Package contents and prices are published as supplied by the laboratory and may change. Nothing on this site constitutes a binding quotation. Please confirm the current price and the exact contents of a package with the lab before booking.',
      'Some packages include procedures that can only be performed at the centre. Where that is the case, the package page says so.',
    ],
  },
  {
    heading: 'Bookings made through this site',
    paragraphs: [
      'Forms on this site record a request in your own browser. They do not create a confirmed appointment and take no payment. A booking exists only once the laboratory has confirmed it with you directly.',
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
      ? 'How this website handles information. It is a static site with no backend — form entries stay in your own browser.'
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
