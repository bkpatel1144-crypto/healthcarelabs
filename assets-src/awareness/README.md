# Awareness posters

The lab's own health-awareness artwork, as published on Instagram. Drop the
originals here at full size, then run:

```bash
npm run images
```

That generates responsive AVIF/WebP/JPEG sets into `public/media/awareness/` and
rewrites `src/data/awarenessPosts.ts` with real dimensions. These encode at a
higher quality than the photograph collections — small Gujarati lettering on
flat colour is exactly what aggressive AVIF smears.

**The filename is the key, and it is used twice.** It selects the alt text and
caption in `scripts/optimise-images.mjs`, and it selects the English title,
summary and onward link in `src/data/awareness.ts`. Add a poster and you need an
entry in both, or the card falls back to a generic caption with no summary.

| Filename                 | Poster                                              |
| ------------------------ | --------------------------------------------------- |
| `no-symptoms.jpg`        | "There's nothing wrong with me"                      |
| `risk-factors.jpg`       | When there are risk factors, or a doctor advises it  |
| `pcos-one-sign.jpg`      | Is an irregular period the only sign of PCOS?        |
| `pcos-other-signs.jpg`   | The other signs that can come with PCOS              |
| `burning-urination.jpg`  | Burning when you urinate — is more water enough?     |
| `choosing-a-lab.jpg`     | Choose a laboratory on reliability, not on distance  |

**This folder is for the square social artwork only.** The lab's full-page
newspaper-style features are a different thing and live in
`assets-src/reports/` — see the README there.

Display order is set by the `order` array for this collection in
`scripts/optimise-images.mjs`, not by filename.

Two things to check before adding one:

- **The artwork is reproduced unchanged.** The English text beside a poster is a
  summary of what it says, never a rewrite presented as the lab's own wording.
- **Only link a poster where the catalogue answers it.** The burning-urination
  poster names a urine culture, which the published packages do not include, so
  it points at the packages that do contain a urine routine instead.

Originals in this folder are **not** deployed — only the generated files under
`public/` are.
