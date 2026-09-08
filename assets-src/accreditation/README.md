# Accreditation photographs

Drop the original, full-size photographs in this folder, then run:

```bash
npm run images
```

That generates responsive AVIF/WebP/JPEG sets into `public/media/accreditation/`
and rewrites `src/data/accreditationPhotos.ts` with real dimensions.

**Filenames drive the captions.** Use exactly these three names so each photo
gets the right caption and sits in the right slot:

| Filename                     | Used as                                  |
| ---------------------------- | ---------------------------------------- |
| `certificate-handover.jpg`   | Lead image — the certificate being handed over |
| `stage-wide.jpg`             | Wide shot of the ceremony stage          |
| `group-photo.jpg`            | Group photograph of accredited labs      |

Any other filename still works, but falls back to a generic caption. Captions
are defined in `scripts/optimise-images.mjs`.

Originals in this folder are **not** deployed — only the generated files under
`public/` are.
