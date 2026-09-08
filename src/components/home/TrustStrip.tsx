import { FlaskConical, Home, ShieldCheck, Smartphone } from 'lucide-react';
import { Container, Reveal } from '@/components/common/Primitives';

/**
 * Capability strip. Every item describes something the lab actually does — no
 * counts, no accuracy figures, no accreditation claims.
 */
const CAPABILITIES = [
  {
    Icon: FlaskConical,
    title: 'Advanced Diagnostics',
    detail: 'Pathology, imaging and cardiac testing under one roof.',
  },
  {
    Icon: Home,
    title: 'Home Collection',
    detail: 'Trained phlebotomists collect samples at your address.',
  },
  {
    Icon: Smartphone,
    title: 'Digital Reports',
    detail: 'Reports shared digitally as soon as they are verified.',
  },
  {
    Icon: ShieldCheck,
    title: 'Quality-Focused Processing',
    detail: 'Every sample verified before a report is released.',
  },
];

export function TrustStrip() {
  return (
    <section
      id="trust"
      aria-label="What Healthcare Labs provides"
      className="relative border-b border-ink-line bg-white"
    >
      <Container>
        <ul className="grid divide-ink-line sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
          {CAPABILITIES.map(({ Icon, title, detail }, i) => (
            <Reveal
              as="li"
              key={title}
              delay={i}
              className="group flex items-start gap-4 border-b border-ink-line py-8 pr-6 last:border-b-0 sm:border-b-0 sm:py-9 sm:pl-6 sm:first:pl-0 lg:pl-8"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 transition-colors duration-300 group-hover:bg-brand-500 group-hover:text-white group-hover:ring-brand-500">
                <Icon className="h-[21px] w-[21px]" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[15px] font-bold leading-tight tracking-[-0.01em] text-ink">
                  {title}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">{detail}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
