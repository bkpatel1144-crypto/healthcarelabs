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
import { IconButton } from './AdminPackages';
import { Button } from '@/components/common/Button';
import { SelectField, TextAreaField, TextField } from '@/components/common/Form';
import { Badge } from '@/components/common/Primitives';
import { useContent } from '@/store/content';
import { createId, formatDate, formatPrice, savingsPercent, slugify } from '@/lib/format';
import type { Offer } from '@/types';

const BLANK: Offer = {
  id: '',
  slug: '',
  title: '',
  description: '',
  packageSlug: '',
  originalPrice: null,
  offerPrice: null,
  validUntil: '',
  terms: [],
};

export default function AdminOffers() {
  useAdminSeo('Offers');
  const { offers, saveOffer, deleteOffer, packages } = useContent();
  const { confirm, dialog } = useConfirm();

  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offers
      .filter((o) => (showArchived ? true : !o.archived))
      .filter((o) => !q || `${o.title} ${o.description}`.toLowerCase().includes(q));
  }, [offers, query, showArchived]);

  return (
    <AdminShell
      title="Offers"
      description="Promotional pricing shown on /my-offers. A countdown appears on the public site only when an offer carries a real expiry date."
      actions={
        <Button size="md" onClick={() => setEditing({ ...BLANK })}>
          <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          New offer
        </Button>
      }
    >
      <AdminToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Search offers…"
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
        <AdminEmpty message="No offers match that search." />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white shadow-soft ring-1 ring-brand-50">
          <table className="w-full min-w-[760px] text-left">
            <caption className="sr-only">Offers</caption>
            <thead>
              <tr className="border-b border-ink-line text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                <th scope="col" className="px-5 py-3.5">Offer</th>
                <th scope="col" className="px-5 py-3.5">Pricing</th>
                <th scope="col" className="px-5 py-3.5">Valid until</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-line">
              {rows.map((o) => {
                const pct = savingsPercent(o.originalPrice, o.offerPrice);
                return (
                  <tr key={o.id} className="transition-colors hover:bg-mist">
                    <td className="px-5 py-4">
                      <span className="block text-[14.5px] font-semibold text-ink">{o.title}</span>
                      {o.highlight && (
                        <span className="mt-0.5 block text-[12px] text-brand-600">{o.highlight}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[14px] tabular-nums text-ink-muted">
                      {formatPrice(o.offerPrice)}
                      {o.originalPrice !== null && (
                        <span className="ml-2 text-ink-soft line-through">
                          {formatPrice(o.originalPrice)}
                        </span>
                      )}
                      {pct !== null && (
                        <span className="ml-2 font-semibold text-emerald-600">−{pct}%</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[14px] text-ink-muted">
                      {o.validUntil ? formatDate(o.validUntil) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {o.archived ? <Badge tone="warn">Archived</Badge> : <Badge tone="neutral">Live</Badge>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <IconButton label={`Edit ${o.title}`} onClick={() => setEditing({ ...o })}>
                          <Pencil className="h-4 w-4" strokeWidth={2} />
                        </IconButton>
                        <IconButton
                          label={o.archived ? `Restore ${o.title}` : `Archive ${o.title}`}
                          onClick={() => saveOffer({ ...o, archived: !o.archived })}
                        >
                          {o.archived ? (
                            <ArchiveRestore className="h-4 w-4" strokeWidth={2} />
                          ) : (
                            <Archive className="h-4 w-4" strokeWidth={2} />
                          )}
                        </IconButton>
                        <IconButton
                          label={`Delete ${o.title}`}
                          danger
                          onClick={() =>
                            confirm(`Delete the offer “${o.title}” permanently?`, () =>
                              deleteOffer(o.id),
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <OfferEditor
          value={editing}
          packageOptions={packages.map((p) => ({ slug: p.slug, name: p.name }))}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            saveOffer(next);
            setEditing(null);
          }}
        />
      )}

      {dialog}
    </AdminShell>
  );
}

function OfferEditor({
  value,
  packageOptions,
  onClose,
  onSave,
}: {
  value: Offer;
  packageOptions: { slug: string; name: string }[];
  onClose: () => void;
  onSave: (o: Offer) => void;
}) {
  const [draft, setDraft] = useState<Offer>(value);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Offer>(key: K, v: Offer[K]) =>
    setDraft((d) => ({ ...d, [key]: v }));

  const numeric = (raw: string): number | null => {
    const v = raw.trim();
    if (v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const submit = () => {
    if (!draft.title.trim()) {
      setError('An offer needs a title.');
      return;
    }
    onSave({
      ...draft,
      id: draft.id || createId('offer'),
      slug: draft.slug.trim() || slugify(draft.title),
      title: draft.title.trim(),
    });
  };

  return (
    <AdminModal
      open
      onClose={onClose}
      title={value.id ? `Edit ${value.title}` : 'New offer'}
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
            Save offer
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
          label="Title"
          required
          className="sm:col-span-2"
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
        />
        <TextAreaField
          label="Description"
          className="sm:col-span-2"
          rows={3}
          value={draft.description}
          onChange={(e) => set('description', e.target.value)}
        />
        <TextField
          label="Highlight label"
          value={draft.highlight ?? ''}
          hint="Short badge text, e.g. “Largest saving”."
          onChange={(e) => set('highlight', e.target.value)}
        />
        <SelectField
          label="Linked package"
          value={draft.packageSlug ?? ''}
          onValueChange={(v) => set('packageSlug', v)}
          placeholder="None"
          options={[
            { value: '', label: 'None' },
            ...packageOptions.map((p) => ({ value: p.slug, label: p.name })),
          ]}
        />
        <TextField
          label="Original price (₹)"
          type="number"
          inputMode="numeric"
          value={draft.originalPrice ?? ''}
          onChange={(e) => set('originalPrice', numeric(e.target.value))}
        />
        <TextField
          label="Offer price (₹)"
          type="number"
          inputMode="numeric"
          value={draft.offerPrice ?? ''}
          onChange={(e) => set('offerPrice', numeric(e.target.value))}
        />
        <TextField
          label="Valid until"
          type="date"
          className="sm:col-span-2"
          value={draft.validUntil}
          hint="Leave blank if there is no real deadline — the countdown will not be shown."
          onChange={(e) => set('validUntil', e.target.value)}
        />
        <TextAreaField
          label="Terms"
          className="sm:col-span-2"
          rows={4}
          hint="One term per line."
          value={draft.terms.join('\n')}
          onChange={(e) => set('terms', e.target.value.split('\n').filter(Boolean))}
        />
      </div>
    </AdminModal>
  );
}
