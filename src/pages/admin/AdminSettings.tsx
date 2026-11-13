import { useRef, useState } from 'react';
import { CloudUpload, Download, RotateCcw, Upload } from 'lucide-react';
import { AdminShell, useAdminSeo, useConfirm } from '@/components/admin/AdminShell';
import { Button } from '@/components/common/Button';
import { useContent } from '@/store/content';
import { SITE_CONFIG } from '@/config/site';
import { STORAGE_KEYS, storage } from '@/lib/storage';
import { publishCatalogue } from '@/lib/catalogueApi';

export default function AdminSettings() {
  useAdminSeo('Settings');
  const { exportJson, importJson, resetDemoData, preferences, setPreferences, storageAvailable } =
    useContent();
  const { confirm, dialog } = useConfirm();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);

  const download = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healthcare-labs-content-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMessage({ tone: 'ok', text: 'Export downloaded.' });
  };

  const onFile = async (file: File) => {
    try {
      const text = await file.text();
      const result = importJson(text);
      setMessage(
        result.ok
          ? { tone: 'ok', text: 'Import complete. The site now reflects the imported content.' }
          : { tone: 'bad', text: result.error ?? 'That file could not be imported.' },
      );
    } catch {
      setMessage({ tone: 'bad', text: 'That file could not be read.' });
    }
  };

  return (
    <AdminShell
      title="Settings"
      description="Move content between browsers, or put everything back the way it shipped."
    >
      {message && (
        <p
          role="status"
          className={
            message.tone === 'ok'
              ? 'mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-[14px] font-medium text-emerald-800'
              : 'mb-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-[14px] font-medium text-rose-800'
          }
        >
          {message.text}
        </p>
      )}

      {/* ---- Publishing ---- */}
      <PublishPanel />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---- Data management ---- */}
        <section className="rounded-3xl bg-white shadow-soft ring-1 ring-brand-50 p-6 sm:p-7">
          <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Data</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
            Everything lives in this browser. Export to move it to another machine, or import a file
            exported earlier.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button size="md" variant="secondary" onClick={download}>
              <Download className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Export JSON
            </Button>

            <Button size="md" variant="secondary" onClick={() => fileInput.current?.click()}>
              <Upload className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Import JSON
            </Button>
            {/*
              sr-only keeps this reachable by assistive tech rather than hiding
              it outright, so it needs its own name — the visible trigger is a
              separate button and does not label it.
            */}
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              aria-label="Choose a JSON file to import"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFile(file);
                e.target.value = '';
              }}
            />

            <Button
              size="md"
              variant="danger"
              onClick={() =>
                confirm(
                  'Reset everything to the content this site shipped with? Packages, offers, articles, testimonials, appointments and messages in this browser will all be replaced.',
                  () => {
                    resetDemoData();
                    setMessage({ tone: 'ok', text: 'All content has been reset.' });
                  },
                )
              }
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Reset to shipped data
            </Button>
          </div>

          <dl className="mt-7 space-y-2.5 border-t border-ink-line pt-6 text-[13px]">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-muted">Local storage</dt>
              <dd className="font-semibold text-ink">
                {storageAvailable ? 'Available' : 'Blocked — using memory'}
              </dd>
            </div>
            {Object.values(STORAGE_KEYS).map((key) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <dt className="font-mono text-[12px] text-ink-soft">{key}</dt>
                <dd className="text-ink-muted">{storage.has(key) ? 'set' : 'empty'}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---- Preferences + config ---- */}
        <div className="space-y-6">
          <section className="rounded-3xl bg-white shadow-soft ring-1 ring-brand-50 p-6 sm:p-7">
            <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Display</h2>
            <label className="mt-5 flex cursor-pointer items-start gap-3 text-[14.5px] text-ink">
              <input
                type="checkbox"
                checked={preferences.reducedEffects}
                onChange={(e) => setPreferences({ reducedEffects: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-ink-line text-brand-500 focus:ring-2 focus:ring-brand-300"
              />
              <span>
                <span className="block font-semibold">Prefer reduced effects</span>
                <span className="mt-1 block text-[13px] leading-relaxed text-ink-muted">
                  A stored preference for this browser. The 3D hero already honours the operating
                  system’s own reduced-motion setting independently of this.
                </span>
              </span>
            </label>

            <p className="mt-6 border-t border-ink-line pt-5 text-[13px] leading-relaxed text-ink-muted">
              Saved packages in this browser:{' '}
              <span className="font-semibold tabular-nums text-ink">
                {preferences.savedPackages.length}
              </span>
            </p>
          </section>

          <section className="rounded-3xl bg-white shadow-soft ring-1 ring-brand-50 p-6 sm:p-7">
            <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">
              Business information
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
              Contact details, hours and social links are compiled into the build from{' '}
              <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-[12.5px]">
                src/config/site.ts
              </code>
              . Edit that one file and redeploy — nothing is duplicated elsewhere in the codebase.
            </p>
            <dl className="mt-6 space-y-3 border-t border-ink-line pt-5 text-[13.5px]">
              <ConfigRow label="Brand" value={SITE_CONFIG.brandName} />
              <ConfigRow label="Legal name" value={SITE_CONFIG.legalName} />
              <ConfigRow label="Phone" value={SITE_CONFIG.phoneDisplay} />
              <ConfigRow label="Emergency line" value={SITE_CONFIG.emergencyLine} />
              <ConfigRow label="Email" value={SITE_CONFIG.email} />
              <ConfigRow label="WhatsApp" value={`+${SITE_CONFIG.whatsapp}`} />
              <ConfigRow label="Address" value={SITE_CONFIG.address.full} />
              <ConfigRow
                label="Accreditations"
                value={
                  SITE_CONFIG.accreditations.length > 0
                    ? SITE_CONFIG.accreditations.map((a) => a.label).join(', ')
                    : 'None published'
                }
              />
            </dl>
          </section>
        </div>
      </div>

      {dialog}
    </AdminShell>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

/**
 * Pushes the catalogue in this browser up to Firestore, where visitors read it.
 *
 * This exists because for a long time it did not, and the gap was invisible:
 * the admin panel edited a copy in the editor's own localStorage, so changing
 * a price changed it on that screen and nowhere else. The lab could believe a
 * price was live while every visitor still saw the old one.
 *
 * Edits now publish as they are made. This is for the one-time move of
 * whatever is already in this browser, and for forcing everything back up if
 * the two ever drift.
 */
function PublishPanel() {
  const { packages, posts, testimonials } = useContent();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setResult(null);
    setFailed(null);
    try {
      const counts = await Promise.all([
        publishCatalogue('packages', packages),
        publishCatalogue('posts', posts),
        publishCatalogue('testimonials', testimonials),
      ]);
      setResult(`${counts[0]} packages, ${counts[1]} posts, ${counts[2]} testimonials are now live.`);
    } catch (error) {
      /*
        Worth showing rather than swallowing: the usual causes are rules not
        deployed yet, or the signed-in account not being in the admins
        collection, and both are things the person reading this can fix.
      */
      setFailed(error instanceof Error ? error.message : 'Could not publish.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mb-6 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-brand-50 sm:p-7">
      <h2 className="flex items-center gap-2 text-[17px] font-bold tracking-[-0.02em] text-ink">
        <CloudUpload className="h-5 w-5 text-brand-600" aria-hidden="true" />
        Publish to the live site
      </h2>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
        Packages, blog posts and testimonials publish automatically as you edit them. Use this to
        push everything in this browser up at once — do it now if the catalogue has never been
        published, or later if the site and this panel ever disagree.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={() => void run()} disabled={busy}>
          {busy ? 'Publishing…' : 'Publish everything'}
        </Button>
        <span className="text-[13px] text-ink-soft">
          {packages.length} packages · {posts.length} posts · {testimonials.length} testimonials
        </span>
      </div>
      {result && (
        <p role="status" className="mt-3 text-[13.5px] font-semibold text-mint-600">{result}</p>
      )}
      {failed && (
        <p role="alert" className="mt-3 text-[13.5px] font-semibold text-coral-600">
          {failed} — check that firestore.rules is deployed and that you are signed in as an admin.
        </p>
      )}
    </section>
  );
}
