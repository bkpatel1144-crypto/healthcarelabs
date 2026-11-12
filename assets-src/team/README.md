# Team photographs

The photographs in the "The people" band on the About page. Drop originals
here at full size, then run:

```bash
npm run images
```

That generates responsive AVIF/WebP/JPEG sets into `public/media/team/` and
rewrites `src/data/teamPhotos.ts` with real dimensions.

| Filename                  | Used as                                      |
| ------------------------- | -------------------------------------------- |
| `laboratory-team.jpg`     | The group photograph heading the band        |
| `viral-desai.jpg`         | Lab Director & Founder, the feature block    |
| `dr-mayuri-thumar.jpg`    | Consultant Pathologist card                  |
| `dr-bhoomika-narola.jpg`  | Consultant Pathologist card                  |
| `dr-shruti-devani.jpg`    | Consultant Pathologist card                  |

Alt text and captions live in `scripts/optimise-images.mjs`, keyed by filename.
Who each person is, and the order they appear in, lives in `src/data/team.ts`,
keyed by the same slug. Change a filename and you have to change both.

## What may be printed under a face

Only what the lab has published. It supplied four names and four roles, and
that is exactly what the About page prints.

**No qualifications, degrees, registration numbers or years of service.** None
were given, and a credential invented under a named doctor's photograph is the
worst thing this site could carry — a reader is entitled to rely on it. If the
lab supplies real biographies in writing, put them in the `bio` field in
`src/data/team.ts` and the cards will render them. The automated check in the
harness fails the build of the About page if anything resembling a degree,
a registration or a length of service appears in this band.

## Provenance of the current files

`laboratory-team.jpg` was cut out of a screenshot of an Instagram story, so the
story's UI sticker was painted out of the top-right corner and the burned-in
"QUALIFIED TEAM" caption was cropped off the bottom.

The three pathologist portraits arrived as a single 912x430 contact sheet, so
each was only 224x298 once cut out — far too soft for a card. They were
super-resolved with `google/nano-banana-edit` to 864x1184 and trimmed to 4:5.
That model reconstructs detail rather than inventing a new subject, so the
faces are theirs; it was chosen over a text-to-image model, which cannot
reproduce a person it has never seen, and over `recraft/crisp-upscale`, which
preserved the faces faithfully but garbled the lettering on the coats and the
back wall. Note that the reconstruction does flatter slightly — compare against
the original sheet before assuming a feature is real.

**If the lab can supply the original photographs, replace these files and
re-run the command.** Reconstructed detail is a stopgap for a missing original,
not a substitute for one.

`viral-desai.jpg` is an unmodified 1110x1417 original, trimmed to 4:5.

Originals in this folder are **not** deployed — only the generated files under
`public/` are.
