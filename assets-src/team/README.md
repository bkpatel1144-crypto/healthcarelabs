# Team photograph

The photograph shown in the "The people" band on the About page. Drop the
original here at full size, then run:

```bash
npm run images
```

That generates responsive AVIF/WebP/JPEG sets into `public/media/team/` and
rewrites `src/data/teamPhotos.ts` with real dimensions.

| Filename               | Used as                                  |
| ---------------------- | ---------------------------------------- |
| `laboratory-team.jpg`  | The single photograph in the About band  |

Captions and alt text live in `scripts/optimise-images.mjs`. The section renders
the first entry only — add a second photograph and it will be ignored until the
component is changed to expect more than one.

**Nothing goes under this photograph that the lab has not published.** No names,
no qualifications, no headcount. The About page states plainly that the site
prints no figure it cannot evidence, and a team caption is the easiest place to
break that.

The current image was cut out of a screenshot of an Instagram story, so the
story's UI sticker was painted out of the top-right corner and the burned-in
"QUALIFIED TEAM" caption was cropped off the bottom. If the lab can supply the
original photograph rather than a screenshot, replace this file with it and
re-run the command — the cleaned version exists only because the original was
not available.

Originals in this folder are **not** deployed — only the generated files under
`public/` are.
