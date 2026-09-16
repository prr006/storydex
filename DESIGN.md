# StoryDex — Redesign: “The Catalogue”

**Status: this document supersedes the previous “Midnight Archive” direction, which is abandoned.**

Midnight Archive was a screening room: near-black violet canvas, cinematic full-bleed
hero, glowing ember accent, mono labels at 11px, a dense poster wall, ring-and-ledger
statistics. It looked like a streaming service and a dashboard at the same time. This
document replaces it with something else entirely.

---

## Part 1 — UX first: what StoryDex is

### 1.1 The job

StoryDex does one thing a normal anime list can't: it treats a franchise as **one story**
instead of twelve rows. Everything in the interface should serve the sentence a user
actually wants to say:

> *“I'm four entries into Re:ZERO, twelve into One Piece, and these six I've finished.”*

### 1.2 The three questions the app must answer, in order

| Rank | Question | Where it's answered |
| --- | --- | --- |
| 1 | **Where am I right now?** | Continue — a compact list of active stories, one row each |
| 2 | **What's next, and when?** | Up next — next entry per active story, plus anything waiting on air |
| 3 | **What do I own?** | The library — browse, filter, sort, three densities |

Aggregate statistics are **not** a question anyone opens a tracker to ask. They are
therefore demoted from four boxes and a progress ring to **one inline sentence** in the
header. If the user wants the totals, they are there; they never take a section.

### 1.3 What StoryDex feels like on open

**“This is my collection of stories, and I know exactly where I am with them.”**

That is a *library* feeling, not a *streaming* feeling. Three consequences:

- **Nothing autoplays, rotates, or animates on its own.** A collection is still; the user moves.
- **The interface is quiet so the collection is loud.** Paper ground, one accent, generous space.
- **Progress is stated in words and counts**, not inferred from a bar's angle.

### 1.4 Primary action

There is **one** primary action per screen, and it is always the same verb — *open the
story you were already in*:

- Home → the Continue rows. The entire row is the target, not a button inside it.
- Story page → the next entry, as a single inline call to action plus a sticky bar.
- Library → open a story. Browsing is *finding*, not *deciding*.

Import is a **secondary, once-ever** action: a compact control in the header, and the
whole of the empty state.

---

## Part 2 — Information architecture

### 2.1 Routes

| Route | Name | Contents | Status |
| --- | --- | --- | --- |
| `/` | Welcome | Identity, what StoryDex does, import, live AniList artwork | kept, rebuilt |
| `/dashboard` | **Home** | Header sentence → Continue → Up next → Recently added → compact library block | kept, rebuilt |
| `/library` | **Library** | Full browse: search, filters (status, format, genre, franchise), sort, 3 densities | **new** |
| `/franchises` | **Collections** | Franchises as story collections, grouped by lifecycle, with entry composition | **new** |
| `/discover` | **Discover** | Live AniList trending / this season / upcoming, cross-referenced against your library | **new** |
| `/franchise/[id]` | **Story** | Identity → Progress → Timeline → Entries → Next action | kept, rebuilt |

The header shows four destinations only: **Library · Discover · Franchises** plus compact
search and a settings menu. The **wordmark goes to Home** (`/dashboard`); `/` is the
welcome page for a first visit and a "back to where you were" page afterwards. Below
`md` the three links move into a sheet rather than disappearing. `Settings` is a popover,
not a route: theme, re-import, clear data, storage disclosure.

**Library vs Collections** are deliberately different jobs:

- **Library** answers *“find it.”* A flat, filterable, sortable index of stories. Good for
  “show me everything I've dropped” or “all films.”
- **Collections** answers *“what shape is this story?”* Every franchise is shown as a
  **composition strip** — TV seasons, films, OVAs and specials as distinguishable marks —
  grouped into In progress / Caught up / Finished / Not started / Stopped. You see
  relationships, not just names.

### 2.2 Home, concretely

```
┌────────────────────────────────────────────────────────────────────────────┐
│ StoryDex      Library   Discover   Franchises      [ Search ]        ⚙     │  sticky, 60px, 1px rule beneath
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Tuesday, 16 September                                        ← 12.5px     │
│                                                                            │
│  You're four entries into Re:ZERO.                          ← 34–52px      │
│                                                               instrument   │
│                                            14 stories · 3 in progress       │
│                                            41 entries · 22 watched          │  ← ALL statistics, one block, right-aligned
│                                                               sans, ink-2  │
├── CONTINUE ─────────────────────────────────────────────────────────────────┤
│  ▢   Re:ZERO − Starting Life in Another World            In progress       │  ← 76px cover
│      Season 3 · TV · 2024                                entry 4 of 4       │
│      ▮▮▮▯                                                75%               │  ← segment ruler, one block per entry
│                                                            [ Resume → ]    │
│  ────────────────────────────────────────────────────────────────────────  │
│  ▢   One Piece                                           In progress       │
│      Episode 1082 of 1122 · TV                                           │
│      ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▯▯▯▯▮▮▮                 │
├── UP NEXT ──────────────────────────────────────────────────────────────────┤
│  ○  One Piece        Episode 1083                    TV · airing           │  ← waiting on air, hollow mark
│  ●  Fullmetal Alch.  Conqueror of Shamballa           Film · 2026           │
├── RECENTLY ADDED ───────────────────────────────────────────────────────────┤
│  [6 cards]                                          Browse the library →   │
└────────────────────────────────────────────────────────────────────────────┘
```

Deliberate choices:

- **Continue is a list, not a carousel and not a hero.** A user with three active stories
  should see all three at once, compared side by side, with their real next entry named.
  A rotating hero hides two of them.
- **One story per row, full width.** No competitor product does this; it is what makes
  “where am I” legible in a single downward glance.
- **The segment ruler replaces every progress bar in the product.** One block per entry,
  so “3 of 4” is *countable*, not estimated. It is the app's signature visual.
- **Statistics are one right-aligned paragraph.** Never a section.

### 2.3 The library, concretely

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Library                                             14 stories            │
│  Everything you're tracking.                                               │
│                                                                            │
│  [ Search titles and entries…………………… ]   Sort [ Recently updated ▾ ]      │
│                                                                            │
│  Status  All · In progress · Caught up · Finished · Not started · Stopped   │
│  Format  All · TV · Film · OVA · Special                                    │
│  Genre   All · Action · Drama · Fantasy · …                                 │
│  Franchise ▾                                        Density  ▦ ▤ ☰          │
├────────────────────────────────────────────────────────────────────────────┤
│  (grid / list / table — the active density)                                │
└────────────────────────────────────────────────────────────────────────────┘
```

**Three densities, one component.** This is the answer to “don't force one giant poster
wall”:

| Density | Use | Row/cell shows |
| --- | --- | --- |
| **Grid** `▦` | scanning by artwork | cover, title, ruler, status, next entry |
| **List** `▤` | scanning by progress | 56px cover, title, ruler with counts, next entry, status, year |
| **Table** `☰` | comparing many at once | columns: cover · title · entries · watched · progress · status · format · year |

Filters are **multi-select chips grouped by facet**, each with a live count, and they
compose (status AND format AND genre). Filter state lives in the URL on `/library`, so a
view is linkable and survives a refresh. Empty results name the filters that caused them
and offer a one-click reset.

### 2.4 The story page, concretely

Five chapters, vertically sequenced, each with room to breathe. **Nothing is shown
simultaneously that can be shown in order.**

```
┌ 1 · IDENTITY ──────────────────────────────────────────────────────────────┐
│   ▢ cover        Re:ZERO − Starting Life in Another World                  │
│   (196px)        Fantasy · Psychological · Thriller                        │
│                  2016 – 2026 · 4 entries · 66 episodes · TV, Film          │
│                  [———— synopsis, set in the serif, 62ch ————]              │
├ 2 · PROGRESS ──────────────────────────────────────────────────────────────┤
│        0      1      2      3                                              │
│        ▮      ▮      ▮      ◐         3 of 4 entries · 58 of 66 episodes   │
│        watched watched watched  current                                    │
│                                        Next: Season 3 · TV · 2024          │
├ 3 · TIMELINE ──────────────────────────────────────────────────────────────┤
│   the story in order, format-labelled, node marks by state                 │
├ 4 · ENTRIES ───────────────────────────────────────────────────────────────┤
│   reference table: cover · title · format · year · episodes · score · link  │
├ 5 · NEXT ACTION ───────────────────────────────────────────────────────────┤
│   sticky bottom bar when the chapter scrolls out of view                    │
└────────────────────────────────────────────────────────────────────────────┘
```

- **No full-bleed backdrop.** The old hero pushed the story's own title below 90vh of
  decoration. Identity is now a *title page*: cover object, typography, synopsis. The
  cover is the artwork moment; the page is paper.
- **Progress gets its own chapter**, because it's the reason the product exists. It states
  counts in words *and* draws the segment ruler at scale.
- **Timeline** shows relationships: every entry labelled by format (TV / Film / OVA /
  Special), node marks by state, joined by a rail. A composition strip above it gives the
  shape of the whole story in one line.
- **Next action appears twice** — inline after Progress, where the decision is made, and
  as a sticky bar, so the one action is never more than a glance away.

---

## Part 3 — Visual direction

### 3.1 The concept in one line

**A printed catalogue of your collection.** Warm paper, ink, one green, one rust. The
interface is a well-set book; the covers are the plates.

This is chosen *against* the previous direction on every axis:

| | Midnight Archive (gone) | The Catalogue (new) |
| --- | --- | --- |
| Ground | `#050410` violet-black | `#F4F1EB` warm paper |
| Theme | dark only | **light default + real dark theme** |
| Brand | violet `#8b5cf6` | **deep pine `#1D5647`** |
| Accent | ember `#ffb457` (bright amber) | **clay `#A8462A`** (muted rust) |
| Depth | aurora blobs, glass blur, glow | rules, tinted panels, one soft shadow |
| Shape | 22–32px radii, pill everything | **6–14px radii, rectilinear** |
| Display type | Instrument Serif, 88px | Instrument Sans **bold**, 34–52px |
| Prose type | Inter | **Newsreader** (serif used for *reading*, not titles) |
| Smallest text | 11px mono, tracked, abundant | **12.5px sans**, rare |
| Composition | full-bleed hero, poster wall | masthead, editorial column, ruled list |
| Motion | 1.1s cinematic, parallax, auto-rotate | 8–12px fades, nothing self-animating |

Nothing is carried over: not the palette, not the type pairing, not the shape language,
not the page rhythm, not the motion.

### 3.2 Colour

Two complete themes, both semantic. **No component names a hex value** — they name a role.

**Light — “Paper” (default)**

```
canvas       #F4F1EB   page
surface      #FFFFFF   cards, panels
surface-sunk #EDE9E1   wells, tracks, table stripes
ink          #1B1A17   primary text (warm near-black, never #000)
ink-2        #5A564E   secondary text
ink-3        #8B857A   tertiary: labels, table headers
rule         #E2DDD3   hairlines
rule-strong  #CFC8BA   card edges, dividers
pine-600     #1D5647   brand + primary action
pine-100     #E3EFE9   brand tint
clay-500     #A8462A   "you are here" — the only warm accent
```

**Dark — “Night”**

```
canvas       #131210   warm charcoal (deliberately not navy, not violet)
surface      #1B1A16
surface-sunk #24221C
ink          #F3F0E9
ink-2        #B4ADA0
ink-3        #877F72
rule         #2C2A23
pine-300     #8FBFB0   brand in dark
clay-400     #D9774E
```

**Status is carried by one colour system, used at every size:**

| State | Colour | Meaning |
| --- | --- | --- |
| In progress | clay | you are mid-story — **the only warm colour in the app** |
| Finished | pine | earned |
| Caught up | blue-slate | nothing left to watch that exists |
| Not started | ink-3 | sitting on the shelf |
| Stopped | red-brown | dropped |

The accent budget is one product decision: **clay covers under 3% of pixels on any
screen.** It appears in the current segment of a ruler, one word in the Continue list,
one button on the story page. Because it is scarce, a 6px mark is enough to find your
place in a page of covers.

### 3.3 Type

Two families, two jobs — the opposite of the previous four-family, mono-labelled system.

**Instrument Sans** — *interface and titles.* A slightly narrow grotesk with real weight.
Titles are set in it at 600–700 with `-0.02em` tracking. This is what replaces the serif
display: confidence through weight and scale, not through a different typeface.

**Newsreader** — *reading.* A genuine text serif with a real italic, used only for prose:
synopses, the header sentence, empty states, editorial asides. The previous design used a
serif for *headlines*; this one uses a serif for *sentences*. That inversion is the whole
typographic idea.

**Instrument Sans** also carries all numerals with `tabular-nums`, which removes the
mono-instrument feel while keeping columns from jittering.

```
micro    11px   uppercase, +0.08em   eyebrow labels only — used ~once per screen
small    12.5px  table headers, meta
body     14.5px
reading  16px   serif, synopses (line-height 1.7)
lead     18px   serif, header sentence
title    22px   600   card titles, row titles
head     30px   700   page titles
display  clamp(34px, 4.5vw, 52px)  700  -0.02em   the one big statement per page
mega     clamp(44px, 7vw, 80px)    700  landing only
```

Rule: **one display on a screen, one micro label, everything else from the middle of the
scale.** The old design had 11px mono on every element; this one has at most one uppercase
label per screen.

### 3.4 Space, shape, depth

- **Page gutter** `clamp(20px, 4vw, 44px)`, max content width **1240px**. Narrower than
  before, which makes the type read as editorial rather than stretched.
- **Vertical rhythm** 8px base; sections are separated by **72–120px** plus a 1px rule.
  Generous by default, tighter only inside tables.
- **Radii** 6px (chips, inputs), 10px (cards, panels), 14px (the identity cover). Small
  radii read as print; large radii read as an app.
- **Depth** is a **1px rule plus a tinted panel** in almost every case. There is exactly
  one shadow in the system — a 2px lift on card hover — and no blur, no glass, no glow.
- **Rules do the grouping.** Facet rows, table headers, list separators, section breaks.
  A ruled page is the fastest way to read as “catalogue” instead of “dashboard.”

### 3.5 Motion

Calm. Motion exists to explain a change and then stop:

- Entrances: 8–12px rise, 240ms, stagger 30ms. Short because the page is dense.
- Hover: border colour and a 1.5% cover scale. No lift, no glow, no parallax.
- The segment ruler fills once, on first paint of that row, in 500ms.
- **Nothing self-animates.** No rotating carousels, no scroll-driven drawing, no pulses.
  A collection is still.

---

## Part 4 — Component plan

| Component | Role | Replaces |
| --- | --- | --- |
| `Masthead` | Sticky header: wordmark, 3 links, compact search, settings menu. 60px, rule beneath. | `Navbar` |
| `SettingsMenu` | Popover: theme, re-import, clear library, storage disclosure. | — |
| `Cover` | The only artwork primitive. Real AniList URL or a designed placeholder; fixed aspect; tint bed from `coverImage.color`. | `Artwork` |
| `EntryRuler` | **Signature component.** One block per entry: watched / current / planned / upcoming / dropped. Used on cards, rows, tables, detail progress. | `Progress` (bars + rings + ledger) |
| `StatusMark` | A word and a dot. Six states, one system. | `Status` (dot + tag + YouAreHere) |
| `ContinueRow` | Full-width active-story row: cover, title, next entry named, ruler, counts, one action. | `ContinueWatching` (hero + carousel) |
| `UpNextTable` | Compact ruled table of next entries, including not-yet-aired. | — |
| `StoryCard` | Cover, title, ruler with counts, one status word, one next-entry line. Nothing else. | `StoryCard` (rewritten) |
| `LibraryBrowser` | Search + facet chips + sort + density toggle + three renderers. Shared by Home and Library. | `FilterRail` |
| `CompositionStrip` | One mark per entry, shaped by format — the “what shape is this story” visual. | — |
| `CollectionSection` | Lifecycle group on `/franchises`, with composition strips. | — |
| `Chapter` | Numbered section wrapper (Identity, Progress, …) that enforces the story page's sequence. | — |
| `EntryTimeline` | Relationship-aware ordered list: format labels, state marks, connecting rail. | `FranchiseMap` |
| `EntryTable` | Reference table for the full record. | inline rows |
| `NextActionBar` | Sticky bottom action, appears when the inline CTA scrolls away. | — |
| `EmptyLibrary` | Designed empty state, with live AniList artwork and a single import action. | `EmptyHero` |
| `ImportDialog` | Rebuilt in the new language; same AniList flow. | `ImportDialog` |

**Deleted outright:** `Atmosphere` (aurora/grain/vignette), `ContinueWatching`,
`FranchiseMap`, `FilterRail`, `ProgressRingStat`, `SpotlightRail`, `Navbar`, the old
`Artwork`, `Progress` and `Status`.

### Data plan (no architecture change)

- Keep `storydex:library:v1` and the `{username, importedAt, franchises}` shape, so
  **existing persisted data loads unchanged.** `accentColor` stays additive and optional.
- `lib/design.ts` keeps its public API (status, phase, progress, next-entry, formatting) —
  the *semantics* are unchanged; only its `color` values are re-pointed at the new tokens.
- `lib/franchise.ts`, `lib/anilist.ts`, `lib/useLibrary.ts`, `lib/storage.ts` keep their
  contracts. `useDashboardControls` is superseded by `lib/libraryView.ts` (facet + sort +
  density state, URL-synced).
- **No fabricated library, no generated artwork.** Verified against real AniList data.

---

## Part 5 — Is this materially different?

Checked against the previous implementation, point by point:

| Requirement | Old | New |
| --- | --- | --- |
| Ground | violet-black, dark-only | warm paper light **+** warm-charcoal dark |
| Hero | full-bleed 92svh backdrop + poster plate + rail | **no hero** — a ruled header sentence |
| Poster wall | dense 2–6 col grid as the primary surface | covers at 76px in ruled rows; grid is one of three densities |
| Typography | 11px mono labels everywhere | 12.5px minimum, one uppercase label per screen |
| Stats | ring + ledger + 4 boxes | **one inline sentence** |
| Card | poster with hover-reveal overlay | rectilinear card, ruler, one status word |
| Detail | simultaneous columns, sticky sidebar | **five sequenced chapters** |
| Timeline | scroll-drawn glowing road | format-labelled ruled timeline + composition strip |
| Colour | black + violet + amber glow | paper + pine + clay, no glow |
| Depth | aurora, grain, glass, glow | rules and tinted panels, one hover shadow |

Different ground, different palette, different type system, different shape language,
different page rhythm, different motion, different information architecture.

---

## Part 6 — Implementation status

Built and verified in this order:

| Area | State |
| --- | --- |
| Tokens, themes, type scale, utilities | `app/globals.css` rewritten; both themes emit; `data-theme` on `<html>` |
| Shell | `app/layout.tsx` + `AppShell` (masthead, library context, import dialogue, `MotionConfig reducedMotion="user"`) |
| Routes | `/` · `/dashboard` · `/library` · `/franchises` · `/discover` · `/franchise/[id]`, all building |
| Components | every item in the Part 4 table, plus `Statement`, `StoryViews` (grid/list/table) and `DiscoverBoard` |
| Deleted | `Atmosphere`, `Artwork`, `ContinueWatching`, `FilterRail`, `FranchiseCard`, `FranchiseMap`, `Navbar`, `Progress`, `ProgressRingStat`, `SpotlightRail`, `Status`, `components/ui`, `lib/useDashboardControls` |
| Data | unchanged: `storydex:library:v1`, `{username, importedAt, franchises}`, all `lib/*` contracts |

### On artwork

- `coverImage` is used everywhere a picture appears. `bannerImage` is preserved in the data
  and in storage but is **not** rendered as a full-bleed backdrop: this design has no hero,
  and reintroducing one to spend the banner would undo the difference this document exists
  to make. Nothing derived, blurred or generated is drawn from a cover either.
- There are no bundled image assets and no generated artwork anywhere in the app. Stories
  with no artwork get the designed monogram plate from `Cover`.

---

## Part 7 — Verification

Because there is no bundled library, the build is checked two ways:

1. **A throwaway harness** that replays a real AniList list payload — same field shape,
   same CDN URL shape, real media ids and titles — through the *actual* `groupFranchises`
   implementation, so the components were rendered against data the production import
   produces. Every route was then fetched and inspected in the server-rendered HTML
   (7 stories covering in progress, caught up with a not-yet-aired entry, finished,
   stopped, planned, and a single long-running series), all three densities were rendered,
   and the harness was deleted before commit.
2. **`npm run verify:anilist -- <username>`**, which runs the real fetch → group → render
   path against a live list and asserts the invariants plus reports state coverage.

The empty library is treated as a first-class state, not an edge case: it is what every
new user sees, and it is designed.
