import { SITE_CONFIG } from '@/config/site';

const { locale, code, symbol } = SITE_CONFIG.currency;

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${symbol}${Math.round(value).toLocaleString('en-IN')}`;
  }
}

export function savings(original: number | null, offer: number | null): number | null {
  if (original === null || offer === null) return null;
  const diff = original - offer;
  return diff > 0 ? diff : null;
}

export function savingsPercent(original: number | null, offer: number | null): number | null {
  if (!original || offer === null || offer >= original) return null;
  return Math.round(((original - offer) / original) * 100);
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', opts ?? { day: 'numeric', month: 'short', year: 'numeric' });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function pluralize(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many;
}
