import type { Franchise, Season } from './franchise'

/* ==========================================================================
   StoryDex — design semantics
   --------------------------------------------------------------------------
   One place where a raw AniList status becomes a *visual* decision, so the
   dashboard, the cards and the Franchise Map can never disagree.

   Colour logic (deliberate, and the core of the system):
     violet  = identity + chrome. Never a status.
     jade    = finished  (the reward colour)
     ember   = YOU ARE HERE / watch next  (the single warm accent)
     lilac   = planned later
     ghost   = not released / not started
   ========================================================================== */

export type EntryStatus =
  | 'watched'
  | 'watching'
  | 'planned'
  | 'upcoming'
  | 'unwatched'
  | 'paused'
  | 'dropped'

export interface StatusVisual {
  /** Human label, sentence case for inline use. */
  label: string
  /** Short ALL-CAPS label for mono labels. */
  tag: string
  /** CSS colour for this status. */
  color: string
  /** True when the entry should be rendered as "not yet reached". */
  dim: boolean
  /** True when the node is the user's current position in the story. */
  live: boolean
}

const STATUS_VISUALS: Record<EntryStatus, StatusVisual> = {
  watched: { label: 'Watched', tag: 'WATCHED', color: 'var(--color-jade)', dim: false, live: false },
  watching: { label: 'Watching now', tag: 'WATCHING', color: 'var(--color-ember)', dim: false, live: true },
  planned: { label: 'Planned', tag: 'PLANNED', color: 'var(--color-lilac)', dim: true, live: false },
  upcoming: { label: 'Not aired yet', tag: 'UPCOMING', color: 'var(--color-veil)', dim: true, live: false },
  unwatched: { label: 'Not started', tag: 'BACKLOG', color: 'var(--color-veil)', dim: true, live: false },
  paused: { label: 'Paused', tag: 'PAUSED', color: 'var(--color-slate)', dim: true, live: false },
  dropped: { label: 'Dropped', tag: 'DROPPED', color: 'var(--color-coral)', dim: true, live: false },
}

export const CURRENT_YEAR = new Date().getFullYear()

/** Is this entry unreleased? Prefers AniList's airing status, falls back to year. */
export function isUpcoming(season: Season, currentYear = CURRENT_YEAR): boolean {
  if (season.airingStatus) return season.airingStatus === 'NOT_YET_RELEASED'
  return season.year > currentYear
}

/**
 * Resolve one entry to a visual status.
 *
 * Priority order matters: a finished entry is always "watched" even if its
 * airing status looks odd, and the user's own CURRENT flag always outranks
 * the release calendar.
 */
export function getEntryStatus(season: Season, currentYear = CURRENT_YEAR): EntryStatus {
  if (season.completed || season.status === 'COMPLETED' || season.status === 'REPEATING') {
    return 'watched'
  }
  if (season.status === 'CURRENT') return 'watching'
  if (season.status === 'DROPPED') return 'dropped'
  if (season.status === 'PAUSED') return 'paused'
  if (isUpcoming(season, currentYear)) return 'upcoming'
  if (season.status === 'PLANNING') return 'planned'
  return 'unwatched'
}

export function statusVisual(status: EntryStatus): StatusVisual {
  return STATUS_VISUALS[status]
}

export function seasonVisual(season: Season, currentYear = CURRENT_YEAR): StatusVisual {
  return STATUS_VISUALS[getEntryStatus(season, currentYear)]
}

/* --------------------------------------------------------------------------
   Progress math
   -------------------------------------------------------------------------- */

export interface StoryProgress {
  completed: number
  total: number
  /** 0–100, rounded. */
  percent: number
  /** Fractional 0–1, for bars and rings that shouldn't round the truth away. */
  ratio: number
  complete: boolean
  started: boolean
}

export function getStoryProgress(franchise: Franchise): StoryProgress {
  const total = franchise.seasons.length
  const completed = franchise.seasons.filter((s) => getEntryStatus(s) === 'watched').length
  const ratio = total > 0 ? completed / total : 0
  return {
    completed,
    total,
    ratio,
    percent: Math.round(ratio * 100),
    complete: total > 0 && completed === total,
    started: completed > 0,
  }
}

/** Total episodes in a franchise — the "how big is this story" number. */
export function getEpisodeTotal(franchise: Franchise): number {
  return franchise.seasons.reduce((sum, s) => sum + (s.episodes || 0), 0)
}

/**
 * Episodes actually consumed. Finished entries count in full; in-progress
 * entries contribute their raw episode progress, which is why "588 of 1,104
 * episodes" is a more honest headline metric than a season percentage.
 */
export function getEpisodeProgress(franchise: Franchise): { watched: number; total: number } {
  let watched = 0
  let total = 0
  for (const season of franchise.seasons) {
    const eps = season.episodes || 0
    total += eps
    const status = getEntryStatus(season)
    if (status === 'watched') watched += eps
    else if (status === 'watching') watched += Math.min(season.progress || 0, eps)
  }
  return { watched, total }
}

/* --------------------------------------------------------------------------
   Sequencing — "what do I watch next?"
   -------------------------------------------------------------------------- */

/**
 * The entry the user should watch next.
 *
 * Dropped entries are excluded from the candidate pool on purpose: "Continue
 * watching" must never re-suggest something the user explicitly walked away
 * from. If a dropped entry is all that's left, the story reads as dropped, and
 * the UI surfaces that state instead of inventing a next step.
 *
 * Prefers the value computed at import time, then the user's live CURRENT
 * entry, then the first watchable entry in release order. The fallback matters
 * because AniList's relation graph is often incomplete: an entry can arrive
 * with no `nextToWatch` computed at all, and the UI still has to answer the
 * only question the product exists to answer.
 */
export function getNextEntry(franchise: Franchise): Season | null {
  if (franchise.nextToWatch && getEntryStatus(franchise.nextToWatch) !== 'dropped') {
    return franchise.nextToWatch
  }

  const candidates = franchise.seasons.filter((s) => {
    const status = getEntryStatus(s)
    return status !== 'watched' && status !== 'dropped'
  })
  if (candidates.length === 0) return null

  return (
    candidates.find((s) => getEntryStatus(s) === 'watching') ??
    candidates.find((s) => getEntryStatus(s) === 'planned' || getEntryStatus(s) === 'unwatched') ??
    candidates[0]
  )
}

/** Index of the next entry within the story, for "Entry 4 of 7" copy. */
export function getNextEntryIndex(franchise: Franchise): number {
  const next = getNextEntry(franchise)
  if (!next) return -1
  return franchise.seasons.findIndex((s) => s.id === next.id)
}

/**
 * Is there anything the user can actually watch right now?
 *
 * A story whose only remaining entry hasn't aired is not "in progress" — it's
 * *finished with what exists*. Treating those the same is the single most
 * common lie anime trackers tell, so we separate them everywhere: they never
 * appear in Continue Watching, and they get their own phase.
 */
export function canContinue(franchise: Franchise): boolean {
  const next = getNextEntry(franchise)
  return next !== null && getEntryStatus(next) !== 'upcoming'
}

/** The nearest not-yet-aired entry anywhere in the library, for the "caught up" state. */
export function getSoonestUpcoming(
  franchises: Franchise[],
): { franchise: Franchise; entry: Season } | null {
  let best: { franchise: Franchise; entry: Season } | null = null

  for (const franchise of franchises) {
    for (const entry of franchise.seasons) {
      if (getEntryStatus(entry) !== 'upcoming') continue
      if (!best) {
        best = { franchise, entry }
        continue
      }
      const a = entry.year > 0 ? entry.year : Infinity
      const b = best.entry.year > 0 ? best.entry.year : Infinity
      if (a < b) best = { franchise, entry }
    }
  }

  return best
}

export type StoryPhase =
  | 'complete'
  | 'watching'
  | 'caught-up'
  | 'dropped'
  | 'paused'
  | 'backlog'
  | 'planned'

/**
 * The story-level state. Order matters and is deliberate: what you're actively
 * watching outranks everything, "nothing left to watch but more is coming"
 * outranks abandonment, and a genuine stop outranks a stall.
 */
export function getStoryPhase(franchise: Franchise): StoryPhase {
  const { complete, started } = getStoryProgress(franchise)
  if (complete) return 'complete'

  const statuses = franchise.seasons.map((s) => getEntryStatus(s))
  if (statuses.includes('watching')) return 'watching'

  // Caught up: nothing left except entries that haven't aired.
  if (started && statuses.every((s) => s === 'watched' || s === 'upcoming')) return 'caught-up'

  if (statuses.includes('dropped')) return 'dropped'
  if (started || statuses.includes('paused')) return 'paused'
  if (statuses.includes('unwatched')) return 'backlog'
  if (statuses.includes('planned')) return 'planned'
  return 'caught-up'
}

const PHASE_COPY: Record<StoryPhase, { label: string; color: string }> = {
  complete: { label: 'Complete', color: 'var(--color-jade)' },
  watching: { label: 'In progress', color: 'var(--color-ember)' },
  'caught-up': { label: 'Caught up', color: 'var(--color-azure)' },
  dropped: { label: 'Dropped', color: 'var(--color-coral)' },
  paused: { label: 'Paused', color: 'var(--color-slate)' },
  backlog: { label: 'Backlog', color: 'var(--color-mist)' },
  planned: { label: 'Planned', color: 'var(--color-lilac)' },
}

export function phaseCopy(phase: StoryPhase) {
  return PHASE_COPY[phase]
}

/* --------------------------------------------------------------------------
   Formatting
   -------------------------------------------------------------------------- */

export function formatYear(year: number | undefined): string {
  return year && year > 0 ? String(year) : '—'
}

export function formatSpan(years: number[]): string {
  const valid = years.filter((y) => y > 0)
  if (valid.length === 0) return 'Year unknown'
  const min = Math.min(...valid)
  const max = Math.max(...valid)
  return min === max ? String(min) : `${min}–${max}`
}

/** AniList user scores are 0–100. Display as a 10-point scale. */
export function formatScore(score: number | undefined): string | null {
  if (!score || score <= 0) return null
  return (score / 10).toFixed(1)
}

export function formatCount(value: number): string {
  return value.toLocaleString('en-US')
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

/**
 * AniList formats are SCREAMING_SNAKE enums. Expanding them naively produces
 * "Tv" and "Ova", which looks like a bug — so they're mapped by hand, in the
 * product's own editorial voice (MOVIE reads as "Film" everywhere).
 */
const FORMAT_LABELS: Record<string, string> = {
  TV: 'TV',
  TV_SHORT: 'TV Short',
  MOVIE: 'Film',
  SPECIAL: 'Special',
  OVA: 'OVA',
  ONA: 'ONA',
  MUSIC: 'Music',
}

export function formatFormat(format: string | undefined): string {
  if (!format) return 'TV'
  return FORMAT_LABELS[format] ?? format.charAt(0) + format.slice(1).toLowerCase()
}

export function formatEpisodes(season: Season): string {
  if (!season.episodes || season.episodes <= 0) return 'Ep ?'
  return `${season.episodes} ep${season.episodes === 1 ? '' : 's'}`
}

/* --------------------------------------------------------------------------
   Per-story accent
   --------------------------------------------------------------------------
   A story's hero tint comes from its OWN artwork: AniList returns
   `coverImage.color`, the dominant colour of the cover. That means the tint is
   always in sympathy with the poster sitting inside it, and it's free — no
   colour extraction, no canvas, no request.

   When AniList omits the colour (it happens, particularly on older entries) we
   fall back to a hue derived from the franchise id, kept inside a narrow
   violet→indigo→magenta spread so an untinted story still reads as StoryDex
   rather than as a random colour.
   -------------------------------------------------------------------------- */

/** Deterministic spinoff hue, used only when AniList gives us no colour. */
export function storyHue(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  const spread = [-34, -20, -8, 0, 12, 22, 34]
  return spread[Math.abs(hash) % spread.length]
}

function hexToRgb(hex: string): [number, number, number] | null {
  const value = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(value)) return null
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

/**
 * A ready-to-use rgba() tint for a story's hero and atmosphere layers.
 * Prefers the real AniList cover colour; falls back to the id-derived hue.
 */
export function storyTint(
  input: string | { id: string; accentColor?: string | null },
  alpha = 0.5,
): string {
  const id = typeof input === 'string' ? input : input.id
  const accent = typeof input === 'string' ? null : input.accentColor

  if (accent) {
    const rgb = hexToRgb(accent)
    // AniList sometimes returns near-black or near-white cover colours. Those
    // make useless tints, so let them fall through to the brand hue instead.
    if (rgb) {
      const [r, g, b] = rgb
      const luma = (0.2126 * r + 0.7152 * g + 0.2107 * b) / 255
      if (luma > 0.08 && luma < 0.94) {
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      }
    }
  }

  const hue = 262 + storyHue(id)
  return `hsla(${hue}, 82%, 58%, ${alpha})`
}
