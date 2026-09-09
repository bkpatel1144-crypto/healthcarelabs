/**
 * Single source of truth for every piece of business information on the site.
 * Values here are transcribed from healthcare-labs.com. Anything that could not
 * be verified is left as an empty string and simply does not render.
 * Never hard-code contact details anywhere else in the codebase.
 */

export interface SiteConfig {
  brandName: string;
  legalName: string;
  tagline: string;
  description: string;
  url: string;
  phone: string;
  phoneDisplay: string;
  emergencyLine: string;
  email: string;
  whatsapp: string;
  whatsappMessage: string;
  address: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    full: string;
    mapQuery: string;
  };
  hours: { days: string; time: string }[];
  social: {
    instagram: string;
    facebook: string;
    linkedin: string;
    twitter: string;
    youtube: string;
    telegram: string;
  };
  /**
   * Accreditation claims. Every entry must carry a real certificate number —
   * that is the evidence that makes it publishable. `logo` is optional: the
   * badge falls back to a typographic treatment when the official emblem file
   * is not present, so nothing ever renders a broken image.
   */
  accreditations: {
    label: string;
    registrationNumber: string;
    scope?: string;
    /** Path under /public to the official accreditation emblem. */
    logo?: string;
  }[];
  /**
   * Optional operational metrics. Left blank on purpose — no invented numbers.
   * Fill a value and it appears; leave it blank and the tile is skipped.
   */
  stats: { label: string; value: string; suffix?: string }[];
  currency: { code: string; symbol: string; locale: string };
}

export const SITE_CONFIG: SiteConfig = {
  brandName: 'Healthcare Labs',
  legalName: 'Desai Healthcare Pathology Laboratory [OPC] Pvt. Ltd.',
  tagline: 'Your Trusted Partner in Health Diagnostics',
  description:
    'Advanced diagnostics, preventive health packages and trusted laboratory care — designed around you.',
  url: 'https://healthcare-labs.com',

  phone: '+918000010308',
  phoneDisplay: '+91 80000 10308',
  emergencyLine: '0261-3522858',
  email: 'info@healthcare-labs.com',

  whatsapp: '919925094247',
  whatsappMessage:
    'Hello Healthcare Labs, I would like to know more about your health packages.',

  address: {
    line1: '123-223-224, Royal Square, VIP Circle, Utran, Mota Varachha',
    city: 'Surat',
    state: 'Gujarat',
    postalCode: '394105',
    country: 'India',
    full: '123-223-224, Royal Square, VIP Circle, Utran, Mota Varachha, Surat - 394105',
    mapQuery: 'Royal Square, VIP Circle, Utran, Mota Varachha, Surat 394105',
  },

  hours: [
    { days: 'Monday – Saturday', time: '7:00 AM – 10:00 PM' },
    { days: 'Sunday', time: '7:00 AM – 2:00 PM' },
  ],

  social: {
    instagram: 'https://www.instagram.com/healthcare_labs_official/',
    facebook: '',
    linkedin: '',
    twitter: '',
    youtube: '',
    telegram: '',
  },

  /*
    Operational figures as published by the lab on healthcare-labs.com. These
    are the client's own claims, reproduced — not computed and not invented.
    Clear the array to stop rendering them.
  */
  stats: [
    { label: 'Regional processing labs across India', value: '15', suffix: '+' },
    { label: 'Samples processed daily', value: '1K', suffix: '+' },
    { label: 'Samples processed to date', value: '15L', suffix: '+' },
  ],

  accreditations: [
    {
      label: 'NABL Accredited',
      registrationNumber: 'MC-6960',
      scope: 'Medical Testing',
      // Drop the official emblem here to replace the typographic badge.
      logo: '/brand/nabl-accreditation.png',
    },
  ],

  currency: { code: 'INR', symbol: '₹', locale: 'en-IN' },
};

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about-us' },
  { label: 'Health Packages', href: '/health-package' },
  { label: 'My Offers', href: '/my-offers' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact Us', href: '/contact-us' },
] as const;

export const whatsappHref = (message: string = SITE_CONFIG.whatsappMessage): string =>
  `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;

export const telHref = (n: string = SITE_CONFIG.phone): string =>
  `tel:${n.replace(/[^\d+]/g, '')}`;

export const mailHref = (m: string = SITE_CONFIG.email): string => `mailto:${m}`;

export const mapHref = (): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    SITE_CONFIG.address.mapQuery,
  )}`;
