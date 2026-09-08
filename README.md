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
| `hero-lab.mp4` | 917 KB | 1080p, desktop |
| `hero-lab-720.mp4` | 368 KB | 720p, phones and tablets |
| `hero-lab-poster.jpg` | 95 KB | poster, and the only asset under reduced motion |

The clip is a **forward + reversed ping-pong encode**, so it loops with no
visible seam. `HeroVideo` picks the source by viewport in JS (`<source media>` is
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

The overlay in `HeroVideo.tsx` is a five-layer stack, and the layer opacities are
load-bearing: the footage is bright white PPE exactly where the headline sits, so
legibility comes from a **left-weighted ramp** rather than one flat scrim. A
uniform darkening heavy enough for the copy made the footage invisible. Measured
contrast over the copy column is 18.4:1 for the headline and 12.4:1 for the lede.

---

## Accreditation photographs

The ceremony photographs are driven by a build-time image pipeline.

**To add or replace them:**

1. Drop the full-size originals into `assets-src/accreditation/` using these
   exact names (they select the caption and the layout slot):
   - `certificate-handover.jpg` — the lead image, certificate being handed over
   - `stage-wide.jpg` — wide shot of the stage
   - `group-photo.jpg` — group photograph
2. Run `npm run images`.

That generates **AVIF + WebP + JPEG at 640/1024/1600 px** into
`public/media/accreditation/`, and rewrites `src/data/accreditationPhotos.ts`
with each photo's real intrinsic dimensions so the markup reserves exact space
and never shifts layout while loading. Filenames are content-hashed, so
replacing a photo busts its own cache with no manual renaming.

Originals in `assets-src/` are **not** deployed — only the generated files under
`public/`.

The `AccreditationSection` degrades in both directions: the certificate record
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

**Long chip rows scroll, they do not wrap.** The 12 health concerns wrapped onto
five rows on a phone (~290 px of vertical space); they now sit on one 57 px row
with a slim styled scrollbar (`.scroll-row` in `index.css`).

**The hero's right column does work.** `HeroFinder` searches every package name,
summary and individual test in the live catalogue, ranks name matches above test
matches, and routes straight to a result — rather than holding a decorative
graphic.

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
#   h e a l t h c a r e l a b s  
 