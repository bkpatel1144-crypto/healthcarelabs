# Healthcare Labs

Marketing and booking site for **Healthcare Labs** — the diagnostics practice of
Desai Healthcare Pathology Laboratory [OPC] Pvt. Ltd., Surat.

React + TypeScript + Vite + Tailwind. Static build, no backend, deploys to Vercel.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # regenerates sitemap.xml, typechecks, then builds to dist/
npm run preview    # serve the production build
npm run lint       # typecheck only (tsc --noEmit)
```

---

## Where to change things

| What | File |
| --- | --- |
| Phone, email, WhatsApp, address, hours, socials, **NABL certificate** | `src/config/site.ts` |
| Health packages (names, prices, test lists, preparation) | `src/data/packages.ts` |
| Offers (derived from package pricing) | `src/data/offers.ts` |
| Blog articles | `src/data/blogs.ts` |
| Concern taxonomy used by the filters | `src/data/healthConcerns.ts` |
| Departments and installed analysers | `src/data/labFacility.ts` |
| Accreditation record and ceremony details | `src/data/accreditation.ts` |
| Testimonials | `src/data/testimonials.ts` |
| Colour, type scale, shadows | `tailwind.config.js` |

**Contact details live in exactly one place.** `src/config/site.ts` is the only
file that holds a phone number, an email address or an address. Nothing else in
the codebase hard-codes them.

---

## Content provenance

Everything factual on this site is transcribed from healthcare-labs.com or
supplied by the lab:

- **17 health packages** with the lab's own published prices and test lists.
- **Contact details, opening hours, legal entity name.**
- **NABL accreditation**, certificate `MC-6960` (medical testing), awarded at the
  felicitation ceremony at Hotel Radisson Blu, New Delhi on 9 December 2024 —
  all read off the certificate and the ceremony backdrop.
- **Vision / mission / quality statements**, quoted verbatim and labelled as the
  organisation's own words.
- **Departments and installed analysers** — Beckman Coulter AU480 and Access 2,
  Bio-Rad D-10, Mindray BC-5130, across Biochemistry, Hematology and Immunology
  — all read off the equipment and signage in the facility photographs.

`src/data/labFacility.ts` states instrument *capability* only. It deliberately
does not claim which analyser runs which package: routing is the lab's decision
and is not something a photograph can evidence.

**One open question:** the facility signage reads "24 HOUR SERVICE", which
contradicts the published hours (7 AM – 10 PM, and 7 AM – 2 PM on Sunday). The
site publishes the hours and makes no 24-hour claim. Confirm which is correct
before changing either.

Deliberately **not** published, because it could not be evidenced: patient
counts, accuracy percentages, turnaround guarantees, and attributed patient
testimonials. Package and test counts shown on the site are computed from the
catalogue at build time, so they cannot drift.

`src/data/testimonials.ts` carries the seven reviews Healthcare Labs publishes
on healthcare-labs.com, transcribed verbatim from named reviewers — nothing
there is written or embellished. The homepage renders them as a scrolling card
wall; if the array is emptied it falls back to the lab's own published vision,
mission and quality statements, labelled as the organisation's words rather
than a patient's. More entries can be added via `/admin`.

Template junk from the old WordPress site was dropped entirely: `demo@gmail.com`,
`+91 9988776655`, the "5th Street, 21st Floor, New York" address, four stock
doctor profiles, Vokalia/Consonantia lorem text, and a spam "Crypto Discord"
blog post.

---

## Hero

The hero background is real laboratory footage supplied by the client, encoded
into `public/media/`:

| File | Size | Notes |
| --- | --- | --- |
| `hero-lab.mp4` | 980 KB | 1080p, desktop |
| `hero-lab-720.mp4` | 444 KB | 720p, phones and tablets |
| `hero-lab-poster.jpg` | 95 KB | poster, and the only asset under reduced motion |

The clip loops by **crossfading its own tail back onto its head** — 10.5 s from
source 1 s–13 s with a 1.5 s dissolve, at full speed. Motion always runs
forward: a ping-pong encode also loops seamlessly but plays the technician's
hands backwards, which reads as broken.

**The segment choice matters more than anything else here.** Sampling the source
at 2 fps, cropped to the band actually visible between the copy column and the
finder panel, gives this motion profile:

| Source window | Motion (RMSE between samples) |
| --- | --- |
| 1–12 s | 15–69 — the pipetting sequence |
| 13–19 s | 6.6–9.0 — holding still at the microscope |

An earlier encode took 10–19.6 s, which is almost entirely the static half, and
measured 7.90 — it played correctly but read as a still photograph. The current
cut measures **30.35**. Seam: 7.34/255 first-frame vs last-frame, against 47.82
for unrelated frames.

`hero-lab-poster.jpg` is the loop's own first frame, so the video's fade-in has
nothing to jump over. Re-extract it alongside any re-encode.

**Pin the H.264 level.** Left to itself ffmpeg produced Level 5.0 for the 1080p
encode, which decodes fine in software but sits above the ceiling many older
hardware decoders accept for High profile — it played on the machine it was
built on and nowhere else. Always pass `-level 4.0` for 1080p and `-level 3.1`
for 720p, and verify:

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=profile,level   -of default=nw=1 public/media/hero-lab.mp4     # expect High / 40
```

**The video always autoplays, with no gating and no controls.** Two earlier
versions withheld it under `prefers-reduced-motion` and on data-saver
connections — the textbook behaviour — and then offered a play button instead.
Both were rejected: on Windows the reduced-motion flag is set by switching off
animation effects, a performance setting as often as an accessibility one, so
ordinary machines showed a still image and looked broken. Autoplay-always is
the client's explicit decision, taken with that trade-off on the table.

It is muted with no audio track at all (`-an` at encode time), which is what
makes autoplay permitted everywhere, and `playsinline` stops iOS forcing
fullscreen. If a browser still rejects the play promise, playback is retried
once on the visitor's first interaction. `HeroVideo` picks the source by viewport in JS (`<source media>` is
unreliable), serves the poster alone when the visitor prefers reduced motion or
the browser reports a data-saver connection, and cross-fades the video in on
`canplay` so there is no first-frame flash.

To re-encode from a new source:

```bash
FC="[0:v]scale=1920:1080:flags=lanczos,fps=25,setsar=1,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0[v]"
ffmpeg -ss 11 -t 8 -i SOURCE.mov -filter_complex "$FC" -map "[v]" \
  -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -profile:v high \
  -movflags +faststart -an public/media/hero-lab.mp4
```

Then re-cut the poster to match the loop's first frame (`-ss` = segment start +
crossfade duration):

```bash
ffmpeg -ss 2.5 -i SOURCE.mov -frames:v 1 -vf "scale=1920:-1:flags=lanczos"   -q:v 5 public/media/hero-lab-poster.jpg
```

Before shipping a new cut, check it actually moves — a technically perfect loop
of a static shot looks broken:

```bash
ffmpeg -i public/media/hero-lab.mp4 -vf "fps=2,crop=iw*0.28:ih:iw*0.36:0" /tmp/f%03d.jpg
# then compare consecutive frames; below ~8 RMSE reads as a still image
```

The overlay in `HeroVideo.tsx` is a five-layer stack, and the layer opacities are
load-bearing: the footage is bright white PPE exactly where the headline sits, so
legibility comes from a **left-weighted ramp** rather than one flat scrim. A
uniform darkening heavy enough for the copy made the footage invisible. Measured
contrast over the copy column is 18.4:1 for the headline and 12.4:1 for the lede.

---

## Photographs

Two photo collections are driven by one build-time pipeline. Drop originals into
the matching folder and run `npm run images`.

### `assets-src/accreditation/` — the NABL ceremony

| Filename | Slot |
| --- | --- |
| `certificate-handover.jpg` | Lead image — certificate being handed over |
| `stage-wide.jpg` | Wide shot of the stage |
| `group-photo.jpg` | Group photograph |

### `assets-src/lab/` — the facility

| Filename | Slot / department chip |
| --- | --- |
| `reception.jpg` | Lead image — Front desk |
| `brand-signage.jpg` | Centre |
| `biochemistry-department.jpg` | Biochemistry |
| `chemistry-analyser-operator.jpg` | Biochemistry |
| `chemistry-analyser.jpg` | Biochemistry |
| `hba1c-analyser.jpg` | Biochemistry |
| `hematology-department.jpg` | Hematology |
| `immunoassay-analyser.jpg` | Immunology |

**Filenames select the caption and the department chip** — the tables live in
`scripts/optimise-images.mjs`. Any other filename still works but falls back to
a generic caption.

`npm run images` generates **AVIF + WebP + JPEG at 640/1024/1600 px** into
`public/media/<collection>/`, and rewrites that collection's manifest
(`src/data/accreditationPhotos.ts`, `src/data/labPhotos.ts`) with each photo's
real intrinsic dimensions so the markup reserves exact space and never shifts
layout while loading. Filenames are content-hashed, so replacing a photo busts
its own cache with no manual renaming.

Originals in `assets-src/` are **not** deployed — only the generated files under
`public/`.

Eleven photographs are in place: eight of the facility (reception, the
illuminated mark, the biochemistry floor, the AU480 with and without an
operator, the Bio-Rad D-10, the hematology bench and the Access 2) and three
from the NABL ceremony.

Both sections degrade in both directions. `LabFacility` ("Inside the
laboratory", on the homepage) always renders the departments and the named
analysers from `src/data/labFacility.ts`; the photo grid appears above them once
the manifest has entries. `AccreditationSection` behaves the same way: the certificate record
always renders (those facts are known), and the photo column appears only once
the manifest has entries. With no photos the record lays out as a four-up strip
rather than leaving an empty half. Photos open in a keyboard-navigable lightbox
(arrows, Escape, focus trap, focus restored).

**The official NABL emblem is deliberately absent.** `AccreditationBadge` renders
it if `public/brand/nabl-accreditation.png` exists and falls back to a
typographic badge otherwise. Drawing a convincing stand-in for an official
accreditation mark is not something this codebase should do — the claim carries
on the certificate number.

---

## Accessibility panel

A launcher tab on the left edge (`A11Y`) opens a panel with four controls.
Preferences persist per browser under `healthcare_labs_a11y` and are applied as
data-attributes and an inline `zoom` on `<html>`, so no component needs to know
a preference exists — the styling lives in `index.css`.

| Control | Implementation |
| --- | --- |
| Text size | `zoom` on `<html>`, 5 steps from 90% to 140% |
| High contrast | `data-a11y-contrast` — solid grounds, full-strength text, real borders, underlined links, decorative layers hidden |
| Dyslexia font | `data-a11y-dyslexic` — self-hosted OpenDyslexic |
| Listen to page | Web Speech API over `<main>`, chrome stripped |

**Text size uses `zoom`, not a root font-size.** This design sets type in px
throughout (`text-[15px]` and friends), so a root font-size change would move
nothing. `zoom` reflows properly, unlike a transform, which would break the
fixed header and every sticky element.

**OpenDyslexic is bundled, not loaded from a CDN** (`public/fonts/`, SIL OFL —
licence included). Declaring `@font-face` costs nothing until something uses
the family, so the ~230 KB only downloads for visitors who switch it on.

**Read-aloud hides itself** where the Web Speech API is absent, and cancels on
navigation — hearing the previous page read out after clicking a link is
disorienting.

### Two layout rules this feature forced

Both are in `index.css` and both prevent a whole class of bug, not just this one:

```css
:where(h1, h2, h3, h4, h5, h6, p, li, dt, dd, figcaption, blockquote) {
  overflow-wrap: break-word;
}
:where(.grid) > * { min-width: 0; }
```

At 140% zoom on a 390px phone the effective viewport is ~279 CSS px, and a
heading word set in OpenDyslexic at 30px is wider than the screen. Grid and
flex children default to `min-width: auto`, so they refuse to shrink below
their longest word and widen the page instead of wrapping. Verified: zero
horizontal overflow at the heaviest combination (140% + high contrast +
OpenDyslexic) across 5 routes x 5 widths.

A `vw`-based cap was tried first and does not work — `vw` resolves against the
unzoomed viewport, so it never engages.

---

## Notable implementation choices

**No native `<select>` anywhere.** A native select's *open* menu is drawn by the
OS and CSS cannot touch it — you can style the closed control perfectly and the
popup still appears with the system accent colour. `src/components/common/Select.tsx`
is an ARIA listbox with roving `aria-activedescendant`, full keyboard support
(arrows, Home/End, Enter, Escape, typeahead), click-outside dismissal, upward
flip near the viewport edge, and a hidden input so the value still participates
in form semantics.

**The palette is light.** The build originally ran deep navy throughout. The
client compared it to their existing site — white, vivid blue, photographs of
people — and read the dark version as cold and dated rather than premium. The
polarity is now flipped: white and soft-blue grounds, a colour mesh in the
hero, coral and mint as the second and third accents, and three saturated
gradient blocks (the quick-action strip, the home-collection panel, the closing
CTA) as the colour anchors. Dark is kept only where it is load-bearing: the
footer, the photo lightbox, image scrims, and the admin shell.

Every gradient headline ends on a 600-weight stop. mint-400 measures 2.2:1 on
white and coral-400 2.9:1, both under the 3:1 large-text floor, which made the
last word of each headline the least readable one; the 600 stops measure
4.7–6.9:1.

**Glass is a system, not a class.** `src/index.css` defines four tiers -
`.glass`, `.glass-bar`, `.glass-solid` and `.glass-dark` - sharing one recipe:
a gradient fill rather than a flat alpha, `saturate()` on the backdrop so
colour behind blooms through instead of going grey, an inset 1px highlight
along the top edge, and a low wide shadow. The inset lip is what separates
glass from a translucent rectangle; without it a blurred pane reads as a grey
band. A `@supports not (backdrop-filter)` fallback drops to near-opaque fills,
because a translucent pane over a photograph is unreadable without the blur.

Glass is applied only where something is worth blurring - the header over the
hero mesh, badges and chips over photographs, the finder band over its colour
blooms, icon tiles on the gradient sections, the compare dock and sheet over
the page. Never over flat white, where it is invisible and only costs paint
time.

`.glass-sheen` adds a highlight that tracks the pointer, driven by `useSheen`
writing three CSS custom properties straight onto the element - no React
state, and positions are batched to an animation frame so a high-polling-rate
mouse cannot queue more style writes than the compositor draws. Hidden on
coarse pointers and under `prefers-reduced-motion`, where there is no hover to
track.

The header capsule uses `.glass-bar` rather than `.glass` for a measured
reason: it crosses the hero photograph as you scroll, and at `.glass` density
the photo pulled the ground behind the nav to rgb(188,198,208) - 4.44:1
against `text-ink-muted`, under the 4.5:1 floor. At `.glass-bar` density the
measured worst case is 5.9:1.

**Package comparison.** Seventeen packages overlap heavily, so the real
question is not "what is in this one" but "what does this have that the
cheaper one doesn't". `CompareToggle` queues up to three packages from the
cards or a detail page, a glass dock shows the selection, and the sheet lays
out the union of their tests with a tick or dash per column. Rows where every
package agrees collapse behind a toggle, so the differences lead. The queue
lives in the same localStorage preferences as saved packages.

Matching is on the exact published test name. The lab's own lists word some
tests two ways - "S. TSH" and "TSH", "CBC Indices, ESR" and "CBC, ESR & Blood
Indices" - and deciding that two differently-worded entries are the same test
is the lab's call, not this site's, so the sheet says as much rather than
merging entries and silently changing their test counts. Thirty-two such pairs
exist in the catalogue; normalising case, punctuation and word order collapses
none of them, so a normaliser would not help.

**Header is light in both states.** A white glass bar at rest, flush to the top
edge, contracting into a floating white-glass capsule on scroll. It was dark for
as long as the hero was navy — the polarity flipped with the palette.
`/admin` opens on a light background, so it starts in the capsule state.

**The accreditation band is on the homepage and on About.** NABL is the lab's
strongest single credential, so it gets the hero pill, the footer badge, and a
full section with the certificate and ceremony photography on both pages.

**The header switches to the drawer below `xl`, not `lg`.** Six nav links plus
two icon buttons plus the CTA do not fit between 1024 and 1180 — the labels
wrapped to a second line and pushed the bar to 60px. Verified single-line from
1280 up, drawer below.

**The hero fills the viewport at every size.** `.hero-viewport` in `index.css`
sets `min-height: 100vh` with a `100svh` override behind `@supports`, so mobile
browser chrome does not make it jump; `min-height` rather than `height` lets it
grow when content needs more room. On desktop the hero measures exactly the
viewport (900px at 1440×900, 1080 at 1920×1080, 1440 at 2560×1440).

Below `lg` the test finder moves out of the hero into its own band directly
beneath it. Stacked under the copy it made the mobile hero ~1567px — roughly
two screens. Split, both read as one screen each and nothing is lost. That band
needs its own `overflow-hidden`: the finder's glow is an `-inset-10` absolute
layer, and unclipped it widened the document by 8px at 768.

**Header and hero run full-bleed.** A centred 1360 px shell left roughly 270 px
of dead margin either side at 1920 px, which is what made the page read as a
narrow template. Both now use `Container size="full"` with fluid padding
(`clamp(2.5rem, 4.5vw, 5.5rem)`), and the rest of the site's shell widened to
1560 px. Text blocks keep their own `max-w-*`, so line length stays readable on
an ultrawide.

**Long chip rows scroll, they do not wrap.** The 12 health concerns wrapped onto
five rows on a phone (~290 px of vertical space); they now sit on one 57 px row
with a slim styled scrollbar (`.scroll-row` in `index.css`).

**The hero's right column does work.** `HeroFinder` searches every package name,
summary and individual test in the live catalogue, ranks name matches above test
matches, and routes straight to a result — rather than holding a decorative
graphic.

**The finder's input id comes from `useId`.** It renders twice — hero on
desktop, its own band on mobile — so a hardcoded id appeared twice in the
document, which silently broke `<label for>` association on the second copy.

**localStorage never crashes the app.** `src/lib/storage.ts` falls back to an
in-memory map on private-mode denial, quota errors or corrupt JSON, and
self-heals by dropping unparseable keys.

---

## Local admin

`/admin` is a **client-side content manager, not a secure backend.** There is no
server and no authentication; it edits the copy of the catalogue held in this
browser's localStorage. Routes are `noindex, nofollow` and disallowed in
`robots.txt`.

Dashboard · Packages · Offers · Blog · Testimonials · Leads · Appointments ·
Settings (export / import JSON, reset to shipped data).

Form submissions are written to localStorage only — nothing is transmitted, so
**a submitted form does not notify the lab.** Both success states say so, and the
privacy page explains it.

---

## Deployment

`vercel.json` sets the SPA rewrite, immutable caching for `/assets`, and basic
security headers. Build command `npm run build`, output `dist`. No serverless
functions, no runtime environment variables.

Update `SITE_CONFIG.url` if the domain changes — canonicals, Open Graph URLs,
JSON-LD and `sitemap.xml` all derive from it.

---

## Verification

Checked with a Playwright suite (60 assertions) plus a sweep of 19 routes × 7
widths (320 → 1920):

- Zero console errors, zero page errors, zero failed requests.
- Zero horizontal overflow at any width.
- Package search / concern filter / sort / budget filter / clear, and URL sync.
- Both forms: validation, focus-to-first-error, localStorage persistence,
  success states, and the admin round-trip.
- Admin CRUD → public site, archive, and reset.
- Per-route `<title>`, canonical, description, Open Graph, Twitter, JSON-LD.
- Keyboard: skip link is the first tab stop, mobile drawer traps focus and
  closes on Escape, listbox is fully operable.
- Reduced motion: no video element mounted, poster served, copy intact.

Three suite assertions fail on an ambiguous selector, not on app behaviour:
`/contact-us` renders two forms that both have a `name` field, so the harness
fills the wrong one. The home-collection flow is verified separately on
`/health-package`, where it is the only form.
#   h e a l t h c a r e l a b s 
 
 #   h e a l t h c a r e l a b s 
 
 