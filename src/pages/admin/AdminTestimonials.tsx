import { useMemo, useState } from 'react';
import { Archive, ArchiveRestore, Info, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import {
  AdminModal,
  AdminShell,
  AdminToolbar,
  useAdminSeo,
  useConfirm,
} from '@/components/admin/AdminShell';
import { IconButton } from './AdminPackages';
import { Button } from '@/components/common/Button';
import { SelectField, TextAreaField, TextField } from '@/components/common/Form';
import { Badge } from '@/components/common/Primitives';
import { useContent } from '@/store/content';
import { createId } from '@/lib/format';
import type { Testimonial } from '@/types';

const BLANK: Testimonial = {
  id: '',
  name: '',
  location: '',
  rating: 5,
  quote: '',
  packageName: '',
};

export default function AdminTestimonials() {
  useAdminSeo('Testimonials');
  const { testimonials, saveTestimonial, deleteTestimonial, packages } = useContent();
  const { confirm, dialog } = useConfirm();

  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Testimonial | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return testimonials.filter((t) => !q || `${t.name} ${t.quote}`.toLowerCase().includes(q));
  }, [testimonials, query]);

  return (
    <AdminShell
      title="Testimonials"
      description="Real, attributed patient feedback. While this list is empty the homepage shows the lab's published commitments instead."
      actions={
        <Button size="md" onClick={() => setEditing({ ...BLANK })}>
          <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          Add testimonial
        </Button>
      }
    >
      <div className="mb-6 flex gap-3 rounded-xl border border-brand-200 bg-brand-50/60 p-5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" strokeWidth={2} aria-hidden="true" />
        <div className="text-[14px] leading-relaxed text-ink-muted">
          <p className="font-semibold text-ink">Only add testimonials you actually received.</p>
          <p className="mt-1">
            This site ships with an empty list on purpose. Invented reviews are both dishonest and,
            for a medical business, a regulatory risk. Get written consent before publishing
            someone’s name alongside a health experience.
          </p>
        </div>
      </div>

      <AdminToolbar query={query} onQuery={setQuery} placeholder="Search testimonials…" />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-line bg-white px-6 py-16 text-center">
          <p className="text-[15px] font-semibold text-ink">No testimonials published.</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-ink-muted">
            The homepage is currently showing the laboratory’s vision, mission and quality
            statements. Adding a testimonial here switches that section to a carousel.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {rows.map((t) => (
            <li
              key={t.id}
              className="flex flex-col rounded-xl border border-ink-line bg-white p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-0.5" aria-label={`${t.rating} out of 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={i < t.rating ? 'h-4 w-4 text-amber-400' : 'h-4 w-4 text-ink-line'}
                      fill="currentColor"
                      strokeWidth={0}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                {t.archived && <Badge tone="warn">Archived</Badge>}
              </div>

              <blockquote className="mt-4 text-[15px] leading-relaxed text-ink">
                “{t.quote}”
              </blockquote>

              <p className="mt-4 text-[13.5px] text-ink-muted">
                <span className="font-semibold text-ink">{t.name}</span>
                {t.location && ` · ${t.location}`}
                {t.packageName && ` · ${t.packageName}`}
              </p>

              <div className="mt-auto flex justify-end gap-1.5 pt-5">
                <IconButton label={`Edit ${t.name}`} onClick={() => setEditing({ ...t })}>
                  <Pencil className="h-4 w-4" strokeWidth={2} />
                </IconButton>
                <IconButton
                  label={t.archived ? `Restore ${t.name}` : `Archive ${t.name}`}
                  onClick={() => saveTestimonial({ ...t, archived: !t.archived })}
                >
                  {t.archived ? (
                    <ArchiveRestore className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <Archive className="h-4 w-4" strokeWidth={2} />
                  )}
                </IconButton>
                <IconButton
                  label={`Delete ${t.name}`}
                  danger
                  onClick={() =>
                    confirm(`Delete the testimonial from ${t.name}?`, () => deleteTestimonial(t.id))
                  }
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <TestimonialEditor
          value={editing}
          packageNames={packages.map((p) => p.name)}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            saveTestimonial(next);
            setEditing(null);
          }}
        />
      )}

      {dialog}
    </AdminShell>
  );
}

function TestimonialEditor({
  value,
  packageNames,
  onClose,
  onSave,
}: {
  value: Testimonial;
  packageNames: string[];
  onClose: () => void;
  onSave: (t: Testimonial) => void;
}) {
  const [draft, setDraft] = useState<Testimonial>(value);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Testimonial>(key: K, v: Testimonial[K]) =>
    setDraft((d) => ({ ...d, [key]: v }));

  const submit = () => {
    if (!draft.name.trim() || !draft.quote.trim()) {
      setError('A testimonial needs both a name and a quote.');
      return;
    }
    onSave({ ...draft, id: draft.id || createId('tst'), name: draft.name.trim() });
  };

  return (
    <AdminModal
      open
      onClose={onClose}
      title={value.id ? `Edit testimonial` : 'Add testimonial'}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-ink-line px-4 text-[14px] font-semibold text-ink transition-colors hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            Cancel
          </button>
          <Button size="md" onClick={submit}>
            Save testimonial
          </Button>
        </>
      }
    >
      {error && (
        <p role="alert" className="mb-5 rounded-lg bg-rose-50 px-4 py-3 text-[13.5px] font-medium text-rose-700">
          {error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Name" required value={draft.name} onChange={(e) => set('name', e.target.value)} />
        <TextField
          label="Location"
          value={draft.location}
          placeholder="Surat"
          onChange={(e) => set('location', e.target.value)}
        />
        <SelectField
          label="Rating"
          value={String(draft.rating)}
          onValueChange={(v) => set('rating', Number(v))}
          options={[5, 4, 3, 2, 1].map((n) => ({
            value: String(n),
            label: n === 1 ? '1 star' : n + ' stars',
          }))}
        />
        <SelectField
          label="Package"
          value={draft.packageName ?? ''}
          onValueChange={(v) => set('packageName', v)}
          placeholder="Not specified"
          options={[
            { value: '', label: 'Not specified' },
            ...packageNames.map((n) => ({ value: n, label: n })),
          ]}
        />
        <TextAreaField
          label="Quote"
          required
          className="sm:col-span-2"
          rows={4}
          value={draft.quote}
          onChange={(e) => set('quote', e.target.value)}
        />
      </div>
    </AdminModal>
  );
}
