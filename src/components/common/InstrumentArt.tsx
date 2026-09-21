/**
 * Original illustrations of the instrument classes the lab runs.
 *
 * The lab asked for a photograph of each machine, found by searching its name.
 * Those results are manufacturer marketing photographs — Beckman Coulter,
 * Bio-Rad, Snibe, Mindray, Thermo Fisher — and republishing them on a
 * commercial site is copyright infringement, with the liability sitting on the
 * lab rather than on whoever searched. So these are drawn from scratch instead.
 *
 * Drawn rather than iconified, because the brief was "professional" and "all
 * the same type": one visual language, one palette, one stroke weight, one
 * front elevation, across every card. And drawn as vectors, which beats the
 * requested full HD at every size — they are exact at 200px on a phone and at
 * 2x on a 5K display, with no raster to ship.
 *
 * There is one drawing per entry rather than one per class. Four immunoassay
 * analysers sharing a single picture put four identical cards in a row inside
 * one department, which read as a template rather than as a catalogue — so the
 * pairs are drawn apart on the real difference between them: bench-top against
 * floor-standing, one column against two, a centrifuge against a tube rack.
 *
 * They depict a *class* of instrument, not a specific model, which is both the
 * honest thing to show and the reason they do not resemble any manufacturer's
 * product. A photograph of the lab's own machine beats all of this, and the
 * card swaps to one the moment every instrument has been photographed.
 */

export type InstrumentArtKey =
  | 'chemistry'
  | 'dry-chemistry'
  | 'hplc'
  | 'hplc-large'
  | 'immunoassay'
  | 'immunoassay-large'
  | 'clia'
  | 'clia-large'
  | 'haematology'
  | 'plate-reader'
  | 'allergy-panel'
  | 'gel-card'
  | 'semen-analyser'
  | 'centrifuge'
  | 'iui-prep'
  | 'histology'
  | 'cytology'
  | 'skin-prick';

/* One palette, used by every drawing, so eighteen cards read as a set. */
const LINE = '#0E6088'; // brand-700
const BODY = '#FFFFFF';
const PANEL = '#D6EFFB'; // brand-100
const ACCENT = '#AEDFF7'; // brand-200
const SCREEN = '#159BD3'; // brand-500
const LIVE = '#14C4A3'; // mint-400

export function InstrumentArt({
  art,
  className,
}: {
  art: InstrumentArtKey;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 84"
      className={className}
      fill="none"
      stroke={LINE}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {DRAWINGS[art]}
      {/* A common ground line ties the set together. */}
      <path d="M28 78h144" stroke={ACCENT} strokeWidth={3} />
    </svg>
  );
}

const DRAWINGS: Record<InstrumentArtKey, React.ReactNode> = {
  /* Bench-top clinical chemistry: big cabinet, sample carousel, reagent door. */
  chemistry: (
    <>
      <rect x="40" y="20" width="120" height="58" rx="6" fill={BODY} />
      <rect x="48" y="28" width="40" height="26" rx="3" fill={SCREEN} stroke="none" />
      <path d="M52 36h24M52 42h18M52 48h28" stroke="#fff" strokeWidth={2} opacity={0.85} />
      <circle cx="126" cy="44" r="17" fill={PANEL} />
      <circle cx="126" cy="44" r="7" fill={BODY} />
      <circle cx="126" cy="31" r="2.6" fill={LINE} stroke="none" />
      <circle cx="139" cy="44" r="2.6" fill={LINE} stroke="none" />
      <circle cx="126" cy="57" r="2.6" fill={LINE} stroke="none" />
      <circle cx="113" cy="44" r="2.6" fill={LINE} stroke="none" />
      <path d="M40 64h120" />
      <circle cx="50" cy="71" r="3" fill={LIVE} stroke="none" />
    </>
  ),

  /* Dry chemistry: slide-based, so a cartridge slot and a stack of slides. */
  'dry-chemistry': (
    <>
      <rect x="46" y="22" width="108" height="56" rx="6" fill={BODY} />
      <rect x="56" y="30" width="38" height="22" rx="3" fill={SCREEN} stroke="none" />
      <path d="M60 40h20M60 46h12" stroke="#fff" strokeWidth={2} />
      <rect x="104" y="30" width="40" height="8" rx="3" fill={PANEL} />
      <rect x="104" y="42" width="40" height="8" rx="3" fill={PANEL} />
      <rect x="104" y="54" width="40" height="8" rx="3" fill={ACCENT} stroke="none" />
      <rect x="104" y="54" width="40" height="8" rx="3" strokeWidth={1.6} />
      <path d="M46 66h108" />
      <circle cx="58" cy="72" r="3" fill={LIVE} stroke="none" />
    </>
  ),

  /* HPLC: cabinet plus the separation column standing beside it. */
  hplc: (
    <>
      <rect x="34" y="26" width="92" height="52" rx="6" fill={BODY} />
      <rect x="42" y="34" width="46" height="24" rx="3" fill={SCREEN} stroke="none" />
      <path d="M46 52c6-10 10 6 16-4s10 4 16-6" stroke="#fff" strokeWidth={2} />
      <path d="M34 64h92" />
      <circle cx="104" cy="44" r="8" fill={PANEL} />
      <circle cx="104" cy="44" r="3" fill={LIVE} stroke="none" />
      <rect x="140" y="18" width="24" height="60" rx="8" fill={PANEL} />
      <path d="M146 30h12M146 40h12M146 50h12" stroke={LINE} strokeWidth={1.6} opacity={0.6} />
      <path d="M126 36c10-6 10-12 14-12" />
    </>
  ),

  /* The bigger HPLC: wider cabinet, paired columns, a longer trace. */
  'hplc-large': (
    <>
      <rect x="28" y="20" width="102" height="58" rx="6" fill={BODY} />
      <rect x="38" y="28" width="56" height="28" rx="3" fill={SCREEN} stroke="none" />
      <path d="M42 48c8-14 12 8 20-6s12 6 20-8" stroke="#fff" strokeWidth={2} />
      <path d="M28 62h102" />
      <circle cx="112" cy="40" r="9" fill={PANEL} />
      <circle cx="112" cy="40" r="3.4" fill={LIVE} stroke="none" />
      <rect x="140" y="14" width="13" height="64" rx="6" fill={PANEL} />
      <rect x="158" y="24" width="13" height="54" rx="6" fill={ACCENT} stroke="none" />
      <rect x="158" y="24" width="13" height="54" rx="6" strokeWidth={1.8} />
      <path d="M130 32c8-4 6-12 10-12" />
    </>
  ),

  /* Immunoassay: tall cabinet, reagent carousel behind glass, pipette arm. */
  immunoassay: (
    <>
      <rect x="44" y="14" width="112" height="64" rx="7" fill={BODY} />
      <rect x="52" y="22" width="96" height="30" rx="4" fill={PANEL} />
      <circle cx="82" cy="37" r="11" fill={BODY} />
      <circle cx="82" cy="37" r="4" fill={ACCENT} stroke="none" />
      <path d="M118 22v22" strokeWidth={3} />
      <circle cx="118" cy="47" r="4" fill={LIVE} stroke="none" />
      <rect x="52" y="58" width="42" height="14" rx="3" fill={SCREEN} stroke="none" />
      <path d="M57 65h14" stroke="#fff" strokeWidth={2} />
      <path d="M106 58h42" stroke={ACCENT} strokeWidth={3} />
      <path d="M106 68h28" stroke={ACCENT} strokeWidth={3} />
    </>
  ),

  /* The floor-standing immunoassay unit: upper bay, cabinet, sample track. */
  'immunoassay-large': (
    <>
      <rect x="38" y="10" width="124" height="38" rx="6" fill={BODY} />
      <rect x="38" y="48" width="124" height="30" rx="6" fill={BODY} />
      <rect x="48" y="18" width="52" height="22" rx="3" fill={SCREEN} stroke="none" />
      <path d="M53 27h18M53 33h28" stroke="#fff" strokeWidth={2} />
      <circle cx="130" cy="29" r="12" fill={PANEL} />
      <circle cx="130" cy="29" r="4" fill={BODY} />
      <path d="M48 62h104" stroke={ACCENT} strokeWidth={5} />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={58 + i * 22} cy={62} r="3.2" fill={i === 2 ? LIVE : BODY} strokeWidth={1.6} />
      ))}
    </>
  ),

  /* Compact chemiluminescence unit: reaction wheel, reagent bottles on top. */
  clia: (
    <>
      <rect x="52" y="30" width="96" height="48" rx="6" fill={BODY} />
      <circle cx="80" cy="52" r="14" fill={PANEL} />
      <circle cx="80" cy="52" r="5" fill={BODY} />
      <path d="M80 38v6M94 52h-6M80 66v-6M66 52h6" strokeWidth={1.8} />
      <rect x="106" y="40" width="32" height="20" rx="3" fill={SCREEN} stroke="none" />
      <path d="M111 48h14M111 54h8" stroke="#fff" strokeWidth={2} />
      <rect x="62" y="18" width="10" height="12" rx="3" fill={ACCENT} stroke="none" />
      <rect x="62" y="18" width="10" height="12" rx="3" strokeWidth={1.6} />
      <rect x="78" y="14" width="10" height="16" rx="3" fill={LIVE} stroke="none" />
      <rect x="78" y="14" width="10" height="16" rx="3" strokeWidth={1.6} />
      <path d="M52 68h96" />
    </>
  ),

  /* The larger chemiluminescence unit: loader arm over a reagent carousel. */
  'clia-large': (
    <>
      <rect x="34" y="16" width="132" height="62" rx="7" fill={BODY} />
      <rect x="44" y="24" width="60" height="26" rx="3" fill={PANEL} />
      <circle cx="74" cy="37" r="9" fill={BODY} />
      <circle cx="74" cy="37" r="3" fill={ACCENT} stroke="none" />
      <path d="M116 24h40" strokeWidth={3} />
      <path d="M136 24v14" strokeWidth={3} />
      <circle cx="136" cy="42" r="4.5" fill={LIVE} stroke="none" />
      <rect x="44" y="56" width="48" height="14" rx="3" fill={SCREEN} stroke="none" />
      <path d="M49 63h20" stroke="#fff" strokeWidth={2} />
      <rect x="104" y="54" width="52" height="18" rx="3" fill={PANEL} />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={114 + i * 12} cy={63} r="3" fill={BODY} strokeWidth={1.4} />
      ))}
    </>
  ),

  /* Haematology: cabinet with a rack of sample tubes feeding in. */
  haematology: (
    <>
      <rect x="56" y="18" width="104" height="60" rx="6" fill={BODY} />
      <rect x="64" y="26" width="44" height="28" rx="3" fill={SCREEN} stroke="none" />
      <path d="M68 46l8-10 6 7 7-12 7 15" stroke="#fff" strokeWidth={2} />
      <circle cx="134" cy="36" r="10" fill={PANEL} />
      <circle cx="134" cy="36" r="3.4" fill={LIVE} stroke="none" />
      <path d="M56 62h104" />
      <rect x="26" y="44" width="26" height="34" rx="4" fill={PANEL} />
      <path d="M32 50v22M39 50v22M46 50v22" strokeWidth={3} stroke={BODY} />
      <path d="M32 50v22M39 50v22M46 50v22" strokeWidth={1.6} />
    </>
  ),

  /* Microplate reader: low body with the plate drawn out, wells visible. */
  'plate-reader': (
    <>
      <rect x="62" y="28" width="104" height="50" rx="6" fill={BODY} />
      <rect x="72" y="36" width="36" height="20" rx="3" fill={SCREEN} stroke="none" />
      <path d="M76 46h10M90 46h6" stroke="#fff" strokeWidth={2} />
      <path d="M62 62h104" />
      <rect x="24" y="52" width="58" height="22" rx="3" fill={PANEL} />
      {[0, 1, 2, 3, 4, 5].map((c) => (
        <g key={c}>
          <circle cx={32 + c * 9} cy={59} r="2.4" fill={BODY} strokeWidth={1.4} />
          <circle cx={32 + c * 9} cy={68} r="2.4" fill={c < 3 ? LIVE : BODY} strokeWidth={1.4} />
        </g>
      ))}
    </>
  ),

  /* Allergen panel: the strip plate under a reading head. */
  'allergy-panel': (
    <>
      <path d="M100 12v16" strokeWidth={3} />
      <rect x="84" y="28" width="32" height="14" rx="4" fill={SCREEN} stroke="none" />
      <rect x="84" y="28" width="32" height="14" rx="4" strokeWidth={1.8} />
      <rect x="34" y="50" width="132" height="26" rx="4" fill={BODY} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <g key={i}>
          <rect x={42 + i * 15} y="54" width="10" height="18" rx="2" fill={PANEL} stroke="none" />
          <rect x={42 + i * 15} y="54" width="10" height="18" rx="2" strokeWidth={1.4} />
          <circle cx={47 + i * 15} cy={63} r="2.6" fill={i % 3 === 0 ? LIVE : ACCENT} stroke="none" />
        </g>
      ))}
    </>
  ),

  /* Gel cards standing in their rack, with the column bands showing. */
  'gel-card': (
    <>
      <rect x="30" y="66" width="140" height="12" rx="4" fill={PANEL} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={44 + i * 32} y="14" width="24" height="52" rx="3" fill={BODY} />
          <rect x={49 + i * 32} y="20" width="14" height="28" rx="2" fill={ACCENT} stroke="none" />
          <rect
            x={49 + i * 32}
            y={i % 2 === 0 ? 24 : 34}
            width="14"
            height="7"
            rx="2"
            fill={i % 2 === 0 ? SCREEN : LIVE}
            stroke="none"
          />
          <path d={`M${49 + i * 32} 54h14`} strokeWidth={1.6} />
        </g>
      ))}
    </>
  ),

  /* Semen analyser: compact bench unit with a capillary slot. */
  'semen-analyser': (
    <>
      <rect x="52" y="24" width="96" height="54" rx="6" fill={BODY} />
      <rect x="62" y="32" width="44" height="26" rx="3" fill={SCREEN} stroke="none" />
      <circle cx="74" cy="42" r="3" fill="#fff" stroke="none" />
      <circle cx="86" cy="48" r="2.2" fill="#fff" stroke="none" />
      <circle cx="96" cy="39" r="2.2" fill="#fff" stroke="none" />
      <path d="M52 64h96" />
      <rect x="116" y="34" width="22" height="8" rx="3" fill={PANEL} />
      <circle cx="127" cy="54" r="4" fill={LIVE} stroke="none" />
      <path d="M148 38h16" strokeWidth={3} stroke={ACCENT} />
    </>
  ),

  /* Centrifuge: domed lid over a visible body, rotor and tubes beneath it. */
  centrifuge: (
    <>
      <rect x="48" y="54" width="104" height="24" rx="6" fill={BODY} />
      <path d="M58 54a42 30 0 0 1 84 0" fill={BODY} />
      <path d="M70 54a30 20 0 0 1 60 0" fill={PANEL} stroke="none" />
      <path d="M70 54a30 20 0 0 1 60 0" strokeWidth={1.6} />
      <path d="M84 50l-6-12M100 46V32M116 50l6-12" strokeWidth={3} />
      <circle cx="100" cy="66" r="4.5" fill={LIVE} stroke="none" />
      <path d="M118 62h22" stroke={ACCENT} strokeWidth={3} />
    </>
  ),

  /* IUI preparation: the tube rack and the pipette, not another centrifuge. */
  'iui-prep': (
    <>
      <rect x="42" y="48" width="86" height="26" rx="4" fill={PANEL} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <path d={`M${54 + i * 20} 24v30a6 6 0 0 0 12 0V24`} fill={BODY} />
          <path d={`M${54 + i * 20} 40v14a6 6 0 0 0 12 0V40z`} fill={i === 1 ? LIVE : ACCENT} stroke="none" />
          <path d={`M${54 + i * 20} 40v14a6 6 0 0 0 12 0V40`} strokeWidth={1.6} />
        </g>
      ))}
      <path d="M150 14v34a6 6 0 0 1-12 0V14z" fill={BODY} />
      <path d="M144 48v10" strokeWidth={3} />
      <circle cx="144" cy="64" r="3.4" fill={SCREEN} stroke="none" />
    </>
  ),

  /* Histology: tissue processor with its retort and a cassette basket. */
  histology: (
    <>
      <rect x="58" y="16" width="104" height="62" rx="6" fill={BODY} />
      <rect x="68" y="24" width="40" height="22" rx="3" fill={SCREEN} stroke="none" />
      <path d="M72 35h22M72 41h14" stroke="#fff" strokeWidth={2} />
      <circle cx="134" cy="36" r="14" fill={PANEL} />
      <path d="M124 36h20M129 29h10M129 43h10" strokeWidth={1.8} />
      <path d="M58 56h104" />
      <rect x="24" y="52" width="30" height="26" rx="3" fill={PANEL} />
      <path d="M24 60h30M24 68h30M34 52v26M44 52v26" strokeWidth={1.6} />
    </>
  ),

  /* Liquid-based cytology: the collection vial and the prepared slide. */
  cytology: (
    <>
      <rect x="46" y="18" width="34" height="60" rx="10" fill={BODY} />
      <rect x="52" y="38" width="22" height="34" rx="6" fill={ACCENT} stroke="none" />
      <path d="M46 30h34" strokeWidth={1.8} />
      <rect x="98" y="24" width="56" height="48" rx="4" fill={BODY} />
      <ellipse cx="126" cy="46" rx="15" ry="13" fill={PANEL} stroke="none" />
      <circle cx="120" cy="42" r="3" fill={SCREEN} stroke="none" />
      <circle cx="131" cy="49" r="2.4" fill={SCREEN} stroke="none" />
      <circle cx="127" cy="38" r="2" fill={LIVE} stroke="none" />
      <path d="M98 62h56" strokeWidth={1.8} />
    </>
  ),

  /* Skin prick testing: the forearm, the marked drops, the lancet above. */
  'skin-prick': (
    <>
      {/* Forearm only. An attempt at a hand on the end of it read as a fin. */}
      <rect x="30" y="44" width="140" height="30" rx="15" fill={BODY} />
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          cx={48 + i * 22}
          cy={60}
          r="5"
          fill={i === 1 ? LIVE : ACCENT}
          stroke={LINE}
          strokeWidth={1.6}
        />
      ))}
      <path d="M70 30l-8 12" strokeWidth={3} stroke={SCREEN} />
      <path d="M70 30l8-12" strokeWidth={5} stroke={LINE} />
    </>
  ),
};
