import { useEffect, useState, type FormEvent } from 'react';
import { MapPin, Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { AccountShell, EmptyPanel, Panel } from '@/components/account/AccountShell';
import { SelectField, TextField, TextAreaField } from '@/components/common/Form';
import { Button } from '@/components/common/Button';
import {
  deleteAddress,
  deleteMember,
  formatAddress,
  saveAddress,
  saveMember,
  watchAddresses,
  watchMembers,
} from '@/lib/accountApi';
import { ageFrom, useAuth } from '@/store/auth';
import { localDateIso } from '@/lib/format';
import { GENDER_OPTIONS } from '@/pages/account/AccountProfile';
import type { FamilyMember, Gender, SavedAddress } from '@/types/account';

const RELATIONS = ['Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Grandparent', 'Other'].map(
  (r) => ({ value: r, label: r }),
);

/* ----------------------------------------------------------- family members */

export default function AccountFamily() {
  const { user } = useAuth();
  const [rows, setRows] = useState<FamilyMember[] | null>(null);
  const [editing, setEditing] = useState<FamilyMember | 'new' | null>(null);

  useEffect(() => {
    if (!user) return;
    return watchMembers(user.uid, setRows);
  }, [user]);

  return (
    <AccountShell
      title="Family members"
      description="Add the people you book tests for, so you can pick them when booking and keep their reports in one account."
      actions={
        editing === null && (
          <Button size="sm" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add member
          </Button>
        )
      }
    >
      {editing !== null && user && (
        <MemberForm
          uid={user.uid}
          initial={editing === 'new' ? null : editing}
          onDone={() => setEditing(null)}
        />
      )}

      {rows === null ? (
        <Panel>
          <p className="text-ink-muted">Loading…</p>
        </Panel>
      ) : rows.length === 0 && editing === null ? (
        <EmptyPanel title="No family members added">Add a member to book tests for them.</EmptyPanel>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {rows.map((m) => {
            const age = ageFrom(m.dob);
            return (
              <li key={m.id} className="flex items-start gap-4 rounded-3xl bg-white p-5 ring-1 ring-ink-line">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{m.name}</p>
                  <p className="text-[13.5px] text-ink-muted">
                    {[m.relation, m.gender && m.gender[0].toUpperCase() + m.gender.slice(1), age !== null ? `${age} yrs` : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <RowActions
                  label={m.name}
                  onEdit={() => setEditing(m)}
                  onDelete={() => user && deleteMember(user.uid, m.id)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </AccountShell>
  );
}

function MemberForm({ uid, initial, onDone }: { uid: string; initial: FamilyMember | null; onDone: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [relation, setRelation] = useState(initial?.relation ?? '');
  const [gender, setGender] = useState<Gender>(initial?.gender ?? '');
  const [dob, setDob] = useState(initial?.dob ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const today = localDateIso();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Enter the member’s full name.');
    if (!relation) return setError('Choose how they are related to you.');
    if (dob && dob > today) return setError('Date of birth cannot be in the future.');
    setBusy(true);
    try {
      await saveMember(uid, {
        ...(initial ? { id: initial.id, createdAt: initial.createdAt } : {}),
        name: name.trim(),
        relation,
        gender,
        dob,
      });
      onDone();
    } catch {
      setError('Could not save. Please try again.');
      setBusy(false);
    }
  };

  return (
    <Panel className="mb-2">
      <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
        <TextField label="Full name" maxLength={100} required value={name} onChange={(e) => setName(e.target.value)} className="sm:col-span-2" />
        <SelectField label="Relation" required options={RELATIONS} value={relation} onValueChange={setRelation} placeholder="Select" />
        <SelectField label="Gender" options={GENDER_OPTIONS} value={gender} onValueChange={(v) => setGender(v as Gender)} placeholder="Select" />
        <TextField label="Date of birth" type="date" max={today} value={dob} onChange={(e) => setDob(e.target.value)} />
        <FormButtons busy={busy} error={error} onCancel={onDone} />
      </form>
    </Panel>
  );
}

/* ---------------------------------------------------------------- addresses */

export function AccountAddresses() {
  const { user } = useAuth();
  const [rows, setRows] = useState<SavedAddress[] | null>(null);
  const [editing, setEditing] = useState<SavedAddress | 'new' | null>(null);

  useEffect(() => {
    if (!user) return;
    return watchAddresses(user.uid, setRows);
  }, [user]);

  return (
    <AccountShell
      title="Addresses"
      description="Saved addresses fill in the booking form for you."
      actions={
        editing === null && (
          <Button size="sm" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add address
          </Button>
        )
      }
    >
      {editing !== null && user && (
        <AddressForm uid={user.uid} initial={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
      )}

      {rows === null ? (
        <Panel>
          <p className="text-ink-muted">Loading…</p>
        </Panel>
      ) : rows.length === 0 && editing === null ? (
        <EmptyPanel title="No saved addresses">Add your home or office address for quicker booking.</EmptyPanel>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {rows.map((a) => (
            <li key={a.id} className="flex items-start gap-4 rounded-3xl bg-white p-5 ring-1 ring-ink-line">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-mint-50 text-mint-600">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink">{a.label}</p>
                <p className="text-[13.5px] leading-relaxed text-ink-muted">{formatAddress(a)}</p>
              </div>
              <RowActions
                label={a.label}
                onEdit={() => setEditing(a)}
                onDelete={() => user && deleteAddress(user.uid, a.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}

function AddressForm({ uid, initial, onDone }: { uid: string; initial: SavedAddress | null; onDone: () => void }) {
  const [form, setForm] = useState({
    label: initial?.label ?? 'Home',
    line: initial?.line ?? '',
    landmark: initial?.landmark ?? '',
    city: initial?.city ?? '',
    pincode: initial?.pincode ?? '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.line.trim().length < 8) return setError('Enter the house number, street and area.');
    if (!form.city.trim()) return setError('Enter the city.');
    if (!/^\d{6}$/.test(form.pincode)) return setError('Enter a 6-digit PIN code.');
    setBusy(true);
    try {
      await saveAddress(uid, {
        ...(initial ? { id: initial.id, createdAt: initial.createdAt } : {}),
        label: form.label.trim() || 'Home',
        line: form.line.trim(),
        landmark: form.landmark.trim(),
        city: form.city.trim(),
        pincode: form.pincode,
      });
      onDone();
    } catch {
      setError('Could not save. Please try again.');
      setBusy(false);
    }
  };

  return (
    <Panel className="mb-2">
      <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Save as"
          options={['Home', 'Office', 'Other'].map((v) => ({ value: v, label: v }))}
          value={form.label}
          onValueChange={(v) => set('label', v)}
        />
        <TextField label="PIN code" inputMode="numeric" maxLength={6} required value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/[^\d]/g, ''))} />
        <TextAreaField label="House no., street, area" maxLength={400} required value={form.line} onChange={(e) => set('line', e.target.value)} className="sm:col-span-2" />
        <TextField label="Landmark" maxLength={120} value={form.landmark} onChange={(e) => set('landmark', e.target.value)} />
        <TextField label="City" maxLength={80} required value={form.city} onChange={(e) => set('city', e.target.value)} />
        <FormButtons busy={busy} error={error} onCancel={onDone} />
      </form>
    </Panel>
  );
}

/* ------------------------------------------------------------------ shared */

function FormButtons({ busy, error, onCancel }: { busy: boolean; error: string; onCancel: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
      <Button type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'Save'}
      </Button>
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      {error && (
        <p role="alert" className="text-[13px] font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

function RowActions({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 gap-1">
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${label}`}
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-mist hover:text-brand-600"
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => {
          if (window.confirm(`Delete ${label}?`)) onDelete();
        }}
        aria-label={`Delete ${label}`}
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-rose-50 hover:text-rose-600"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
