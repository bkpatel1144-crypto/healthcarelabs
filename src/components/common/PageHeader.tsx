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
  /*
    Light masthead. Every inner page used to open on deep navy, which is what
    made the whole site read as dark; it now opens on white with the same
    colour mesh as the hero so the pages feel continuous with it.
  */
  return (
    <section className="relative overflow-hidden bg-white pt-[74px] lg:pt-[76px] xl:pt-[116px]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(175deg,#FFFFFF_0%,#F4F8FF_60%,#E9F2FF_100%)]" />
        <div className="absolute inset-0 bg-mesh-hero opacity-70" />
        <div className="absolute -right-28 -top-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,122,69,0.16),transparent_68%)] blur-2xl" />
      </div>

      <Container className="relative pb-16 pt-14 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-soft">
              <li>
                <Link
                  to="/"
                  className="transition-colors hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
                >
                  Home
                </Link>
              </li>
              {crumbs.map((c, i) => (
                <Fragment key={c.label}>
                  <li aria-hidden="true">
                    <ChevronRight className="h-3.5 w-3.5 text-ink-line" strokeWidth={2.4} />
                  </li>
                  <li>
                    {c.to && i < crumbs.length - 1 ? (
                      <Link
                        to={c.to}
                        className="transition-colors hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
                      >
                        {c.label}
                      </Link>
                    ) : (
                      <span aria-current="page" className="font-semibold text-ink">
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
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="mt-6 text-balance text-[clamp(2.1rem,5vw,3.6rem)] font-extrabold leading-[1.04] tracking-tightest text-ink">
              {title}
            </h1>
            {description && (
              <p className="mt-6 max-w-2xl text-pretty text-[16.5px] leading-relaxed text-ink-muted sm:text-[17.5px]">
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
