import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Paperclip, Phone, Trash2 } from 'lucide-react';
import { AdminEmpty, AdminShell, AdminToolbar, useAdminSeo, useConfirm } from '@/components/admin/AdminShell';
import { Select } from '@/components/common/Select';
import { adminDeleteRequest, adminUpdateRequest, openAttachment, watchAllRequests } from '@/lib/accountApi';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  REQUEST_STATUS_LABEL,
  REQUEST_TYPE_LABEL,
  type PatientRequest,
  type RequestStatus,
  type RequestType,
} from '@/types/account';

const STATUS_OPTIONS = (Object.keys(REQUEST_STATUS_LABEL) as RequestStatus[]).map((s) => ({
  value: s,
  label: REQUEST_STATUS_LABEL[s],
}));

const TABS: { value: 'all' | RequestType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'prescription', label: 'Prescriptions' },
  { value: 'support', label: 'Support' },
  { value: 'contact', label: 'Contact' },
  { value: 'partnership', label: 'Partnerships' },
];

export default function AdminRequests() {
  useAdminSeo('Requests');
  const [rows, setRows] = useState<PatientRequest[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | RequestType>('all');
  const [showResolved, setShowResolved] = useState(false);
  const { confirm, dialog } = useConfirm();

  useEffect(
    () =>
      watchAllRequests(setRows, (err) => {
        console.error(err);
        setError('Could not load requests. Check that this account is in the admins collection and the rules are published.');
      }),
    [],
  );

  const counts = useMemo(() => {
    const open = (rows ?? []).filter((r) => r.status !== 'resolved');
    return Object.fromEntries(TABS.map((t) => [t.value, open.filter((r) => t.value === 'all' || r.type === t.value).length]));
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      if (tab !== 'all' && r.type !== tab) return false;
      if (!showResolved && r.status === 'resolved') return false;
      return !q || [r.name, r.phone, r.email, r.topic, r.message].join(' ').toLowerCase().includes(q);
    });
  }, [rows, query, tab, showResolved]);

  return (
    <AdminShell
      title="Requests"
      description="Prescriptions, support questions, contact messages and partnership enquiries from the website. Replies show in the sender’s account if they were logged in."
    >
      <div role="tablist" aria-label="Request type" className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-semibold ring-1 transition-colors',
              tab === t.value ? 'bg-brand-500 text-white ring-brand-500' : 'bg-white text-ink-muted ring-ink-line hover:text-ink',
            )}
          >
            {t.label}
            {counts[t.value] > 0 && (
              <span className={cn('rounded-full px-1.5 text-[11px] tabular-nums', tab === t.value ? 'bg-white/25' : 'bg-brand-50 text-brand-700')}>
                {counts[t.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      <AdminToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Search name, phone, message…"
        right={
          <label className="flex items-center gap-2 text-[13.5px] font-medium text-ink-muted">
            <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} className="h-4 w-4 accent-brand-500" />
            Show resolved
          </label>
        }
      />

      {error ? (
        <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-[14px] text-rose-700">{error}</p>
      ) : rows === null ? (
        <p className="text-ink-muted">Loading…</p>
      ) : visible.length === 0 ? (
        <AdminEmpty message="Nothing here — you’re all caught up." />
      ) : (
        <ul className="space-y-4">
          {visible.map((r) => (
            <RequestRow
              key={r.id}
              request={r}
              onDelete={() => confirm(`Delete this ${REQUEST_TYPE_LABEL[r.type].toLowerCase()} from ${r.name}?`, () => void adminDeleteRequest(r))}
            />
          ))}
        </ul>
      )}
      {dialog}
    </AdminShell>
  );
}

function RequestRow({ request: r, onDelete }: { request: PatientRequest; onDelete: () => void }) {
  const [reply, setReply] = useState(r.reply);
  const [saving, setSaving] = useState(false);
  const [fileError, setFileError] = useState('');

  return (
    <li className="rounded-3xl bg-white p-5 ring-1 ring-ink-line sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
            {REQUEST_TYPE_LABEL[r.type]} · {formatDate(r.createdAt)} ·{' '}
            {r.uid ? (
              <Link to={`/admin/patients?uid=${r.uid}`} className="text-brand-600 hover:underline">
                registered patient
              </Link>
            ) : (
              'guest'
            )}
          </p>
          <h2 className="mt-1 text-[17px] font-bold text-ink">
            {r.name}
            {r.topic && <span className="font-medium text-ink-muted"> — {r.topic}</span>}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-40">
            <Select
              options={STATUS_OPTIONS}
              value={r.status}
              onChange={(v) => void adminUpdateRequest(r.id, { status: v as RequestStatus })}
              ariaLabel={`Status of ${REQUEST_TYPE_LABEL[r.type].toLowerCase()} from ${r.name}, ${formatDate(r.createdAt)}`}
            />
          </div>
          <button type="button" onClick={onDelete} aria-label="Delete request" className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-rose-50 hover:text-rose-600">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[14px]">
        <a href={`tel:+91${r.phone}`} className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:underline">
          <Phone className="h-4 w-4" aria-hidden="true" />
          +91 {r.phone}
        </a>
        <a href={`https://wa.me/91${r.phone}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-mint-700 hover:underline">
          WhatsApp
        </a>
        {r.email && (
          <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 text-ink-muted hover:text-brand-600">
            <Mail className="h-4 w-4" aria-hidden="true" />
            {r.email}
          </a>
        )}
      </div>

      {r.message && <p className="mt-3 whitespace-pre-line text-[14.5px] text-ink">{r.message}</p>}

      {r.attachment && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              setFileError('');
              void openAttachment(r).catch((e: Error) => setFileError(e.message));
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-3.5 py-2 text-[13.5px] font-semibold text-brand-700 hover:bg-brand-100"
          >
            <Paperclip className="h-4 w-4" aria-hidden="true" />
            Open {r.attachment.mime === 'application/pdf' ? 'PDF' : 'photo'} — {r.attachment.fileName}
          </button>
          {fileError && <p role="alert" className="mt-1.5 text-[12.5px] text-rose-600">{fileError}</p>}
        </div>
      )}

      <form
        className="mt-4 flex flex-col gap-2 border-t border-ink-line pt-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          try {
            await adminUpdateRequest(r.id, {
              reply: reply.trim(),
              ...(r.status === 'open' && reply.trim() ? { status: 'in-progress' as const } : {}),
            });
          } finally {
            setSaving(false);
          }
        }}
      >
        <label htmlFor={`reply-${r.id}`} className="text-[13px] font-semibold text-ink">
          Reply {r.uid ? '(shown in the patient’s account)' : '(guest — note for staff only; call them back)'}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <textarea
            id={`reply-${r.id}`}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            maxLength={2000}
            rows={2}
            placeholder={r.type === 'prescription' ? 'e.g. Tests: CBC, HbA1c, Lipid profile — total ₹… We will call to book.' : 'Your reply…'}
            className="min-h-[44px] flex-1 rounded-lg border border-ink-line px-3 py-2 text-[14px] focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
          <button
            type="submit"
            disabled={saving || reply.trim() === r.reply}
            className="h-11 rounded-lg bg-brand-500 px-4 text-[13.5px] font-semibold text-white hover:bg-brand-600 disabled:bg-mist disabled:text-ink-soft sm:self-end"
          >
            {saving ? 'Saving…' : 'Save reply'}
          </button>
        </div>
      </form>
    </li>
  );
}
