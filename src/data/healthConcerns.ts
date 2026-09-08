import type { HealthConcern } from '@/types';

/**
 * Concern taxonomy used by the homepage explorer and the package filters.
 * `signals` describe when people commonly ask about a test area — they are
 * navigational prompts, not diagnostic criteria.
 */
export const HEALTH_CONCERNS: HealthConcern[] = [
  {
    id: 'diabetes',
    label: 'Diabetes',
    description: 'Fasting and post-meal sugar, HbA1c, insulin studies and the kidney markers tracked alongside them.',
    icon: 'Droplet',
    signals: ['Family history of diabetes', 'Ongoing sugar monitoring', 'Unexplained thirst or fatigue'],
  },
  {
    id: 'heart',
    label: 'Heart Health',
    description: 'Lipid profile, CRP, homocysteine, cardiac enzymes and functional testing with ECG, Echo and TMT.',
    icon: 'HeartPulse',
    signals: ['Family history of heart disease', 'High cholesterol on a past report', 'Pre-40 baseline check'],
  },
  {
    id: 'thyroid',
    label: 'Thyroid',
    description: 'TSH alone or the complete T3, T4 and TSH set, as part of a wider hormonal review.',
    icon: 'Activity',
    signals: ['Weight change without a clear cause', 'Persistent tiredness', 'Thyroid medication review'],
  },
  {
    id: 'liver',
    label: 'Liver',
    description: 'The full liver profile — SGPT, SGOT, bilirubin and protein — with hepatitis B and C screening.',
    icon: 'Layers',
    signals: ['Abnormal liver enzyme on a past report', 'Hepatitis screening', 'Routine liver review'],
  },
  {
    id: 'kidney',
    label: 'Kidney',
    description: 'Creatinine, blood urea, BUN, uric acid, electrolytes and urine microalbumin.',
    icon: 'Filter',
    signals: ['Diabetes or hypertension follow-up', 'Swelling or changed urine output', 'Routine renal review'],
  },
  {
    id: 'vitamin',
    label: 'Vitamin Deficiency',
    description: 'Vitamin B12 and D3, serum iron, TIBC and ferritin for a full nutritional picture.',
    icon: 'Sun',
    signals: ['Ongoing fatigue', 'Low haemoglobin', 'Limited sun exposure or a restricted diet'],
  },
  {
    id: 'womens-health',
    label: "Women's Health",
    description: 'AMH, FSH, LH and prolactin, thyroid function, anaemia studies and pre-marital screening.',
    icon: 'Flower2',
    signals: ['Cycle changes', 'Fertility planning', 'Pre-marital screening'],
  },
  {
    id: 'mens-health',
    label: "Men's Health",
    description: 'Testosterone, seminal fluid examination, PSA and pre-marital infection screening.',
    icon: 'User',
    signals: ['Fertility planning', 'Pre-marital screening', 'PSA baseline after 40'],
  },
  {
    id: 'general-wellness',
    label: 'General Wellness',
    description: 'Broad annual reviews that read blood count, sugar, lipids, liver, kidney and thyroid together.',
    icon: 'ShieldCheck',
    signals: ['Annual check', 'No specific concern', 'Establishing a baseline'],
  },
  {
    id: 'cancer',
    label: 'Cancer Screening',
    description: 'Established tumour marker panels for men and women, combined with basic imaging.',
    icon: 'ScanSearch',
    signals: ['Family history screening', 'Physician-advised screening', 'Age-based baseline'],
  },
  {
    id: 'bone-joint',
    label: 'Bone & Joint',
    description: 'RA quantitative, uric acid, calcium, phosphorus, CRP and Anti-CCP/ANA auto-antibodies.',
    icon: 'Bone',
    signals: ['Persistent joint pain', 'Morning stiffness', 'Autoimmune work-up'],
  },
  {
    id: 'child-health',
    label: 'Child Health',
    description: 'Paediatric routine screening covering blood count, iron, B12, urine and stool.',
    icon: 'Baby',
    signals: ['School health check', 'Growth and nutrition review', 'Recurring infections'],
  },
];

export const getConcern = (id: string): HealthConcern | undefined =>
  HEALTH_CONCERNS.find((c) => c.id === id);
