# StoryDex — Design Direction

**Working name for this direction: “The Midnight Archive.”**

A screening room, not a dashboard. The interface behaves like a curated print
archive that happens to be interactive: ink-black paper, one violet ink, one
warm accent reserved for a single job, editorial serif titles, and technical
mono numerals. Artwork is the loudest element on every screen; UI chrome is the
quietest.

This document is the specification. It is implemented — every token, measurement
and rule below exists in the codebase, and the file paths are given so the
reasoning can be traced back to the source.

---

## 0. The one idea everything follows

> **One warm colour, one job.**

The brief asked for “restrained use of glow” and “avoid excessive borders,
badges, shadows.” The way to earn that restraint is to give a single colour a
single meaning and never spend it anywhere else.

**Ember (`#ffb457`) means: *you are here, and here is what to watch next.***

It appears on the current entry in the Franchise Map, the “Up next” eyebrow on
the dashboard hero, the progress rule of a story you are mid-way through, and
the row marker of the entry you have in flight. Nothing else. Not buttons, not
links, not decoration.

Everything else falls into four semantic groups:

| Role | Colour | Meaning |
| --- | --- | --- |
| Identity | violet `#8b5cf6` / `#a78bfa` | StoryDex itself — chrome, actions, the default progress rule |
| Ahead | veil `#6f6a8c`, lilac `#b79cff` | not started, or planned later |
| Here | ember `#ffb457` | your current position in a story |
| Done | jade `#45e0a0` | finished, earned |

That is the whole system. It means a user can scan a page of artwork and read
their own progress from colour alone, and it means the warm accent can be tiny —
a 3px dot — and still stop the eye.

---

## 1. Overall visual identity

**Ink, not black.** The canvas is `#050410` — near-black with a violet bias, so
nothing ever reads as a neutral Tailwind gray. Surfaces step up in *light*, not
in borders: `#08070f` → `#0b0917` → `#100e1e` → `#171428` → `#1f1b35`.

**Four atmosphere layers** (`components/Atmosphere.tsx`) sit behind every page:

1. **Ink base** — the violet-black canvas.
2. **Aurora** — three slow-drifting radial blooms (violet, indigo, cyan) at 34s,
   46s and 58s. Different periods means the background never visibly repeats.
3. **Horizon** — a wide ellipse of light bleeding down from above the fold, so
   pages feel lit from a source rather than uniformly filled.
4. **Vignette + grain** — an edge falloff that pulls the eye to the composition
   centre, and 3.5% SVG film grain in `overlay` blend.

Cost: one fixed `pointer-events-none` div, no images, no canvas. It is what
stops the product from looking like a template, and it is entirely disabled
under `prefers-reduced-motion`.

**Per-story tint comes from the artwork itself.** AniList returns
`coverImage.color` — the dominant colour of each cover — and every franchise
carries it through as `accentColor`. Heroes, cards and the atmosphere layers
tint themselves in sympathy with the poster sitting inside them, for free: no
colour extraction, no canvas, no extra request. When AniList omits the colour
(it happens on older entries) `storyTint()` falls back to a hue derived from the
franchise id, clamped to a ±34° violet-family spread so an untinted story still
reads as StoryDex rather than as a random colour.

**Hairlines, not borders.** Cards do not have boxes. Surfaces are separated by
1px rules at 7% white (`--color-hairline`), often gradient-faded at both ends
(`.rule-fade`). Radii are generous — 22px on cards, 28–32px on plates — because
large radii read as “object” and small radii read as “widget.”

**Glass is chrome-only.** Real `backdrop-filter` blur appears in exactly two
places: the navbar when condensed, and the “Up next” plate that floats over
artwork. Everywhere else, depth comes from gradients and light, not from
frosted panels — which is what separates a media product from a SaaS dashboard.

Net effect on the shelf grid: **the cards have no borders and no shadows at all**
separating them from each other — hairlines only ever appear *between sections
and rows* — and each card carries exactly two overlays (a scrim and a hover
wash) where the previous card carried four effects (`shadow-2xl +
shadow-brand/20 + hover:ring + hover:-translate-y`).

---

## 2. Dashboard layout

The previous hierarchy was a 72px all-caps “YOUR STORIES” banner and four equal
stat boxes. That is a control panel. The new page is **“The Shelf”** — five
registers, each answering exactly one question:

```
┌─ imported-from strip ──── 1px rule, findable but never first ──────────────┐
│                                                                            │
│  1  CONTINUE WATCHING      ← where am I right now?                         │
│     full-bleed cinematic hero, 8s staging rail along the bottom            │
│                                                                            │
│  2  LIBRARY SUMMARY        ← how far have I come?                          │
│     one ring + one proportional ledger on hairlines (no cards)             │
│                                                                            │
│  3  UP NEXT RAIL           ← what should I open?                           │
│     five posters, captions underneath, horizontal scroll on mobile         │
│                                                                            │
│  4  THE SHELF              ← what do I own?                                │
│     editorial heading + filter rail + 2–6 column poster grid               │
│                                                                            │
│  5  LOOSE THREADS          ← what did I abandon?                           │
│     a ledger of stalled stories, quietest section on the page              │
└────────────────────────────────────────────────────────────────────────────┘
```

**Why one hero and not four stats.** A tracker’s most valuable pixel is the next
episode. So the dashboard opens with it at full bleed, and the aggregate numbers
are demoted to a single ring plus a ledger strip — *“3 of 14 stories complete ·
1,284 of 2,110 episodes”*. One number stated confidently beats four competing.

**Why “Library composition” is a 6px strip.** Phase distribution (complete / in
progress / caught up / backlog / planned / paused / dropped) is a hundred data
points of nuance and about 40px of legitimate screen space. A proportionally
flex-growed bar with a hairline legend says it once, then gets out of the way.

**The screen door.** Section eyebrows are 11px mono, uppercase, 0.14em tracking,
in `--color-veil`. Headings are editorial serif at
`clamp(1.75rem, 3vw, 3rem)`. That pairing — tiny technical label over large
editorial title — is the single most repeated typographic move in the product
and it is what makes a list of sections read as a publication.

**What is not on this page:** view toggles, chart widgets, notifications, user
avatars, a floating action button. The library *is* the content.

---

## 3. Franchise card design

`components/StoryCard.tsx` — a 2:3 poster, and nothing that could be mistaken
for a container. The card is the artwork; the interface is what the artwork says.

**Resting state — six marks total:**

```
┌────────────────────────┐
│ 3/4              ●     │  mono counter (11px) · status dot
│                        │
│                        │
│                        │
│                        │
│  In progress ─ 4 ent.  │  ← hover only
│  ⏵ Next · Season 3     │  ← hover only
│  Re:ZERO − Starting…   │  17px semibold, 2-line clamp
│  2016–2024        75%  │  mono year span · mono percentage
│  ▬▬▬▬▬▬▬▬▬▬░░░░░░░░░  │  2px ticked progress rule
└────────────────────────┘
```

**Hover is an opening, not a lift.** Three coordinated moves over 500ms on one
easing curve:

1. The artwork scales to `1.045` over **900ms** — noticeably slower than the
   card's own motion. Artwork moves at the speed of a camera; chrome moves at
   the speed of a hand. That single asymmetry is most of what makes it feel
   expensive.
2. The lower scrim deepens, and the detail layer — phase tag, entry count, next
   entry with a play disc, your score — fades up into space that was already
   reserved. **No layout shift, ever.** The card does not grow; it reveals.
3. A faint radial wash in the story’s own accent colour appears from the top
   left, as if the card caught light.

The card lifts only 6px on a shadow that is one inset rim plus one soft ambient
shadow — not the stacked `shadow-2xl + ring + border` combination that
immediately reads as generated.

**Progress is a rule, not a pill.** 2px, ticked at each entry boundary so the
user can count entries rather than estimate a percentage. Violet by default,
**ember when you are mid-story, jade when finished** — so an entire grid of
franchises can be read at a glance: warm threads are the ones in flight, green is
done, violet is untouched.

The card is also the unit of the grid, and the grid is deliberately dense:
2 columns on mobile, 3 at `sm`, 4 at `lg`, up to 6 at `2xl`. Media libraries
should feel like shelves you can scan, not tiles you have to scroll.

---

## 4. Franchise detail page

`app/franchise/[id]/page.tsx` — the flagship. Five movements:

### 4.1 Hero (86–92svh, full bleed)

The banner fills the viewport, then receives a four-layer grade: horizontal fade
(dark on the text side), vertical scrim, a top-to-bottom ink wash, and a radial
tint in the story’s own hue. On load the artwork settles from `scale(1.08)` over
1.6s — a focus pull, not a zoom.

Content is bottom-anchored: a **236px poster plate** with its own bloom, then the
eyebrow rail — phase, year span, entry count, all mono — then the title in
Instrument Serif at `clamp(2.6rem, 7vw, 5.25rem)` with `-0.02em` tracking, then
the synopsis measured to **62ch** so it reads like a film note rather than a
paragraph of UI copy.

Genres are **plain mono text with hairline separators**, not a chip cloud. Chips
on a hero is the most reliable signal of a generated layout.

The whole hero block drifts up 78px and fades to 15% as you scroll — 40px of
parallax, the only parallax in the product.

### 4.2 Next to Watch (a wide plate spanning the fold)

A single plate, pulled up `-mt-10`/`-mt-16` so it overlaps the hero — the
“cinematic overhang.” It carries the entry’s own artwork, scaled 110% and heavily
desaturated behind the copy, so the plate belongs to *that entry* and not just
the franchise.

Left: **ember eyebrow** (“Watch next” / “Continue watching” / “Coming soon”),
the entry title in serif, and a mono metadata rail. Right: one filled white CTA
and one ghost. Two actions total.

Three states, three different actions — this is where the product earns trust:

- `CURRENT` → **Resume** (play glyph), plus “View on AniList”
- `PLANNING` / not started → **Start watching**
- `NOT_YET_RELEASED` → eyebrow becomes **“Coming soon”**, the play button is
  *removed* and replaced by “View on AniList”. A tracker that offers a play
  button for something that does not exist yet is lying.

When a story is genuinely finished, the plate is replaced by a **CompletionPlate**
in jade: *“You finished Steins;Gate — 3 entries · 50 episodes · every one
watched.”*

### 4.3 Franchise Map (see §5)

### 4.4 The full record

Every entry as an editorial row, not a card: index numeral, 16:9 artwork crop,
title, mono metadata rail, status, and an AniList link that fades in on hover.
Watched rows drop to 70% opacity with a desaturated crop and a small jade check
overlay; the row you are currently watching gets a **2px ember left edge**.
Hover returns full opacity — the row wakes up when you look at it.

### 4.5 The ledger (sticky sidebar on desktop, second on mobile)

Three blocks: the numbers (entries, watched, episodes, span, your score, format
mix as a proportional rule), “where you stand” (per-status counts with
proportional hairlines), and genres as plain text.

On mobile the ledger moves **above** the full record — a reader on a phone wants
the summary before a six-row table.

---

## 5. Timeline / Franchise Map

`components/FranchiseMap.tsx`

**The problem with every anime timeline.** Thumbnail left, metadata right, dots
on a wire. It communicates order, and only order. It has no point of view, so it
cannot make you feel anything about your own progress.

**The idea: draw the story as a road you have already walked.**

```
   ✓  01  2016  Re:ZERO − Starting Life in Another World        WATCHED
   │           TV · 25 eps · scored 9.2
   ✓  02  2020  Re:ZERO Season 2                                WATCHED
   │           TV · 13 eps
   ✓  03  2021  Re:ZERO Season 2 Part 2                         WATCHED
   │           TV · 12 eps
   ◉  04  2024  Re:ZERO Season 3          [WATCH NEXT]         WATCHING
   │           TV · 16 eps · ep 6 / 16
   │           ▬▬▬▬▬▬░░░░░░░░░░░░░░░░
   ○  05  2026  Re:ZERO Season 4                                 PLANNED
   │           TV · eps TBA · not aired
```

**How it is built.** Rather than one long rule, the road is **one 3px segment
per node**, absolutely positioned to span exactly that row. That is what makes it
pixel-accurate — the lit/unlit boundary always lands on a node — and it makes the
road animatable: each travelled segment draws itself downward (`scaleY 0 → 1`)
when its row enters the viewport, staggered 90ms apart. **The road is laid as you
read it.** There is no scroll-jacking and no custom scroll listener.

**The node vocabulary** is the smallest set that can carry the meaning:

| Marker | Means |
| --- | --- |
| jade ring with a check | watched |
| **ember disc with a breathing halo** | *this is where you are* |
| dashed lilac ring | planned |
| hollow veil ring | not yet released |
| coral ring | dropped |

The ember node is the single most important pixel in the product: everything
above it is past, everything below is future. It pulses (`animate-halo`, 2.8s)
because it is alive. Nothing else on the page animates continuously.

**Text-first, deliberately.** Posters on the timeline would collapse the design
back into a list of thumbnails. Instead the left register is mono (index, year),
the right register is the title in sans, and artwork arrives on click via an
**entry sheet** — a 440px right-side rail on desktop, a bottom sheet on mobile —
carrying the poster, full metadata, an AniList deep link, and a jump to the row
in the record.

The map is the journey. The record is the inventory. They are different objects
because they answer different questions.

---

## 6. Typography

Four families, four jobs. This is the part that most distinguishes the design
from a Tailwind default.

| Family | Role | Where |
| --- | --- | --- |
| **Instrument Serif** | editorial voice | story titles, hero copy, page section headings, ledger numerals |
| **Plus Jakarta Sans** | interface voice | nav, buttons, section headers, card titles |
| **Inter** | reading voice | synopses, descriptions |
| **JetBrains Mono** | instrument voice | counts, years, formats, percentages, status tags |

**Scale** (`@theme` in `app/globals.css`):

```
display        88px / 0.94 / -0.03em     hero on the landing page
display-sm     52px / 0.98 / -0.025em    franchise detail title
title          32px / 1.08 / -0.02em     section headings
title-sm       22px / 1.20 / -0.015em    card titles (feature variant)
lead           17px / 1.65               synopses, hero paragraphs
body           15px / 1.60               default
body-sm        13px / 1.50               captions, metadata
label          11px / 0.14em / UPPER     mono eyebrows and status tags
data           13px / tabular-nums       every number in the product
```

**Three rules that do the work:**

1. **Big things get tight tracking; small things get open tracking.** Headlines
   run `-0.02em` to `-0.03em`; mono labels run `+0.14em`. This reads as
   intentional at every size and is the opposite of the default
   `tracking-normal` everything.
2. **Numerals are monospaced and tabular.** Episode counts, years and
   percentages never jitter as values change, and they look like instrumentation
   — which is the correct register for a tracker.
3. **One editorial element per viewport.** Serif is a spice. A page with a serif
   heading, serif body and serif captions is a magazine; a page with one serif
   headline over sans and mono is a product.

The wordmark is serif (“Story” in chalk, “Dex” in violet) with a hairline
underline that draws on hover. It needs no symbol.

---

## 7. Colour system

Defined as `@theme` tokens in `app/globals.css`; legacy shadcn variable names are
aliased onto the new palette so nothing can silently fall back to an old value.

```
CANVAS
  ink-950  #050410   page — violet-biased near-black, never #000
  ink-900  #08070f   recessed panels
  ink-850  #0b0917   raised surfaces (cards, plates)
  ink-800  #100e1e   glass bases
  ink-700  #171428   inputs, artwork placeholders
  ink-600  #1f1b35   highest surface
  ink-500  #2a2545   dividers on light-ish surfaces

TEXT
  chalk    #f2f0fa   primary — a slightly warm white, not #fff
  mist     #a9a3c4   secondary — the workhorse
  veil     #6f6a8c   tertiary — labels, "dim" states

IDENTITY (violet)
  brand-100 #ece6ff · 300 #c4b2ff · 400 #a78bfa
  brand-500 #8b5cf6 (primary action) · 600 #7137ea · 700 #5a1fc4
  indigo-300 #b9c0ff · indigo-400 #8f97ff · indigo-700 #353c9e

SEMANTIC
  ember  #ffb457   YOU ARE HERE / watch next        ← the only warm colour
  jade   #45e0a0   finished
  azure  #5ec8ff   caught up (nothing left to air)
  lilac  #b79cff   planned
  coral  #ff7a6b   dropped
  slate  #7f8ba3   paused
```

**Rules of use**

- Accent colours are held to **under 2% of pixels** on any screen — a working
  rule, not a measurement. They appear as dots, rules and single words: never
  fills, never backgrounds, never large badges.
- Violet is the *only* colour allowed on a button, and only on the landing page;
  in the app, primary CTAs are **chalk-on-ink** (a white pill), which reads as
  neutral, confident and expensive. There is exactly one white button per screen.
- Status is never colour alone: every status also carries a shape (a check, a
  filled disc, a dashed ring, a hollow ring) and a mono text label. Colour-blind
  users lose nothing.
- Gradients are **directional and subtle**: a progress rule from `brand-600` to
  `brand-300`, a scrim from 96% to transparent. There is not one diagonal
  purple-pink wash in the product.

---

## 8. Motion & interactions

`lib/motion.ts` is the whole language, and it is small on purpose.

**One easing family.** `cubic-bezier(0.16, 1, 0.3, 1)` — expo-out — for
everything. Four durations: `0.18` (feedback), `0.34` (UI), `0.62` (sections),
`1.1` (cinematic entrances). When every transition decelerates on the same curve,
the product feels choreographed even though it is just consistent.

**Four rules:**

1. **Distance is small.** Entrances travel 14–18px. Premium motion is restraint,
   not travel. Nothing slides in from off-screen.
2. **Stagger is 55ms.** Enough to read as a cascade, never a slideshow. Capped
   so a 40-item grid finishes settling in under a second.
3. **Motion always answers a question** — *where did this come from?*, *is this
   interactive?*, *what changed?* — and never decorates.
4. **Two speeds per interaction.** Chrome moves in 300–500ms; artwork moves in
   700–900ms. That contrast is what makes hover feel like a camera rather than
   a hover state.

**Signature interactions**

| Interaction | Behaviour |
| --- | --- |
| Continue Watching staging | Crossfades backdrops over 1.1s; the story switches and the tint crossfades with it. Auto-advances every 8s — **paused on hover, on focus, and when the tab is hidden.** |
| Hero entrance | Artwork settles from `scale(1.08)` over 1.6s; copy rises 18px behind it, 100ms later. |
| Card hover | Artwork `1.045` / 900ms; detail layer fades up into reserved space; accent wash appears. Zero layout shift. |
| Progress bars | Grow from `scaleX(0)` **once**, when scrolled into view, over 0.95s. They never re-animate. |
| Filter change | The active underline slides between chips via a shared `layoutId`. |
| Franchise Map | Road segments draw themselves downward, staggered as rows enter view. |
| Route chrome | The navbar is transparent at the top of a page and condenses to glass after 24px. A 1px violet scroll-progress rule sits under it. |
| Navigation | Active nav item is marked by a gradient hairline that shares a `layoutId` with its siblings. |

Every one of these is disabled under `prefers-reduced-motion: reduce`, and every
hover state has a `focus-visible` equivalent.

---

## 9. Mobile adaptation

Mobile is the primary reading context for an anime tracker — people check what to
watch from the couch. The layout is rebuilt, not shrunk.

**Navigation.** Below `md`, the navbar collapses to wordmark + a hamburger that
opens a **full-screen glass sheet**: 22px serif-weight links on hairlines, the
tracked-story count, and a full-width import button. It is the same design
language as the desktop nav, not a fallback.

**Hero.** Posters stack under the copy full-bleed; the staging rail becomes a
horizontally scrollable strip of 40px thumbnails. Text is inset by the shell
gutter, artwork bleeds to the device edge — that bleed is what keeps the hero
feeling cinematic on a 390px screen.

**Cards.** 2 columns at the base size, because posters are the content and small
posters are still readable, while 16px gutters keep them from feeling cramped.

**Franchise detail, reordered.** The grid is 3 blocks with explicit per-breakpoint
order:

```
mobile:        map  →  ledger  →  full record
desktop:       map + full record (left)   |   sticky ledger (right)
```

**Franchise Map.** The road and the marker axis are fixed offsets, so the
structure survives at any width; the metadata rail wraps under the title, the
status column moves below the row. **Nothing is hidden** — the map is the reason
to open a story, so it stays complete. Tap targets on node markers are 32px.

**Entry sheet** becomes a bottom sheet at 86vh, rounded on the top corners only.

**Everything important is ≥44px** on the touch axis, and no interaction depends
on hover: the card’s detail layer is a bonus, never the only route to the next
entry — the hero, the rail, the map and the row all carry that information
independently.

---

## 10. What to remove from the current design

Deletions, with the reason. These are the changes that will do the most work.

| Remove | Why |
| --- | --- |
| **The 72px all-caps “YOUR STORIES” banner** | A dashboard is not a poster. It consumes the entire first viewport to say nothing the page does not already imply. Replaced by the Continue Watching hero. |
| **Four equal stat boxes in a row** | Four numbers of equal weight = no hierarchy. Replaced by one ring (stories complete) and one proportional ledger. |
| **The sticky glass control bar** | A floating panel that follows the scroll and contains a search field, ten chips and a sort menu is a toolbar, and toolbars read as admin. Filters now live inline with the shelf they control, as underlined text with counts. |
| **Status pills with tinted backgrounds and borders** | `bg-blue/20 border border-blue/50` × 40 entries is badge soup. Replaced by a dot or a check plus a mono label. |
| **Genre chip clouds** | Chips on hero sections are the single most reliable tell of a generated layout. Genres are now mono text with hairline separators. |
| **The native `<select>` for sorting** | Instantly cheapens a careful interface. Replaced by a custom popover. |
| **The rounded search input with an inset magnifier** | Replaced by a single underlined field with a mono prompt that lights up on focus — the top of a card catalogue drawer, which is the correct metaphor. |
| **`material-symbols-outlined` ligature icons** | They were never loaded (the font is not in the project), so every status icon was rendering as raw text. Status is now drawn: SVG checks, CSS dots, `lucide-react` for controls. |
| **Status rings and glows stacked on cards** | `hover:shadow-2xl hover:shadow-brand/20` plus a hover ring plus a translate plus a scale is four effects fighting. Now: one lift, one rim-light, one artwork scale. |
| **`YOUR STORIES`, `LIBRARY`, `STATS` and `DISCOVER` as nav items** | `DISCOVER` and `STATS` both went nowhere. A nav that advertises absent features is worse than a short one. Replaced by Library + story count + keyboard-accessible search. |
| **The Blurple CTA** (`#7c3aed → #5a00c6`) | Primary actions are now chalk-on-ink white pills: one per screen, which is why it can be quiet. |
| **Multiple competing glows** (`shadow-brand-glow`, `shadow-brand-glow/20`, `animate-pulse` dots on everything) | Glow is now a single-pixel halo on the current entry, and a drop shadow on progress rings. Nothing else glows, so the things that do are unmistakable. |
| **`.fade-in` / `.stagger-1..5` CSS animation utilities** | Two animation systems (CSS delays and Framer Motion) produced inconsistent timings. All motion now runs through `lib/motion.ts`. |

**Kept, deliberately:** the deep-night canvas and violet identity; the poster
grid; the “Next to Watch” concept; and the honest local-storage-only import flow
with its microcopy. The redesign is an evolution of the same product, not a
different one.

---

## Appendix — where things live

```
app/
  layout.tsx              fonts, metadata, <Atmosphere />, theme colour
  globals.css             the entire design system: tokens, utilities, keyframes
  page.tsx                landing — the title card + live AniList artwork wall
  dashboard/page.tsx      The Shelf (data derived in-file from the real library)
  franchise/[id]/page.tsx hero → next plate → map → record → ledger
components/
  Atmosphere.tsx          aurora, horizon, vignette, grain
  Artwork.tsx             Poster / Banner + isRemoteArtwork gate + derived hero
  Status.tsx              StatusDot / StatusTag / YouAreHere
  Progress.tsx            StoryBar / ProgressRing / Ledger
  StoryCard.tsx           the franchise card
  ContinueWatching.tsx    the cinematic hero + staging rail + caught-up state
  FranchiseMap.tsx        the road, node vocabulary, entry sheet
  FilterRail.tsx          search, filter chips, sort popover
  ProgressRingStat.tsx    the dashboard's single hero statistic
  SpotlightRail.tsx       live trending AniList art for pre-import screens
  Navbar.tsx              condensing glass bar, scroll rule, mobile sheet
lib/
  anilist.ts              GraphQL client: library, media batch, spotlight
  franchise.ts            relation-graph grouping → Franchise[]
  design.ts               all status/phase/progress/format semantics
  motion.ts               easing, durations, variants
  storage.ts              localStorage persistence + artwork sanitisation
  useLibrary.ts           reads the stored library (no bundled fallback)
  useSpotlight.ts         one shared, cached spotlight request per page
scripts/
  verify-anilist.ts       runs the real data path against a live AniList user
  loaders/ts-resolve.mjs  lets Node run the app's TS modules directly
```

Four conventions worth preserving:

1. **No component decides what a status looks like.** It asks `lib/design.ts`.
   That is why the dashboard, the cards and the map can never disagree.
2. **No component hard-codes a colour.** Everything resolves through a token, so
   the palette can be re-tuned in one place.
3. **No component invents content.** Everything rendered comes from the AniList
   API (the user's list, or the spotlight for pre-import screens). There is no
   seeded fixture data anywhere in `app/`, `components/` or `lib/`.
4. **No artwork is bundled.** `isRemoteArtwork()` is the only gate, and the
   placeholder path is designed rather than empty.

---

## Verifying against real AniList data

Because the app renders real data exclusively, there is no sample library to
eyeball the design against. Two ways to verify:

**1. Import through the UI.** Paste an AniList username into the import dialog.
That runs `fetchAniListLibrary` → `expandFranchises` → `groupFranchises` →
`localStorage`, and the dashboard renders it.

**2. The verification script** (needs network access, so run it locally — it
cannot run in a sandbox that blocks egress):

```
npm run verify:anilist -- <anilist-username>
```

It imports the *same* modules the browser runs, then asserts the invariants the
redesign depends on and reports the ones that are data-dependent:

```
✓ 1,284 list entries in 812ms
✓ 96 stories from 1,284 entries
✓ 41 multi-entry stories · largest: "One Piece" (14 entries)
✓ every story has a remote AniList cover URL
✓ no artwork references point at a local path
✓ 62/96 stories have a real banner (65%) — the other 34 use the cover-derived fallback
✓ 71/96 stories carry an AniList accent colour for their hero tint
✓ complete: 23   watching: 14   caught-up: 9   dropped: 6 …
! paused: 0 — this UI state is unexercised by this list
✓ 37 stories feed Continue Watching / Up next
✓ every continuable story resolves a next entry
✓ formats present: MOVIE, ONA, OVA, SPECIAL, TV, TV_SHORT
✓ 88 entries have no episode count (rendered as "Ep ?")
```

Two things make this worth having. First, a **failing** check exits non-zero, so
it can gate CI (`✗ 2 continuable stories have no resolvable next entry`). Second,
the **warnings matter as much as the passes** — a state with zero coverage is a
state nobody has looked at, which is exactly how the caught-up and dropped
branches got designed in the first place.

It writes `.verify/library.json` (the exact payload the app persists to
`localStorage`, so it can be pasted straight in for visual QA) and
`.verify/report.json` (coverage summary). Both are gitignored.
