export type ConcernId =
  | 'diabetes'
  | 'heart'
  | 'thyroid'
  | 'liver'
  | 'kidney'
  | 'vitamin'
  | 'womens-health'
  | 'mens-health'
  | 'general-wellness'
  | 'cancer'
  | 'bone-joint'
  | 'child-health';

export interface HealthPackage {
  id: string;
  slug: string;
  name: string;
  summary: string;
  /** Long-form overview shown on the detail page. */
  overview: string;
  tests: string[];
  /** null when the lab quotes on request (e.g. modular allergy panels). */
  price: number | null;
  offerPrice: number | null;
  /** Free-form note used when a package is priced per selected panel. */
  priceNote?: string;
  concerns: ConcernId[];
  suitableFor: string[];
  preparation: string[];
  homeCollection: boolean;
  reportTime: string;
  featured: boolean;
  archived?: boolean;
  updatedAt?: string;
}

export interface Offer {
  id: string;
  slug: string;
  title: string;
  description: string;
  packageSlug?: string;
  originalPrice: number | null;
  offerPrice: number | null;
  /** ISO date. Empty string = no expiry, so no countdown is shown. */
  validUntil: string;
  terms: string[];
  highlight?: string;
  archived?: boolean;
  updatedAt?: string;
}

export type BlogCategory =
  | 'Preventive Health'
  | 'Nutrition'
  | "Women's Health"
  | "Men's Health"
  | 'Diabetes'
  | 'Heart Health'
  | 'Wellness'
  | 'Lab Tests';

export interface BlogSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  author: string;
  publishedAt: string;
  readingMinutes: number;
  featured: boolean;
  sections: BlogSection[];
  archived?: boolean;
  updatedAt?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  quote: string;
  packageName?: string;
  archived?: boolean;
  updatedAt?: string;
}

export interface HealthConcern {
  id: ConcernId;
  label: string;
  description: string;
  /** lucide-react icon name resolved through the icon registry. */
  icon: string;
  signals: string[];
}

export interface AppointmentLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  preferredDate: string;
  preferredTime: string;
  address: string;
  packageSlug: string;
  notes?: string;
  status: 'new' | 'contacted' | 'scheduled' | 'closed';
  createdAt: string;
}

export interface ContactLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: 'new' | 'contacted' | 'closed';
  createdAt: string;
}

export interface Preferences {
  lastConcern: ConcernId | null;
  reducedEffects: boolean;
  savedPackages: string[];
}

/** A processed photograph emitted by scripts/optimise-images.mjs. */
export interface SitePhoto {
  id: string;
  /** Intrinsic size, used to reserve exact layout space. */
  width: number;
  height: number;
  /** Largest JPEG, used as the `src` fallback. */
  src: string;
  avif: string;
  webp: string;
  jpeg: string;
  alt: string;
  caption: string;
  /** Short department or category label, shown as an overlay chip. */
  tag?: string;
}
