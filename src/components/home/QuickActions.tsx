import { Link } from 'react-router-dom';
import { CalendarCheck, MessageCircle, PackageSearch, Phone } from 'lucide-react';
import { Container, Reveal } from '@/components/common/Primitives';
import { SITE_CONFIG, telHref, whatsappHref } from '@/config/site';

/**
 * The four things a visitor most often arrives wanting to do. Deliberately a
 * dark inset band rather than another row of white cards — it breaks the
 * rhythm between the hero and the editorial sections that follow.
 */
const ACTIONS = [
  {
    Icon: PackageSearch,
    label: 'Browse packages',
    detail: 'Compare panels, tests and pricing',
    to: '/health-package',
  },
  {
    Icon: CalendarCheck,
    label: 'Book home collection',
    detail: 'Pick a date, time and address',
    to: '/contact-us#home-collection',
  },
  {
    Icon: Phone,
    label: 'Call the lab',
    detail: SITE_CONFIG.phoneDisplay,
    href: telHref(),
  },
  {
    Icon: MessageCircle,
    label: 'Ask on WhatsApp',
    detail: 'Questions about a test or panel',
    href: whatsappHref(),
  },
];

export function QuickActions() {
  return (
    <section aria-label="Quick actions" className="bg-mist py-16 sm:py-20">
      <Container>
        <div className="overflow-hidden rounded-2xl bg-navy-900 shadow-liftLg">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-grid-dark [background-size:56px_56px] [mask-image:radial-gradient(ellipse_80%_100%_at_50%_0%,#000,transparent_75%)]"
            />
            <ul className="relative grid sm:grid-cols-2 lg:grid-cols-4">
              {ACTIONS.map(({ Icon, label, detail, to, href }, i) => {
                const inner = (
                  <>
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.07] text-brand-300 ring-1 ring-inset ring-white/10 transition-all duration-300 group-hover:bg-brand-500 group-hover:text-white group-hover:ring-brand-400">
                      <Icon className="h-[19px] w-[19px]" strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    <span className="mt-5 block text-[15.5px] font-bold tracking-[-0.01em] text-white">
                      {label}
                    </span>
                    <span className="mt-1.5 block text-[13.5px] leading-relaxed text-slate-400">
                      {detail}
                    </span>
                    <span
                      aria-hidden="true"
                      className="mt-5 block h-px w-9 bg-brand-400/50 transition-all duration-300 group-hover:w-16 group-hover:bg-brand-400"
                    />
                  </>
                );

                const classes =
                  'group block h-full border-b border-white/[0.08] p-7 transition-colors duration-300 hover:bg-white/[0.035] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-300 sm:p-8 lg:border-b-0 lg:border-r lg:last:border-r-0';

                return (
                  <Reveal as="li" key={label} delay={i} className="sm:[&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+2)]:border-b-0">
                    {to ? (
                      <Link to={to} className={classes}>
                        {inner}
                      </Link>
                    ) : (
                      <a
                        href={href}
                        {...(href?.startsWith('http')
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                        className={classes}
                      >
                        {inner}
                      </a>
                    )}
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
