import { Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
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
import { AuthProvider, useAuth } from '@/store/auth';
import { FullPageSpinner, RequireAuth } from '@/components/account/AccountShell';
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

const Login = lazy(() => import('@/pages/Login'));
const UploadPrescription = lazy(() => import('@/pages/UploadPrescription'));
const LabLocations = lazy(() => import('@/pages/LabLocations'));
const Help = lazy(() => import('@/pages/Help'));
const Partner = lazy(() => import('@/pages/Partner'));
const AccountRequests = lazy(() => import('@/pages/account/AccountRequests'));
const AdminRequests = lazy(() => import('@/pages/admin/AdminRequests'));
const AdminStaff = lazy(() => import('@/pages/admin/AdminOperations').then((m) => ({ default: m.AdminStaff })));
const AdminScheduling = lazy(() => import('@/pages/admin/AdminOperations').then((m) => ({ default: m.AdminScheduling })));
const AdminAudit = lazy(() => import('@/pages/admin/AdminOperations').then((m) => ({ default: m.AdminAudit })));
const BookingReceipt = lazy(() => import('@/pages/account/BookingReceipt'));
const StaffPanel = lazy(() => import('@/pages/staff/StaffPanel'));
const Welcome = lazy(() => import('@/pages/account/Welcome'));
const AccountProfile = lazy(() => import('@/pages/account/AccountProfile'));
const AccountBookings = lazy(() => import('@/pages/account/AccountBookings'));
const AccountReports = lazy(() => import('@/pages/account/AccountReports'));
const AccountFamily = lazy(() => import('@/pages/account/AccountPeople'));
const AccountAddresses = lazy(() =>
  import('@/pages/account/AccountPeople').then((m) => ({ default: m.AccountAddresses })),
);
const AdminBookings = lazy(() => import('@/pages/admin/AdminBookings'));
const AdminPatients = lazy(() => import('@/pages/admin/AdminPatients'));
const AdminReports = lazy(() => import('@/pages/admin/AdminReports'));

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminPackages = lazy(() => import('@/pages/admin/AdminPackages'));
const AdminOffers = lazy(() => import('@/pages/admin/AdminOffers'));
const AdminBlog = lazy(() => import('@/pages/admin/AdminBlog'));
const AdminTestimonials = lazy(() => import('@/pages/admin/AdminTestimonials'));
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

/** Patient panel: the site header, no marketing chrome, login required. */
function AccountLayout() {
  return (
    <div className="min-h-screen bg-mist">
      <Header />
      <RequireAuth>
        <Suspense fallback={<FullPageSpinner />}>
          <Outlet />
        </Suspense>
      </RequireAuth>
      <AccessibilityWidget />
    </div>
  );
}

/**
 * Lab staff only. Signed-out visitors go to /login; signed-in patients see a
 * refusal showing their user ID, which is what the first admin copies into the
 * Firestore `admins` collection. firestore.rules enforce the same check on the
 * server, so this gate shapes the experience — it is not the security.
 */
function RequireAdmin({ children }: { children: ReactNode }) {
  const { status, isAdmin, user, signOut } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'signed-out') {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-5 pb-20 pt-[140px] text-center">
        <h1 className="text-[24px] font-extrabold text-ink">Lab staff only</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
          This account is not an admin. To make it one, open Firebase console → Firestore (database{' '}
          <strong>healthcarelabs</strong>) → collection <code>admins</code> → add a document whose
          ID is:
        </p>
        <p className="mt-4 select-all break-all rounded-xl bg-white p-3 font-mono text-[14px] text-ink ring-1 ring-ink-line">
          {user?.uid}
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-6 text-[14px] font-semibold text-brand-600 hover:underline"
        >
          Log out and use another account
        </button>
      </div>
    );
  }
  return <>{children}</>;
}

/** Admin shares the header for navigation but drops the marketing chrome. */
function AdminLayout() {
  return (
    <div className="min-h-screen bg-mist">
      <Header />
      <RequireAdmin>
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </RequireAdmin>
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
        <Route path="login" element={<Login />} />
        <Route path="upload-prescription" element={<UploadPrescription />} />
        <Route path="lab-locations" element={<LabLocations />} />
        <Route path="help" element={<Help />} />
        <Route path="partner-with-us" element={<Partner />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/account" element={<AccountLayout />}>
        <Route index element={<AccountProfile />} />
        <Route path="bookings" element={<AccountBookings />} />
        <Route path="reports" element={<AccountReports />} />
        <Route path="family" element={<AccountFamily />} />
        <Route path="addresses" element={<AccountAddresses />} />
        <Route path="requests" element={<AccountRequests />} />
        <Route path="bookings/:id/receipt" element={<BookingReceipt />} />
        <Route path="welcome" element={<Welcome />} />
      </Route>

      <Route path="/staff" element={<AccountLayout />}>
        <Route index element={<StaffPanel />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="packages" element={<AdminPackages />} />
        <Route path="offers" element={<AdminOffers />} />
        <Route path="blog" element={<AdminBlog />} />
        <Route path="testimonials" element={<AdminTestimonials />} />
        <Route path="leads" element={<Navigate to="/admin/requests" replace />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="patients" element={<AdminPatients />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="requests" element={<AdminRequests />} />
        <Route path="staff" element={<AdminStaff />} />
        <Route path="scheduling" element={<AdminScheduling />} />
        <Route path="audit" element={<AdminAudit />} />
        <Route path="appointments" element={<Navigate to="/admin/bookings" replace />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ContentProvider>
          <ScrollManager />
          <RouteAnnouncer />
          <AppRoutes />
        </ContentProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
