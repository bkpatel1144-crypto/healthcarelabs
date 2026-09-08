import type { BlogPost, BlogCategory } from '@/types';

/**
 * Editorial content. The first two posts are rewritten from the articles
 * published on healthcare-labs.com/blog; the rest are original general-health
 * writing for this site.
 *
 * Everything here is general information about widely accepted preventive
 * practice. Nothing diagnoses, treats or promises an outcome, and every article
 * points the reader back to their own physician for interpretation. Authorship
 * is attributed to the editorial team — no invented clinicians.
 */

export const BLOG_CATEGORIES: BlogCategory[] = [
  'Preventive Health',
  'Nutrition',
  "Women's Health",
  "Men's Health",
  'Diabetes',
  'Heart Health',
  'Wellness',
  'Lab Tests',
];

const AUTHOR = 'Healthcare Labs Editorial Team';

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-reading-your-blood-report',
    slug: 'how-to-read-your-blood-test-report',
    title: 'How to actually read your blood test report',
    excerpt:
      'Reference ranges, flagged values and why one number outside the range is rarely the whole story. A plain-language guide to the report in your hand.',
    category: 'Lab Tests',
    author: AUTHOR,
    publishedAt: '2025-11-18',
    readingMinutes: 7,
    featured: true,
    sections: [
      {
        paragraphs: [
          'A pathology report is a list of measurements, not a verdict. It tells your doctor what was in the sample on the morning it was drawn. Learning to read the structure of the page makes the conversation that follows much more useful — and usually much less frightening.',
        ],
      },
      {
        heading: 'The three columns that matter',
        paragraphs: [
          'Almost every report has the same shape: the name of the parameter, your result, and the reference range. The reference range is the interval within which most healthy people in a comparable population fall. It is a statistical band, not a boundary between well and unwell.',
          'That distinction matters. Ranges are typically set so that roughly 95 per cent of a healthy reference population falls inside them — which means a small number of perfectly healthy people fall outside by definition. A single flagged value on a panel of thirty is common and often means nothing on its own.',
        ],
      },
      {
        heading: 'Why ranges differ between laboratories',
        paragraphs: [
          'Two labs can report the same sample with slightly different ranges. This is expected. Ranges depend on the analyser, the reagent kit and the reference population the lab has validated against. It is why results are best compared within the same laboratory over time, and why you should bring your previous reports when you test again.',
        ],
      },
      {
        heading: 'Trend beats snapshot',
        paragraphs: [
          'The most valuable thing about a report is rarely the single number. It is the direction of travel. A cholesterol figure that has moved steadily across three annual checks tells a physician far more than one reading taken in isolation.',
          'This is the practical case for keeping your reports. A folder — paper or digital — that holds five years of routine checks is a genuinely useful clinical document.',
        ],
      },
      {
        heading: 'What to ask at the follow-up',
        bullets: [
          'Which of these values, if any, changes what we do next?',
          'Is this result consistent with my previous reports, or is it a change?',
          'Could anything about how I prepared for the test have affected this number?',
          'When should this be repeated, and does it need repeating at all?',
        ],
      },
      {
        paragraphs: [
          'Interpretation belongs with the doctor who knows your history. Use the report to ask better questions, not to reach conclusions on your own.',
        ],
      },
    ],
  },
  {
    id: 'post-fasting-before-a-test',
    slug: 'fasting-before-a-blood-test',
    title: 'Fasting before a blood test: what it changes, and what it does not',
    excerpt:
      'Which tests genuinely need an empty stomach, how long is long enough, and the small preparation mistakes that quietly skew results.',
    category: 'Lab Tests',
    author: AUTHOR,
    publishedAt: '2025-10-29',
    readingMinutes: 5,
    featured: false,
    sections: [
      {
        paragraphs: [
          'Fasting instructions are not a formality. For a handful of common tests, eating beforehand changes the number enough to change the conclusion drawn from it.',
        ],
      },
      {
        heading: 'The tests that need it',
        bullets: [
          'Fasting blood sugar (FBS) — the entire point of the test is the baseline before food.',
          'Lipid profile — triglycerides in particular rise sharply after a meal.',
          'Serum insulin and C-peptide — measured against a fasting baseline.',
          'Some iron studies, where recent intake can distort the reading.',
        ],
      },
      {
        heading: 'The tests that do not',
        paragraphs: [
          'Complete blood count, thyroid function, most hormone panels, liver enzymes and HbA1c do not require fasting. HbA1c in particular reflects roughly three months of average glucose, so a single breakfast cannot move it.',
        ],
      },
      {
        heading: 'How long, and what counts as breaking a fast',
        paragraphs: [
          'Ten to twelve hours is the usual instruction. Plain water is not only allowed but helpful — mild dehydration makes the draw harder and can concentrate some values.',
          'Tea and coffee break the fast, with or without sugar. So does chewing gum, and so does a mint. If you have eaten, say so at the counter: rescheduling the draw costs an hour, while an unflagged non-fasting lipid profile can send a whole consultation in the wrong direction.',
        ],
      },
      {
        heading: 'Timing the post-prandial sample',
        paragraphs: [
          'For a post-prandial (PPBS) sample, the clock starts at the first bite, not the last. Two hours from the start of the meal is the standard interval. Eating slowly over an hour and then waiting two more hours produces a number that is not comparable to anything.',
        ],
      },
      {
        paragraphs: [
          'When you book, ask what preparation your specific panel needs. It takes thirty seconds and protects the value of the whole test.',
        ],
      },
    ],
  },
  {
    id: 'post-healthy-lifestyle-habits',
    slug: 'daily-habits-for-a-healthier-life',
    title: 'Small daily habits that hold up over years',
    excerpt:
      'Hygiene, movement, sun protection, sleep and regular testing. Unglamorous, well-evidenced and far more effective than anything that trends.',
    category: 'Wellness',
    author: AUTHOR,
    publishedAt: '2025-09-24',
    readingMinutes: 6,
    featured: false,
    sections: [
      {
        paragraphs: [
          'Preventive health is not built out of dramatic interventions. It is built out of a handful of ordinary habits repeated for long enough that they stop feeling like effort.',
        ],
      },
      {
        heading: 'Wash your hands properly',
        paragraphs: [
          'Handwashing remains one of the most effective infection-control measures available to anyone, anywhere. Twenty seconds with soap, before meals and after using the restroom, does the work.',
        ],
      },
      {
        heading: 'Break up sitting, not just exercise',
        paragraphs: [
          'A workout does not cancel out ten uninterrupted sedentary hours. Standing, stretching or walking for a few minutes every hour improves circulation and is easier to sustain than a training programme you will abandon in March.',
        ],
      },
      {
        heading: 'Protect your skin',
        paragraphs: [
          'Ultraviolet exposure accumulates. Sunscreen on exposed skin matters on overcast days too, since a substantial share of UV passes through cloud cover.',
        ],
      },
      {
        heading: 'Take sleep as seriously as diet',
        paragraphs: [
          'Consistent sleep timing is as important as duration. A regular schedule — the same window every night, including weekends — is what stabilises the rhythms that govern appetite, glucose handling and mood.',
        ],
      },
      {
        heading: 'Test on a schedule, not on a symptom',
        paragraphs: [
          'Many of the conditions worth catching early are quiet for years. Routine testing at a sensible interval is what turns a slow change into something visible while it is still easy to act on. Ask your physician what interval fits your age and history.',
        ],
      },
    ],
  },
  {
    id: 'post-mental-health-tips',
    slug: 'looking-after-your-mental-health',
    title: 'Looking after your mental health, practically',
    excerpt:
      'Connection, screen limits, mindfulness and knowing when to ask for professional help — the everyday scaffolding of mental wellbeing.',
    category: 'Wellness',
    author: AUTHOR,
    publishedAt: '2025-09-05',
    readingMinutes: 5,
    featured: false,
    sections: [
      {
        paragraphs: [
          'Mental health is part of general health, and it responds to the same kind of ordinary maintenance — with the important addition that professional help is a normal step rather than a last resort.',
        ],
      },
      {
        heading: 'Stay connected',
        paragraphs: [
          'Sustained relationships with friends and family are among the most consistently protective factors in the research on wellbeing. Social contact is not a luxury added after the important things; it is one of the important things.',
        ],
      },
      {
        heading: 'Put a boundary around screens',
        paragraphs: [
          'Long unbroken screen time is associated with disturbed sleep and heightened stress, particularly in the hour before bed. Substituting something offline — reading, a walk, time outdoors — for that final hour is a small change with a disproportionate effect.',
        ],
      },
      {
        heading: 'Practise something that slows you down',
        paragraphs: [
          'Meditation, yoga and journalling all work through the same mechanism: deliberate attention to the present rather than rehearsal of the past or future. Which one you choose matters far less than doing it regularly.',
        ],
      },
      {
        heading: 'Ask for help early',
        paragraphs: [
          'If low mood, anxiety or exhaustion is interfering with work, sleep or relationships, speak to a qualified mental health professional. Earlier is easier. Some physical conditions — thyroid disorders and vitamin B12 deficiency among them — can also present with mood and energy changes, which is one reason a physician may suggest blood work alongside a mental health assessment.',
        ],
      },
    ],
  },
  {
    id: 'post-preventive-testing-by-age',
    slug: 'preventive-testing-by-age',
    title: 'What preventive testing is worth doing at each stage of life',
    excerpt:
      'A decade-by-decade view of routine screening, and why the right interval matters more than the size of the panel.',
    category: 'Preventive Health',
    author: AUTHOR,
    publishedAt: '2025-12-02',
    readingMinutes: 8,
    featured: true,
    sections: [
      {
        paragraphs: [
          'The instinct when booking a health check is to buy the biggest panel available. That is usually the wrong optimisation. A moderate panel repeated on a reliable schedule produces a far more useful record than an exhaustive one taken once and never repeated.',
        ],
      },
      {
        heading: 'In your twenties: establish a baseline',
        paragraphs: [
          'The purpose of testing at this stage is not to find disease — it is to record what normal looks like for you. A blood count, fasting sugar, a lipid profile and basic liver and kidney markers give a physician a reference point that becomes more valuable every year it survives.',
        ],
      },
      {
        heading: 'In your thirties: add the hormonal and nutritional layer',
        paragraphs: [
          'Thyroid function, vitamin B12 and vitamin D are the additions most often made in this decade. This is also the point at which family history should start shaping the panel: an early history of diabetes or cardiac disease in first-degree relatives is a reason to test earlier and more often than the general guidance suggests.',
        ],
      },
      {
        heading: 'In your forties: bring in cardiac and functional testing',
        paragraphs: [
          'Blood work alone stops being sufficient. ECG, echocardiography and treadmill testing measure function rather than chemistry, and they answer questions a lipid profile cannot. Age-appropriate screening panels also become relevant in this decade — discuss which apply to you with your physician.',
        ],
      },
      {
        heading: 'Fifty and beyond: consistency over breadth',
        paragraphs: [
          'The panels do not change dramatically. What changes is the value of the trend. Twenty years of comparable annual reports is a clinical asset, and by this stage the interval matters more than any single addition to the list.',
        ],
      },
      {
        heading: 'The one rule that applies at every age',
        paragraphs: [
          'Test on a schedule you will actually keep, at the same laboratory where possible, and take every report to the physician who knows your history. A modest panel reviewed properly beats a comprehensive one filed away unread.',
        ],
      },
    ],
  },
  {
    id: 'post-understanding-hba1c',
    slug: 'understanding-hba1c',
    title: 'HbA1c, explained: why one number covers three months',
    excerpt:
      'What HbA1c actually measures, why it is not affected by yesterday’s dinner, and where it falls short.',
    category: 'Diabetes',
    author: AUTHOR,
    publishedAt: '2025-11-06',
    readingMinutes: 6,
    featured: false,
    sections: [
      {
        paragraphs: [
          'Fasting sugar tells you about a morning. HbA1c tells you about a season. Understanding the difference is the key to reading a diabetes report sensibly.',
        ],
      },
      {
        heading: 'What is being measured',
        paragraphs: [
          'Glucose in the bloodstream attaches to haemoglobin in red blood cells, and it stays attached for the life of the cell. Red cells live roughly 120 days. Measuring the proportion of haemoglobin carrying glucose therefore gives a weighted average of blood sugar over the preceding two to three months, weighted toward the more recent weeks.',
          'This is why HbA1c requires no fasting and cannot be gamed by a careful week before the appointment.',
        ],
      },
      {
        heading: 'Why fasting sugar is still ordered alongside it',
        paragraphs: [
          'Two people can share an HbA1c value while having very different days — one steady, the other swinging between highs and lows that average out. Fasting and post-prandial sugar expose that variability. This is why diabetes panels routinely include all three rather than choosing between them.',
        ],
      },
      {
        heading: 'Where HbA1c is less reliable',
        paragraphs: [
          'Because the test depends on red cell lifespan, anything that shortens or lengthens it can distort the result. Anaemia, recent blood loss, transfusion and certain haemoglobin variants all affect the reading. If any of these apply to you, tell the laboratory and your physician — an alternative measure may be more appropriate.',
        ],
      },
      {
        heading: 'What accompanies it in a proper review',
        paragraphs: [
          'A diabetes review is not one number. Urine microalbumin and serum creatinine cover kidney involvement, a lipid profile covers cardiovascular risk, and a blood count provides context. Panels are assembled this way because the complications matter as much as the glucose figure itself.',
        ],
      },
    ],
  },
  {
    id: 'post-heart-numbers',
    slug: 'the-heart-numbers-worth-knowing',
    title: 'The heart numbers worth knowing before you turn forty',
    excerpt:
      'Beyond total cholesterol — the lipid fractions, inflammatory markers and functional tests that build a real cardiac picture.',
    category: 'Heart Health',
    author: AUTHOR,
    publishedAt: '2025-10-12',
    readingMinutes: 7,
    featured: false,
    sections: [
      {
        paragraphs: [
          'Cardiac risk is rarely visible in a single figure. It emerges from a set of measurements read together, which is why cardiac panels are built the way they are.',
        ],
      },
      {
        heading: 'The lipid profile is four numbers, not one',
        paragraphs: [
          'Total cholesterol is the least informative line on the panel. LDL, HDL and triglycerides each behave differently, and the relationships between them carry more information than the total. A normal total figure can conceal an unfavourable distribution.',
        ],
      },
      {
        heading: 'Inflammation and homocysteine',
        paragraphs: [
          'CRP measures general inflammation, and homocysteine is an amino acid that has been studied extensively in cardiovascular contexts. Neither is a standalone verdict — both are read as part of a wider picture, and both are included in detailed cardiac panels for that reason.',
        ],
      },
      {
        heading: 'Chemistry versus function',
        paragraphs: [
          'Blood tests describe composition. ECG, 2D echocardiography and treadmill testing describe behaviour — the rhythm, the structure and the response to exertion. A complete cardiac review covers both, because a normal lipid profile and an abnormal stress response can coexist.',
        ],
      },
      {
        heading: 'When to start',
        paragraphs: [
          'General guidance points to a baseline lipid profile in early adulthood and periodic repetition after that. A family history of early cardiac disease is the strongest reason to begin sooner and test more often. Your physician is the right person to set the interval.',
        ],
      },
    ],
  },
  {
    id: 'post-iron-and-fatigue',
    slug: 'iron-b12-and-persistent-fatigue',
    title: 'Persistent fatigue: what iron, B12 and thyroid testing can rule in or out',
    excerpt:
      'Tiredness that outlasts a bad week deserves a proper work-up. Here is what a full anaemia and nutritional panel actually covers.',
    category: 'Nutrition',
    author: AUTHOR,
    publishedAt: '2025-08-19',
    readingMinutes: 6,
    featured: false,
    sections: [
      {
        paragraphs: [
          'Fatigue is one of the least specific complaints in medicine and one of the most common reasons people book a blood test. A well-constructed panel is useful precisely because it narrows a very wide field quickly.',
        ],
      },
      {
        heading: 'Haemoglobin alone is not iron status',
        paragraphs: [
          'A complete blood count reports haemoglobin, but iron stores can be depleted well before haemoglobin falls. Ferritin reflects stored iron; serum iron and TIBC describe what is circulating and how much capacity remains. Reading the three together distinguishes genuine iron deficiency from other causes of a low count.',
        ],
      },
      {
        heading: 'Vitamin B12',
        paragraphs: [
          'B12 deficiency can produce fatigue alongside neurological and mood symptoms, and it is more common in people following strictly vegetarian or vegan diets, since the vitamin occurs mainly in animal-derived foods. It is a standard inclusion in fatigue panels for that reason.',
        ],
      },
      {
        heading: 'Thyroid function',
        paragraphs: [
          'Both underactive and overactive thyroid states can present as tiredness. TSH is the usual first-line test, with T3 and T4 added when a fuller picture is needed.',
        ],
      },
      {
        heading: 'Why the panels bundle these together',
        paragraphs: [
          'Testing one marker at a time turns a single question into three appointments across six weeks. Comprehensive fatigue panels exist to answer the question in one draw — and to make it clear when the answer is not in the blood at all, which is itself worth knowing.',
        ],
      },
      {
        paragraphs: [
          'Fatigue that persists for more than a few weeks should be discussed with a physician regardless of what any panel shows.',
        ],
      },
    ],
  },
  {
    id: 'post-womens-health-screening',
    slug: 'womens-health-screening-essentials',
    title: "Women's health screening: the tests behind the panels",
    excerpt:
      'AMH, FSH, LH and prolactin, thyroid function and iron studies — what each measures and when cycle timing matters.',
    category: "Women's Health",
    author: AUTHOR,
    publishedAt: '2025-07-30',
    readingMinutes: 6,
    featured: false,
    sections: [
      {
        paragraphs: [
          'Several tests in women’s health panels are timing-sensitive in a way that most routine blood work is not. Knowing which ones changes how you book the appointment.',
        ],
      },
      {
        heading: 'The hormone set',
        paragraphs: [
          'FSH, LH and prolactin are typically drawn on day two to five of the menstrual cycle, because the reference ranges used to interpret them are defined for that window. Prolactin is additionally sensitive to time of day and to stress, so it is usually sampled in the morning, at least an hour after waking.',
          'AMH is the exception: it is relatively stable across the cycle and can be drawn at any point, which is part of why it is used in ovarian reserve assessment.',
        ],
      },
      {
        heading: 'Thyroid function',
        paragraphs: [
          'Thyroid disorders are more prevalent in women, and thyroid function interacts with menstrual regularity and fertility. TSH appears in almost every women’s health panel for that reason.',
        ],
      },
      {
        heading: 'Iron and anaemia',
        paragraphs: [
          'Menstrual blood loss makes iron deficiency more common, and a complete blood count with ferritin, serum iron and TIBC gives a fuller answer than haemoglobin on its own.',
        ],
      },
      {
        heading: 'Pre-marital and pre-conception screening',
        paragraphs: [
          'These panels add haemoglobin electrophoresis, which identifies inherited haemoglobin traits relevant to family planning, along with blood group and standard infection screening. Both partners are generally advised to test together, since several of the findings are only meaningful as a pair.',
        ],
      },
      {
        paragraphs: [
          'Call ahead when booking hormone testing so the appointment can be timed to your cycle — it is the difference between a result that can be interpreted and one that cannot.',
        ],
      },
    ],
  },
  {
    id: 'post-mens-health-screening',
    slug: 'mens-health-screening-after-forty',
    title: "Men's health screening after forty",
    excerpt:
      'PSA, testosterone and metabolic markers — what changes in routine screening for men in the fifth decade.',
    category: "Men's Health",
    author: AUTHOR,
    publishedAt: '2025-07-08',
    readingMinutes: 5,
    featured: false,
    sections: [
      {
        paragraphs: [
          'Men are consistently less likely than women to attend routine preventive checks, and the conditions that screening picks up are largely silent in their early stages. The fifth decade is where the case for a schedule becomes hard to argue with.',
        ],
      },
      {
        heading: 'PSA',
        paragraphs: [
          'Prostate-specific antigen is a screening marker, not a diagnosis. It can be raised for several benign reasons, and the decision to test — and what to do with the result — is one to make with a physician who knows your history and family background.',
        ],
      },
      {
        heading: 'Testosterone',
        paragraphs: [
          'Testosterone declines gradually with age. It is measured in the morning, when levels peak, and interpreted against symptoms rather than in isolation. It appears in pre-marital and fertility panels alongside seminal fluid examination.',
        ],
      },
      {
        heading: 'The metabolic core',
        paragraphs: [
          'Fasting sugar, HbA1c, a lipid profile and liver and kidney panels remain the backbone. Cardiovascular and metabolic conditions account for the largest share of what preventive screening in this age group is designed to surface early.',
        ],
      },
      {
        heading: 'Make it routine',
        paragraphs: [
          'Booking the same check in the same month every year removes the decision from the equation. Pairing it with a fixed annual date — a birthday works well — is the simplest way to make it stick.',
        ],
      },
    ],
  },
];

export const getPostBySlug = (slug: string): BlogPost | undefined =>
  BLOG_POSTS.find((p) => p.slug === slug);
