import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Download, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { AdminEmpty, AdminModal, AdminShell, AdminToolbar, useAdminSeo, useConfirm } from '@/components/admin/AdminShell';
import { SelectField, TextField } from '@/components/common/Form';
import {
  MAX_REPORT_BYTES,
  deleteReport,
  downloadReport,
  uploadReport,
  watchMyBookings,
  watchPatients,
  watchReports,
} from '@/lib/accountApi';
import { useAuth } from '@/store/auth';
import { formatDate } from '@/lib/format';
import { formatBytes } from '@/pages/account/AccountReports';
import type { Booking, LabReport, PatientProfile } from '@/types/account';
import { PATHOLOGISTS } from '@/data/team';

export default function AdminReports() {
  useAdminSeo('Reports');
  const { actor } = useAuth();
  const [rows, setRows] = useState<LabReport[] | null>(null);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    const onErr = () => setError('Could not load reports. Is this account in the admins collection?');
    const a = watchReports('all', setRows, onErr);
    const b = watchPatients(setPatients, onErr);
    return () => {
      a();
      b();
    };
  }, []);

  const byUid = useMemo(() => new Map(patients.map((p) => [p.uid, p])), [patients]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      if (!q) return true;
      const p = byUid.get(r.uid);
      return [r.title, r.patientName, r.fileName, p?.name, p?.phone, p?.email].join(' ').toLowerCase().includes(q);
    });
  }, [rows, query, byUid]);

  return (
    <AdminShell
      title="Reports"
      description="Upload signed PDF reports to a patient's account. The patient can download them from My reports straight away."
      actions={
        <button
          type="button"
          onClick={() => setUploading(true)}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-[14px] font-semibold text-white hover:bg-brand-600"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          Upload report
        </button>
      }
    >
      <AdminToolbar query={query} onQuery={setQuery} placeholder="Search patient, phone, report…" />
      {error ? (
        <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-[14px] text-rose-700">{error}</p>
      ) : rows === null ? (
        <p className="text-ink-muted">Loading…</p>
      ) : visible.length === 0 ? (
        <AdminEmpty message="No reports uploaded yet." />
      ) : (
        <ReportList
          rows={visible}
          subtitle={(r) => {
            const p = byUid.get(r.uid);
            return `${r.patientName}${p?.phone ? ` · +91 ${p.phone}` : ''} · ${formatDate(r.uploadedAt)} · ${formatBytes(r.sizeBytes)}`;
          }}
          onDelete={(r) => actor && confirm(`Withdraw “${r.title}” for ${r.patientName}? The patient will no longer see it. To correct a report, upload a revised version instead.`, () => void deleteReport(r, actor))}
        />
      )}

      <AdminModal open={uploading} onClose={() => setUploading(false)} title="Upload a report">
        <UploadReportForm patients={patients} onDone={() => setUploading(false)} />
      </AdminModal>
      {dialog}
    </AdminShell>
  );
}

export function ReportList({
  rows,
  subtitle,
  onDelete,
}: {
  rows: LabReport[];
  subtitle: (r: LabReport) => string;
  onDelete: (r: LabReport) => void;
}) {
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-ink-line">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">
              {r.title}
              {r.version > 1 && <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">v{r.version} revised</span>}
              {r.superseded && <span className="ml-2 rounded bg-mist px-1.5 py-0.5 text-[11px] font-bold text-ink-soft">superseded</span>}
            </p>
            <p className="truncate text-[13px] text-ink-muted">{subtitle(r)}{r.signedBy ? ` · signed by ${r.signedBy}` : ''}</p>
          </div>
          <button
            type="button"
            onClick={() => void downloadReport(r)}
            aria-label={`Download ${r.title}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-mist hover:text-brand-600"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(r)}
            aria-label={`Delete ${r.title}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Pick patient → optional booking → PDF. `fixedUid` skips the patient picker. */
export function UploadReportForm({
  patients,
  fixedUid,
  onDone,
}: {
  patients: PatientProfile[];
  fixedUid?: string;
  onDone: () => void;
}) {
  const { actor } = useAuth();
  const [uid, setUid] = useState(fixedUid ?? '');
  const [signedBy, setSignedBy] = useState('');
  const [existing, setExisting] = useState<LabReport[]>([]);
  const [supersedesId, setSupersedesId] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingId, setBookingId] = useState('');
  const [title, setTitle] = useState('');
  const [patientName, setPatientName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const patient = patients.find((p) => p.uid === uid);

  useEffect(() => {
    setBookings([]);
    setBookingId('');
    setPatientName(patient?.name ?? '');
    setExisting([]);
    setSupersedesId('');
    if (!uid) return;
    const stops = [watchMyBookings(uid, setBookings), watchReports({ uid }, (r) => setExisting(r.filter((x) => !x.superseded)))];
    return () => stops.forEach((s) => s());
  }, [uid, patient?.name]);

  const chooseBooking = (id: string) => {
    setBookingId(id);
    const b = bookings.find((x) => x.id === id);
    if (b) {
      setPatientName(b.patientName);
      if (!title) setTitle(b.packageNames.join(' + ') || 'Lab report');
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!uid) return setError('Choose the patient account.');
    if (!title.trim()) return setError('Give the report a title, e.g. “Thyroid profile”.');
    if (!patientName.trim()) return setError('Enter the name printed on the report.');
    if (!signedBy) return setError('Choose the authorised signatory who reviewed and released this report.');
    if (!file) return setError('Choose the PDF file.');
    if (!actor) return;
    setBusy(true);
    try {
      const prior = existing.find((r) => r.id === supersedesId) ?? null;
      await uploadReport(file, { uid, bookingId, patientName: patientName.trim(), title: title.trim(), signedBy, supersedes: prior }, actor);
      onDone();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Upload failed.');
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {!fixedUid && (
        <SelectField
          label="Patient account"
          required
          value={uid}
          onValueChange={setUid}
          placeholder="Choose a patient"
          options={patients.map((p) => ({
            value: p.uid,
            label: p.name || '(no name yet)',
            meta: p.phone ? `+91 ${p.phone}` : p.email,
          }))}
        />
      )}
      {uid && bookings.length > 0 && (
        <SelectField
          label="For booking"
          value={bookingId}
          onValueChange={chooseBooking}
          placeholder="Not linked to a booking"
          options={[
            { value: '', label: 'Not linked to a booking' },
            ...bookings.map((b) => ({
              value: b.id,
              label: `${b.patientName} — ${b.packageNames.join(' + ') || 'home collection'}`,
              meta: formatDate(b.preferredDate),
            })),
          ]}
        />
      )}
      {existing.length > 0 && (
        <SelectField
          label="Replaces an earlier report"
          value={supersedesId}
          onValueChange={(id) => {
            setSupersedesId(id);
            const r = existing.find((x) => x.id === id);
            if (r) {
              setTitle(r.title);
              setPatientName(r.patientName);
              if (r.bookingId) setBookingId(r.bookingId);
            }
          }}
          placeholder="No — this is a new report"
          hint="Choose one to issue a corrected version. The earlier one is kept but marked superseded."
          options={[{ value: '', label: 'No — this is a new report' }, ...existing.map((r) => ({ value: r.id, label: r.title, meta: `v${r.version}` }))]}
        />
      )}
      <SelectField
        label="Authorised signatory"
        required
        value={signedBy}
        onValueChange={setSignedBy}
        placeholder="Who reviewed and released it"
        options={PATHOLOGISTS.map((p) => ({ value: p.name, label: p.name, meta: p.role }))}
      />
      <TextField label="Report title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Complete blood count" />
      <TextField label="Name on report" required value={patientName} onChange={(e) => setPatientName(e.target.value)} hint="The account holder or the family member tested." />
      <div>
        <label htmlFor="report-file" className="mb-2 block text-[13px] font-semibold text-ink">
          PDF file <span className="text-rose-500">*</span>
        </label>
        <input
          id="report-file"
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setError(f && f.size > MAX_REPORT_BYTES ? 'That PDF is larger than 5 MB. Compress it and try again.' : '');
            setFile(f);
          }}
          className="block w-full text-[14px] text-ink-muted file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2.5 file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
        />
        <p className="mt-2 text-[12.5px] text-ink-soft">PDF only, up to 5 MB.</p>
      </div>
      {error && <p role="alert" className="text-[13.5px] font-medium text-rose-600">{error}</p>}
      <div className="flex justify-end gap-2.5">
        <button type="button" onClick={onDone} className="h-10 rounded-lg border border-ink-line px-4 text-[14px] font-semibold text-ink hover:bg-mist">
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-[14px] font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {busy ? 'Uploading…' : 'Upload'}
        </button>
      </div>
      {patient && !fixedUid && (
        <p className="text-[12.5px] text-ink-soft">
          Visible to {patient.name || 'this patient'} under My reports as soon as it uploads.
        </p>
      )}
    </form>
  );
}
