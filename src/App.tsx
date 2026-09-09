import { Suspense, lazy } from 'react';
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  FloatingActions,
  RouteAnnouncer,
  ScrollManager,
} from '@/components/layout/SiteChrome';
import { AccessibilityWidget } from '@/components/a11y/AccessibilityWidget';
import { CompareDock } from '@/components/packages/ComparePackages';
import { LabReelAd } from '@/components/common/LabReelAd';
import { ContentProvider } from '@/store/content';
import Home from '@/pages/Home';

/* Route-level code splitting: the homepage ships in the entry chunk, everything
   else loads on demand. Admin is a separate chunk entirely — visitors who never
   open it never download it. */
const About = lazy(() => import('@/pages/About'));
const Packages = lazy(() => import('@/pages/Packages'));
const PackageDetail = lazy(() => import('@/pages/PackageDetail'));
const Offers = lazy(() => import('@/pages/Offers'));
const Blog = lazy(() => import('@/pages/Blog'));
const BlogPostPage = lazy(() => import('@/pages/BlogPost'));
const Contact = lazy(() => import('@/pages/Contact'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const PrivacyPolicy = lazy(() =>
  import('@/pages/Legal').then((m) => ({ default: m.PrivacyPolicy })),
);
const TermsOfUse = lazy(() => import('@/pages/Legal').then((m) => ({ default: m.TermsOfUse })));

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminPackages = lazy(() => import('@/pages/admin/AdminPackages'));
const AdminOffers = lazy(() => import('@/pages/admin/AdminOffers'));
const AdminBlog = lazy(() => import('@/pages/admin/AdminBlog'));
const AdminTestimonials = lazy(() => import('@/pages/admin/AdminTestimonials'));
const AdminLeads = lazy(() => import('@/pages/admin/AdminLeads'));
const AdminAppointments = lazy(() =>
  import('@/pages/admin/AdminLeads').then((m) => ({ default: m.AdminAppointments })),
);
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));

/** Keeps the viewport from flashing white while a route chunk loads. */
function RouteFallback() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-navy-900" role="status">
      <span className="sr-only">Loading</span>
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-brand-400"
      />
    </div>
  );
}

/** Public site: header, footer and the floating contact affordances. */
function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main id="main" className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CompareDock />
      <LabReelAd />
      <FloatingActions />
      <AccessibilityWidget />
    </div>
  );
}

/** Admin shares the header for navigation but drops the marketing chrome. */
function AdminLayout() {
  return (
    <div className="min-h-screen bg-mist">
      <Header />
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
      <AccessibilityWidget />
    </div>
  );
}

function AppRoutes() {
  // `key` on the outlet container is unnecessary here — each page manages its
  // own head via useSeo, and ScrollManager handles position.
  useLocation();

  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="about-us" element={<About />} />
        <Route path="health-package" element={<Packages />} />
        <Route path="health-package/:slug" element={<PackageDetail />} />
        <Route path="my-offers" element={<Offers />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<BlogPostPage />} />
        <Route path="contact-us" element={<Contact />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route path="terms" element={<TermsOfUse />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="packages" element={<AdminPackages />} />
        <Route path="offers" element={<AdminOffers />} />
        <Route path="blog" element={<AdminBlog />} />
        <Route path="testimonials" element={<AdminTestimonials />} />
        <Route path="leads" element={<AdminLeads />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ContentProvider>
        <ScrollManager />
        <RouteAnnouncer />
        <AppRoutes />
      </ContentProvider>
    </BrowserRouter>
  );
}
