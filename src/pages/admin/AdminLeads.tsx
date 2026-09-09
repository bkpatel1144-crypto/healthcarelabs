import { useMemo, useState } from 'react';
import { Mail, Phone, Trash2 } from 'lucide-react';
import {
  AdminEmpty,
  AdminShell,
  AdminToolbar,
  useAdminSeo,
  useConfirm,
} from '@/components/admin/AdminShell';
import { IconButton } from './AdminPackages';
import { Badge } from '@/components/common/Primitives';
import { Select } from '@/components/common/Select';
import { useContent } from '@/store/content';
import { formatDate } from '@/lib/format';
import { telHref } from '@/config/site';
import type { AppointmentLead, ContactLead } from '@/types';

const CONTACT_STATUSES: ContactLead['status'][] = ['new', 'contacted', 'closed'];
const APPOINTMENT_STATUSES: AppointmentLead['status'][] = [
  'new',
  'contacted',
  'scheduled',
  'closed',
];

/** Status values are stored lowercase; these are the labels shown in the UI. */
const TITLE_CASE: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  scheduled: 'Scheduled',
  closed: 'Closed',
};

const STATUS_TONE: Record<string, 'brand' | 'warn' | 'success' | 'neutral'> = {
  new: 'brand',
  contacted: 'warn',
  scheduled: 'success',
  closed: 'neutral',
};

/* ------------------------------------------------------------------ Leads */

export default function AdminLeads() {
  useAdminSeo('Leads');
  const { contacts, updateContact, deleteContact } = useContent();
  const { confirm, dialog } = useConfirm();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | ContactLead['status']>('all');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts
      .filter((c) => status === 'all' || c.status === status)
      .filter((c) => !q || `${c.name} ${c.phone} ${c.email} ${c.message}`.toLowerCase().includes(q));
  }, [contacts, query, status]);

  return (
    <AdminShell
      title="Contact messages"
      description="Messages submitted through the contact form. They are stored in this browser only — this site has no backend."
    >
      <AdminToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Search messages…"
        right={
          <StatusFilter
            options={CONTACT_STATUSES}
            value={status}
            onChange={(v) => setStatus(v as typeof status)}
          />
        }
      />

      {rows.length === 0 ? (
        <AdminEmpty message="No contact messages yet." />
      ) : (
        <ul className="space-y-4">
          {rows.map((c) => (
            <li key={c.id} className="rounded-3xl bg-white shadow-soft ring-1 ring-brand-50 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-[16px] font-bold text-ink">{c.name}</h2>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] text-ink-muted">
                    <a
                      href={telHref(c.phone)}
                      className="inline-flex items-center gap-1.5 hover:text-brand-600"
                    >
                      <Phone className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                      {c.phone}
                    </a>
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="inline-flex items-center gap-1.5 hover:text-brand-600"
                      >
                        <Mail className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                        {c.email}
                      </a>
                    )}
                    <span className="text-ink-soft">{formatDate(c.createdAt)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                  <StatusSelect
                    label={`Status for ${c.name}`}
                    options={CONTACT_STATUSES}
                    value={c.status}
                    onChange={(v) => updateContact(c.id, { status: v as ContactLead['status'] })}
                  />
                  <IconButton
                    label={`Delete message from ${c.name}`}
                    danger
                    onClick={() =>
                      confirm(`Delete the message from ${c.name}?`, () => deleteContact(c.id))
                    }
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2} />
                  </IconButton>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-line border-t border-ink-line pt-4 text-[14.5px] leading-relaxed text-ink-muted">
                {c.message}
              </p>
            </li>
          ))}
        </ul>
      )}

      {dialog}
    </AdminShell>
  );
}

/* ----------------------------------------------------------- Appointments */

export function AdminAppointments() {
  useAdminSeo('Appointments');
  const { appointments, updateAppointment, deleteAppointment, packages } = useContent();
  const { confirm, dialog } = useConfirm();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | AppointmentLead['status']>('all');

  const packageName = (slug: string) =>
    packages.find((p) => p.slug === slug)?.name ?? (slug ? slug : 'Not decided');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments
      .filter((a) => status === 'all' || a.status === status)
      .filter(
        (a) => !q || `${a.name} ${a.phone} ${a.email} ${a.address}`.toLowerCase().includes(q),
      );
  }, [appointments, query, status]);

  return (
    <AdminShell
      title="Appointments"
      description="Home collection requests submitted through the site. Confirm each one by phone — nothing here notifies the lab automatically."
    >
      <AdminToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Search appointments…"
        right={
          <StatusFilter
            options={APPOINTMENT_STATUSES}
            value={status}
            onChange={(v) => setStatus(v as typeof status)}
          />
        }
      />

      {rows.length === 0 ? (
        <AdminEmpty message="No home collection requests yet." />
      ) : (
        <ul className="space-y-4">
          {rows.map((a) => (
            <li key={a.id} className="rounded-3xl bg-white shadow-soft ring-1 ring-brand-50 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-[16px] font-bold text-ink">{a.name}</h2>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] text-ink-muted">
                    <a
                      href={telHref(a.phone)}
                      className="inline-flex items-center gap-1.5 hover:text-brand-600"
                    >
                      <Phone className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                      {a.phone}
                    </a>
                    {a.email && (
                      <a
                        href={`mailto:${a.email}`}
                        className="inline-flex items-center gap-1.5 hover:text-brand-600"
                      >
                        <Mail className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                        {a.email}
                      </a>
                    )}
                    <span className="text-ink-soft">Requested {formatDate(a.createdAt)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge>
                  <StatusSelect
                    label={`Status for ${a.name}`}
                    options={APPOINTMENT_STATUSES}
                    value={a.status}
                    onChange={(v) =>
                      updateAppointment(a.id, { status: v as AppointmentLead['status'] })
                    }
                  />
                  <IconButton
                    label={`Delete request from ${a.name}`}
                    danger
                    onClick={() =>
                      confirm(`Delete the request from ${a.name}?`, () => deleteAppointment(a.id))
                    }
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2} />
                  </IconButton>
                </div>
              </div>

              <dl className="mt-4 grid gap-x-8 gap-y-3 border-t border-ink-line pt-4 text-[14px] sm:grid-cols-2">
                <Row label="Preferred slot" value={`${a.preferredDate} · ${a.preferredTime}`} />
                <Row label="Package" value={packageName(a.packageSlug)} />
                <Row label="Address" value={a.address} className="sm:col-span-2" />
                {a.notes && <Row label="Notes" value={a.notes} className="sm:col-span-2" />}
              </dl>
            </li>
          ))}
        </ul>
      )}

      {dialog}
    </AdminShell>
  );
}

/* ------------------------------------------------------------------ shared */

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[12px] font-bold uppercase tracking-[0.1em] text-ink-soft">{label}</dt>
      <dd className="mt-1 leading-relaxed text-ink-muted">{value}</dd>
    </div>
  );
}

function StatusFilter({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <>
      <label htmlFor="status-filter" className="text-[13px] font-semibold text-ink-muted">
        Status
      </label>
      <Select
        id="status-filter"
        value={value}
        onChange={onChange}
        options={[
          { value: 'all', label: 'All' },
          ...options.map((s) => ({ value: s, label: TITLE_CASE[s] ?? s })),
        ]}
        size="md"
        ariaLabel="Filter by status"
        className="w-36"
      />
    </>
  );
}

function StatusSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <>
      <label className="sr-only" htmlFor={`status-${label}`}>
        {label}
      </label>
      <Select
        id={`status-${label}`}
        value={value}
        onChange={onChange}
        options={options.map((s) => ({ value: s, label: TITLE_CASE[s] ?? s }))}
        size="sm"
        ariaLabel={label}
        className="w-32"
      />
    </>
  );
}
