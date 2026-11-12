import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AdminEmpty, AdminShell, useAdminSeo } from '@/components/admin/AdminShell';
import { SelectField, TextField } from '@/components/common/Form';
import { Select } from '@/components/common/Select';
import {
  saveBookingConfig,
  saveStaff,
  watchAudit,
  watchBookingConfig,
  watchPatients,
  watchStaff,
} from '@/lib/accountApi';
import { useAuth } from '@/store/auth';
import { formatStamp } from '@/pages/account/AccountBookings';
import {
  DEFAULT_BOOKING_CONFIG,
  type AuditEntry,
  type BookingConfig,
  type PatientProfile,
  type StaffMember,
} from '@/types/account';

/* ===================================================== Scheduling settings */

/** "07:30" → "s0730": slot ids carry their start time so past slots can be hidden. */
const slotIdFor = (hhmm: string) => `s${hhmm.replace(':', '')}`;
const hhmmFor = (id: string) => (/^s(\d{2})(\d{2})$/.test(id) ? `${id.slice(1, 3)}:${id.slice(3, 5)}` : '');

interface SlotRow {
  start: string;
  label: string;
  capacity: string;
}

export function AdminScheduling() {
  useAdminSeo('Scheduling');
  const { actor } = useAuth();
  const [cfg, setCfg] = useState<BookingConfig | null>(null);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [pincodes, setPincodes] = useState('');
  const [closed, setClosed] = useState('');
  const [daysAhead, setDaysAhead] = useState('14');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // The form is filled from the first snapshot only, so a later save does not
  // overwrite what the admin is in the middle of typing.
  const loaded = useRef(false);
  useEffect(
    () =>
      watchBookingConfig((c) => {
        setCfg(c);
        if (loaded.current) return;
        loaded.current = true;
        setSlots(
          Object.entries(c.slots)
            .sort(([, a], [, b]) => a.order - b.order)
            .map(([id, s]) => ({ start: hhmmFor(id), label: s.label, capacity: String(s.capacity) })),
        );
        setPincodes(c.servicePincodes.join(', '));
        setClosed(c.closedDates.join(', '));
        setDaysAhead(String(c.daysAhead));
      }),
    [],
  );

  const save = async () => {
    setMessage(null);
    const out: BookingConfig['slots'] = {};
    for (const [i, s] of slots.entries()) {
      if (!/^\d{2}:\d{2}$/.test(s.start)) return setMessage({ ok: false, text: `Slot ${i + 1}: enter a start time.` });
      if (!s.label.trim()) return setMessage({ ok: false, text: `Slot ${i + 1}: enter the label patients see.` });
      const cap = Number(s.capacity);
      if (!Number.isInteger(cap) || cap < 0 || cap > 200) return setMessage({ ok: false, text: `Slot ${i + 1}: capacity must be a whole number from 0 to 200.` });
      const id = slotIdFor(s.start);
      if (out[id]) return setMessage({ ok: false, text: `Two slots start at ${s.start}.` });
      out[id] = { label: s.label.trim(), capacity: cap, order: i + 1 };
    }
    if (Object.keys(out).length === 0) return setMessage({ ok: false, text: 'Keep at least one time slot.' });
    const pins = pincodes.split(/[\s,]+/).filter(Boolean);
    const badPin = pins.find((p) => !/^\d{6}$/.test(p));
    if (badPin) return setMessage({ ok: false, text: `“${badPin}” is not a 6-digit PIN code.` });
    const dates = closed.split(/[\s,]+/).filter(Boolean);
    const badDate = dates.find((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d));
    if (badDate) return setMessage({ ok: false, text: `“${badDate}” is not a date in YYYY-MM-DD form.` });
    const days = Number(daysAhead);
    if (!Number.isInteger(days) || days < 1 || days > 60) return setMessage({ ok: false, text: 'Booking window must be 1 to 60 days.' });
    if (!actor) return;
    setBusy(true);
    try {
      await saveBookingConfig(
        { slots: out, servicePincodes: [...new Set(pins)], closedDates: [...new Set(dates)].sort(), daysAhead: days, updatedAt: '' },
        actor,
      );
      setMessage({ ok: true, text: 'Saved. The booking form uses these settings straight away.' });
    } catch {
      setMessage({ ok: false, text: 'Could not save. Check the Firestore rules are published.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell
      title="Scheduling"
      description="Home-collection time slots and how many visits each can take, the PIN codes you cover, and days with no collection."
    >
      {cfg === null ? (
        <p className="text-ink-muted">Loading…</p>
      ) : (
        <div className="space-y-6">
          {!cfg.updatedAt && (
            <p className="rounded-2xl bg-amber-50 p-4 text-[14px] text-amber-800">
              These are the starting defaults (6 visits per slot, all PIN codes). Adjust them to your team’s real capacity and save.
            </p>
          )}
          <section className="rounded-3xl bg-white p-6 ring-1 ring-ink-line">
            <h2 className="text-[17px] font-bold text-ink">Time slots</h2>
            <p className="mt-1 text-[13.5px] text-ink-muted">Capacity is the number of home visits your phlebotomists can make in that window on one day. 0 closes a slot.</p>
            <ul className="mt-4 space-y-2.5">
              {slots.map((s, i) => (
                <li key={i} className="grid grid-cols-[110px_1fr_90px_40px] items-end gap-2">
                  <TextField label="Starts" type="time" value={s.start} onChange={(e) => setSlots((x) => x.map((r, j) => (j === i ? { ...r, start: e.target.value } : r)))} />
                  <TextField label="Label patients see" value={s.label} maxLength={40} onChange={(e) => setSlots((x) => x.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))} />
                  <TextField label="Capacity" type="number" min={0} max={200} value={s.capacity} onChange={(e) => setSlots((x) => x.map((r, j) => (j === i ? { ...r, capacity: e.target.value } : r)))} />
                  <button type="button" aria-label={`Remove slot ${s.label || i + 1}`} onClick={() => setSlots((x) => x.filter((_, j) => j !== i))}
                    className="flex h-12 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setSlots((x) => [...x, { start: '', label: '', capacity: '6' }])}
              className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-brand-600 hover:underline">
              <Plus className="h-4 w-4" aria-hidden="true" />Add a slot
            </button>
          </section>

          <section className="grid gap-5 rounded-3xl bg-white p-6 ring-1 ring-ink-line sm:grid-cols-2">
            <TextField label="Booking window (days ahead)" type="number" min={1} max={60} value={daysAhead} onChange={(e) => setDaysAhead(e.target.value)} />
            <div />
            <TextField label="PIN codes served" value={pincodes} onChange={(e) => setPincodes(e.target.value)} hint="Comma-separated. Leave empty to accept every PIN code." className="sm:col-span-2" />
            <TextField label="Closed dates" value={closed} onChange={(e) => setClosed(e.target.value)} hint="Comma-separated, YYYY-MM-DD — e.g. 2026-11-14, 2027-01-26" className="sm:col-span-2" />
          </section>

          {message && <p role="status" className={message.ok ? 'rounded-xl bg-mint-50 p-3.5 text-[14px] text-mint-800' : 'rounded-xl bg-rose-50 p-3.5 text-[14px] text-rose-700'}>{message.text}</p>}
          <button type="button" onClick={() => void save()} disabled={busy} className="h-11 rounded-lg bg-brand-500 px-5 text-[14px] font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
            {busy ? 'Saving…' : 'Save scheduling'}
          </button>
          <button type="button" onClick={() => {
            setSlots(Object.entries(DEFAULT_BOOKING_CONFIG.slots).map(([id, s]) => ({ start: hhmmFor(id), label: s.label, capacity: String(s.capacity) })));
          }} className="ml-3 h-11 rounded-lg px-4 text-[14px] font-semibold text-ink-muted hover:text-ink">
            Restore default slots
          </button>
        </div>
      )}
    </AdminShell>
  );
}

/* ================================================================= Staff */

export function AdminStaff() {
  useAdminSeo('Staff');
  const { actor } = useAuth();
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [pick, setPick] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const onErr = () => setError('Could not load staff. Is this account in the admins collection?');
    const stops = [watchStaff(setStaff, onErr), watchPatients(setPatients, onErr)];
    return () => stops.forEach((s) => s());
  }, []);

  const candidates = useMemo(
    () => patients.filter((p) => !(staff ?? []).some((s) => s.uid === p.uid)),
    [patients, staff],
  );

  const add = async () => {
    setError('');
    const p = patients.find((x) => x.uid === pick);
    if (!p || !actor) return setError('Choose the account to add.');
    if (!p.name || p.name.length < 2) return setError('That account has no name yet. Ask them to complete their profile first.');
    try {
      await saveStaff({ uid: p.uid, name: p.name, phone: p.phone, email: p.email, role: 'phlebotomist', active: true, createdAt: new Date().toISOString() }, actor);
      setPick('');
    } catch {
      setError('Could not add. Check the Firestore rules are published.');
    }
  };

  return (
    <AdminShell
      title="Staff"
      description="Phlebotomists who collect samples. Each one signs in with their own account and sees only the visits assigned to them."
    >
      <section className="mb-6 rounded-3xl bg-white p-6 ring-1 ring-ink-line">
        <h2 className="text-[17px] font-bold text-ink">Add a phlebotomist</h2>
        <p className="mt-1 text-[13.5px] text-ink-muted">They first sign up on the website like a patient (mobile OTP is easiest); then choose their account here.</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="w-full max-w-sm">
            <SelectField
              label="Account"
              value={pick}
              onValueChange={setPick}
              placeholder={candidates.length ? 'Choose an account' : 'No other accounts yet'}
              options={candidates.map((p) => ({ value: p.uid, label: p.name || '(no name)', meta: p.phone ? `+91 ${p.phone}` : p.email }))}
            />
          </div>
          <button type="button" onClick={() => void add()} className="h-12 rounded-xl bg-brand-500 px-5 text-[14px] font-semibold text-white hover:bg-brand-600">
            Add as phlebotomist
          </button>
        </div>
        {error && <p role="alert" className="mt-3 text-[13.5px] text-rose-600">{error}</p>}
      </section>

      {staff === null ? (
        <p className="text-ink-muted">Loading…</p>
      ) : staff.length === 0 ? (
        <AdminEmpty message="No phlebotomists added yet." />
      ) : (
        <ul className="space-y-3">
          {staff.map((s) => (
            <li key={s.uid} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink-line">
              <div>
                <p className="font-semibold text-ink">{s.name}</p>
                <p className="text-[13px] text-ink-muted">{s.phone ? `+91 ${s.phone}` : s.email} · phlebotomist</p>
              </div>
              <div className="w-40">
                <Select
                  options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Deactivated' }]}
                  value={s.active ? 'active' : 'inactive'}
                  onChange={(v) => actor && void saveStaff({ ...s, active: v === 'active' }, actor)}
                  ariaLabel={`Access for ${s.name}`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}

/* ================================================================= Audit */

export function AdminAudit() {
  useAdminSeo('Audit log');
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => watchAudit(setRows, () => setError('Could not load the audit log.')), []);

  return (
    <AdminShell title="Audit log" description="Every staff action on patient records, newest first. Entries cannot be edited or deleted — by anyone.">
      {error ? (
        <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-rose-700">{error}</p>
      ) : rows === null ? (
        <p className="text-ink-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <AdminEmpty message="No staff actions recorded yet." />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink-line">
          <table className="w-full min-w-[720px] text-left text-[13.5px]">
            <thead className="bg-mist text-[11.5px] uppercase tracking-[0.08em] text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Who</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Record</th>
                <th className="px-4 py-3 font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-line">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-ink-muted">{formatStamp(r.at)}</td>
                  <td className="px-4 py-2.5 text-ink">{r.actorRole} <span className="font-mono text-[11px] text-ink-soft">{r.actorUid.slice(0, 6)}</span></td>
                  <td className="px-4 py-2.5 font-semibold text-ink">{r.action}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-ink-muted">{r.target}</td>
                  <td className="px-4 py-2.5 text-ink-muted">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
