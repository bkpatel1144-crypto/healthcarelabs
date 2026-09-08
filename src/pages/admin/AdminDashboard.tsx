import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarClock,
  Database,
  FileText,
  MessageSquare,
  Package,
  Quote,
  Tag,
} from 'lucide-react';
import { AdminShell, useAdminSeo } from '@/components/admin/AdminShell';
import { useContent } from '@/store/content';
import { formatDate } from '@/lib/format';
import { storage } from '@/lib/storage';

export default function AdminDashboard() {
  useAdminSeo('Dashboard');
  const { packages, offers, posts, testimonials, appointments, contacts, storageAvailable } =
    useContent();

  const tiles = [
    { label: 'Packages', value: packages.length, to: '/admin/packages', Icon: Package },
    { label: 'Offers', value: offers.length, to: '/admin/offers', Icon: Tag },
    { label: 'Blog posts', value: posts.length, to: '/admin/blog', Icon: FileText },
    { label: 'Testimonials', value: testimonials.length, to: '/admin/testimonials', Icon: Quote },
    { label: 'Contact messages', value: contacts.length, to: '/admin/leads', Icon: MessageSquare },
    {
      label: 'Appointments',
      value: appointments.length,
      to: '/admin/appointments',
      Icon: CalendarClock,
    },
  ];

  const recent = [
    ...appointments.map((a) => ({
      id: a.id,
      kind: 'Appointment' as const,
      name: a.name,
      detail: `${a.preferredDate} · ${a.preferredTime}`,
      createdAt: a.createdAt,
      status: a.status,
      to: '/admin/appointments',
    })),
    ...contacts.map((c) => ({
      id: c.id,
      kind: 'Message' as const,
      name: c.name,
      detail: c.message.slice(0, 70) + (c.message.length > 70 ? '…' : ''),
      createdAt: c.createdAt,
      status: c.status,
      to: '/admin/leads',
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return (
    <AdminShell
      title="Dashboard"
      description="An overview of the content and the enquiries held in this browser."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(({ label, value, to, Icon }) => (
          <li key={label}>
            <Link
              to={to}
              className="group flex items-start justify-between gap-4 rounded-xl border border-ink-line bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              <div>
                <span className="block text-[32px] font-extrabold leading-none tracking-tightest text-ink tabular-nums">
                  {value}
                </span>
                <span className="mt-2.5 block text-[13.5px] text-ink-muted">{label}</span>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-mist text-ink-soft transition-colors group-hover:bg-brand-500 group-hover:text-white">
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10">
        <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Recent activity</h2>
        {recent.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-ink-line bg-white px-6 py-14 text-center">
            <p className="text-[15px] text-ink-muted">
              No enquiries yet. Submit the home collection or contact form on the public site and it
              will appear here.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-ink-line overflow-hidden rounded-xl border border-ink-line bg-white">
            {recent.map((r) => (
              <li key={r.id}>
                <Link
                  to={r.to}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500"
                >
                  <span className="w-24 shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600">
                    {r.kind}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold text-ink">
                      {r.name}
                    </span>
                    <span className="block truncate text-[13px] text-ink-muted">{r.detail}</span>
                  </span>
                  <span className="hidden shrink-0 text-[12.5px] text-ink-soft sm:block">
                    {formatDate(r.createdAt)}
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-ink-soft"
                    strokeWidth={2.2}
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 rounded-xl border border-ink-line bg-white p-6">
        <h2 className="flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.02em] text-ink">
          <Database className="h-5 w-5 text-brand-500" strokeWidth={2} aria-hidden="true" />
          Storage
        </h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">
          {storageAvailable
            ? 'Local storage is available in this browser. Content and enquiries persist between visits on this device only.'
            : 'Local storage is blocked in this browser. The app is running from memory, so anything you change will be lost when the tab closes.'}
        </p>
        <p className="mt-2 text-[13px] text-ink-soft">
          Keys in use:{' '}
          <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-[12px]">
            healthcare_labs_*
          </code>{' '}
          — {storage.isAvailable() ? 'writable' : 'read-only fallback'}.
        </p>
        <Link
          to="/admin/settings"
          className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-brand-600 transition-colors hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
        >
          Export, import or reset data
          <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
        </Link>
      </section>
    </AdminShell>
  );
}
