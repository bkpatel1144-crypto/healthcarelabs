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

`src/data/testimonials.ts` ships as an empty array on purpose. The homepage
renders the lab's published commitments instead, and switches to a testimonial
carousel automatically once real, consented entries are added via `/admin`.

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

**Reduced motion and data-saver get a play button, not silence.** If the visitor
prefers reduced motion, or the browser reports save-data or a 2G connection,
the video is not mounted — but a "Play background video" control is, so the
footage is still reachable and its absence is visible. The earlier version
silently showed only the poster, which meant a PC with Windows animation
effects switched off (a performance setting as often as an accessibility one)
appeared to have a broken hero with no way to recover. `HeroVideo` picks the source by viewport in JS (`<source media>` is
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

## Notable implementation choices

**No native `<select>` anywhere.** A native select's *open* menu is drawn by the
OS and CSS cannot touch it — you can style the closed control perfectly and the
popup still appears with the system accent colour. `src/components/common/Select.tsx`
is an ARIA listbox with roving `aria-activedescendant`, full keyboard support
(arrows, Home/End, Enter, Escape, typeahead), click-outside dismissal, upward
flip near the viewport edge, and a hidden input so the value still participates
in form semantics.

**Header is dark in both states.** Transparent at rest so the navy hero runs to
the top edge, contracting into a floating navy-glass capsule on scroll. A white
bar cut a bright band across the hero; staying dark also means one text colour
scheme throughout. `/admin` opens on a light background, so it starts in the
capsule state.

**No accreditation band on the homepage.** NABL is surfaced by the hero pill,
the footer badge and the dedicated section on About. A fourth treatment as a
band above the capability strip was redundant and read as filler.

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