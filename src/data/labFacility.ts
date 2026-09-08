/**
 * The lab's departments and installed analysers.
 *
 * Every instrument here is named off the equipment visible in the facility
 * photographs, and each `covers` line describes what that *class* of analyser
 * is for. It deliberately stops short of claiming which instrument runs a
 * given package — routing is the lab's business and is not visible in a
 * photograph.
 */

export interface Instrument {
  make: string;
  model: string;
  /** What this class of analyser is used for. */
  role: string;
  covers: string[];
  department: string;
}

export const DEPARTMENTS = [
  {
    id: 'biochemistry',
    name: 'Biochemistry',
    description:
      'Clinical chemistry and glycated haemoglobin — the panels behind liver, kidney, lipid, electrolyte and diabetes reporting.',
  },
  {
    id: 'hematology',
    name: 'Hematology',
    description:
      'Blood counts and red cell indices, including the differential that sits behind every CBC on the menu.',
  },
  {
    id: 'immunology',
    name: 'Immunology',
    description:
      'Immunoassay work — thyroid and reproductive hormones, vitamins, cardiac and tumour markers.',
  },
] as const;

export const INSTRUMENTS: Instrument[] = [
  {
    make: 'Beckman Coulter',
    model: 'AU480',
    role: 'Clinical chemistry analyser',
    covers: ['Liver profile', 'Kidney profile', 'Lipid profile', 'Electrolytes', 'Glucose'],
    department: 'Biochemistry',
  },
  {
    make: 'Bio-Rad',
    model: 'D-10',
    role: 'HPLC glycated haemoglobin analyser',
    covers: ['HbA1c', 'Haemoglobin variants'],
    department: 'Biochemistry',
  },
  {
    make: 'Beckman Coulter',
    model: 'Access 2',
    role: 'Immunoassay analyser',
    covers: ['Thyroid (T3, T4, TSH)', 'Vitamin B12', 'Hormones', 'Tumour markers'],
    department: 'Immunology',
  },
  {
    make: 'Mindray',
    model: 'BC-5130',
    role: 'Haematology analyser',
    covers: ['CBC', 'Blood indices', 'Differential count'],
    department: 'Hematology',
  },
];
