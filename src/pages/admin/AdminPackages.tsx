import { useMemo, useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  AdminEmpty,
  AdminModal,
  AdminShell,
  AdminToolbar,
  useAdminSeo,
  useConfirm,
} from '@/components/admin/AdminShell';
import { Button } from '@/components/common/Button';
import { SelectField, TextAreaField, TextField } from '@/components/common/Form';
import { Badge } from '@/components/common/Primitives';
import { useContent } from '@/store/content';
import { createId, formatPrice, slugify } from '@/lib/format';
import { HEALTH_CONCERNS } from '@/data/healthConcerns';
import type { ConcernId, HealthPackage } from '@/types';

const BLANK: HealthPackage = {
  id: '',
  slug: '',
  name: '',
  summary: '',
  overview: '',
  tests: [],
  price: null,
  offerPrice: null,
  concerns: [],
  suitableFor: [],
  preparation: [],
  homeCollection: true,
  reportTime: 'Within 24 hours',
  featured: false,
};

export default function AdminPackages() {
  useAdminSeo('Packages');
  const { packages, savePackage, deletePackage } = useContent();
  const { confirm, dialog } = useConfirm();

  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<HealthPackage | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return packages
      .filter((p) => (showArchived ? true : !p.archived))
      .filter((p) => !q || `${p.name} ${p.summary} ${p.tests.join(' ')}`.toLowerCase().includes(q));
  }, [packages, query, showArchived]);

  return (
    <AdminShell
      title="Packages"
      description="Edit the health package catalogue held in this browser. Changes appear immediately across the public site."
      actions={
        <Button size="md" onClick={() => setEditing({ ...BLANK })}>
          <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          New package
        </Button>
      }
    >
      <AdminToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Search packages by name or test…"
        right={
          <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-medium text-ink-muted">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 rounded border-ink-line text-brand-500 focus:ring-2 focus:ring-brand-300"
            />
            Show archived
          </label>
        }
      />

      {rows.length === 0 ? (
        <AdminEmpty message="No packages match that search." />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white shadow-soft ring-1 ring-brand-50">
          <table className="w-full min-w-[760px] text-left">
            <caption className="sr-only">Health packages</caption>
            <thead>
              <tr className="border-b border-ink-line text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                <th scope="col" className="px-5 py-3.5">Package</th>
                <th scope="col" className="px-5 py-3.5">Tests</th>
                <th scope="col" className="px-5 py-3.5">Price</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-line">
              {rows.map((p) => (
                <tr key={p.id} className="align-middle transition-colors hover:bg-mist">
                  <td className="px-5 py-4">
                    <span className="block text-[14.5px] font-semibold text-ink">{p.name}</span>
                    <span className="mt-0.5 block font-mono text-[11.5px] text-ink-soft">
                      /{p.slug}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[14px] tabular-nums text-ink-muted">
                    {p.tests.length}
                  </td>
                  <td className="px-5 py-4 text-[14px] tabular-nums text-ink-muted">
                    {p.offerPrice !== null ? formatPrice(p.offerPrice) : 'On request'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {p.featured && <Badge tone="brand">Featured</Badge>}
                      {p.archived && <Badge tone="warn">Archived</Badge>}
                      {!p.featured && !p.archived && <Badge tone="neutral">Live</Badge>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1.5">
                      <IconButton label={`Edit ${p.name}`} onClick={() => setEditing({ ...p })}>
                        <Pencil className="h-4 w-4" strokeWidth={2} />
                      </IconButton>
                      <IconButton
                        label={p.archived ? `Restore ${p.name}` : `Archive ${p.name}`}
                        onClick={() => savePackage({ ...p, archived: !p.archived })}
                      >
                        {p.archived ? (
                          <ArchiveRestore className="h-4 w-4" strokeWidth={2} />
                        ) : (
                          <Archive className="h-4 w-4" strokeWidth={2} />
                        )}
                      </IconButton>
                      <IconButton
                        label={`Delete ${p.name}`}
                        danger
                        onClick={() =>
                          confirm(
                            `Delete “${p.name}” permanently? Archiving keeps it out of the public site without losing it.`,
                            () => deletePackage(p.id),
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <PackageEditor
          value={editing}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            savePackage(next);
            setEditing(null);
          }}
        />
      )}

      {dialog}
    </AdminShell>
  );
}

function PackageEditor({
  value,
  onClose,
  onSave,
}: {
  value: HealthPackage;
  onClose: () => void;
  onSave: (p: HealthPackage) => void;
}) {
  const [draft, setDraft] = useState<HealthPackage>(value);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof HealthPackage>(key: K, v: HealthPackage[K]) =>
    setDraft((d) => ({ ...d, [key]: v }));

  const toggleConcern = (id: ConcernId) =>
    setDraft((d) => ({
      ...d,
      concerns: d.concerns.includes(id)
        ? d.concerns.filter((c) => c !== id)
        : [...d.concerns, id],
    }));

  const submit = () => {
    if (!draft.name.trim()) {
      setError('A package needs a name.');
      return;
    }
    const slug = draft.slug.trim() || slugify(draft.name);
    onSave({
      ...draft,
      id: draft.id || createId('pkg'),
      slug,
      name: draft.name.trim(),
      tests: draft.tests.filter(Boolean),
    });
  };

  const numeric = (raw: string): number | null => {
    const v = raw.trim();
    if (v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  return (
    <AdminModal
      open
      onClose={onClose}
      title={value.id ? `Edit ${value.name}` : 'New package'}
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
            Save package
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
        <TextField
          label="Name"
          required
          className="sm:col-span-2"
          value={draft.name}
          onChange={(e) => set('name', e.target.value)}
        />
        <TextField
          label="Slug"
          className="sm:col-span-2"
          value={draft.slug}
          hint="Leave blank to generate from the name."
          onChange={(e) => set('slug', e.target.value)}
        />
        <TextAreaField
          label="Summary"
          className="sm:col-span-2"
          rows={2}
          value={draft.summary}
          onChange={(e) => set('summary', e.target.value)}
        />
        <TextAreaField
          label="Overview"
          className="sm:col-span-2"
          rows={4}
          value={draft.overview}
          onChange={(e) => set('overview', e.target.value)}
        />
        <TextField
          label="Original price (₹)"
          type="number"
          inputMode="numeric"
          value={draft.price ?? ''}
          onChange={(e) => set('price', numeric(e.target.value))}
          hint="Leave blank for on-request pricing."
        />
        <TextField
          label="Offer price (₹)"
          type="number"
          inputMode="numeric"
          value={draft.offerPrice ?? ''}
          onChange={(e) => set('offerPrice', numeric(e.target.value))}
        />
        <TextField
          label="Report time"
          value={draft.reportTime}
          onChange={(e) => set('reportTime', e.target.value)}
        />
        <SelectField
          label="Home collection"
          value={draft.homeCollection ? 'yes' : 'no'}
          onValueChange={(v) => set('homeCollection', v === 'yes')}
          options={[
            { value: 'yes', label: 'Available' },
            { value: 'no', label: 'Centre visit required' },
          ]}
        />
        <TextAreaField
          label="Included tests"
          className="sm:col-span-2"
          rows={6}
          hint="One test per line."
          value={draft.tests.join('\n')}
          onChange={(e) => set('tests', e.target.value.split('\n'))}
        />
        <TextAreaField
          label="Preparation steps"
          className="sm:col-span-2"
          rows={3}
          hint="One step per line."
          value={draft.preparation.join('\n')}
          onChange={(e) => set('preparation', e.target.value.split('\n').filter(Boolean))}
        />
        <TextAreaField
          label="Suitable for"
          className="sm:col-span-2"
          rows={2}
          hint="One audience tag per line."
          value={draft.suitableFor.join('\n')}
          onChange={(e) => set('suitableFor', e.target.value.split('\n').filter(Boolean))}
        />

        <fieldset className="sm:col-span-2">
          <legend className="mb-2 block text-[13px] font-semibold text-ink">Health concerns</legend>
          <div className="flex flex-wrap gap-2">
            {HEALTH_CONCERNS.map((c) => {
              const on = draft.concerns.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleConcern(c.id)}
                  aria-pressed={on}
                  className={
                    on
                      ? 'rounded-lg border border-brand-500 bg-brand-500 px-3 py-1.5 text-[13px] font-semibold text-white'
                      : 'rounded-lg border border-ink-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:border-brand-200 hover:text-brand-600'
                  }
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-medium text-ink sm:col-span-2">
          <input
            type="checkbox"
            checked={draft.featured}
            onChange={(e) => set('featured', e.target.checked)}
            className="h-4 w-4 rounded border-ink-line text-brand-500 focus:ring-2 focus:ring-brand-300"
          />
          Feature on the homepage
        </label>
      </div>
    </AdminModal>
  );
}

export function IconButton({
  label,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        danger
          ? 'flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-ink-soft transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500'
          : 'flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-ink-soft transition-colors hover:border-ink-line hover:bg-mist hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500'
      }
    >
      {children}
    </button>
  );
}
