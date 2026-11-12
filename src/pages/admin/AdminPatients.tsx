import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRight, Upload } from 'lucide-react';
import { AdminEmpty, AdminModal, AdminShell, AdminToolbar, useAdminSeo, useConfirm } from '@/components/admin/AdminShell';
import { deleteReport, watchMembers, watchMyBookings, watchPatients, watchReports } from '@/lib/accountApi';
import { ageFrom, useAuth } from '@/store/auth';
import { formatDate } from '@/lib/format';
import { ReportList, UploadReportForm } from '@/pages/admin/AdminReports';
import { formatBytes } from '@/pages/account/AccountReports';
import { BOOKING_STATUS_LABEL, type Booking, type FamilyMember, type LabReport, type PatientProfile } from '@/types/account';

export default function AdminPatients() {
  useAdminSeo('Patients');
  const [rows, setRows] = useState<PatientProfile[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [params, setParams] = useSearchParams();
  const openUid = params.get('uid');

  useEffect(
    () =>
      watchPatients(setRows, (err) => {
        console.error(err);
        setError('Could not load patients. Is this account in the admins collection?');
      }),
    [],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? []).filter((p) => !q || [p.name, p.phone, p.email].join(' ').toLowerCase().includes(q));
  }, [rows, query]);

  const open = rows?.find((p) => p.uid === openUid) ?? null;

  return (
    <AdminShell
      title="Patients"
      description="Everyone who has logged in to the website. Open a patient to see their family members, bookings and reports."
    >
      <AdminToolbar query={query} onQuery={setQuery} placeholder="Search name, phone, email…" />
      {error ? (
        <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-[14px] text-rose-700">{error}</p>
      ) : rows === null ? (
        <p className="text-ink-muted">Loading…</p>
      ) : visible.length === 0 ? (
        <AdminEmpty message="No patients yet." />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-line">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-mist text-[12px] uppercase tracking-[0.08em] text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Mobile</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">Email</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-line">
              {visible.map((p) => (
                <tr key={p.uid} className="cursor-pointer hover:bg-mist/60" onClick={() => setParams({ uid: p.uid })}>
                  <td className="px-4 py-3 font-semibold text-ink">{p.name || <span className="text-ink-soft">(no name)</span>}</td>
                  <td className="px-4 py-3 tabular-nums text-ink-muted">{p.phone ? `+91 ${p.phone}` : '—'}</td>
                  <td className="hidden px-4 py-3 text-ink-muted md:table-cell">{p.email || '—'}</td>
                  <td className="hidden px-4 py-3 text-ink-muted sm:table-cell">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      aria-label={`Open ${p.name || 'patient'}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:text-brand-600"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal open={open !== null} onClose={() => setParams({})} title={open?.name || 'Patient'}>
        {open && <PatientDetail patient={open} />}
      </AdminModal>
    </AdminShell>
  );
}

function PatientDetail({ patient: p }: { patient: PatientProfile }) {
  const { actor } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reports, setReports] = useState<LabReport[]>([]);
  const [uploading, setUploading] = useState(false);
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    const stops = [
      watchMembers(p.uid, setMembers),
      watchMyBookings(p.uid, setBookings),
      watchReports({ uid: p.uid }, setReports),
    ];
    return () => stops.forEach((s) => s());
  }, [p.uid]);

  const age = ageFrom(p.dob);

  return (
    <div className="space-y-7">
      <dl className="grid gap-4 text-[14px] sm:grid-cols-2">
        <Field label="Mobile" value={p.phone ? `+91 ${p.phone}` : ''} />
        <Field label="Email" value={p.email} />
        <Field label="Gender / Age" value={[p.gender, age !== null ? `${age} yrs` : ''].filter(Boolean).join(' · ')} />
        <Field label="Joined" value={formatDate(p.createdAt)} />
      </dl>

      <Section title={`Family members (${members.length})`}>
        {members.length === 0 ? (
          <p className="text-[14px] text-ink-soft">None added.</p>
        ) : (
          <ul className="text-[14px] text-ink">
            {members.map((m) => (
              <li key={m.id}>
                {m.name} <span className="text-ink-soft">— {m.relation}{ageFrom(m.dob) !== null ? `, ${ageFrom(m.dob)} yrs` : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Bookings (${bookings.length})`}>
        {bookings.length === 0 ? (
          <p className="text-[14px] text-ink-soft">No bookings.</p>
        ) : (
          <ul className="space-y-1.5 text-[14px]">
            {bookings.map((b) => (
              <li key={b.id} className="flex flex-wrap justify-between gap-2">
                <span className="text-ink">
                  {formatDate(b.preferredDate)} · {b.patientName} · {b.packageNames.join(' + ') || 'home collection'}
                </span>
                <span className="font-semibold text-brand-700">{BOOKING_STATUS_LABEL[b.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title={`Reports (${reports.length})`}
        action={
          !uploading && (
            <button type="button" onClick={() => setUploading(true)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:underline">
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              Upload
            </button>
          )
        }
      >
        {uploading ? (
          <UploadReportForm patients={[p]} fixedUid={p.uid} onDone={() => setUploading(false)} />
        ) : reports.length === 0 ? (
          <p className="text-[14px] text-ink-soft">No reports uploaded.</p>
        ) : (
          <ReportList
            rows={reports}
            subtitle={(r) => `${r.patientName} · ${formatDate(r.uploadedAt)} · ${formatBytes(r.sizeBytes)}`}
            onDelete={(r) => actor && confirm(`Withdraw “${r.title}”?`, () => void deleteReport(r, actor))}
          />
        )}
      </Section>
      {dialog}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-soft">{label}</dt>
      <dd className="mt-1 text-ink">{value || '—'}</dd>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between border-b border-ink-line pb-2">
        <h3 className="text-[15px] font-bold text-ink">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
