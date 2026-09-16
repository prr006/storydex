# StoryDex — Redesign: “A Story Is a Route”

**Status: this document supersedes every previous direction — “Midnight Archive”, “The
Catalogue”, and “Personal Universe”. None of them is in force.**

Personal Universe was dark, artwork-led and clean, and it still read as *a polished anime
streaming dashboard*. That was the failure worth naming: hero → rail → rail → grid →
collection cards is the shape every media product already has. It was technically solid
and it was generic.

This direction keeps the dark ground and throws away the composition. StoryDex's one real
idea — **an anime story is not an entry, it is a franchise: seasons, films, specials, OVAs
and arcs that belong to one continuous story** — becomes the layout language instead of a
line of copy in the hero.

---

## Part 1 — The idea in one line

**A story is a route through time, and you are somewhere on it.**

Every surface answers the same four questions in the same order, without a table:

| | The device | What it looks like |
| --- | --- | --- |
| **STORY** | the jacket | artwork at hero scale, bleeding past its container, with the story's own air behind it |
| **ENTRIES** | the route | one node per entry, in watch order, connected by a line that is lit behind you and dashed ahead |
| **PROGRESS** | the light on the line | the line *stops where you stopped*; entry counts sit beside it, never inside a generic bar |
| **NEXT** | the next node | always named, always artwork-backed, always one action away |

The line is the brand. A crop of any screen shows a lit line with nodes on it and artwork
beneath — that is `StoryPath`, and it is recognisable without the wordmark.

### What this is not

| Not this | Because |
| --- | --- |
| Streaming dashboard | No uniform card rails. The stage, the rungs, the horizon and the archive are four different shapes. |
| Streaming app (Netflix/Crunchyroll) | No promo slabs, no autoplay, no carousel that moves without you. |
| AniList / MyAnimeList | Those are entry lists. StoryDex's unit is the whole story, drawn as a route. |
| SaaS dashboard | No KPI cards, no chart furniture. Figures live on the story they describe. |
| Editorial catalogue | No paper, no serif, no ruled index. That direction is dead. |
| Generic AI dark UI | Grain, atmosphere derived from real artwork, giant era numerals, poster-scale titles — none of which is a default. |

---

## Part 2 — Visual system

### 2.1 Colour

One deliberate dark theme. Canvas is `#08090c`; three surface steps sit on top of it and a
light rim (`rgb(255 255 255 / .07)`, `.13` strong) replaces grey borders, so panels read as
lit rather than drawn.

Two accent systems, never mixed:

* **StoryDex indigo** (`#6d5cff`, strong `#9d91ff`) — navigation, primary actions, focus.
  This is the product's voice.
* **Story accents** — each story's own `coverImage.color`, applied through
  `accentVars()` as `--accent`, `--accent-strong`, `--accent-soft`. Used for that story's
  progress line, nodes, milestone borders, atmosphere. Never for important text: where a
  story accent carries a label, the label sits on the ground, not on the accent.

States are semantic and identical everywhere: watched emerald `#3ddc97`, watching indigo
`#7b6bff`, planned/caught-up `#63a4ff`, not aired amber `#f0b429`, on hold `#8b93a3`,
stopped `#f2707f`. A state colour never changes meaning between screens.

### 2.2 Typography

One family — **Instrument Sans** — used with conviction across four registers:

* *poster scale* (`--text-mega`, up to 8rem): the story you are inside, on the stage and
  the story hero. This is the loudest thing in the product.
* *era scale* (`--text-era`, up to 6rem): years on the journey map and on the horizon, set
  dim (`white/13`) so they read as architecture, not as text.
* *headings* (`--text-display` → `--text-head` → `--text-card`): section and object titles.
* *utility* (`--text-small`, 13px): metadata, counts, table headers, always with
  `font-variant-numeric: tabular-nums` via `.num`. Small text exists, but nothing
  important is small.

### 2.3 Depth and composition

Five layers, in this order, and artwork is allowed to cross between them:

1. background atmosphere — `Atmosphere`, drifting radial washes in the story's accent
2. artwork — hero jackets, bleeding images (`bleed-soft`, mask-faded edges), grain
3. content — floating panels (`float-panel`), facts as pill rows on the artwork
4. controls — the route, the switcher, the record table
5. foreground action — one loud button per screen

Artwork escapes its container by design: `bleed-soft` dissolves an edge into the page, the
stage offsets a second copy of the artwork against the first, and the hero's "you are here"
panel straddles the hero's bottom edge so the page reads as continuous rather than stacked.
Not everything is a rounded rectangle, and the things that are, are quiet.

### 2.4 Motion

Intentional, slow-ish, never noisy:

* the journey's spine lights only as far as you have walked, and re-lights as the map is
  scrolled
* milestone cards lift 4px on hover with a 900ms artwork scale inside a fixed frame
* story stage cross-fades between stories; artwork drifts (`drift`, 42s) in the atmosphere
* progress fills animate once, on entry (`0.7s`, `cubic-bezier(.22,1,.36,1)`)
* every list staggers at ≤0.06s per item, capped at 0.3s so nothing feels queued

`prefers-reduced-motion` stops the drift and the stagger-based entrances. Nothing moves
on its own, and nothing loops except the atmosphere.

---

## Part 3 — The surfaces

### 3.1 `/dashboard` — Home

Five movements, each a different shape. This is the whole point of the redesign:

1. **The stage** — one story owns the first screen: artwork twice-layered, the story's air
   behind it, the title at poster scale with a giant dim initial as architecture, the route
   across the whole story, the current entry and the next entry named, and a switcher strip
   at the bottom whose tabs each carry their own mini-route. It cross-fades; it never
   auto-advances.
2. **Part-way through** — the ladder. One full-width rung per remaining active story:
   artwork bleeding out of the left column, facts floating in the middle, the route running
   underneath, next-entry and one action on the right.
3. **Up next** — two honest halves. *Ready when you are*: rows for stories you could start
   or restart, artwork bleeding in from the left edge. *Not aired yet*: entries that do not
   exist yet, arranged under giant dim year numerals, because there a year is genuinely a
   date in the future.
4. **Your archive** — story objects: covers of the entries fanned along the foot of the
   artwork, the route drawn across it, then title, years, size, progress.
5. **Stories with depth** — the same objects at feature scale for multi-entry franchises.

Continue Watching is preserved: it *is* the stage, and every rung carries a resume action.

### 3.2 `/franchise/[id]` — inside a story

A descent, not a record: **hero → deck → journey → record → onward**.

* Hero: full-bleed artwork with a faded second copy for depth, the title at poster scale,
  the story's facts as floating pills, the route across the whole story, and the "you are
  here" panel overlapping the hero's bottom edge. Entering a story should feel like entering
  something.
* Deck: the completion ring, entry and episode arithmetic, and the **episode ledger** — one
  bar per entry whose *length is that entry's real episode count*, so the mass of a story is
  visible (a 1,000-episode run next to a single special).
* Journey: `StoryMap` — the era markers, the lit spine, staggered milestones, "you are
  here", and a compressed route index at the top that scrolls the map to any entry.
* Record: the dense entry table, kept subordinate, now carrying each entry's position in the
  story.
* Onward: `ContinueStory` names exactly what to watch next, or says the story is finished.

### 3.3 `StoryMap` — the signature

A journey through time, not a vertical list with a line and cards:

* a single continuous spine; **lit** behind you in the story's own colour, **dashed** ahead
* giant dim year numerals as era markers, with real gaps named between them — "8 years
  later" is part of the story
* milestones staggered above and below the spine, so the eye travels; **the one you are on
  sits centred and alone**, which is how "here" reads instantly
* each milestone: 16:9 artwork, state chip, entry episode position, and its own progress fill
* the current milestone is the only one with an action, and it says *You are here — episode
  366 of 1,000*
* a compressed route at the top: every entry as a stop, hover to name it, press to travel

### 3.4 `/library` — the archive

Practical, artwork-heavy, and organised like a shelf you keep: **grouped by where you stand**
(inside right now → caught up → on hold → not started → planned → completed → set aside),
each shelf introduced by a word, a count and a rule to the edge of the page. Grouping appears
once a library is big enough to need it, and disappears the moment you filter or search.

Three densities, all in the same language: **archive** (story objects, grouped), **list**
(plates with artwork bleeding right and the route underneath), **table** (dense comparison,
artwork still present). Search, filters, sorting and URL state are untouched.

### 3.5 `/franchises` — the franchise as an object

The single-story-entry problem, solved physically. Each shelf has its own shape:

* **In progress** — large story objects, covers fanned along the foot
* **Caught up / Completed** — a **shelf of spines**: upright, thin, pressed together,
  labelled along the spine, with a lit foot showing how much is walked, and a hover that
  pulls the spine out. Finished stories stop being posters you already know and become books
  you own. Spine width is derived from the story's real entry count, so a long saga is
  physically thicker.
* **Not started / Planned / On hold / Set aside** — rows: quieter, smaller, no artwork
  wasted on a story with nothing to show yet.

### 3.6 `/discover` — exploration

Numbered like a contents page (01–04), with a different rhythm per section so no two read
alike: a full-height featured hero; a ranked trending strip; a season **wall** with one wide
lead panel; an upcoming **schedule** grouped under giant dim year numerals; and
recommendations drawn from your own library, each one saying *why*. Live AniList data only —
if the API is unreachable the page says so rather than inventing covers.

---

## Part 4 — Primitives

| Component | Owns |
| --- | --- |
| `Cover` | every image: ratio, tint derived from the artwork, scrim, hover scale. `ArtworkBackdrop` for full-bleed fields |
| `Atmosphere` / `ArtworkAura` / `Vignette` | the "this story has its own air" layer, always behind content |
| `Path` (`StoryPath`) | the route at three sizes — `spark` in tables, `rail` in rungs and decks, `journey` for the map |
| `StoryStage` | Home's opening; `nextEntryAfter()` |
| `StoryLadder` | the full-width rung |
| `Horizon` | ready rows + not-aired eras |
| `StoryObject` / `StoryRowObject` | the franchise as a visual object, card/feature/row |
| `StorySpines` | the shelf of finished stories |
| `StoryHero`, `StoryLedger`, `StoryMap`, `EntriesTable`, `ContinueStory` | the story page, top to bottom |
| `StoryViews` | archive / list / table densities |
| `Bars` | `ProgressBar` and `Ring` — entries and completion, nothing else |
| `StatusMark` | chips, dots, marks in state colours |
| `lib/queue.ts` | the queue and the announced list — logic, so three surfaces agree |

### Data (unchanged)

`lib/anilist.ts` (AniList GraphQL), `lib/franchise.ts` (relation-based grouping),
`lib/storage.ts` (`storydex:library:v1`), `lib/summaries.ts`, `lib/libraryView.ts` (URL
state), `lib/design.ts` (status, phase, progress, accent helpers). No mock data, no bundled
artwork, no hardcoded demo library: every franchise, cover, banner and colour comes from the
user's own AniList import.

---

## Part 5 — Verification

Per stage: `npx tsc --noEmit`, `rm -rf .next && npx next build`, then the served HTML and CSS
are checked for the real strings each surface must produce — stage title, "You are here",
era markers, ledger figures, next-entry names, table rows — against a temporary fixture
injected into `lib/useLibrary.ts` and removed before commit, so the app itself ships empty
until the user imports. Empty states, all seven routes, and the 404 are checked on every
build.
