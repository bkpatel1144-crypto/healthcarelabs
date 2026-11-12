import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, ChevronDown, FlaskConical, IndianRupee, MapPin, MessageCircle, Phone, Printer, Trash2, UserRound } from 'lucide-react';
import { AdminEmpty, AdminShell, AdminToolbar, useAdminSeo, useConfirm } from '@/components/admin/AdminShell';
import { Select } from '@/components/common/Select';
import {
  labAssign,
  labDeleteBooking,
  labRecordPayment,
  labSetStatus,
  labUpdateNote,
  watchAllBookings,
  watchStaff,
  type Actor_,
} from '@/lib/accountApi';
import { useAuth } from '@/store/auth';
import { formatDate, formatPrice, localDateIso } from '@/lib/format';
import { formatStamp } from '@/pages/account/AccountBookings';
import { cn } from '@/lib/cn';
import {
  BOOKING_STATUS_LABEL,
  type Booking,
  type BookingStatus,
  type PaymentMode,
  type StaffMember,
} from '@/types/account';

const STATUS_OPTIONS = (Object.keys(BOOKING_STATUS_LABEL) as BookingStatus[]).map((s) => ({
  value: s,
  label: BOOKING_STATUS_LABEL[s],
}));

const FILTERS = [
  { value: 'open', label: 'Open' },
  { value: 'today', label: 'Visits today' },
  { value: 'upcoming', label: 'Upcoming visits' },
  { value: 'all', label: 'All' },
  ...STATUS_OPTIONS,
];

/** The obvious next step for each status, offered as one button. */
const NEXT: Partial<Record<BookingStatus, { to: BookingStatus; label: string }>> = {
  new: { to: 'confirmed', label: 'Confirm visit' },
  'sample-collected': { to: 'received', label: 'Mark received at lab' },
  received: { to: 'processing', label: 'Start processing' },
};

const OPEN: BookingStatus[] = ['new', 'confirmed', 'assigned', 'sample-collected', 'received', 'processing', 'rejected'];

export default function AdminBookings() {
  useAdminSeo('Bookings');
  const { actor } = useAuth();
  const [rows, setRows] = useState<Booking[] | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('open');
  const { confirm, dialog } = useConfirm();
  const today = localDateIso();

  useEffect(() => {
    const onErr = (err: Error) => {
      console.error(err);
      setError('Could not load bookings. Check that this account is listed in the admins collection and the Firestore rules are published.');
    };
    const stops = [watchAllBookings(setRows, onErr), watchStaff(setStaff, () => {})];
    return () => stops.forEach((s) => s());
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? [])
      .filter((b) => {
        if (filter === 'open') return OPEN.includes(b.status);
        if (filter === 'today') return b.preferredDate === today && b.status !== 'cancelled';
        if (filter === 'upcoming') return b.preferredDate >= today && OPEN.includes(b.status);
        if (filter === 'all') return true;
        return b.status === filter;
      })
      .filter((b) => !q || [b.patientName, b.phone, b.email, b.address, b.pincode, b.id, b.sampleId, ...b.packageNames].join(' ').toLowerCase().includes(q))
      .sort((a, b) =>
        filter === 'today' || filter === 'upcoming'
          ? `${a.preferredDate}${a.slotId}`.localeCompare(`${b.preferredDate}${b.slotId}`)
          : b.createdAt.localeCompare(a.createdAt),
      );
  }, [rows, query, filter, today]);

  return (
    <AdminShell
      title="Bookings"
      description="Home-collection orders, live from Firebase. Move each one through the visit; the patient sees every step in their account."
    >
      <AdminToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Search name, phone, PIN code, sample ID…"
        right={
          <div className="w-48">
            <Select options={FILTERS} value={filter} onChange={setFilter} ariaLabel="Filter by status" />
          </div>
        }
      />

      {error ? (
        <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-[14px] text-rose-700">{error}</p>
      ) : rows === null || !actor ? (
        <p className="text-ink-muted">Loading…</p>
      ) : visible.length === 0 ? (
        <AdminEmpty message="No bookings match." />
      ) : (
        <ul className="space-y-4">
          {visible.map((b) => (
            <BookingRow
              key={b.id}
              booking={b}
              staff={staff.filter((s) => s.active)}
              actor={actor}
              onDelete={() =>
                confirm(`Delete booking for ${b.patientName}? Use this only for duplicates or junk — real visits should be cancelled so the record is kept.`, () =>
                  void labDeleteBooking(b.id, actor),
                )
              }
            />
          ))}
        </ul>
      )}
      {dialog}
    </AdminShell>
  );
}

function whatsappTo(b: Booking, text: string) {
  return `https://wa.me/91${b.phone}?text=${encodeURIComponent(text)}`;
}

function BookingRow({
  booking: b,
  staff,
  actor,
  onDelete,
}: {
  booking: Booking;
  staff: StaffMember[];
  actor: Actor_;
  onDelete: () => void;
}) {
  const [note, setNote] = useState(b.labNote ?? '');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [payMode, setPayMode] = useState<Exclude<PaymentMode, ''>>('cash');
  const [payAmount, setPayAmount] = useState(String(b.total || ''));
  const next = NEXT[b.status];
  const ref = `#${b.id.slice(0, 8).toUpperCase()}`;

  const act = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That change was refused.');
    } finally {
      setBusy('');
    }
  };

  const setStatus = (to: BookingStatus) => {
    if (to === 'cancelled' || to === 'rejected') {
      const reason = window.prompt(to === 'cancelled' ? 'Reason for cancelling (shown to the patient):' : 'Why must the sample be taken again? (shown to the patient)');
      if (!reason || reason.trim().length < 3) return;
      void act('status', () => labSetStatus(b.id, to, actor, { reason: reason.trim() }));
    } else {
      void act('status', () => labSetStatus(b.id, to, actor));
    }
  };

  return (
    <li className="rounded-3xl bg-white p-5 ring-1 ring-ink-line sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
            {ref} · received {formatDate(b.createdAt)} ·{' '}
            {b.uid ? (
              <Link to={`/admin/patients?uid=${b.uid}`} className="text-brand-600 hover:underline">
                registered patient
              </Link>
            ) : (
              'guest'
            )}
          </p>
          <h2 className="mt-1 text-[17px] font-bold text-ink">
            {b.packageNames.length ? b.packageNames.join(' + ') : 'Package not chosen'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-52">
            <Select
              options={STATUS_OPTIONS}
              value={b.status}
              onChange={(v) => setStatus(v as BookingStatus)}
              ariaLabel={`Status for ${b.patientName}, booking ${ref}`}
            />
          </div>
          <button type="button" onClick={onDelete} aria-label={`Delete booking ${ref}`} className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-rose-50 hover:text-rose-600">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-[14px] text-ink-muted sm:grid-cols-2 xl:grid-cols-4">
        <p className="flex items-center gap-2">
          <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
          {b.patientName}
        </p>
        <a href={`tel:+91${b.phone}`} className="flex items-center gap-2 font-semibold text-brand-600 hover:underline">
          <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
          +91 {b.phone}
        </a>
        <p className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
          {formatDate(b.preferredDate)} · {b.preferredTime}
        </p>
        <p className="flex items-center gap-2 font-semibold text-ink">
          <IndianRupee className="h-4 w-4 shrink-0" aria-hidden="true" />
          {b.total > 0 ? formatPrice(b.total) : 'Price on request'} ·{' '}
          {b.payment.status === 'paid' ? (
            <span className="text-mint-700">paid {formatPrice(b.payment.amountPaid)} by {b.payment.mode.toUpperCase()}</span>
          ) : (
            <span className="text-amber-700">due</span>
          )}
        </p>
      </div>
      <p className="mt-2 flex items-start gap-2 text-[14px] text-ink-muted">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {b.address}, {b.pincode}
      </p>
      {b.notes && <p className="mt-2 text-[13.5px] italic text-ink-muted">“{b.notes}”</p>}
      {b.statusReason && <p className="mt-2 text-[13.5px] text-rose-700">Reason: {b.statusReason}</p>}
      {(b.phlebotomist || b.sampleId) && (
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] text-ink">
          {b.phlebotomist && <span><strong className="font-semibold">Phlebotomist:</strong> {b.phlebotomist.name}</span>}
          {b.sampleId && (
            <span className="inline-flex items-center gap-1.5">
              <FlaskConical className="h-4 w-4 text-brand-600" aria-hidden="true" />
              Sample {b.sampleId} · {formatStamp(b.collectedAt)}
            </span>
          )}
        </p>
      )}

      {/* ---- Actions ---- */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-line pt-4">
        {next && (
          <button
            type="button"
            disabled={busy !== ''}
            onClick={() => setStatus(next.to)}
            className="h-10 rounded-lg bg-brand-500 px-4 text-[13.5px] font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {next.label}
          </button>
        )}
        {['new', 'confirmed', 'assigned', 'rejected'].includes(b.status) && (
          <div className="w-60">
            <Select
              options={staff.map((s) => ({ value: s.uid, label: s.name, meta: s.phone ? `+91 ${s.phone}` : undefined }))}
              value={b.phlebotomistUid}
              placeholder={staff.length ? 'Assign phlebotomist' : 'No phlebotomists yet — add in Staff'}
              disabled={staff.length === 0 || busy !== ''}
              onChange={(uid) => {
                const s = staff.find((x) => x.uid === uid);
                if (s) void act('assign', () => labAssign(b.id, { uid: s.uid, name: s.name, phone: s.phone }, actor));
              }}
              ariaLabel={`Assign phlebotomist for ${b.patientName}, booking ${ref}`}
            />
          </div>
        )}
        <a href={whatsappTo(b, `Hello ${b.patientName}, your Healthcare Labs home collection ${ref} is ${BOOKING_STATUS_LABEL[b.status].toLowerCase()} for ${formatDate(b.preferredDate)}, ${b.preferredTime}.${b.phlebotomist ? ` ${b.phlebotomist.name} will collect the sample.` : ''}`)}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[13.5px] font-semibold text-mint-700 ring-1 ring-mint-100 hover:bg-mint-50">
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          WhatsApp update
        </a>
        <Link to={`/account/bookings/${b.id}/receipt`} className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[13.5px] font-semibold text-ink-muted ring-1 ring-ink-line hover:text-brand-600">
          <Printer className="h-4 w-4" aria-hidden="true" />
          Receipt
        </Link>
        <button type="button" onClick={() => setShowHistory((v) => !v)} aria-expanded={showHistory}
          className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-[13.5px] font-semibold text-ink-muted hover:text-ink">
          History ({b.history.length})
          <ChevronDown className={cn('h-4 w-4 transition-transform', showHistory && 'rotate-180')} aria-hidden="true" />
        </button>
      </div>

      {showHistory && (
        <ol className="mt-3 space-y-1.5 rounded-2xl bg-mist p-4 text-[13px]">
          {b.history.map((h, i) => (
            <li key={i} className="flex flex-wrap gap-x-3">
              <span className="w-32 shrink-0 tabular-nums text-ink-soft">{formatStamp(h.at)}</span>
              <span className="font-semibold text-ink">{BOOKING_STATUS_LABEL[h.status]}</span>
              <span className="text-ink-muted">by {h.by}{h.note ? ` — ${h.note}` : ''}</span>
            </li>
          ))}
        </ol>
      )}

      {b.payment.status === 'due' && b.status !== 'cancelled' && (
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const amount = Number(payAmount);
            if (!Number.isFinite(amount) || amount <= 0) return setError('Enter the amount received.');
            void act('pay', () => labRecordPayment(b.id, payMode, amount, actor));
          }}
        >
          <div className="w-32">
            <Select
              options={[{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }, { value: 'card', label: 'Card' }]}
              value={payMode}
              onChange={(v) => setPayMode(v as Exclude<PaymentMode, ''>)}
              ariaLabel={`Payment mode for booking ${ref}`}
            />
          </div>
          <label className="sr-only" htmlFor={`amt-${b.id}`}>Amount received</label>
          <input id={`amt-${b.id}`} type="number" min="1" inputMode="numeric" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount ₹"
            className="h-12 w-32 rounded-xl border border-ink-line px-3 text-[14px] focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100" />
          <button type="submit" disabled={busy !== ''} className="h-12 rounded-xl px-4 text-[13.5px] font-semibold text-ink ring-1 ring-ink-line hover:bg-mist disabled:opacity-60">
            Record payment
          </button>
        </form>
      )}

      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void act('note', () => labUpdateNote(b.id, note.trim(), actor));
        }}
      >
        <label htmlFor={`note-${b.id}`} className="sr-only">
          Note shown to the patient
        </label>
        <input
          id={`note-${b.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder="Note shown to the patient, e.g. “Please keep your Aadhaar handy”"
          className="h-10 flex-1 rounded-lg border border-ink-line px-3 text-[14px] focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={busy !== '' || note.trim() === (b.labNote ?? '')}
          className="h-10 rounded-lg bg-brand-500 px-4 text-[13.5px] font-semibold text-white hover:bg-brand-600 disabled:bg-mist disabled:text-ink-soft"
        >
          {busy === 'note' ? 'Saving…' : 'Save note'}
        </button>
      </form>
      {error && <p role="alert" className="mt-2 text-[13px] font-medium text-rose-600">{error}</p>}
    </li>
  );
}
