import { useEffect, useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { AccountShell, EmptyPanel, Panel } from '@/components/account/AccountShell';
import { Button } from '@/components/common/Button';
import { downloadReport, watchReports } from '@/lib/accountApi';
import { useAuth } from '@/store/auth';
import { formatDate } from '@/lib/format';
import type { LabReport } from '@/types/account';

export function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AccountReports() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LabReport[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    // Superseded versions stay on record but are not offered for download.
    return watchReports({ uid: user.uid }, (r) => setRows(r.filter((x) => !x.superseded)), () =>
      setError('Could not load your reports. Please refresh the page.'),
    );
  }, [user]);

  return (
    <AccountShell
      title="My reports"
      description="Reports appear here as soon as the lab signs them off. Only you and the lab can see them."
    >
      {error ? (
        <Panel>
          <p role="alert" className="text-rose-600">{error}</p>
        </Panel>
      ) : rows === null ? (
        <Panel>
          <p className="text-ink-muted">Loading reports…</p>
        </Panel>
      ) : rows.length === 0 ? (
        <EmptyPanel title="No reports yet">
          Once your sample is processed, the lab uploads the report here and you can download it as a
          PDF.
        </EmptyPanel>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <ReportRow key={r.id} report={r} />
          ))}
        </ul>
      )}
    </AccountShell>
  );
}

function ReportRow({ report }: { report: LabReport }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-5 ring-1 ring-ink-line">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <FileText className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-ink">
          {report.title}
          {report.version > 1 && <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">Revised (v{report.version})</span>}
        </p>
        <p className="mt-0.5 text-[13px] text-ink-muted">
          {report.patientName} · {formatDate(report.uploadedAt)} · {formatBytes(report.sizeBytes)}
          {report.signedBy && <> · Signed by {report.signedBy}</>}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-[12.5px] text-rose-600">
            {error}
          </p>
        )}
      </div>
      <Button
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            await downloadReport(report);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Download failed.');
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
        Download PDF
      </Button>
    </li>
  );
}
