import { DiagnosticHero } from '@/components/hero/DiagnosticHero';
import { TrustStrip } from '@/components/home/TrustStrip';
import { QuickActions } from '@/components/home/QuickActions';
import { WhyHealthcareLabs } from '@/components/home/WhyHealthcareLabs';
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
      <DiagnosticHero />
      <TrustStrip />
      <QuickActions />
      <WhyHealthcareLabs />
      <HealthConcerns />
      <FeaturedPackages />
      <DiagnosticJourney />
      <LabFacility />
      <HomeCollectionSection />
      <Voices />
      <BlogTeaser />
      <FinalCTA />
    </>
  );
}
