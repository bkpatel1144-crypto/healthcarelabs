import { DiagnosticHero } from '@/components/hero/DiagnosticHero';
import { LabRibbon } from '@/components/home/LabRibbon';
import { WhyHealthcareLabs } from '@/components/home/WhyHealthcareLabs';
import { AccreditationSection } from '@/components/common/AccreditationSection';
import { HealthConcerns } from '@/components/home/HealthConcerns';
import { FeaturedPackages } from '@/components/home/FeaturedPackages';
import { DiagnosticJourney } from '@/components/home/DiagnosticJourney';
import { LabFacility } from '@/components/home/LabFacility';
import { HomeCollectionSection } from '@/components/home/HomeCollection';
import { Voices } from '@/components/home/Voices';
import { BlogTeaser } from '@/components/home/BlogTeaser';
import { FinalCTA } from '@/components/home/FinalCTA';
import { useSeo } from '@/lib/seo';
import { SITE_CONFIG } from '@/config/site';

export default function Home() {
  useSeo({
    title: `${SITE_CONFIG.brandName} — Advanced Diagnostics & Health Packages in Surat`,
    description: SITE_CONFIG.description,
    path: '/',
    jsonLd: {
      '@type': 'WebSite',
      '@id': `${SITE_CONFIG.url}/#website`,
      url: SITE_CONFIG.url,
      name: SITE_CONFIG.brandName,
      publisher: { '@id': `${SITE_CONFIG.url}/#organization` },
    },
  });

  return (
    <>
      {/*
        The homepage follows the order a visitor actually decides in, and each
        section is here because it answers the next question — not because the
        page needed another band.

        Measured before this pass, it carried 24 prices, 13 package cards and 6
        links to the same listing, because packages appeared in three separate
        sections. Two more bands, "What Healthcare Labs provides" and "Quick
        actions", restated claims and CTAs that the hero, the header and the
        floating buttons already carried. Both are gone; pricing now appears in
        exactly one place.

          1  Hero          — who this is, what it does, one thing to do next.
          2  Ribbon        — the breadth of the catalogue at a glance.
          3  Concerns      — "which of these is me?" Identification, no prices.
          4  Packages      — the offer. The only section that carries pricing.
          5  Why           — why this lab rather than another.
          6  Accreditation — the credential behind the claim.
          7  Journey       — what happens to my sample. Answers the anxiety.
          8  Facility      — the named instruments. Evidence, not adjectives.
          9  Voices        — people who already did this.
         10  Home visit    — removes the last obstacle, and takes the booking.
         11  Reading       — for the visitor who is not ready to book today.
         12  Close         — the ask, once, at the end.
      */}
      <DiagnosticHero />
      <LabRibbon />
      <HealthConcerns />
      <FeaturedPackages />
      <WhyHealthcareLabs />
      <AccreditationSection />
      <DiagnosticJourney />
      <LabFacility />
      <Voices />
      <HomeCollectionSection />
      <BlogTeaser />
      <FinalCTA />
    </>
  );
}
