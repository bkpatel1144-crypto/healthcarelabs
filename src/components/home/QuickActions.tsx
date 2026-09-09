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
    <section aria-label="Quick actions" className="bg-white py-16 sm:py-20">
      <Container>
        <div className="overflow-hidden rounded-4xl bg-gradient-to-br from-brand-600 via-brand-500 to-mint-400 shadow-card">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-grid-dark [background-size:56px_56px] [mask-image:radial-gradient(ellipse_80%_100%_at_50%_0%,#000,transparent_75%)] opacity-60"
            />
            <ul className="relative grid sm:grid-cols-2 lg:grid-cols-4">
              {ACTIONS.map(({ Icon, label, detail, to, href }, i) => {
                const inner = (
                  <>
                    <span className="glass-dark flex h-11 w-11 items-center justify-center rounded-2xl text-white transition-all duration-300 group-hover:bg-white group-hover:bg-none group-hover:text-brand-600">
                      <Icon className="h-[19px] w-[19px]" strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    <span className="mt-5 block text-[15.5px] font-bold tracking-[-0.01em] text-white">
                      {label}
                    </span>
                    <span className="mt-1.5 block text-[13.5px] leading-relaxed text-white/75">
                      {detail}
                    </span>
                    <span
                      aria-hidden="true"
                      className="mt-5 block h-px w-9 bg-white/50 transition-all duration-300 group-hover:w-16 group-hover:bg-white"
                    />
                  </>
                );

                const classes =
                  'group block h-full border-b border-white/15 p-7 transition-colors duration-300 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white sm:p-8 lg:border-b-0 lg:border-r lg:last:border-r-0';

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
