/**
 * The lab's departments, installed analysers and the procedures run alongside
 * them.
 *
 * Transcribed from the list the lab supplied, with manufacturer names spelled
 * as the manufacturer spells them — the list came in as "VITOS 250",
 * "THERMOPHISHER" and "GEL METRIX", which are the right machines under the
 * wrong spellings. `make` is filled in only where the manufacturer is not in
 * doubt; where the lab named a model without one, the model stands on its own
 * rather than being attributed to a guess.
 *
 * `kind` matters. Four of the entries the lab listed are not analysers at all —
 * a semen wash, an IUI preparation, a skin prick test and an ELISA allergy
 * panel are procedures and methods. Filing them under "installed analysers"
 * would be a claim about equipment the lab did not make, so they are labelled
 * for what they are and sit in the department that performs them.
 *
 * `covers` describes what that class of analyser or procedure is for. It stops
 * short of claiming which instrument runs a given package — routing is the
 * lab's business and changes day to day.
 */

import type { InstrumentArtKey } from '@/components/common/InstrumentArt';

export interface Instrument {
  /** Manufacturer, where it is not in doubt. */
  make?: string;
  model: string;
  /** What this class of analyser or procedure is used for. */
  role: string;
  covers: string[];
  department: string;
  kind: 'analyser' | 'procedure';
  /** Which drawing represents this class of instrument. */
  art: InstrumentArtKey;
  /**
   * Id of a photograph in LAB_PHOTOS showing this instrument in the lab's own
   * facility. Only set where the photograph is genuinely of that machine —
   * manufacturer press images are copyrighted and are not an option.
   */
  photoId?: string;
}

export interface LabDepartment {
  id: string;
  name: string;
  description: string;
}

export const DEPARTMENTS: LabDepartment[] = [
  {
    id: 'biochemistry',
    name: 'Biochemistry',
    description:
      'Clinical chemistry, dry chemistry and glycated haemoglobin — the panels behind liver, kidney, lipid, electrolyte and diabetes reporting.',
  },
  {
    id: 'hematology',
    name: 'Hematology',
    description:
      'Blood counts and red cell indices, including the differential that sits behind every CBC on the menu.',
  },
  {
    id: 'immunoassay',
    name: 'Immunoassay',
    description:
      'Chemiluminescence and ELISA work — thyroid and reproductive hormones, vitamins, cardiac and tumour markers.',
  },
  {
    id: 'transfusion',
    name: 'Transfusion serology',
    description:
      'Column agglutination on gel cards for blood grouping, cross-matching and antibody work.',
  },
  {
    id: 'andrology',
    name: 'Andrology',
    description:
      'Automated semen analysis, and sample preparation for intrauterine insemination.',
  },
  {
    id: 'histopathology',
    name: 'Histopathology & cytology',
    description:
      'Automated tissue processing, and liquid-based cytology preparation for cervical and fluid samples.',
  },
  {
    id: 'allergy',
    name: 'Allergy testing',
    description: 'Skin prick testing on site, and specific IgE allergy panels by ELISA.',
  },
];

export const INSTRUMENTS: Instrument[] = [
  /* ------------------------------ Biochemistry ------------------------------ */
  {
    make: 'Beckman Coulter',
    model: 'AU480',
    art: 'chemistry',
    role: 'Clinical chemistry analyser',
    covers: ['Liver profile', 'Kidney profile', 'Lipid profile', 'Electrolytes', 'Glucose'],
    department: 'Biochemistry',
    kind: 'analyser',
    photoId: 'chemistry-analyser',
  },
  {
    make: 'Ortho Clinical Diagnostics',
    model: 'VITROS 250',
    art: 'chemistry',
    role: 'Dry chemistry analyser',
    covers: ['Liver profile', 'Kidney profile', 'Electrolytes', 'Enzymes'],
    department: 'Biochemistry',
    kind: 'analyser',
  },
  {
    make: 'Bio-Rad',
    model: 'D-100',
    art: 'hplc',
    role: 'HPLC glycated haemoglobin system',
    covers: ['HbA1c', 'Haemoglobin variants'],
    department: 'Biochemistry',
    kind: 'analyser',
  },
  {
    make: 'Bio-Rad',
    model: 'D-10',
    art: 'hplc',
    role: 'HPLC glycated haemoglobin analyser',
    covers: ['HbA1c', 'Haemoglobin variants'],
    department: 'Biochemistry',
    kind: 'analyser',
    photoId: 'hba1c-analyser',
  },

  /* ------------------------------- Hematology ------------------------------- */
  {
    make: 'Mindray',
    model: 'BC-6000',
    art: 'haematology',
    role: 'Haematology analyser',
    covers: ['CBC', 'Blood indices', 'Differential count'],
    department: 'Hematology',
    kind: 'analyser',
  },

  /* ------------------------------ Immunoassay ------------------------------- */
  {
    make: 'Beckman Coulter',
    model: 'Access DxI 600',
    art: 'immunoassay',
    role: 'Immunoassay analyser',
    covers: ['Thyroid', 'Fertility hormones', 'Cardiac markers', 'Tumour markers'],
    department: 'Immunoassay',
    kind: 'analyser',
  },
  {
    make: 'Beckman Coulter',
    model: 'Access 2',
    art: 'immunoassay',
    role: 'Immunoassay analyser',
    covers: ['Thyroid (T3, T4, TSH)', 'Vitamin B12', 'Hormones', 'Tumour markers'],
    department: 'Immunoassay',
    kind: 'analyser',
    photoId: 'immunoassay-analyser',
  },
  {
    make: 'Snibe',
    model: 'MAGLUMI X6',
    art: 'immunoassay',
    role: 'Chemiluminescence immunoassay analyser',
    covers: ['Thyroid', 'Hormones', 'Vitamins', 'Infectious disease markers'],
    department: 'Immunoassay',
    kind: 'analyser',
  },
  {
    make: 'Snibe',
    model: 'MAGLUMI X3',
    art: 'immunoassay',
    role: 'Chemiluminescence immunoassay analyser',
    covers: ['Thyroid', 'Hormones', 'Vitamins', 'Infectious disease markers'],
    department: 'Immunoassay',
    kind: 'analyser',
  },
  {
    make: 'Meril',
    model: 'ELISA reader',
    art: 'plate-reader',
    role: 'Microplate ELISA reader',
    covers: ['Serology', 'Specific IgE panels', 'Infectious disease markers'],
    department: 'Immunoassay',
    kind: 'analyser',
  },

  /* --------------------------- Transfusion serology -------------------------- */
  {
    make: 'Tulip Diagnostics',
    model: 'Gel card system',
    art: 'gel-card',
    role: 'Column agglutination gel card system',
    covers: ['Blood grouping', 'Cross-matching', 'Coombs test', 'Antibody screening'],
    department: 'Transfusion serology',
    kind: 'analyser',
  },

  /* -------------------------------- Andrology ------------------------------- */
  {
    model: 'SQA automated semen analyser',
    art: 'semen-analyser',
    role: 'Automated semen analysis with visualisation',
    covers: ['Sperm count', 'Motility', 'Morphology', 'Semen volume'],
    department: 'Andrology',
    kind: 'analyser',
  },
  {
    model: 'Semen wash system',
    art: 'centrifuge',
    role: 'Sample preparation',
    covers: ['Sperm washing', 'Sample concentration'],
    department: 'Andrology',
    kind: 'procedure',
  },
  {
    model: 'Semen preparation for IUI',
    art: 'centrifuge',
    role: 'Preparation for intrauterine insemination',
    covers: ['IUI sample preparation'],
    department: 'Andrology',
    kind: 'procedure',
  },

  /* ------------------------ Histopathology & cytology ------------------------ */
  {
    make: 'Thermo Fisher Scientific',
    model: 'Automated histology system',
    art: 'histology',
    role: 'Tissue processing and section preparation',
    covers: ['Tissue processing', 'Embedding', 'Sectioning'],
    department: 'Histopathology & cytology',
    kind: 'analyser',
  },
  {
    model: 'EasyPrep liquid-based cytology',
    art: 'cytology',
    role: 'Liquid-based cytology preparation',
    covers: ['Cervical cytology', 'Fluid cytology'],
    department: 'Histopathology & cytology',
    kind: 'analyser',
  },

  /* ----------------------------- Allergy testing ---------------------------- */
  {
    model: 'Skin prick allergy testing',
    art: 'skin-prick',
    role: 'On-site allergy testing',
    covers: ['Inhalant allergens', 'Food allergens'],
    department: 'Allergy testing',
    kind: 'procedure',
  },
  {
    model: 'ELISA allergy panel',
    art: 'plate-reader',
    role: 'Specific IgE testing by ELISA',
    covers: ['Specific IgE', 'Allergen panels'],
    department: 'Allergy testing',
    kind: 'procedure',
  },
];

/** Instruments grouped under the department that runs them, in listed order. */
export const INSTRUMENTS_BY_DEPARTMENT = DEPARTMENTS.map((department) => ({
  department,
  instruments: INSTRUMENTS.filter((i) => i.department === department.name),
})).filter((group) => group.instruments.length > 0);

export const ANALYSER_COUNT = INSTRUMENTS.filter((i) => i.kind === 'analyser').length;
