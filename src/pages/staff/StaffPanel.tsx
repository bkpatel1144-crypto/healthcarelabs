import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, CalendarClock, FlaskConical, MapPin, MessageCircle, Navigation, Phone, UserRound } from 'lucide-react';
import { phleboMarkCollected, phleboMarkNotCollected, watchAssignedBookings } from '@/lib/accountApi';
import { FullPageSpinner, useAccountSeo } from '@/components/account/AccountShell';
import { useAuth } from '@/store/auth';
import { formatDate, localDateIso } from '@/lib/format';
import { formatStamp } from '@/pages/account/AccountBookings';
import { cn } from '@/lib/cn';
import { BOOKING_STATUS_LABEL, type Booking } from '@/types/account';

/**
 * The phlebotomist's day: the visits assigned to them, in time order, with
 * the two things they record on site — the sample ID written on the tube, or
 * why the sample could not be taken. Security rules let them see and change
 * nothing else.
 */
export default function StaffPanel() {
  useAccountSeo('My collections');
  const { status, staff, actor, user } = useAuth();
  const [rows, setRows] = useState<Booking[] | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'today' | 'upcoming' | 'done'>('today');
  const today = localDateIso();

  useEffect(() => {
    if (!user || !staff) return;
    return watchAssignedBookings(user.uid, setRows, () => setError('Could not load your visits. Please refresh.'));
  }, [user, staff]);

  const visible = useMemo(() => {
    const list = rows ?? [];
    if (tab === 'today') return list.filter((b) => b.preferredDate === today && b.status === 'assigned');
    if (tab === 'upcoming') return list.filter((b) => b.preferredDate > today && b.status === 'assigned');
    return list.filter((b) => b.status !== 'assigned').reverse();
  }, [rows, tab, today]);

  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'signed-out') return <Navigate to="/login?next=%2Fstaff" replace />;
  if (!staff || !actor) {
    return (
      <div className="mx-auto max-w-lg px-5 pb-20 pt-[140px] text-center">
        <h1 className="text-[24px] font-extrabold text-ink">Field staff only</h1>
        <p className="mt-3 text-[15px] text-ink-muted">This account is not set up as a phlebotomist. A lab admin can add it under Admin → Staff.</p>
        <Link to="/account" className="mt-6 inline-block font-semibold text-brand-600 hover:underline">Go to my account</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist pb-16 pt-[100px] lg:pt-[110px]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link to="/account" className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink-muted hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          My account
        </Link>
        <h1 className="mt-4 text-[28px] font-extrabold tracking-editorial text-ink">My collections</h1>
        <p className="mt-1 text-[14.5px] text-ink-muted">{staff.name} · {formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</p>

        <div role="tablist" aria-label="Visits" className="mt-6 grid grid-cols-3 gap-1 rounded-xl bg-white p-1 ring-1 ring-ink-line">
          {([
            ['today', 'Today'],
            ['upcoming', 'Upcoming'],
            ['done', 'Done'],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={cn('h-10 rounded-lg text-[14px] font-semibold', tab === id ? 'bg-brand-500 text-white' : 'text-ink-muted hover:text-ink')}>
              {label}
              {rows && id !== 'done' && (
                <span className="ml-1.5 tabular-nums opacity-80">
                  ({(rows ?? []).filter((b) => b.status === 'assigned' && (id === 'today' ? b.preferredDate === today : b.preferredDate > today)).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {error && <p role="alert" className="mt-4 rounded-2xl bg-rose-50 p-4 text-rose-700">{error}</p>}
        {rows === null ? (
          <p className="mt-6 text-ink-muted">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="mt-6 rounded-3xl border border-dashed border-brand-100 bg-white p-10 text-center text-ink-muted">
            {tab === 'done' ? 'Nothing recorded yet.' : 'No visits assigned here.'}
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {visible.map((b) => (
              <Visit key={b.id} booking={b} actor={actor} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Visit({ booking: b, actor }: { booking: Booking; actor: { uid: string; role: 'admin' | 'phlebotomist' } }) {
  const [mode, setMode] = useState<'' | 'collect' | 'fail'>('');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.address}, ${b.pincode}`)}`;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const v = value.trim();
    if (mode === 'collect' && v.length < 3) return setError('Enter the sample ID printed on the tube label.');
    if (mode === 'fail' && v.length < 3) return setError('Say why the sample could not be collected.');
    setBusy(true);
    try {
      if (mode === 'collect') await phleboMarkCollected(b.id, v, actor);
      else await phleboMarkNotCollected(b.id, v, actor);
      setMode('');
      setValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-3xl bg-white p-5 ring-1 ring-ink-line">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="flex items-center gap-2 text-[15px] font-bold text-ink">
          <CalendarClock className="h-4 w-4 text-brand-600" aria-hidden="true" />
          {b.preferredTime} · {formatDate(b.preferredDate, { day: 'numeric', month: 'short' })}
        </p>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-semibold text-brand-700">{BOOKING_STATUS_LABEL[b.status]}</span>
      </div>
      <p className="mt-3 flex items-center gap-2 text-[15px] text-ink"><UserRound className="h-4 w-4 text-ink-soft" aria-hidden="true" />{b.patientName}</p>
      <p className="mt-1.5 flex items-start gap-2 text-[14px] text-ink-muted"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{b.address}, {b.pincode}</p>
      <p className="mt-1.5 text-[13.5px] text-ink-muted">Tests: {b.packageNames.join(', ') || 'to be confirmed by the lab'}</p>
      {b.notes && <p className="mt-1.5 text-[13.5px] italic text-ink-muted">“{b.notes}”</p>}
      {b.sampleId && (
        <p className="mt-2 flex items-center gap-1.5 text-[13.5px] text-ink"><FlaskConical className="h-4 w-4 text-brand-600" aria-hidden="true" />Sample {b.sampleId} · {formatStamp(b.collectedAt)}</p>
      )}
      {b.statusReason && <p className="mt-2 text-[13.5px] text-rose-700">Not collected: {b.statusReason}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <a href={`tel:+91${b.phone}`} className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[13.5px] font-semibold text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
          <Phone className="h-4 w-4" aria-hidden="true" />Call
        </a>
        <a href={mapLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[13.5px] font-semibold text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
          <Navigation className="h-4 w-4" aria-hidden="true" />Directions
        </a>
        <a href={`https://wa.me/91${b.phone}?text=${encodeURIComponent(`Hello ${b.patientName}, this is ${actor.role === 'phlebotomist' ? 'your phlebotomist' : 'the lab'} from Healthcare Labs. I am on my way for your ${b.preferredTime} sample collection.`)}`}
          target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[13.5px] font-semibold text-mint-700 ring-1 ring-mint-100 hover:bg-mint-50">
          <MessageCircle className="h-4 w-4" aria-hidden="true" />On my way
        </a>
      </div>

      {b.status === 'assigned' && (
        mode === '' ? (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-line pt-4">
            <button type="button" onClick={() => setMode('collect')} className="h-11 flex-1 rounded-xl bg-mint-500 px-4 text-[14px] font-semibold text-white hover:bg-mint-600">
              Mark collected
            </button>
            <button type="button" onClick={() => setMode('fail')} className="h-11 rounded-xl px-4 text-[14px] font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50">
              Could not collect
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 border-t border-ink-line pt-4">
            <label htmlFor={`v-${b.id}`} className="mb-2 block text-[13px] font-semibold text-ink">
              {mode === 'collect' ? 'Sample ID on the tube label' : 'Reason (shown to the patient)'}
            </label>
            <input id={`v-${b.id}`} value={value} onChange={(e) => setValue(e.target.value)} maxLength={mode === 'collect' ? 40 : 300} autoFocus
              placeholder={mode === 'collect' ? 'e.g. HL-24-001873' : 'e.g. Patient not at home, phone switched off'}
              className="h-12 w-full rounded-xl border border-ink-line px-4 text-[15px] focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100" />
            {error && <p role="alert" className="mt-2 text-[13px] font-medium text-rose-600">{error}</p>}
            <div className="mt-3 flex gap-2">
              <button type="submit" disabled={busy} className={cn('h-11 rounded-xl px-4 text-[14px] font-semibold text-white disabled:opacity-60', mode === 'collect' ? 'bg-mint-500 hover:bg-mint-600' : 'bg-rose-600 hover:bg-rose-700')}>
                {busy ? 'Saving…' : mode === 'collect' ? 'Confirm collected' : 'Confirm not collected'}
              </button>
              <button type="button" onClick={() => { setMode(''); setValue(''); setError(''); }} className="h-11 rounded-xl px-4 text-[14px] font-semibold text-ink-muted hover:text-ink">
                Back
              </button>
            </div>
          </form>
        )
      )}
    </li>
  );
}
