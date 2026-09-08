import { useEffect } from 'react';
import { SITE_CONFIG } from '@/config/site';
import { ACCREDITATION } from '@/data/accreditation';

export interface SeoInput {
  title: string;
  description: string;
  /** Path only, e.g. "/health-package". */
  path: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  publishedAt?: string;
  author?: string;
  /** Extra JSON-LD injected alongside the Organization graph. */
  jsonLd?: Record<string, unknown>;
}

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
  return el;
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

const JSONLD_ID = 'hcl-route-jsonld';

/**
 * Route-level document head management. Deliberately hand-rolled: a helmet
 * library would be another dependency for ~60 lines of DOM work.
 */
export function useSeo({
  title,
  description,
  path,
  image = '/og-image.jpg',
  type = 'website',
  noindex = false,
  publishedAt,
  author,
  jsonLd,
}: SeoInput): void {
  useEffect(() => {
    const fullTitle = title.includes(SITE_CONFIG.brandName)
      ? title
      : `${title} | ${SITE_CONFIG.brandName}`;
    const canonical = `${SITE_CONFIG.url}${path === '/' ? '/' : path}`;
    const imageUrl = image.startsWith('http') ? image : `${SITE_CONFIG.url}${image}`;

    document.title = fullTitle;

    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="robots"]', {
      name: 'robots',
      content: noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    });
    upsertLink('canonical', canonical);

    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: imageUrl });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_CONFIG.brandName });
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'en_IN' });

    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl });

    if (publishedAt) {
      upsertMeta('meta[property="article:published_time"]', {
        property: 'article:published_time',
        content: publishedAt,
      });
    }
    if (author) {
      upsertMeta('meta[name="author"]', { name: 'author', content: author });
    }

    const graph: Record<string, unknown>[] = [organizationSchema()];
    if (jsonLd) graph.push(jsonLd);

    let script = document.getElementById(JSONLD_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = JSONLD_ID;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  }, [title, description, path, image, type, noindex, publishedAt, author, jsonLd]);
}

export function organizationSchema(): Record<string, unknown> {
  const a = SITE_CONFIG.address;
  return {
    '@type': 'MedicalBusiness',
    '@id': `${SITE_CONFIG.url}/#organization`,
    name: SITE_CONFIG.brandName,
    legalName: SITE_CONFIG.legalName,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/brand/healthcare-labs-logo.png`,
    image: `${SITE_CONFIG.url}/og-image.jpg`,
    description: SITE_CONFIG.description,
    telephone: SITE_CONFIG.phoneDisplay,
    email: SITE_CONFIG.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: a.line1,
      addressLocality: a.city,
      addressRegion: a.state,
      postalCode: a.postalCode,
      addressCountry: 'IN',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '07:00',
        closes: '22:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday',
        opens: '07:00',
        closes: '14:00',
      },
    ],
    sameAs: Object.values(SITE_CONFIG.social).filter(Boolean),
    ...(SITE_CONFIG.accreditations.length > 0
      ? {
          hasCredential: SITE_CONFIG.accreditations.map((a) => ({
            '@type': 'EducationalOccupationalCredential',
            credentialCategory: 'Accreditation',
            name: a.label,
            identifier: a.registrationNumber,
            recognizedBy: {
              '@type': 'Organization',
              name: ACCREDITATION.body,
              alternateName: ACCREDITATION.bodyShort,
            },
            dateCreated: ACCREDITATION.ceremony.date,
          })),
        }
      : {}),
  };
}
