# Health reports

The lab's long-form health features — full newspaper-style pages in Gujarati,
set in columns with an expert byline at the foot. Drop the originals here at
full size, then run:

```bash
npm run images
```

That generates responsive AVIF/WebP/JPEG sets into `public/media/reports/` and
rewrites `src/data/healthReportImages.ts` with real dimensions. Like the
awareness artwork, these encode at the higher quality tier — dense Gujarati body
copy at small sizes is exactly what aggressive AVIF smears.

**This folder is not `assets-src/awareness/`.** That one holds the square social
artwork that closes the About page under "From our Instagram". These are printed
features, they are 3:4 rather than 4:5, and they appear in their own band at the
foot of the Blog page. A printed feature filed under "From our Instagram" would
be mislabelled, and that section's Instagram call to action would be wrong for
it.

**The filename is the key, and it is used twice.** It selects the alt text and
caption in `scripts/optimise-images.mjs`, and it selects the English title,
summary, contents list and onward link in `src/data/healthReports.ts`. Add a
feature and you need an entry in both, or the row falls back to a generic
caption with no summary.

| Filename                    | Feature                                          |
| --------------------------- | ------------------------------------------------ |
| `obesity.jpg`               | Obesity is more than a matter of weight          |
| `health-checkup-by-age.jpg` | Which check-up is needed at which age            |
| `kitchen-cancer-risk.jpg`   | Five things in the kitchen worth a second look   |

Display order is set by the `order` array for this collection in
`scripts/optimise-images.mjs`, not by filename.

Three things to check before adding one:

- **The artwork is reproduced unchanged.** The English text beside a feature is
  a summary of what it says, never a rewrite presented as the lab's own wording.
- **Do not repeat the byline as site copy.** These features close with a named
  consultant pathologist's note. That byline belongs to the lab's own
  publication; restating the name and credential as text we write would be us
  asserting a credential rather than reproducing theirs.
- **Only link a feature where the catalogue answers it.** The kitchen feature
  has no onward link for exactly this reason — nothing in the published
  packages follows from it.

Originals in this folder are **not** deployed — only the generated files under
`public/` are.
