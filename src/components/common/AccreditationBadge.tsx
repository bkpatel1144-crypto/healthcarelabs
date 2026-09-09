import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';
import { ACCREDITATION } from '@/data/accreditation';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';

/**
 * Accreditation badge, driven entirely by `SITE_CONFIG.accreditations`.
 *
 * Two deliberate choices here:
 *
 *  - It renders the official emblem when `logo` resolves, and falls back to a
 *    typographic badge with a plain UI shield when it does not. The fallback
 *    never draws an invented seal: forging something that reads as an official
 *    accreditation mark is not a design decision anyone should make, and the
 *    real claim carries fine on the certificate number alone.
 *  - The certificate number is always shown next to the label. An
 *    accreditation claim without its number is unverifiable, which is exactly
 *    what makes it worth doubting.
 */

type Variant = 'dark' | 'light' | 'compact';

export function AccreditationBadge({
  /*
    Defaults to the light treatment. It defaulted to 'dark' while the site was
    navy; once the footer went light a bare <AccreditationBadge /> there
    rendered white text on a white card. The light ground is now the common
    case, so the default should be the safe one.
  */
  variant = 'light',
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const accreditation = SITE_CONFIG.accreditations[0];

  // No evidenced accreditation configured: render nothing at all.
  if (!accreditation) return null;

  const { label, registrationNumber, scope, logo } = accreditation;
  const showLogo = Boolean(logo) && !logoFailed;

  const shells: Record<Variant, string> = {
    dark: 'glass-dark',
    light: 'bg-white ring-1 ring-inset ring-ink-line',
    compact: 'bg-brand-50 ring-1 ring-inset ring-brand-200',
  };

  const labelTone: Record<Variant, string> = {
    dark: 'text-white',
    light: 'text-ink',
    compact: 'text-brand-800',
  };

  const metaTone: Record<Variant, string> = {
    dark: 'text-brand-300',
    light: 'text-ink-muted',
    compact: 'text-brand-700',
  };

  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5',
          shells.compact,
          className,
        )}
      >
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand-600" strokeWidth={2.4} aria-hidden="true" />
        <span className={cn('text-[11px] font-bold uppercase tracking-[0.1em]', labelTone.compact)}>
          {label}
        </span>
        <span className={cn('font-mono text-[11px] tabular-nums', metaTone.compact)}>
          {registrationNumber}
        </span>
      </span>
    );
  }

  return (
    <div
      className={cn('inline-flex items-center gap-3.5 rounded-xl px-4 py-3', shells[variant], className)}
    >
      {showLogo ? (
        <img
          src={logo}
          alt={`${label}, certificate ${registrationNumber}`}
          width={44}
          height={44}
          loading="lazy"
          onError={() => setLogoFailed(true)}
          className={cn(
            'h-11 w-11 shrink-0 object-contain',
            // The official emblem is dark blue on white, so it needs a plate
            // of its own on a dark ground.
            variant === 'dark' && 'rounded-md bg-white p-1',
          )}
        />
      ) : (
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
            variant === 'dark'
              ? 'bg-brand-500/15 text-brand-300 ring-1 ring-inset ring-brand-400/25'
              : 'bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100',
          )}
        >
          <ShieldCheck className="h-[22px] w-[22px]" strokeWidth={2} aria-hidden="true" />
        </span>
      )}

      <span className="min-w-0">
        <span
          className={cn(
            'block text-[13.5px] font-bold leading-tight tracking-[-0.01em]',
            labelTone[variant],
          )}
        >
          {label}
        </span>
        <span className={cn('mt-1 block font-mono text-[11.5px] tabular-nums', metaTone[variant])}>
          {registrationNumber}
          {scope && <span className="opacity-70"> · {scope}</span>}
        </span>
        <span
          className={cn(
            'mt-0.5 block text-[11px]',
            variant === 'dark' ? 'text-slate-500' : 'text-ink-soft',
          )}
        >
          Awarded{' '}
          {formatDate(ACCREDITATION.ceremony.date, { month: 'short', year: 'numeric' })}
        </span>
      </span>
    </div>
  );
}

/** Inline pill for tight spaces — the hero eyebrow row, package cards. */
export function AccreditationPill({ className }: { className?: string }) {
  const accreditation = SITE_CONFIG.accreditations[0];
  if (!accreditation) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 rounded-full bg-brand-500/15 px-3.5 py-2 ring-1 ring-inset ring-brand-400/30',
        className,
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand-300" strokeWidth={2.4} aria-hidden="true" />
      <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-200">
        {accreditation.label}
      </span>
      <span className="font-mono text-[11px] tabular-nums text-brand-300/80">
        {accreditation.registrationNumber}
      </span>
    </span>
  );
}
