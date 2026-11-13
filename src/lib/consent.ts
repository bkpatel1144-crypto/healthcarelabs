/**
 * Cookie and storage consent.
 *
 * Built before there is anything to consent to, which is the right order. The
 * site sets no cookies of its own, carries no analytics and loads no tracking
 * pixel — grep for gtag, fbq or document.cookie and nothing comes back. So
 * this gate currently guards an empty room.
 *
 * That is the point. With the gate in place first, analytics cannot later be
 * dropped in and quietly start running: whatever is added has to ask
 * `allows('analytics')` and will be switched off until someone says yes.
 * Bolting consent on after the tracking is how sites end up collecting for
 * months before anyone notices.
 *
 * Shape follows the DPDP Rules 2025: consent has to be a free, specific,
 * informed and unconditional act. So nothing is pre-ticked, rejecting is one
 * tap and sits beside accepting rather than hidden behind "manage", and the
 * choice is re-openable because consent that cannot be withdrawn is not
 * consent.
 *
 * What is deliberately absent is any attempt to identify the visitor.
 * Fingerprinting, or harvesting "everything available" into an admin panel,
 * is the opposite of the data minimisation the same rules require — and on a
 * site where the pages someone reads reveal what they are worried about, that
 * browsing trail is health information.
 */

import { STORAGE_KEYS, storage } from '@/lib/storage';

/**
 * Bump when the categories or what they cover change, so a stored choice that
 * was made about a different set of purposes is asked again rather than
 * assumed to still apply.
 */
export const CONSENT_VERSION = '2026-11-1';

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing';

export interface ConsentRecord {
  /** Always true: the site cannot run without these and they are not optional. */
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  /** Which version of the categories the person was shown. */
  version: string;
  /** ISO timestamp of the decision. */
  decidedAt: string;
}

/** Nothing optional is on until someone turns it on. */
export const DEFAULT_CONSENT: Omit<ConsentRecord, 'version' | 'decidedAt'> = {
  necessary: true,
  analytics: false,
  marketing: false,
};

function isRecord(value: unknown): value is ConsentRecord {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ConsentRecord>;
  return (
    typeof v.analytics === 'boolean' &&
    typeof v.marketing === 'boolean' &&
    typeof v.version === 'string' &&
    typeof v.decidedAt === 'string'
  );
}

/** The stored decision, or null when there is none worth honouring. */
export function readConsent(): ConsentRecord | null {
  const stored = storage.get<unknown>(STORAGE_KEYS.cookieConsent, null);
  if (!isRecord(stored)) return null;
  // A decision about an older set of categories is not a decision about this one.
  if (stored.version !== CONSENT_VERSION) return null;
  return stored;
}

export function saveConsent(choice: { analytics: boolean; marketing: boolean }): ConsentRecord {
  const record: ConsentRecord = {
    necessary: true,
    analytics: choice.analytics,
    marketing: choice.marketing,
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
  };
  storage.set(STORAGE_KEYS.cookieConsent, record);
  // Let anything already mounted react without a reload.
  window.dispatchEvent(new CustomEvent('hcl:consent', { detail: record }));
  return record;
}

/** Withdrawing is as easy as giving, which is the whole requirement. */
export function clearConsent(): void {
  storage.remove(STORAGE_KEYS.cookieConsent);
  window.dispatchEvent(new CustomEvent('hcl:consent', { detail: null }));
}

/**
 * The one function the rest of the app should ask.
 *
 * Anything that wants to measure, remember across sessions for marketing, or
 * call a third party for either purpose must pass through here first and do
 * nothing when it returns false.
 */
export function allows(category: ConsentCategory): boolean {
  if (category === 'necessary') return true;
  const record = readConsent();
  if (!record) return false;
  return record[category];
}
