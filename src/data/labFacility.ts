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
 * `covers` describes what that class of analyser or procedure is for, and
 * `method` how it measures. Both are properties of the instrument class, so
 * both are checkable against the manufacturer's own documentation. What is
 * deliberately absent is throughput, turnaround or accuracy: those are claims
 * about how this lab operates, not about the machine, and the site does not
 * print a figure it cannot evidence.
 *
 * It also stops short of claiming which instrument runs a given package —
 * routing is the lab's business and changes day to day.
 */

import type { InstrumentArtKey } from '@/components/common/InstrumentArt';

export interface Instrument {
  /** Manufacturer, where it is not in doubt. */
  make?: string;
  model: string;
  /** What this class of analyser or procedure is used for. */
  role: string;
  /**
   * What this machine does, written for the person whose sample is in it.
   * The technical line below is for a referring doctor; this one is the
   * reason a visitor is reading the section at all.
   */
  plain: string;
  /**
   * The measurement principle. A property of the instrument class and
   * checkable against the manufacturer's own documentation — never a
   * throughput or turnaround figure, which would be a claim about this lab's
   * operation rather than about the machine.
   */
  method: string;
  /** What is put into it. */
  sample: string;
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
    plain:
      'Runs the everyday blood chemistry \u2014 liver, kidney, lipid and sugar. It measures how much light a reacted sample absorbs, which is how a concentration becomes a number on your report.',
    method: 'Photometry, with ion-selective electrodes for electrolytes',
    sample: 'Serum, plasma or urine',
    covers: ['Liver profile', 'Kidney profile', 'Lipid profile', 'Electrolytes', 'Glucose'],
    department: 'Biochemistry',
    kind: 'analyser',
    photoId: 'chemistry-analyser',
  },
  {
    make: 'Ortho Clinical Diagnostics',
    model: 'VITROS 250',
    art: 'dry-chemistry',
    role: 'Dry chemistry analyser',
    plain:
      'Does that same chemistry on dry slides rather than liquid reagents: a drop of sample goes onto a small coated slide, and the colour it develops is read.',
    method: 'Dry slide colorimetry',
    sample: 'Serum or plasma',
    covers: ['Liver profile', 'Kidney profile', 'Electrolytes', 'Enzymes'],
    department: 'Biochemistry',
    kind: 'analyser',
  },
  {
    make: 'Bio-Rad',
    model: 'D-100',
    art: 'hplc-large',
    role: 'HPLC glycated haemoglobin system',
    plain:
      'Separates the forms of haemoglobin in a blood sample so HbA1c can be measured, and shows up haemoglobin variants such as thalassaemia traits in the same run.',
    method: 'Ion-exchange HPLC',
    sample: 'Whole blood in EDTA',
    covers: ['HbA1c', 'Haemoglobin variants'],
    department: 'Biochemistry',
    kind: 'analyser',
  },
  {
    make: 'Bio-Rad',
    model: 'D-10',
    art: 'hplc',
    role: 'HPLC glycated haemoglobin analyser',
    plain:
      'The same HbA1c separation on a smaller unit \u2014 the three-month average blood sugar used to follow diabetes rather than a single morning reading.',
    method: 'Ion-exchange HPLC',
    sample: 'Whole blood in EDTA',
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
    plain:
      'Counts and sizes the cells in blood \u2014 red cells, white cells and platelets \u2014 and sorts the white cells into five types. This is what a CBC actually is.',
    method: 'Laser flow cytometry with fluorescence and impedance',
    sample: 'Whole blood in EDTA',
    covers: ['CBC', 'Blood indices', 'Differential count'],
    department: 'Hematology',
    kind: 'analyser',
  },

  /* ------------------------------ Immunoassay ------------------------------- */
  {
    make: 'Beckman Coulter',
    model: 'Access DxI 600',
    art: 'immunoassay-large',
    role: 'Immunoassay analyser',
    plain:
      'Measures hormones and markers present in very small amounts. It tags what it is looking for so that it gives off light, then measures that light.',
    method: 'Chemiluminescent immunoassay on paramagnetic particles',
    sample: 'Serum or plasma',
    covers: ['Thyroid', 'Fertility hormones', 'Cardiac markers', 'Tumour markers'],
    department: 'Immunoassay',
    kind: 'analyser',
  },
  {
    make: 'Beckman Coulter',
    model: 'Access 2',
    art: 'immunoassay',
    role: 'Immunoassay analyser',
    plain:
      'The bench-top unit working on the same principle: thyroid, vitamin B12, hormones and tumour markers.',
    method: 'Chemiluminescent immunoassay on paramagnetic particles',
    sample: 'Serum or plasma',
    covers: ['Thyroid (T3, T4, TSH)', 'Vitamin B12', 'Hormones', 'Tumour markers'],
    department: 'Immunoassay',
    kind: 'analyser',
    photoId: 'immunoassay-analyser',
  },
  {
    make: 'Snibe',
    model: 'MAGLUMI X6',
    art: 'clia-large',
    role: 'Chemiluminescence immunoassay analyser',
    plain:
      'A second immunoassay line, using magnetic beads, so hormone and infection testing is not queued behind a single machine.',
    method: 'Chemiluminescence immunoassay on magnetic microbeads',
    sample: 'Serum or plasma',
    covers: ['Thyroid', 'Hormones', 'Vitamins', 'Infectious disease markers'],
    department: 'Immunoassay',
    kind: 'analyser',
  },
  {
    make: 'Snibe',
    model: 'MAGLUMI X3',
    art: 'clia',
    role: 'Chemiluminescence immunoassay analyser',
    plain:
      'The compact unit in that same family, running the same hormone, vitamin and infection tests.',
    method: 'Chemiluminescence immunoassay on magnetic microbeads',
    sample: 'Serum or plasma',
    covers: ['Thyroid', 'Hormones', 'Vitamins', 'Infectious disease markers'],
    department: 'Immunoassay',
    kind: 'analyser',
  },
  {
    make: 'Meril',
    model: 'ELISA reader',
    art: 'plate-reader',
    role: 'Microplate ELISA reader',
    plain:
      'Reads 96-well plates, the format antibody and allergy panels come in, measuring the colour change in every well at once.',
    method: 'Absorbance photometry of 96-well plates',
    sample: 'Serum or plasma',
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
    plain:
      'Blood grouping and cross-matching. Cells and serum are spun through a gel column; where they clump they stay near the top, and that pattern is the result.',
    method: 'Column agglutination in gel',
    sample: 'Whole blood',
    covers: ['Blood grouping', 'Cross-matching', 'Coombs test', 'Antibody screening'],
    department: 'Transfusion serology',
    kind: 'analyser',
  },

  /* -------------------------------- Andrology ------------------------------- */
  {
    model: 'SQA automated semen analyser',
    art: 'semen-analyser',
    role: 'Automated semen analysis with visualisation',
    plain:
      'Counts sperm and measures how many are moving and how well, instead of leaving it to an estimate by eye under a microscope.',
    method: 'Automated concentration and motility analysis',
    sample: 'Semen',
    covers: ['Sperm count', 'Motility', 'Morphology', 'Semen volume'],
    department: 'Andrology',
    kind: 'analyser',
  },
  {
    model: 'Semen wash system',
    art: 'centrifuge',
    role: 'Sample preparation',
    plain:
      'Separates the most motile sperm from the rest of the sample \u2014 the preparation step before an insemination procedure.',
    method: 'Density gradient separation and washing',
    sample: 'Semen',
    covers: ['Sperm washing', 'Sample concentration'],
    department: 'Andrology',
    kind: 'procedure',
  },
  {
    model: 'Semen preparation for IUI',
    art: 'iui-prep',
    role: 'Preparation for intrauterine insemination',
    plain:
      'Concentrates that washed sample into the small volume used for intrauterine insemination.',
    method: 'Density gradient or swim-up preparation',
    sample: 'Semen',
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
    plain:
      'Processes tissue taken at biopsy \u2014 fixing it, drawing the water out and setting it in wax \u2014 so it can be sliced thin enough to read under a microscope.',
    method: 'Automated tissue processing and embedding',
    sample: 'Tissue biopsy',
    covers: ['Tissue processing', 'Embedding', 'Sectioning'],
    department: 'Histopathology & cytology',
    kind: 'analyser',
  },
  {
    model: 'EasyPrep liquid-based cytology',
    art: 'cytology',
    role: 'Liquid-based cytology preparation',
    plain:
      'Prepares cervical and fluid samples as a thin even layer on the slide rather than a smear, which makes abnormal cells easier to find.',
    method: 'Liquid-based thin-layer slide preparation',
    sample: 'Cervical or body fluid',
    covers: ['Cervical cytology', 'Fluid cytology'],
    department: 'Histopathology & cytology',
    kind: 'analyser',
  },

  /* ----------------------------- Allergy testing ---------------------------- */
  {
    model: 'Skin prick allergy testing',
    art: 'skin-prick',
    role: 'On-site allergy testing',
    plain:
      'Allergy testing on the skin: a drop of each allergen is pricked into the forearm and the reaction is measured after about fifteen minutes.',
    method: 'In-vivo prick testing against allergen extracts',
    sample: 'Performed on the patient',
    covers: ['Inhalant allergens', 'Food allergens'],
    department: 'Allergy testing',
    kind: 'procedure',
  },
  {
    model: 'ELISA allergy panel',
    art: 'allergy-panel',
    role: 'Specific IgE testing by ELISA',
    plain:
      'Allergy testing from a blood sample instead, measuring the specific IgE antibody against each allergen. Used where skin testing is not suitable.',
    method: 'Enzyme-linked immunosorbent assay for specific IgE',
    sample: 'Serum',
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
