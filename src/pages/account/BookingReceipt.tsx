import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAccountSeo } from '@/components/account/AccountShell';
import { SITE_CONFIG } from '@/config/site';
import { formatDate, formatPrice } from '@/lib/format';
import { formatStamp } from '@/pages/account/AccountBookings';
import { BOOKING_STATUS_LABEL, type Booking } from '@/types/account';

/**
 * A printable booking receipt: who, what, when, how much, and whether it has
 * been paid. Readable by the patient who booked and by lab admins — the
 * security rules decide, so this page needs no role checks of its own.
 */
export default function BookingReceipt() {
  useAccountSeo('Booking receipt');
  const { id = '' } = useParams();
  const [booking, setBooking] = useState<Booking | null | 'missing'>(null);

  useEffect(() => {
    getDoc(doc(db, 'bookings', id))
      .then((snap) => setBooking(snap.exists() ? (snap.data() as Booking) : 'missing'))
      .catch(() => setBooking('missing'));
  }, [id]);

  if (booking === null) return <p className="px-6 pt-40 text-center text-ink-muted">Loading receipt…</p>;
  if (booking === 'missing') {
    return (
      <div className="px-6 pt-40 text-center">
        <p className="font-semibold text-ink">This receipt is not available.</p>
        <Link to="/account/bookings" className="mt-3 inline-block font-semibold text-brand-600 hover:underline">
          Back to my bookings
        </Link>
      </div>
    );
  }

  const b = booking;
  const paid = b.payment.status === 'paid';

  return (
    <div className="mx-auto max-w-2xl px-5 pb-20 pt-[110px] print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link to="/account/bookings" className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink-muted hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          My bookings
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-[14px] font-semibold text-white hover:bg-brand-600"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print / save as PDF
        </button>
      </div>

      <article className="rounded-3xl bg-white p-8 ring-1 ring-ink-line print:rounded-none print:ring-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-line pb-6">
          <div>
            <img src="/brand/healthcare-labs-logo-460.png" alt={SITE_CONFIG.brandName} className="h-8 w-auto" />
            <p className="mt-3 text-[12.5px] leading-relaxed text-ink-muted">
              {SITE_CONFIG.legalName}
              <br />
              {SITE_CONFIG.address.full}
              <br />
              {SITE_CONFIG.phoneDisplay} · {SITE_CONFIG.email}
            </p>
          </div>
          <div className="text-right">
            <h1 className="text-[22px] font-extrabold text-ink">{paid ? 'Receipt' : 'Booking confirmation'}</h1>
            <p className="mt-1 font-mono text-[13px] text-ink-muted">#{b.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-[13px] text-ink-muted">Booked {formatDate(b.createdAt)}</p>
          </div>
        </header>

        <dl className="grid gap-4 py-6 text-[14px] sm:grid-cols-2">
          <Row label="Patient" value={b.patientName} />
          <Row label="Mobile" value={`+91 ${b.phone}`} />
          <Row label="Visit" value={`${formatDate(b.preferredDate)}, ${b.preferredTime}`} />
          <Row label="Status" value={BOOKING_STATUS_LABEL[b.status]} />
          <Row label="Collection address" value={`${b.address}, ${b.pincode}`} wide />
          {b.sampleId && <Row label="Sample ID" value={`${b.sampleId} (collected ${formatStamp(b.collectedAt)})`} wide />}
        </dl>

        <table className="w-full border-t border-ink-line text-[14px]">
          <thead>
            <tr className="text-left text-[12px] uppercase tracking-[0.08em] text-ink-soft">
              <th className="py-3 font-semibold" colSpan={2}>Tests booked</th>
            </tr>
          </thead>
          <tbody>
            {(b.packageNames.length ? b.packageNames : ['Home collection — tests to be confirmed']).map((n) => (
              <tr key={n} className="border-t border-ink-line">
                <td className="py-2.5 text-ink" colSpan={2}>{n}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-ink">
              <td className="py-3 font-bold text-ink">Total at booking</td>
              <td className="py-3 text-right font-bold tabular-nums text-ink">{b.total > 0 ? formatPrice(b.total) : 'Confirmed by the lab'}</td>
            </tr>
            <tr>
              <td className="py-1 text-ink-muted">{paid ? `Paid by ${b.payment.mode.toUpperCase()} on ${formatStamp(b.payment.paidAt)}` : 'Payment due at collection'}</td>
              <td className="py-1 text-right font-semibold tabular-nums text-ink">{paid ? formatPrice(b.payment.amountPaid) : ''}</td>
            </tr>
          </tbody>
        </table>

        <p className="mt-8 text-[12px] leading-relaxed text-ink-soft">
          The total is what the lab quoted when you booked. Keep this {paid ? 'receipt' : 'confirmation'} for your
          records.
        </p>
      </article>
    </div>
  );
}

function Row({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-soft">{label}</dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  );
}
