/**
 * Verifies StoryDex against a REAL AniList library.
 *
 *   npm run verify:anilist -- <anilist-username>
 *
 * Why this exists: the redesign renders real AniList data exclusively, and
 * there is no bundled sample library to fall back on. That makes it important
 * to be able to point a single command at a live list and prove the whole data
 * path still produces everything the UI needs.
 *
 * It runs the *same* modules the browser runs — lib/anilist.ts and
 * lib/franchise.ts — so a pass here means the seed → grouping → render path is
 * intact, not that a copy of it is.
 *
 * Checks performed:
 *   1. The list fetches (the API contract still holds).
 *   2. Every franchise has a real, absolute AniList cover URL.
 *   3. No artwork reference points at a local path (the app ships none).
 *   4. Banner coverage is reported, so you know how many heroes will use the
 *      cover-derived cinematic fallback rather than a real banner.
 *   5. Every story phase the UI can render is exercised, or reported as
 *      absent — a state with no coverage is a state nobody has looked at.
 *
 * Exit code is non-zero if any hard invariant fails, so it can gate CI.
 */

import { fetchAniListLibrary, fetchSpotlightAnime } from '../lib/anilist.ts'
import { groupFranchises } from '../lib/franchise.ts'
import {
  canContinue,
  getEpisodeProgress,
  getNextEntry,
  getStoryPhase,
  getStoryProgress,
  type StoryPhase,
} from '../lib/design.ts'
import { writeFileSync, mkdirSync } from 'node:fs'

/* -------------------------------------------------------------------------- */

const RESET = '\u001b[0m'
const DIM = '\u001b[2m'
const RED = '\u001b[31m'
const GREEN = '\u001b[32m'
const YELLOW = '\u001b[33m'
const BOLD = '\u001b[1m'

let failures = 0

function ok(message: string) {
  console.log(`  ${GREEN}✓${RESET} ${message}`)
}

function fail(message: string) {
  failures += 1
  console.log(`  ${RED}✗ ${message}${RESET}`)
}

function warn(message: string) {
  console.log(`  ${YELLOW}!${RESET} ${message}`)
}

function heading(message: string) {
  console.log(`\n${BOLD}${message}${RESET}`)
}

const isRemote = (src?: string | null) => Boolean(src && /^https?:\/\//i.test(src))

/* -------------------------------------------------------------------------- */

async function main() {
  const username = process.argv[2]
  if (!username) {
    console.error('Usage: npm run verify:anilist -- <anilist-username>')
    process.exit(2)
  }

  console.log(`\n${BOLD}StoryDex — real AniList verification${RESET}`)
  console.log(`${DIM}user: ${username}${RESET}`)

  // ── 1. Fetch ──────────────────────────────────────────────────────────────
  heading('1. Fetch')
  const started = Date.now()
  let entries
  try {
    entries = await fetchAniListLibrary(username)
  } catch (error) {
    fail(`Could not fetch the list: ${(error as Error).message}`)
    process.exit(1)
  }
  ok(`${entries.length} list entries in ${Date.now() - started}ms`)

  // ── 2. Group (the real grouping code, no expansion here — relation expansion
  //      is a separate network pass and is exercised by the app itself) ─────
  heading('2. Group into stories')
  const franchises = groupFranchises(entries)
  ok(`${franchises.length} stories from ${entries.length} entries`)

  const multiEntry = franchises.filter((f) => f.seasons.length > 1)
  if (multiEntry.length === 0) {
    warn('No franchise grouped more than one entry — grouping may not be working.')
  } else {
    const largest = multiEntry.reduce((a, b) => (b.seasons.length > a.seasons.length ? b : a))
    ok(
      `${multiEntry.length} multi-entry stories · largest: "${largest.name}" (${largest.seasons.length} entries)`,
    )
  }

  // ── 3. Artwork invariants ─────────────────────────────────────────────────
  heading('3. Artwork (the app ships none of its own)')

  const missingCover = franchises.filter((f) => !isRemote(f.posterUrl))
  if (missingCover.length === 0) {
    ok('every story has a remote AniList cover URL')
  } else {
    fail(`${missingCover.length} stories have no usable cover: ${missingCover.slice(0, 5).map((f) => f.name).join(', ')}`)
  }

  const localPaths: string[] = []
  for (const franchise of franchises) {
    if (franchise.posterUrl && !isRemote(franchise.posterUrl)) localPaths.push(franchise.posterUrl)
    if (franchise.bannerUrl && !isRemote(franchise.bannerUrl)) localPaths.push(franchise.bannerUrl)
    for (const season of franchise.seasons) {
      if (season.posterUrl && !isRemote(season.posterUrl)) localPaths.push(season.posterUrl)
    }
  }
  if (localPaths.length === 0) {
    ok('no artwork references point at a local path')
  } else {
    fail(`${localPaths.length} local artwork references: ${[...new Set(localPaths)].slice(0, 5).join(', ')}`)
  }

  const withBanner = franchises.filter((f) => isRemote(f.bannerUrl))
  const bannerPct = franchises.length > 0 ? Math.round((withBanner.length / franchises.length) * 100) : 0
  ok(
    `${withBanner.length}/${franchises.length} stories have a real banner (${bannerPct}%) — the other ${franchises.length - withBanner.length} use the cover-derived cinematic fallback`,
  )

  const withAccent = franchises.filter((f) => Boolean(f.accentColor))
  ok(
    `${withAccent.length}/${franchises.length} stories carry an AniList accent colour for their hero tint`,
  )

  // ── 4. Phase coverage ─────────────────────────────────────────────────────
  heading('4. UI state coverage')

  const byPhase = new Map<StoryPhase, number>()
  for (const franchise of franchises) {
    const phase = getStoryPhase(franchise)
    byPhase.set(phase, (byPhase.get(phase) ?? 0) + 1)
  }

  const ALL_PHASES: StoryPhase[] = [
    'complete',
    'watching',
    'caught-up',
    'dropped',
    'paused',
    'backlog',
    'planned',
  ]

  for (const phase of ALL_PHASES) {
    const count = byPhase.get(phase) ?? 0
    if (count > 0) ok(`${phase}: ${count}`)
    else warn(`${phase}: 0 — this UI state is unexercised by this list`)
  }

  const continuable = franchises.filter((f) => canContinue(f) && !getStoryProgress(f).complete)
  if (continuable.length > 0) {
    ok(`${continuable.length} stories feed Continue Watching / Up next`)
  } else {
    warn('Nothing is continuable — this list renders the "you are caught up" hero.')
  }

  const nextless = continuable.filter((f) => !getNextEntry(f))
  if (nextless.length > 0) {
    fail(`${nextless.length} continuable stories have no resolvable next entry`)
  } else {
    ok('every continuable story resolves a next entry')
  }

  // Movies / specials / missing episode counts exercise the format + fallback
  // paths in the card, the map and the record rows.
  const formats = new Set(franchises.flatMap((f) => f.seasons.map((s) => s.format ?? 'TV')))
  ok(`formats present: ${[...formats].sort().join(', ')}`)

  const noEpisodes = franchises.flatMap((f) => f.seasons).filter((s) => !s.episodes || s.episodes <= 0)
  ok(`${noEpisodes.length} entries have no episode count (rendered as "Ep ?")`)

  // ── 5. Snapshot for visual QA ─────────────────────────────────────────────
  heading('5. Snapshot')

  const snapshot = {
    username,
    verifiedAt: new Date().toISOString(),
    entries: entries.length,
    franchises: franchises.length,
    bannerCoverage: franchises.length > 0 ? withBanner.length / franchises.length : 0,
    byPhase: Object.fromEntries(byPhase),
  }

  mkdirSync('.verify', { recursive: true })
  writeFileSync('.verify/library.json', JSON.stringify({ username, franchises }, null, 0))
  writeFileSync('.verify/report.json', JSON.stringify(snapshot, null, 2))

  ok('wrote .verify/library.json (the exact payload the app stores locally)')
  ok('wrote .verify/report.json')

  // Spotlight is decorative-only; report whether it's reachable but never fail.
  const spotlight = await fetchSpotlightAnime(6)
  if (spotlight.length > 0) {
    ok(`spotlight query returned ${spotlight.length} trending titles for pre-import screens`)
  } else {
    warn('spotlight query returned nothing — pre-import screens will render without artwork')
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log()
  if (failures === 0) {
    console.log(`${GREEN}${BOLD}All invariants hold.${RESET}`)
    console.log(
      `${DIM}For visual QA, either re-import "${username}" through the UI (same code path),\n` +
        `or load the snapshot the app itself writes:\n` +
        `  node -e "const l=JSON.parse(require('fs').readFileSync('.verify/library.json'));` +
        `console.log(JSON.stringify({username:l.username,importedAt:new Date().toISOString(),franchises:l.franchises}))" > /tmp/lib.json\n` +
        `then paste /tmp/lib.json into localStorage under 'storydex:library:v1'.${RESET}\n`,
    )
  } else {
    console.log(`${RED}${BOLD}${failures} invariant(s) failed.${RESET}\n`)
  }

  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error(`\n${RED}Unexpected failure:${RESET}`, error)
  process.exit(1)
})
