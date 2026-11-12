/**
 * Turns full-size photographs into responsive, web-ready sets.
 *
 * Drop originals into `assets-src/<collection>/` (any JPG/PNG, any size) and run
 * `npm run images`. For each photo this writes AVIF, WebP and JPEG at three
 * widths into `public/media/<collection>/`, then regenerates that collection's
 * manifest under `src/data/` with real intrinsic dimensions — so the markup can
 * reserve exact space and never shift layout while loading.
 *
 * Filenames are slugged and content-hashed, so replacing a photo busts its
 * cache without any manual renaming. Filenames also select the caption, which
 * is why the tables below are keyed by slug.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WIDTHS = [640, 1024, 1600];
const INPUT_RE = /\.(jpe?g|png|webp|tiff?)$/i;

/*
  Photographs tolerate aggressive quantisation; artwork with lettering in it
  does not. The awareness creatives are flat colour and small Gujarati type,
  which is exactly what low-quality AVIF smears, so a collection can raise its
  own encoder settings rather than everything paying for the worst case.
*/
const PHOTO_QUALITY = { avif: 55, webp: 76, jpeg: 80 };
const ARTWORK_QUALITY = { avif: 72, webp: 88, jpeg: 88 };

const COLLECTIONS = [
  {
    name: 'accreditation',
    manifest: 'accreditationPhotos.ts',
    exportName: 'ACCREDITATION_PHOTOS',
    order: ['certificate-handover', 'stage-wide', 'group-photo'],
    captions: {
      'certificate-handover': {
        alt: 'Healthcare Labs receiving its NABL accreditation certificate on stage at the felicitation ceremony.',
        caption: 'Receiving the NABL accreditation certificate',
      },
      'stage-wide': {
        alt: 'The NABL felicitation ceremony stage, with the accreditation certificate being presented to Healthcare Labs.',
        caption: 'Felicitation ceremony for freshly accredited laboratories',
      },
      'group-photo': {
        alt: 'Group photograph of the laboratories accredited at the NABL felicitation ceremony.',
        caption: 'Accredited laboratories at the ceremony',
      },
    },
  },
  {
    name: 'lab',
    manifest: 'labPhotos.ts',
    exportName: 'LAB_PHOTOS',
    order: [
      'reception',
      'brand-signage',
      'biochemistry-department',
      'chemistry-analyser-operator',
      'hba1c-analyser',
      'hematology-department',
      'immunoassay-analyser',
      'chemistry-analyser',
    ],
    captions: {
      reception: {
        alt: 'Reception at the Healthcare Labs centre, with the immunology department behind it.',
        caption: 'Reception at the Utran centre',
        tag: 'Front desk',
      },
      'brand-signage': {
        alt: 'The illuminated Healthcare Labs mark on the wall at the Utran centre.',
        caption: 'The mark at the Utran centre',
        tag: 'Centre',
      },
      'biochemistry-department': {
        alt: 'Technicians working across analysers in the biochemistry department at Healthcare Labs.',
        caption: 'The biochemistry department mid-run',
        tag: 'Biochemistry',
      },
      'chemistry-analyser-operator': {
        alt: 'A technician operating the Beckman Coulter AU480 clinical chemistry analyser.',
        caption: 'Running a batch on the AU480',
        tag: 'Biochemistry',
      },
      'chemistry-analyser': {
        alt: 'The Beckman Coulter AU480 clinical chemistry analyser at Healthcare Labs.',
        caption: 'Beckman Coulter AU480 — clinical chemistry',
        tag: 'Biochemistry',
      },
      'hba1c-analyser': {
        alt: 'A technician loading samples into the Bio-Rad D-10 analyser used for HbA1c testing.',
        caption: 'Loading samples for HbA1c on the Bio-Rad D-10',
        tag: 'Biochemistry',
      },
      'hematology-department': {
        alt: 'Blood count processing on the Mindray haematology analyser in the hematology department.',
        caption: 'Blood counts in the hematology department',
        tag: 'Hematology',
      },
      'immunoassay-analyser': {
        alt: 'The Beckman Coulter Access 2 immunoassay analyser with a loaded sample rack.',
        caption: 'Beckman Coulter Access 2 — immunoassay',
        tag: 'Immunology',
      },
    },
  },
  {
    name: 'team',
    manifest: 'teamPhotos.ts',
    exportName: 'TEAM_PHOTOS',
    order: ['laboratory-team'],
    captions: {
      'laboratory-team': {
        alt: 'Three members of the Healthcare Labs staff in branded laboratory coats, standing in the laboratory at the Utran centre with a microscope, sample racks and a workstation behind them.',
        caption: 'The laboratory team at the Utran centre',
      },
    },
  },
  {
    name: 'awareness',
    manifest: 'awarenessPosts.ts',
    exportName: 'AWARENESS_POSTS',
    quality: ARTWORK_QUALITY,
    order: [
      'no-symptoms',
      'risk-factors',
      'pcos-one-sign',
      'pcos-other-signs',
      'burning-urination',
      'choosing-a-lab',
    ],
    captions: {
      'pcos-one-sign': {
        alt: 'Healthcare Labs awareness poster in Gujarati, illustrated with a calendar and a sanitary pad, asking whether an irregular period is the only sign of PCOS and answering that a change in periods is not the only sign.',
        caption: 'Is an irregular period the only sign of PCOS?',
      },
      'pcos-other-signs': {
        alt: 'Healthcare Labs awareness poster in Gujarati listing signs some women with PCOS may notice: irregular or absent periods, acne or oily skin, extra facial or body hair, weight gain or difficulty losing weight, and thinning hair or increased hair fall. It adds that not everyone has every symptom.',
        caption: 'The signs that can come with PCOS',
      },
      'burning-urination': {
        alt: 'Healthcare Labs awareness poster in Gujarati about burning during urination, advising that repeated burning should not be ignored, that it can have several causes including a urinary tract infection, and that a urine routine and microscopy is the usual first evaluation with a urine culture where one is needed.',
        caption: 'Burning urination: is drinking more water enough?',
      },
      'choosing-a-lab': {
        alt: 'Healthcare Labs poster in Gujarati carrying the NABL emblem and headed NABL Certified Lab, saying a fast report is not the only thing that matters in a laboratory because accuracy and reliability matter as much, and advising people to choose a laboratory on its reliability rather than on how near it is.',
        caption: 'Choose a laboratory on reliability, not on distance',
      },
      'no-symptoms': {
        alt: 'Healthcare Labs poster in Gujarati showing a woman holding her forehead with a speech bubble reading "nothing is wrong with me", headed "the most misleading health statement?" It says many health conditions give no clear symptoms early on, and lists diabetes and prediabetes, kidney problems and liver conditions as ones that can stay silent. The footer carries the lab phone numbers and website.',
        caption: 'The most misleading health statement',
      },
      'risk-factors': {
        alt: 'Healthcare Labs poster in Gujarati showing a doctor going through a report with a patient across a desk, headed "when there are risk factors or a doctor advises it". It says appropriate health testing can help identify some problems earlier, and adds not to wait for symptoms. The footer carries the lab phone numbers and website.',
        caption: 'When there are risk factors, or a doctor advises it',
      },
    },
  },
  {
    /*
      The lab's long-form health features — full newspaper-style pages in
      Gujarati, set in columns with an expert byline, rather than the square
      social artwork the awareness collection holds. They are 3:4 and dense
      with small type, so they encode at the artwork settings and are meant to
      be opened full size rather than read in a card.
    */
    name: 'reports',
    manifest: 'healthReportImages.ts',
    exportName: 'HEALTH_REPORT_IMAGES',
    quality: ARTWORK_QUALITY,
    order: ['obesity', 'health-checkup-by-age', 'kitchen-cancer-risk'],
    captions: {
      obesity: {
        alt: 'Healthcare Labs health feature in Gujarati headed "Careful! Obesity", set in newspaper columns. It explains that obesity is not only a matter of appearance or weight, that long-standing excess body fat can affect many of the body’s processes, and covers insulin resistance and type 2 diabetes risk, high blood pressure and cholesterol, fatty liver disease, joint pain and mobility, and effects on hormonal balance and fertility. It closes with a consultant pathologist’s note advising a balanced diet, regular exercise and timely health check-ups.',
        caption: 'Obesity: more than a matter of weight',
      },
      'health-checkup-by-age': {
        alt: 'Healthcare Labs health feature in Gujarati headed "which health check-up is needed at which age?", set in newspaper columns. It sets out basic health monitoring from 20 to 35, metabolic health and preventive screening from 35 to 50, and comprehensive screening at 50 and over, notes that risk factors and family history matter as much as age, and lists what to keep in mind before a check-up such as fasting requirements and bringing previous reports.',
        caption: 'Which check-up is needed at which age',
      },
      'kitchen-cancer-risk': {
        alt: 'Healthcare Labs health feature in Gujarati headed with a warning that vegetables kept for months in the fridge and heavily salted pickles can contribute to cancer risk, set in newspaper columns. It covers five things found in a kitchen: mouldy and stored grains and the aflatoxin risk, very sweet or heavily salted preserved foods, very hot tea and coffee above 65 degrees, cold drinks and high-sugar beverages, and fried or heavily browned starchy foods and acrylamide. It closes by saying prevention is about safe storage and moderation rather than throwing food away.',
        caption: 'Five things in the kitchen worth a second look',
      },
    },
  },
{
    name: 'instruments',
    manifest: 'instrumentPhotos.ts',
    exportName: 'INSTRUMENT_PHOTOS',
    /*
      Rendered on flat white with fine edges and screen detail, which is what
      low-quality AVIF turns to mush. They encode at the artwork settings.
    */
    quality: ARTWORK_QUALITY,
    order: ['chemistry', 'dry-chemistry', 'hplc', 'hplc-large', 'immunoassay', 'immunoassay-large', 'clia', 'clia-large', 'haematology', 'plate-reader', 'allergy-panel', 'gel-card', 'semen-analyser', 'centrifuge', 'iui-prep', 'histology', 'cytology', 'skin-prick'],
    captions: {
      'chemistry': {
        alt: 'A Beckman Coulter AU480 clinical chemistry analyser in a clean, brightly lit laboratory, with its workstation monitor and keyboard beside it.',
        caption: 'Beckman Coulter AU480',
      },
      'dry-chemistry': {
        alt: 'A VITROS 250 dry chemistry analyser in a bright, clean laboratory, with its slide trays open and a monitor and keyboard on an arm beside it.',
        caption: 'VITROS 250 dry chemistry analyser',
      },
      'hplc': {
        alt: 'A Bio-Rad D-10 HbA1c analyser on a laboratory bench, with a printer on top and a tray of purple-cap blood tubes loaded beside its screen.',
        caption: 'Bio-Rad D-10',
      },
      'hplc-large': {
        alt: 'A Bio-Rad D-100 HbA1c system standing in a bright laboratory, with racks of purple-cap blood tubes loaded along its sample track.',
        caption: 'Bio-Rad D-100',
      },
      'immunoassay': {
        alt: 'A Beckman Coulter Access 2 immunoassay analyser on a laboratory bench.',
        caption: 'Beckman Coulter Access 2',
      },
      'immunoassay-large': {
        alt: 'A floor-standing Beckman Coulter DxI 600 immunoassay analyser in a bright laboratory, with a monitor and keyboard on its side arm.',
        caption: 'Beckman Coulter immunoassay analyser',
      },
      'clia': {
        alt: 'A Snibe MAGLUMI X3 chemiluminescence analyser on a laboratory bench, with its computer and monitor beside it.',
        caption: 'Snibe MAGLUMI X3',
      },
      'clia-large': {
        alt: 'A large floor-standing Snibe MAGLUMI chemiluminescence analyser with a green light strip along its top, in a bright laboratory, with a touchscreen and keyboard on an arm beside it.',
        caption: 'Snibe MAGLUMI analyser',
      },
      'haematology': {
        alt: 'A Mindray haematology analyser on a laboratory bench, its screen showing cell scatter plots, with a rack of purple-cap blood tubes beside it.',
        caption: 'Mindray haematology analyser',
      },
      'plate-reader': {
        alt: 'A bench-top microplate ELISA reader with a printer, keypad and display, and a 96-well plate beside it on a laboratory bench.',
        caption: 'Microplate ELISA reader',
      },
      'allergy-panel': {
        alt: 'A 96-well ELISA plate with wells coloured yellow after the colour reaction, a multichannel pipette beside it and a microplate reader behind, on a laboratory bench.',
        caption: 'ELISA allergy panel',
      },
      'gel-card': {
        alt: 'A Tulip Matrix gel card centrifuge and incubator on a laboratory bench, with red racks of gel cards and a reagent dispenser.',
        caption: 'Gel card system',
      },
      'semen-analyser': {
        alt: 'An SQA-Vision automated semen analyser on an andrology laboratory bench, with its results screen beside it.',
        caption: 'SQA-Vision semen analyser',
      },
      'centrifuge': {
        alt: 'A bench-top centrifuge with its lid open, and a rack of conical tubes in front of it showing separated layers after density gradient washing, with a micropipette alongside.',
        caption: 'Density gradient semen wash',
      },
      'iui-prep': {
        alt: 'An Androwash automated semen preparation device on an andrology laboratory bench, with conical tubes and a micropipette beside it.',
        caption: 'Semen preparation for IUI',
      },
      'histology': {
        alt: 'An Epredia Excelsior AS automated tissue processor standing in a histopathology laboratory.',
        caption: 'Automated tissue processor',
      },
      'cytology': {
        alt: 'A bench-top liquid-based cytology processor with a tray of sample vials loaded, and a tray of stained slides beside it.',
        caption: 'Liquid-based cytology',
      },
      'skin-prick': {
        alt: 'A forearm marked with a numbered grid during skin prick testing, with drops of allergen extract and two small red reactions, a gloved hand measuring them with a ruler, and allergen extract bottles and a lancet beside the arm.',
        caption: 'Skin prick testing',
      },
    },
  },
];

function slugOf(file) {
  return basename(file, extname(file))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

let totalWritten = 0;

for (const collection of COLLECTIONS) {
  const srcDir = join(root, 'assets-src', collection.name);
  const outDir = join(root, 'public', 'media', collection.name);
  const manifestPath = join(root, 'src', 'data', collection.manifest);

  if (!existsSync(srcDir)) {
    mkdirSync(srcDir, { recursive: true });
    console.log(`[${collection.name}] created ${srcDir} — drop photos there.`);
    continue;
  }

  const files = readdirSync(srcDir).filter((f) => INPUT_RE.test(f));
  if (files.length === 0) {
    console.log(`[${collection.name}] no images found — leaving the manifest as is.`);
    continue;
  }

  mkdirSync(outDir, { recursive: true });
  const quality = collection.quality ?? PHOTO_QUALITY;
  const entries = [];

  for (const file of files) {
    const buffer = readFileSync(join(srcDir, file));
    const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 8);
    const slug = slugOf(file);

    const image = sharp(buffer).rotate(); // honour EXIF orientation
    const meta = await image.metadata();
    const srcWidth = meta.width ?? 0;
    const srcHeight = meta.height ?? 0;
    if (!srcWidth || !srcHeight) {
      console.warn(`  !! ${file}: could not read dimensions, skipped`);
      continue;
    }

    const widths = WIDTHS.filter((w) => w <= srcWidth);
    if (widths.length === 0) widths.push(srcWidth);

    const written = { avif: [], webp: [], jpeg: [] };

    for (const width of widths) {
      const resized = image.clone().resize({ width, withoutEnlargement: true });
      const stem = `${slug}-${hash}-${width}`;

      await resized
        .clone()
        .avif({ quality: quality.avif, effort: 5 })
        .toFile(join(outDir, `${stem}.avif`));
      written.avif.push({ width, file: `${stem}.avif` });

      await resized.clone().webp({ quality: quality.webp }).toFile(join(outDir, `${stem}.webp`));
      written.webp.push({ width, file: `${stem}.webp` });

      await resized
        .clone()
        .jpeg({ quality: quality.jpeg, progressive: true, mozjpeg: true })
        .toFile(join(outDir, `${stem}.jpg`));
      written.jpeg.push({ width, file: `${stem}.jpg` });
    }

    const srcset = (list) =>
      list.map((x) => `/media/${collection.name}/${x.file} ${x.width}w`).join(', ');
    const largest = written.jpeg[written.jpeg.length - 1];
    const info = collection.captions[slug] ?? {
      alt: `Healthcare Labs — ${slug.replace(/-/g, ' ')}`,
      caption: '',
    };

    entries.push({
      id: slug,
      width: srcWidth,
      height: srcHeight,
      src: `/media/${collection.name}/${largest.file}`,
      avif: srcset(written.avif),
      webp: srcset(written.webp),
      jpeg: srcset(written.jpeg),
      alt: info.alt,
      caption: info.caption,
      ...(info.tag ? { tag: info.tag } : {}),
    });

    totalWritten += widths.length * 3;
    console.log(`  [${collection.name}] ${file} -> ${widths.join('/')}px (${srcWidth}x${srcHeight})`);
  }

  entries.sort((a, b) => {
    const ai = collection.order.indexOf(a.id);
    const bi = collection.order.indexOf(b.id);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.id.localeCompare(b.id);
  });

  writeFileSync(
    manifestPath,
    `// GENERATED FILE — do not edit by hand.
// Run \`npm run images\` after changing anything in assets-src/${collection.name}/.
import type { SitePhoto } from '@/types';

export const ${collection.exportName}: SitePhoto[] = ${JSON.stringify(entries, null, 2)};
`,
    'utf8',
  );

  console.log(`[${collection.name}] wrote ${entries.length} photo(s) to src/data/${collection.manifest}`);
}

console.log(`\nDone — ${totalWritten} derivative file(s) written.`);
