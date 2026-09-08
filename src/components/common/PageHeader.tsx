import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Container, Eyebrow } from '@/components/common/Primitives';

export interface Crumb {
  label: string;
  to?: string;
}

/**
 * Shared dark page masthead. Carries the same navy ground and technical grid as
 * the hero so inner pages stay in the same visual family without repeating the
 * 3D scene.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  crumbs = [],
  children,
  aside,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  crumbs?: Crumb[];
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-navy-900 pt-[74px] lg:pt-[84px]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(150deg,#050E2E_0%,#07133D_45%,#0B2058_100%)]" />
        <div className="absolute inset-0 bg-grid-dark [background-size:72px_72px] [mask-image:radial-gradient(ellipse_80%_70%_at_30%_10%,#000,transparent_76%)]" />
        <div className="absolute -right-32 -top-24 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(53,199,244,0.16),transparent_66%)] blur-2xl" />
      </div>

      <Container className="relative pb-16 pt-14 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-slate-400">
              <li>
                <Link
                  to="/"
                  className="transition-colors hover:text-brand-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-300"
                >
                  Home
                </Link>
              </li>
              {crumbs.map((c, i) => (
                <Fragment key={c.label}>
                  <li aria-hidden="true">
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" strokeWidth={2.4} />
                  </li>
                  <li>
                    {c.to && i < crumbs.length - 1 ? (
                      <Link
                        to={c.to}
                        className="transition-colors hover:text-brand-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-300"
                      >
                        {c.label}
                      </Link>
                    ) : (
                      <span aria-current="page" className="text-slate-300">
                        {c.label}
                      </span>
                    )}
                  </li>
                </Fragment>
              ))}
            </ol>
          </nav>
        )}

        <div className={aside ? 'grid gap-10 lg:grid-cols-12 lg:gap-12' : ''}>
          <div className={aside ? 'lg:col-span-7' : 'max-w-3xl'}>
            <Eyebrow tone="dark">{eyebrow}</Eyebrow>
            <h1 className="mt-6 text-balance text-[clamp(2.1rem,5vw,3.6rem)] font-extrabold leading-[1.04] tracking-tightest text-white">
              {title}
            </h1>
            {description && (
              <p className="mt-6 max-w-2xl text-pretty text-[16.5px] leading-relaxed text-slate-300/90 sm:text-[17.5px]">
                {description}
              </p>
            )}
            {children}
          </div>
          {aside && <div className="lg:col-span-5 lg:pl-4">{aside}</div>}
        </div>
      </Container>
    </section>
  );
}
