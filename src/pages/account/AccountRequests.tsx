import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquareReply, Paperclip, Plus } from 'lucide-react';
import { AccountShell, EmptyPanel, Panel } from '@/components/account/AccountShell';
import { Button } from '@/components/common/Button';
import { openAttachment, watchMyRequests } from '@/lib/accountApi';
import { useAuth } from '@/store/auth';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { REQUEST_STATUS_LABEL, REQUEST_TYPE_LABEL, type PatientRequest } from '@/types/account';

export default function AccountRequests() {
  const { user } = useAuth();
  const [rows, setRows] = useState<PatientRequest[] | null>(null);

  useEffect(() => {
    if (!user) return;
    return watchMyRequests(user.uid, setRows);
  }, [user]);

  return (
    <AccountShell
      title="My requests"
      description="Prescriptions, support questions and messages you’ve sent the lab, with their replies."
      actions={
        <>
          <Button to="/upload-prescription" size="sm" variant="secondary">
            <Paperclip className="h-4 w-4" aria-hidden="true" />
            Upload prescription
          </Button>
          <Button to="/help#support-form" size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New request
          </Button>
        </>
      }
    >
      {rows === null ? (
        <Panel>
          <p className="text-ink-muted">Loading…</p>
        </Panel>
      ) : rows.length === 0 ? (
        <EmptyPanel title="No requests yet">
          Need help? Visit{' '}
          <Link to="/help" className="font-semibold text-brand-600 hover:underline">
            Help &amp; Support
          </Link>
          .
        </EmptyPanel>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-3xl bg-white p-6 ring-1 ring-ink-line">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
                    {REQUEST_TYPE_LABEL[r.type]} · {formatDate(r.createdAt)}
                  </p>
                  <p className="mt-1 font-bold text-ink">{r.topic || REQUEST_TYPE_LABEL[r.type]}</p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-[12.5px] font-semibold',
                    r.status === 'resolved' ? 'bg-mint-50 text-mint-700' : 'bg-brand-50 text-brand-700',
                  )}
                >
                  {REQUEST_STATUS_LABEL[r.status]}
                </span>
              </div>
              {r.message && <p className="mt-3 whitespace-pre-line text-[14.5px] text-ink-muted">{r.message}</p>}
              {r.attachment && (
                <button
                  type="button"
                  onClick={() => void openAttachment(r).catch((e) => window.alert(e.message))}
                  className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-brand-600 hover:underline"
                >
                  <Paperclip className="h-4 w-4" aria-hidden="true" />
                  {r.attachment.fileName}
                </button>
              )}
              {r.reply && (
                <div className="mt-4 rounded-2xl bg-mint-50/70 p-4 ring-1 ring-mint-100">
                  <p className="flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-[0.08em] text-mint-700">
                    <MessageSquareReply className="h-4 w-4" aria-hidden="true" />
                    Reply from the lab
                  </p>
                  <p className="mt-1.5 whitespace-pre-line text-[14.5px] text-ink">{r.reply}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
