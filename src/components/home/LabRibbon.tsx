import { Marquee } from '@/components/common/Motion';
import { HEALTH_CONCERNS } from '@/data/healthConcerns';
import { INSTRUMENTS } from '@/data/labFacility';

/**
 * A moving ribbon between the hero and the page proper.
 *
 * Two jobs. It breaks the run of white bands that made the homepage read as a
 * template — the first colour after the hero used to be four sections down —
 * and it states the breadth of the catalogue in one glance, which is the thing
 * a list of package cards is bad at.
 *
 * Everything on it is real: the concerns the catalogue is indexed by and the
 * departments the lab actually runs. The band is `aria-hidden` because it is a
 * decorative restatement of navigation that exists elsewhere, and a screen
 * reader should not have to sit through a loop of it.
 */

const DEPARTMENTS = [...new Set(INSTRUMENTS.map((i) => i.department))];

const ITEMS = [...HEALTH_CONCERNS.map((c) => c.label), ...DEPARTMENTS];

export function LabRibbon() {
  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden bg-gradient-to-r from-brand-700 via-brand-500 to-mint-500 py-3.5 text-white"
    >
      <div className="absolute inset-0 bg-grid-dark [background-size:40px_40px] opacity-50" />
      <Marquee items={ITEMS} speed={52} className="relative" />
    </div>
  );
}
