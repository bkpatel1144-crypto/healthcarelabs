import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  Check,
  CircleAlert,
  FlaskConical,
  MapPin,
  Plus,
  Printer,
  Receipt,
  UserRound,
} from 'lucide-react';
import { AccountShell, EmptyPanel, Panel } from '@/components/account/AccountShell';
import { Button } from '@/components/common/Button';
import { SelectField, TextField } from '@/components/common/Form';
import { cancelMyBooking, rescheduleMyBooking, watchMyBookings } from '@/lib/accountApi';
import { useAuth } from '@/store/auth';
import { useSlots } from '@/lib/useSlots';
import { formatDate, formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STEPS,
  PATIENT_CHANGEABLE,
  type Booking,
} from '@/types/account';

export function formatStamp(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export default function AccountBookings() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Booking[] | null>(null);

  useEffect(() => {
    if (!user) return;
    return watchMyBookings(user.uid, setRows);
  }, [user]);

  return (
    <AccountShell
      title="My bookings"
      description="Every home collection you book while logged in, with each step as it happens."
      actions={
        <Button to="/contact-us#home-collection" size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Book a test
        </Button>
      }
    >
      {rows === null ? (
        <Panel>
          <p className="text-ink-muted">Loading bookings…</p>
        </Panel>
      ) : rows.length === 0 ? (
        <EmptyPanel title="No bookings yet">
          <Link to="/health-package" className="font-semibold text-brand-600 hover:underline">
            Browse health packages
          </Link>{' '}
          and book a home collection — it will show up here.
        </EmptyPanel>
      ) : (
        <ul className="space-y-4">
          {rows.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </ul>
      )}
    </AccountShell>
  );
}

function BookingCard({ booking: b }: { booking: Booking }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const stepIndex = BOOKING_STEPS.findIndex((s) => s.status === b.status);
  const ended = b.status === 'cancelled' || b.status === 'rejected';
  const changeable = PATIENT_CHANGEABLE.includes(b.status);
  const reached = (status: string) => b.history.filter((h) => h.status === status).pop();

  return (
    <li className="rounded-3xl bg-white p-6 ring-1 ring-ink-line">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
            Booking #{b.id.slice(0, 8).toUpperCase()} · {formatDate(b.createdAt)}
          </p>
          <h2 className="mt-1.5 text-[18px] font-bold text-ink">
            {b.packageNames.length > 0 ? b.packageNames.join(' + ') : 'Home collection'}
          </h2>
        </div>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-[12.5px] font-semibold',
            ended ? 'bg-rose-50 text-rose-700' : b.status === 'completed' ? 'bg-mint-50 text-mint-700' : 'bg-brand-50 text-brand-700',
          )}
        >
          {BOOKING_STATUS_LABEL[b.status]}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-[14px] text-ink-muted sm:grid-cols-3">
        <p className="flex items-center gap-2">
          <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
          {b.patientName}
        </p>
        <p className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
          {formatDate(b.preferredDate)} · {b.preferredTime}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{b.address}, {b.pincode}</span>
        </p>
      </div>

      {ended ? (
        <p className="mt-5 flex items-start gap-2 rounded-2xl bg-rose-50/60 p-3.5 text-[13.5px] text-rose-800">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {b.status === 'cancelled' ? 'This visit was cancelled.' : 'The sample could not be collected or used and needs to be taken again.'}
          {b.statusReason && ` Reason: ${b.statusReason}`}
        </p>
      ) : (
        <ol className="mt-6 grid grid-cols-7 gap-1" aria-label="Booking progress">
          {BOOKING_STEPS.map((s, i) => {
            const done = i <= stepIndex;
            const when = reached(s.status);
            return (
              <li key={s.status} className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold',
                    done ? 'bg-mint-500 text-white' : 'bg-mist text-ink-soft ring-1 ring-ink-line',
                  )}
                  aria-hidden="true"
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn('mt-1.5 text-[11px] leading-tight', done ? 'font-semibold text-ink' : 'text-ink-soft')}>
                  {s.label}
                  <span className="sr-only">{done ? ' (done)' : ''}</span>
                </span>
                {done && when && <span className="mt-0.5 hidden text-[10.5px] text-ink-soft sm:block">{formatStamp(when.at)}</span>}
              </li>
            );
          })}
        </ol>
      )}

      {(b.phlebotomist || b.sampleId) && (
        <div className="mt-5 grid gap-2 rounded-2xl bg-mist p-3.5 text-[13.5px] text-ink sm:grid-cols-2">
          {b.phlebotomist && (
            <p>
              <strong className="font-semibold">Phlebotomist:</strong> {b.phlebotomist.name}
              {b.phlebotomist.phone && (
                <>
                  {' · '}
                  <a href={`tel:+91${b.phlebotomist.phone}`} className="font-semibold text-brand-600 hover:underline">
                    Call
                  </a>
                </>
              )}
            </p>
          )}
          {b.sampleId && (
            <p className="flex items-center gap-1.5">
              <FlaskConical className="h-4 w-4 text-brand-600" aria-hidden="true" />
              <strong className="font-semibold">Sample ID:</strong> {b.sampleId}
              {b.collectedAt && <span className="text-ink-muted">· {formatStamp(b.collectedAt)}</span>}
            </p>
          )}
        </div>
      )}

      {b.labNote && (
        <p className="mt-4 rounded-2xl bg-mist p-3.5 text-[13.5px] text-ink">
          <strong className="font-semibold">Note from the lab:</strong> {b.labNote}
        </p>
      )}

      {rescheduling && (
        <Reschedule
          booking={b}
          onDone={() => setRescheduling(false)}
        />
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink-line pt-4">
        <p className="flex items-center gap-1.5 text-[14px] text-ink-muted">
          <Receipt className="h-4 w-4" aria-hidden="true" />
          {b.total > 0 ? <strong className="font-bold text-ink">{formatPrice(b.total)}</strong> : 'Price confirmed by the lab'}
          {' · '}
          {b.payment.status === 'paid'
            ? <span className="font-semibold text-mint-700">Paid{b.payment.mode ? ` by ${b.payment.mode.toUpperCase()}` : ''}</span>
            : 'Pay at collection'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button to={`/account/bookings/${b.id}/receipt`} size="sm" variant="ghost">
            <Printer className="h-4 w-4" aria-hidden="true" />
            Receipt
          </Button>
          {b.status === 'completed' && (
            <Button to="/account/reports" size="sm" variant="secondary">
              View report
            </Button>
          )}
          {changeable && !rescheduling && (
            <Button size="sm" variant="secondary" onClick={() => setRescheduling(true)}>
              Reschedule
            </Button>
          )}
          {changeable && (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={async () => {
                if (!window.confirm('Cancel this visit? The time slot will be released.')) return;
                setBusy(true);
                setError('');
                try {
                  await cancelMyBooking(b.id);
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Could not cancel.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Cancel visit
            </Button>
          )}
        </div>
      </div>
      {error && <p role="alert" className="mt-2 text-[13px] text-rose-600">{error}</p>}
    </li>
  );
}

function Reschedule({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const [date, setDate] = useState('');
  const [slotId, setSlotId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { cfg, options, today, lastDate, dateProblem } = useSlots(date);

  const submit = async () => {
    setError('');
    const problem = dateProblem(date);
    if (problem) return setError(problem);
    const slot = options.find((o) => o.value === slotId);
    if (!slot) return setError('Choose a time slot.');
    if (slot.left <= 0) return setError('That slot is full. Choose another.');
    setBusy(true);
    try {
      await rescheduleMyBooking(booking.id, date, slotId, cfg.slots[slotId].label);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reschedule.');
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 rounded-2xl bg-brand-50/50 p-4 ring-1 ring-brand-100">
      <p className="text-[14px] font-semibold text-ink">Choose a new date and time</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <TextField label="New date" type="date" min={today} max={lastDate} value={date} onChange={(e) => { setDate(e.target.value); setSlotId(''); }} />
        <SelectField
          label="New time"
          value={slotId}
          onValueChange={setSlotId}
          placeholder={date ? 'Choose a slot' : 'Choose a date first'}
          options={options.map(({ value, label, meta }) => ({ value, label, meta }))}
        />
      </div>
      {error && <p role="alert" className="mt-3 text-[13px] font-medium text-rose-600">{error}</p>}
      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={() => void submit()} disabled={busy}>
          {busy ? 'Saving…' : 'Confirm new time'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Keep current time
        </Button>
      </div>
      <p className="mt-2 text-[12.5px] text-ink-soft">The lab will confirm the new time again.</p>
    </div>
  );
}
