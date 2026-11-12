import { useEffect, useMemo, useState } from 'react';
import { localDateIso } from '@/lib/format';
import { DEFAULT_BOOKING_CONFIG, slotKey, type BookingConfig } from '@/types/account';

/** "s0730" → minutes after midnight, for hiding today's slots that have passed. */
export function slotStartMinutes(id: string): number | null {
  const m = /^s(\d{2})(\d{2})$/.exec(id);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** A visit needs this much notice, so a slot starting sooner is not offered today. */
export const LEAD_MINUTES = 60;

export interface SlotOption {
  value: string;
  label: string;
  meta?: string;
  left: number;
}

/**
 * Live booking config and slot availability for a chosen date. Firebase is
 * imported only once `enabled` is true.
 */
export function useSlots(date: string, enabled = true) {
  const [cfg, setCfg] = useState<BookingConfig>(DEFAULT_BOOKING_CONFIG);
  const [claims, setClaims] = useState<Record<string, number>>({});
  const today = useMemo(() => localDateIso(), []);
  const lastDate = useMemo(
    () => localDateIso(new Date(Date.now() + cfg.daysAhead * 86_400_000)),
    [cfg.daysAhead],
  );

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const stops: (() => void)[] = [];
    void import('@/lib/accountApi').then((api) => {
      if (cancelled) return;
      stops.push(api.watchBookingConfig(setCfg), api.watchSlotClaims(today, lastDate, setClaims));
    });
    return () => {
      cancelled = true;
      stops.forEach((s) => s());
    };
  }, [enabled, today, lastDate]);

  const options = useMemo<SlotOption[]>(() => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return Object.entries(cfg.slots)
      .sort(([, a], [, b]) => a.order - b.order)
      .filter(([id]) => {
        if (date !== today) return true;
        const start = slotStartMinutes(id);
        return start === null || start - LEAD_MINUTES > nowMinutes;
      })
      .map(([id, s]) => {
        const left = s.capacity - (claims[slotKey(date, id)] ?? 0);
        return { value: id, label: s.label, meta: date ? (left <= 0 ? 'Full' : `${left} left`) : undefined, left };
      });
  }, [cfg.slots, claims, date, today]);

  /** Why a date cannot be booked, or null. */
  const dateProblem = (d: string): string | null => {
    if (!d) return 'Choose a date.';
    if (d < today) return 'Choose today or a later date.';
    if (d > lastDate) return `Visits can be booked up to ${cfg.daysAhead} days ahead.`;
    if (cfg.closedDates.includes(d)) return 'The lab does not collect at home on that date.';
    return null;
  };

  return { cfg, options, today, lastDate, dateProblem };
}
