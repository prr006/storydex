# StoryDex — Redesign: “Personal Universe”

**Status: this document supersedes both previous directions — “Midnight Archive” and
“The Catalogue”. Neither is in force.**

The Catalogue was an editorial index: warm paper, hairlines, a serif voice, artwork as
small plates inside a ruled list. It read well and it looked like a well-set book — which
is exactly what was wrong with it. StoryDex is a *library of anime you have lived
through*, and its artwork should be the loudest thing on the screen.

This direction is the inverse: **near-black ground, artwork as the light source, one
identity accent, and progress drawn as part of the artwork rather than as data beside it.**

---

## Part 1 — The idea in one line

**Your collection, lit from within.**

The interface is dark so the artwork can be bright. Everything that isn't artwork —
navigation, panels, tables — recedes to three steps of near-black. Accents come from two
places and nowhere else: StoryDex's own indigo for the app's voice, and each story's
`coverImage.color` for that story's own marks.

Five seconds on `/dashboard` should produce one reaction: *that is my collection, and I
can see where I am.*

### What this is not

| Not this | Because |
| --- | --- |
| Netflix clone | No rows of identical tiles under a logo. One story owns the first screen, and the page says *where you are inside it*. |
| Crunchyroll clone | No seasonal promo slabs, no autoplaying carousel, no "watch now" banners. Nothing moves until the user does. |
| SaaS dashboard | No KPI cards, no sparklines, no chart furniture. The figures live on the story they describe. |
| Editorial catalogue | No paper, no serif, no ruled index, no hairlines doing the layout. |
| Neon/glass showcase | One accent, one shadow, restrained gradients used only where type needs contrast. |

---

## Part 2 — Visual system

### 2.1 Colour

A single deliberate dark theme. Three surface steps, each visibly different from the last,
and a light rim instead of grey borders so panels read as lit rather than drawn.

```
canvas      #08090C   the page
surface     #0E1015   panels, cards, tables
surface-2   #14171D   inputs, secondary panels
surface-3   #1B1F27   wells, placeholders
ink         #F3F5F9   primary text
ink-2       #A8B0C0   secondary
ink-3       #6D7583   metadata
line        rgb(255 255 255 / .07)     hairlines
line-strong rgb(255 255 255 / .13)     card edges, dividers
brand       #6D5CFF   StoryDex's voice: nav, primary actions, links
brand-soft  rgb(109 92 255 / .16)      active nav wash, brand chips
```

**Story states** — six, used identically on every screen and at every scale:

| State | Colour | Meaning |
| --- | --- | --- |
| Completed | `#3DDC97` emerald | watched, earned |
| Watching | `#7B6BFF` indigo (or the story's accent) | you are here |
| Planned | `#63A4FF` blue | on the list, not started |
| Upcoming | `#F0B429` amber | announced, not aired |
| On hold | `#8B93A3` grey | set down |
| Stopped | `#F2707F` red | walked away from |

**Artwork-driven accents.** `accentVars(story)` in `lib/design.ts` returns
`--accent`, `--accent-strong` and `--accent-soft` from the story's own
`coverImage.color` — so a progress bar, a timeline node, a collection card's edge and its
percentage all belong to *that* story. Two guard rails keep it from becoming a rainbow:

- near-black and near-white cover colours are rejected (they'd be invisible or blinding),
  as are near-greys, and fall back to StoryDex indigo;
- the accent is used for **fill and borders only**, never for small text on dark, because
  its contrast cannot be guaranteed. Text stays on the ink ramp.

### 2.2 Typography

One family, used with conviction: **Instrument Sans**, 400/500 for interface, 600/700 for
titles with `-0.02em`-to-`-0.035em` tracking. No serif anywhere. Hierarchy comes from
scale, weight and colour.

```
micro    11px   uppercase, +0.1em    eyebrows, ~one per section
small    13px   metadata, table headers
body     14.5px body copy
card     15px   card titles (600)
lead     17px   hero subtitles, empty-state leads
title    22px   popovers, panel headings
head     28px   section titles
display  clamp(36px, 4.6vw, 56px)    page titles
hero     clamp(40px, 6vw, 76px)      one per screen — dashboard hero, story hero
```

### 2.3 Space, shape, depth

- Gutter `clamp(20px, 4vw, 48px)`, content max **1440px** — wide, because artwork needs room.
- Radii 8 / 10 / 14 / 20px. Poster art gets 10px; heroes and collection cards 20px.
   Nothing is pill-shaped except controls that should be.
- **Exactly two shadows**, both for artwork: `card-shadow` (resting) and `lift` (hover).
  No glow, no blur outside the two sticky surfaces that genuinely overlay content.
- Gradients exist for one reason: letting type sit on artwork. `scrim-hero` (left vignette
  + bottom fade), `scrim-card` (bottom fade), `scrim-bottom`. They are never decorative.

### 2.4 Motion

Framer Motion, tuned to feel expensive rather than busy:

- sections and cards enter with an 8–14px rise, 300–420ms, staggered 30–50ms;
- artwork scales to 1.06 over 420ms inside its own box on hover, and cards lift 4px;
- progress bars fill once, 500–700ms, and never re-animate;
- the hero has no parallax and no autoplay — a collection should sit still;
- `MotionConfig reducedMotion="user"` plus a global `prefers-reduced-motion` block.

---

## Part 3 — Routes, and what each one is for

| Route | Job | Signature element |
| --- | --- | --- |
| `/` Welcome | first visit: what StoryDex does + import. Returning: the story you left | the same hero, for a different reason |
| `/dashboard` | *where am I, and what's next* | artwork hero, continue rail, up-next queue |
| `/library` | *what do I own* | poster grid + one toolbar |
| `/franchises` | *what shape is each story* | collection cards with the entry stack |
| `/discover` | *what's out there, versus what I own* | featured title + ranked trending |
| `/franchise/[id]` | *this story, whole* | hero → ledger → **story timeline** → table → continue |

### 3.1 `/dashboard`

```
┌──────────────────────────────────────────────────────────────────────┐
│ ▣ STORYDEX   Home  Library  Discover  Franchises   [search]  ◉ Kenji  │
├──────────────────────────────────────────────────────────────────────┤
│                                  ┌────────────────────┐              │
│  CONTINUE WATCHING               │  CURRENTLY WATCHING │              │
│  Bleach                          │  The Conflict       │              │
│  2004–2026                       │  Court III · 2024   │              │
│  The Conflict · TV · 2024        │  Episode 9 of 14    │              │
│  Episode 9 of 14      64% watched│  ▮▮▮▮▮▮▮▯▯▯  64%    │              │
│  ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮           │  [▶ Resume episode 9]│              │
│  [▶ Continue — TV 9/14] [+ The whole story]  4/6 · 402 of 420 eps     │
├──────────────────────────────────────────────────────────────────────┤
│  Continue watching  3 stories in progress                      See all │
│  [ 16:9 artwork card ] [ 16:9 artwork card ] [ 16:9 artwork card ] →   │
├──────────────────────────────────────────────────────────────────────┤
│  Up next   Queued, paused and not yet aired                           │
│  [ compact plate ][ compact plate ][ compact plate ] →                │
├──────────────────────────────────────────────────────────────────────┤
│  Your library   8 stories                            Browse all →     │
│  ▢ ▢ ▢ ▢ ▢ ▢ ▢   (2:3 posters, status chip, progress at the foot)     │
├──────────────────────────────────────────────────────────────────────┤
│  Franchises   Stories grouped across seasons, films and specials      │
│  [ banner + entry stack ][ banner + entry stack ][ banner + stack ]   │
└──────────────────────────────────────────────────────────────────────┘
```

Deliberate choices:

- **The hero is the story, not a heading.** There is no "You're 4 entries into…" sentence
  above the fold; the story's own artwork, its current entry and its episode bar *are*
  the greeting.
- **Hero → ledger → rail** is a single downward read: this story, then every other story.
- **Up next is visually lighter than Continue** — it is a queue, not a shelf.
- **Statistics never float.** Entry counts ride on the hero, the segment bar and the
  ledger rows; there is no free-standing KPI block anywhere in the product.

### 3.2 `/franchise/[id]`

```
┌─ Hero ───────────────────────────────────────────────────────────────┐
│  [ real AniList banner, or the cover standing in the same slot ]      │
│  CONTINUE WATCHING            ┌──────────────────────┐               │
│  Bleach                       │ CURRENTLY WATCHING    │               │
│  The Conflict · TV · 2024     │ The Conflict          │               │
│  Episode 9 of 14  64% watched │ Episode 9 of 14 64%   │               │
│  ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮         │ [▶ Resume episode 9]  │               │
│  [▶ Continue] [+ The whole story]  4/6 · 402/420 · Action Supernatural │
├─ Ledger ─────────────────────────────────────────────────────────────┤
│  ◯ 96%        │ Episode ledger        402 watched · 18 remaining     │
│  4 of 6       │ ▬▬▬▬▬▬▬ 2004   ▬ 2022  ▬ 2023  ▬▬ 2024  ▬ 2026      │
├─ Story timeline ─────────────────────────────────────────────────────┤
│  2004      2004      2022      2023      2024      2026              │
│  ●━━━━━━━━ ●━━━━━━━━ ●━━━━━━━━ ●━━━━━━━━ ●━━━━━━━━ ◯                 │
│  [art]     [art]     [art]     [art]     [art]     [art]             │
├─ All entries ────────────────────────────────────────────────────────┤
│  dark table: entry · format · year · episodes · status · score · bar  │
├─ Continue the story ─────────────────────────────────────────────────┤
│  [ artwork ] The Conflict — Court III · Episode 10 of 14   [▶ Watch]  │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.3 The story timeline (the signature view)

One horizontal rail, one stop per entry, in watch order:

- the **era** (year) is set large and dim above each stop, so the 18-year gap between 2004
  and 2022 is *felt* rather than read;
- a **connecting rail** with a node per entry: completed = filled emerald with a check,
  watching = indigo/accent node with a 4px halo (the single strongest mark on the page),
  upcoming = hollow amber, planned = hollow blue, stopped = red bar;
- each stop is a **16:9 artwork card** with the entry's own cover, its format tag, its
  episode line and a progress bar in the story's accent;
- the **current entry's card takes the accent border** and the accent halo — nothing else
  on the page uses that colour;
- it scrolls sideways rather than wrapping, because a story has an order and a wrapped
  grid destroys it.

### 3.4 The library and its three densities

Toolbar: search · status segmented control · format/genre/sort dropdowns · density
toggle. All of it is small, and the counts ride on the options.

| Density | Use | Cell |
| --- | --- | --- |
| **Grid** (default) | scanning by artwork | 2:3 poster, status chip for *stated* states only, progress bar at the foot, two lines of text |
| **List** | scanning by progress | 124×72 plate, title, next entry, full-width bar |
| **Table** | comparing many | dark panel, artwork kept, columns for entries/episodes/status/next/score |

A poster shows its status chip only when the chip says something the progress bar can't
(completed, upcoming, stopped). Everything else stays clean — that restraint is what makes
the grid feel premium instead of noisy.

### 3.5 `/franchises`

Collection cards: a 21:9 banner of the story's widest real artwork, the covers of its first
four entries stacked and overlapping the banner's bottom edge, then title, genres, status
chip, segment bar, percentage, and `N entries · N eps · N watched`. A six-entry saga and a
single film are different shapes before you read a word. Grouped by lifecycle:
In progress → Caught up → Completed → On hold → Not started → Planned → Stopped.

### 3.6 `/discover`

One featured title owns the screen (artwork-led, with a real average score and popularity),
then **Trending** as a ranked carousel where the rank numeral is drawn into the card,
**This season** as a poster grid, **Upcoming** as compact artwork cards, and
**Recommended from your library** — rows that state their reason ("Because you completed
Bleach — both are Action"), drawn from the user's own data, never invented.

---

## Part 4 — Component map

| Component | Role |
| --- | --- |
| `AppShell` | one client boundary: masthead, library context, import dialogue, reduced-motion config |
| `Masthead` | monogram + wordmark, four destinations, ⌘K search, account popover, mobile sheet |
| `SettingsMenu` | account, re-import, storage disclosure, clear data |
| `Cover` / `ArtworkBackdrop` | the only artwork primitives. Real URL or designed monogram; tints and scrims; a poster standing in for a missing banner, never a generated image |
| `Bars`: `ProgressBar` `SegmentBar` `Ring` `LedgerRow` | progress as a first-class visual, all reading `var(--accent)` |
| `StatusMark` / `StatusChip` / `StatusDot` | six states, one vocabulary, at every scale |
| `Cards`: `MediaCard` `PosterCard` `StoryCollectionCard` | the three card objects |
| `UpNextRail` / `UpNextCard` | the queue, and the rule for what belongs in it |
| `Rail` / `RailSection` | the sideways scroller and its titled section, with real controls |
| `StoryHero` | the dashboard/story hero: artwork, current entry, bar, one action |
| `StoryLedger` | ring, episode ledger sized by episode count, currently-watching panel |
| `StoryMap` | **the story timeline** |
| `EntriesTable` | dense reference table in the dark system |
| `ContinueStory` | the closing banner that names the next episode |
| `LibraryBrowser` / `LibraryControls` / `StoryViews` | toolbar + three densities |
| `DiscoverBoard` | featured, ranked trending, season, upcoming, recommendations |
| `EmptyLibrary` | designed empty state with live AniList covers |
| `ImportDialog` | the AniList import flow |

**Deleted in this pass** (they belonged to the previous composition):
`Chapter`, `Statement`, `ContinueRow`, `UpNextTable`, `EntryRuler`, `EntryTimeline`,
`EntryTable`, `NextActionBar`, `CollectionSection`, `StoryCard`.

### Data (unchanged)

`storydex:library:v1` and `{username, importedAt, franchises}` still load as-is.
`lib/franchise.ts`, `lib/storage.ts`, `lib/useLibrary.ts`, `lib/summaries.ts` keep their
contracts. `lib/anilist.ts` gains `averageScore`/`popularity` on the shared media fields
and the Discover boards query — additive only, same endpoint and same POST path.
`lib/libraryView.ts` keeps facet/sort/density state. No business logic was rewritten, and
no mock data exists anywhere in the app.

---

## Part 5 — Artwork policy

- Every image is an AniList CDN URL that arrived through the API. `isRemoteArtwork()`
  gates it: anything that isn't an absolute http(s) URL counts as *no artwork*.
- A story's widest real image is used for its hero: `bannerImage` when AniList has one,
  its cover otherwise — cropped wide and focused on the upper third where a poster's
  subject sits. Nothing is generated, blended or upscaled into existence.
- `coverImage.color` drives the tint bed behind a loading image and the story's accent.
- Stories with no artwork get a designed monogram plate, not a broken image.

---

## Part 6 — Verification

Because the sandbox has no route to `graphql.anilist.co`, the build is checked three ways:

1. **A throwaway harness** that replays a real AniList list payload (same field shape, same
   CDN URL shape, real media ids, titles and cover colours) through the *actual*
   `groupFranchises` implementation — 8 stories covering a 6-entry franchise mid-run, a
   caught-up story with a 2026 film, a finished story, a 1,122-episode series, a stopped
   story, a planned story and a bare film. Every route was then fetched and inspected in
   the server-rendered HTML: real CDN URLs, correct counts, the hero's episode line, the
   timeline's eras and states, all three densities, and the designed empty state. The
   harness is deleted before commit.
2. **`npm run verify:anilist -- <username>`** — the real fetch → group → render path
   against a live list.
3. **`npx tsc --noEmit` + `npx next build`** on every change.
