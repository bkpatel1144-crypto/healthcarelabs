import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, FileImage, Loader2, LogIn, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import {
  SelectField,
  TextAreaField,
  TextField,
  isValidEmail,
  isValidPhone,
  type SelectOption,
} from '@/components/common/Form';
import { useAuth } from '@/store/auth';
import { SITE_CONFIG } from '@/config/site';
import type { RequestType } from '@/types/account';

/**
 * One form behind every "send the lab something" page: support, partnership
 * enquiries, prescriptions. Each lands in Firestore `requests` and in the
 * staff inbox at /admin/requests; a logged-in sender also sees the lab's reply
 * under My requests.
 *
 * Firebase is imported when the form is submitted, not when the page loads.
 */
export function RequestForm({
  type,
  topics,
  topicLabel = 'Topic',
  messageLabel = 'Message',
  messagePlaceholder,
  messageRequired = true,
  file = 'none',
  submitLabel = 'Send',
  success,
}: {
  type: RequestType;
  topics?: SelectOption[];
  topicLabel?: string;
  messageLabel?: string;
  messagePlaceholder?: string;
  messageRequired?: boolean;
  /** 'required' also requires login — anonymous uploads are refused by the rules. */
  file?: 'none' | 'required';
  submitLabel?: string;
  success: ReactNode;
}) {
  const { status, user, profile } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', phone: '', email: '', topic: '', message: '' });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sent, setSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Prefill untouched fields only — see HomeCollectionForm for why.
  const touched = useRef(new Set<string>());
  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({
      ...f,
      name: touched.current.has('name') ? f.name : f.name || profile.name,
      phone: touched.current.has('phone') ? f.phone : f.phone || profile.phone,
      email: touched.current.has('email') ? f.email : f.email || profile.email,
    }));
  }, [profile]);

  const set = (k: keyof typeof form, v: string) => {
    touched.current.add(k);
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const needsLogin = file === 'required' && status !== 'signed-in';
  const loginHref = `/login?next=${encodeURIComponent(location.pathname)}`;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = 'Please enter your full name.';
    if (!isValidPhone(form.phone)) next.phone = 'Enter a valid 10-digit mobile number.';
    if (form.email.trim() && !isValidEmail(form.email)) next.email = 'That email does not look right.';
    if (topics && !form.topic) next.topic = `Choose a ${topicLabel.toLowerCase()}.`;
    if (messageRequired && form.message.trim().length < 10) next.message = 'A little more detail helps us answer properly.';
    if (file === 'required' && !attachment) next.file = 'Attach a photo or PDF.';
    if (Object.values(next).some(Boolean)) {
      setErrors(next);
      return;
    }

    setBusy(true);
    setSendError('');
    try {
      const api = await import('@/lib/accountApi');
      const prepared = attachment ? await api.prepareAttachment(attachment) : undefined;
      await api.createRequest(
        {
          type,
          uid: user?.uid ?? null,
          name: form.name.trim(),
          phone: api.localPhone(form.phone),
          email: form.email.trim(),
          topic: form.topic,
          message: form.message.trim(),
        },
        prepared,
      );
      setSent(true);
      setAttachment(null);
      setForm((f) => ({ ...f, topic: '', message: '' }));
    } catch (err) {
      console.error(err);
      setSendError(
        err instanceof Error && /Upload|larger/.test(err.message)
          ? err.message
          : `This could not be sent. Check your connection, or call ${SITE_CONFIG.phoneDisplay}.`,
      );
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div role="status" className="rounded-3xl bg-mint-50/60 p-7 ring-1 ring-mint-100 sm:p-9">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-mint-600 ring-1 ring-mint-100">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="mt-5 text-[15.5px] leading-relaxed text-ink">{success}</div>
        <p className="mt-4 text-[14px] text-ink-muted">
          {user ? (
            <>
              Track it and read the lab’s reply under{' '}
              <Link to="/account/requests" className="font-semibold text-brand-600 hover:underline">
                My requests
              </Link>
              .
            </>
          ) : (
            <>The lab will reply on the number you gave.</>
          )}
        </p>
        <Button variant="secondary" size="sm" className="mt-6" onClick={() => setSent(false)}>
          Send another
        </Button>
      </div>
    );
  }

  if (needsLogin) {
    return (
      <div className="rounded-3xl bg-white p-7 text-center ring-1 ring-ink-line sm:p-9">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <LogIn className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="mt-4 text-[17px] font-bold text-ink">Log in to upload</p>
        <p className="mx-auto mt-2 max-w-sm text-[14.5px] text-ink-muted">
          Files are kept in your account so only you and the lab can see them. Logging in takes a
          mobile OTP.
        </p>
        <Button to={loginHref} className="mt-6" disabled={status === 'loading'}>
          {status === 'loading' ? 'Checking…' : 'Log in with mobile OTP'}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 rounded-3xl bg-white p-6 ring-1 ring-ink-line sm:grid-cols-2 sm:p-8">
      <TextField label="Full name" name="name" maxLength={100} required autoComplete="name" value={form.name} error={errors.name} onChange={(e) => set('name', e.target.value)} />
      <TextField label="Mobile number" name="phone" required type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={form.phone} error={errors.phone} onChange={(e) => set('phone', e.target.value.replace(/[^\d]/g, ''))} />
      <TextField label="Email" name="email" type="email" maxLength={200} autoComplete="email" hint="Optional" value={form.email} error={errors.email} onChange={(e) => set('email', e.target.value)} className={topics ? undefined : 'sm:col-span-2'} />
      {topics && (
        <SelectField label={topicLabel} required options={topics} value={form.topic} error={errors.topic} onValueChange={(v) => set('topic', v)} placeholder="Choose one" />
      )}

      {file === 'required' && (
        <div className="sm:col-span-2">
          <p className="mb-2 block text-[13px] font-semibold text-ink">
            Prescription <span className="text-rose-500">*</span>
          </p>
          {attachment ? (
            <div className="flex items-center gap-3 rounded-xl border border-ink-line bg-mist px-4 py-3">
              <FileImage className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{attachment.name}</span>
              <button type="button" onClick={() => setAttachment(null)} aria-label="Remove file" className="rounded-full p-1 text-ink-muted hover:text-rose-600">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 px-4 py-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-50"
            >
              <Paperclip className="h-6 w-6 text-brand-600" aria-hidden="true" />
              <span className="text-[14.5px] font-semibold text-ink">Take a photo or choose a file</span>
              <span className="text-[12.5px] text-ink-soft">JPG, PNG, WebP or PDF · large photos are compressed automatically</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              setAttachment(e.target.files?.[0] ?? null);
              setErrors((x) => ({ ...x, file: '' }));
              e.target.value = '';
            }}
          />
          {errors.file && <p role="alert" className="mt-2 text-[12.5px] font-medium text-rose-600">{errors.file}</p>}
        </div>
      )}

      <TextAreaField
        label={messageLabel}
        maxLength={2000}
        name="message"
        required={messageRequired}
        rows={4}
        value={form.message}
        error={errors.message}
        onChange={(e) => set('message', e.target.value)}
        placeholder={messagePlaceholder}
        className="sm:col-span-2"
        hint={messageRequired ? undefined : 'Optional'}
      />

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Button type="submit" size="lg" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {busy ? 'Sending…' : submitLabel}
        </Button>
        {sendError && <p role="alert" className="text-[13.5px] font-medium text-rose-600">{sendError}</p>}
      </div>
    </form>
  );
}
