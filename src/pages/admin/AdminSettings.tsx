import { useRef, useState } from 'react';
import { Download, RotateCcw, Upload } from 'lucide-react';
import { AdminShell, useAdminSeo, useConfirm } from '@/components/admin/AdminShell';
import { Button } from '@/components/common/Button';
import { useContent } from '@/store/content';
import { SITE_CONFIG } from '@/config/site';
import { STORAGE_KEYS, storage } from '@/lib/storage';

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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---- Data management ---- */}
        <section className="rounded-xl border border-ink-line bg-white p-6 sm:p-7">
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
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
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
          <section className="rounded-xl border border-ink-line bg-white p-6 sm:p-7">
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

          <section className="rounded-xl border border-ink-line bg-white p-6 sm:p-7">
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
