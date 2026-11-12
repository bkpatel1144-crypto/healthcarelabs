import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarCheck,
  CalendarClock,
  Database,
  FileText,
  FlaskConical,
  Inbox,
  Package,
  Quote,
  ScrollText,
  Tag,
  Users,
} from 'lucide-react';
import { AdminShell, useAdminSeo } from '@/components/admin/AdminShell';
import { useContent } from '@/store/content';
import { formatDate } from '@/lib/format';
import { storage } from '@/lib/storage';
import { watchAllBookings, watchAllRequests, watchPatients } from '@/lib/accountApi';
import { cn } from '@/lib/cn';
import {
  BOOKING_STATUS_LABEL,
  REQUEST_STATUS_LABEL,
  REQUEST_TYPE_LABEL,
  type Booking,
  type PatientProfile,
  type PatientRequest,
} from '@/types/account';

/** Local calendar date, so "today" matches the date patients picked. */
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function AdminDashboard() {
  useAdminSeo('Dashboard');
  const { packages, offers, posts, testimonials, storageAvailable } = useContent();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [requests, setRequests] = useState<PatientRequest[] | null>(null);
  const [patients, setPatients] = useState<PatientProfile[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const onErr = () => setError('Live data could not load. Check that this account is in the admins collection and the Firestore rules are published.');
    const stops = [watchAllBookings(setBookings, onErr), watchAllRequests(setRequests, onErr), watchPatients(setPatients, onErr)];
    return () => stops.forEach((s) => s());
  }, []);

  const today = todayIso();
  const live = useMemo(() => {
    const b = bookings ?? [];
    const r = requests ?? [];
    return [
      { label: 'Bookings to confirm', value: b.filter((x) => x.status === 'new').length, to: '/admin/bookings', Icon: CalendarClock, urgent: true },
      { label: 'Collections today', value: b.filter((x) => x.preferredDate === today && x.status !== 'cancelled').length, to: '/admin/bookings', Icon: CalendarCheck },
      { label: 'Samples in progress', value: b.filter((x) => ['confirmed', 'assigned', 'sample-collected', 'received', 'processing'].includes(x.status)).length, to: '/admin/bookings', Icon: FlaskConical },
      { label: 'Prescriptions to quote', value: r.filter((x) => x.type === 'prescription' && x.status !== 'resolved').length, to: '/admin/requests', Icon: ScrollText, urgent: true },
      { label: 'Open requests', value: r.filter((x) => x.status !== 'resolved').length, to: '/admin/requests', Icon: Inbox },
      { label: 'Registered patients', value: (patients ?? []).length, to: '/admin/patients', Icon: Users },
    ];
  }, [bookings, requests, patients, today]);

  const recent = useMemo(
    () =>
      [
        ...(bookings ?? []).map((b) => ({
          id: b.id,
          kind: 'Booking',
          name: b.patientName,
          detail: `${formatDate(b.preferredDate)} · ${b.preferredTime} · ${b.packageNames.join(' + ') || 'home collection'}`,
          status: BOOKING_STATUS_LABEL[b.status],
          createdAt: b.createdAt,
          to: '/admin/bookings',
        })),
        ...(requests ?? []).map((r) => ({
          id: r.id,
          kind: REQUEST_TYPE_LABEL[r.type].split(' ')[0],
          name: r.name,
          detail: r.topic || r.message.slice(0, 70) || (r.attachment ? 'Attachment' : ''),
          status: REQUEST_STATUS_LABEL[r.status],
          createdAt: r.createdAt,
          to: '/admin/requests',
        })),
      ]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 10),
    [bookings, requests],
  );

  const loading = bookings === null || requests === null || patients === null;

  const content = [
    { label: 'Packages', value: packages.length, to: '/admin/packages', Icon: Package },
    { label: 'Offers', value: offers.length, to: '/admin/offers', Icon: Tag },
    { label: 'Blog posts', value: posts.length, to: '/admin/blog', Icon: FileText },
    { label: 'Testimonials', value: testimonials.length, to: '/admin/testimonials', Icon: Quote },
  ];

  return (
    <AdminShell title="Dashboard" description="What needs attention today, live from Firebase.">
      {error && <p role="alert" className="mb-6 rounded-2xl bg-rose-50 p-4 text-[14px] text-rose-700">{error}</p>}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {live.map(({ label, value, to, Icon, urgent }) => (
          <li key={label}>
            <Link
              to={to}
              className="group flex items-center gap-4 rounded-3xl bg-white p-5 shadow-soft ring-1 ring-brand-50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card hover:ring-brand-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              <span
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset transition-colors group-hover:bg-brand-500 group-hover:text-white group-hover:ring-brand-500',
                  urgent && value > 0 ? 'bg-amber-50 text-amber-600 ring-amber-100' : 'bg-brand-50 text-brand-600 ring-brand-100',
                )}
              >
                <Icon className="h-[20px] w-[20px]" strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[26px] font-extrabold leading-none tracking-tightest text-ink tabular-nums">
                  {loading ? '–' : value}
                </span>
                <span className="mt-1.5 block truncate text-[13px] text-ink-muted">{label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10">
        <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Recent activity</h2>
        {!loading && recent.length === 0 ? (
          <div className="mt-4 flex items-start gap-4 rounded-3xl bg-white p-5 shadow-soft ring-1 ring-brand-50">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-soft text-ink-soft ring-1 ring-inset ring-brand-50">
              <Inbox className="h-[19px] w-[19px]" strokeWidth={2} aria-hidden="true" />
            </span>
            <p className="text-[14.5px] leading-relaxed text-ink-muted">
              Nothing yet. Bookings, prescriptions and messages from the website appear here as they arrive.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-brand-50 overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-brand-50">
            {recent.map((r) => (
              <li key={r.id}>
                <Link
                  to={r.to}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500"
                >
                  <span className="w-28 shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600">{r.kind}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold text-ink">{r.name}</span>
                    <span className="block truncate text-[13px] text-ink-muted">{r.detail}</span>
                  </span>
                  <span className="hidden shrink-0 rounded-full bg-mist px-2.5 py-1 text-[12px] font-semibold text-ink-muted md:block">{r.status}</span>
                  <span className="hidden shrink-0 text-[12.5px] text-ink-soft sm:block">{formatDate(r.createdAt)}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-soft" strokeWidth={2.2} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-brand-50">
        <h2 className="flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.02em] text-ink">
          <Database className="h-5 w-5 text-brand-500" strokeWidth={2} aria-hidden="true" />
          Website content (stored in this browser)
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {content.map(({ label, value, to, Icon }) => (
            <li key={label}>
              <Link to={to} className="flex items-center gap-3 rounded-2xl bg-mist px-4 py-3 text-[14px] text-ink hover:text-brand-700">
                <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
                <span className="font-bold tabular-nums">{value}</span> {label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13.5px] leading-relaxed text-ink-muted">
          {storageAvailable
            ? 'Catalogue edits are kept in this browser until they are moved to Firebase.'
            : 'Local storage is blocked in this browser, so catalogue edits are lost when the tab closes.'}{' '}
          Keys: <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-[12px]">healthcare_labs_*</code> —{' '}
          {storage.isAvailable() ? 'writable' : 'read-only fallback'}.
        </p>
        <Link to="/admin/settings" className="mt-4 inline-flex items-center gap-2 text-[14px] font-semibold text-brand-600 hover:text-brand-700">
          Export, import or reset content
          <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
        </Link>
      </section>
    </AdminShell>
  );
}
