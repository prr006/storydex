import type { CSSProperties } from 'react'
import type { Franchise, Season } from './franchise'

/* ==========================================================================
   StoryDex — design semantics
   --------------------------------------------------------------------------
   One place where a raw AniList status becomes a *visual* decision, so the
   dashboard, the cards and the Franchise Map can never disagree.

   Colour logic (deliberate, and the core of the system):
     ink greys = chrome. Never a status.
     emerald   = finished
     indigo    = YOU ARE HERE (or the story's own artwork accent)
     amber     = announced, not aired yet
     blue      = on the list, not started
     red       = walked away from

   StoryDex has its own accent (indigo), and every story also carries one taken
   from its AniList artwork. `accentVars()` is how a component adopts a story's
   accent without naming a hex value: it returns the CSS custom properties that
   `--accent`-aware utilities and inline styles read.
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
  watched: { label: 'Completed', tag: 'DONE', color: 'var(--state-done)', dim: false, live: false },
  watching: { label: 'Watching', tag: 'WATCHING', color: 'var(--state-progress)', dim: false, live: true },
  planned: { label: 'Planned', tag: 'PLANNED', color: 'var(--state-planned)', dim: true, live: false },
  upcoming: { label: 'Upcoming', tag: 'UPCOMING', color: 'var(--state-upcoming)', dim: true, live: false },
  unwatched: { label: 'Not started', tag: 'NOT STARTED', color: 'var(--state-idle)', dim: true, live: false },
  paused: { label: 'On hold', tag: 'ON HOLD', color: 'var(--state-paused)', dim: true, live: false },
  dropped: { label: 'Stopped', tag: 'STOPPED', color: 'var(--state-stopped)', dim: true, live: false },
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
  complete: { label: 'Completed', color: 'var(--state-done)' },
  watching: { label: 'Watching', color: 'var(--state-progress)' },
  'caught-up': { label: 'Caught up', color: 'var(--state-planned)' },
  dropped: { label: 'Stopped', color: 'var(--state-stopped)' },
  paused: { label: 'On hold', color: 'var(--state-paused)' },
  backlog: { label: 'Not started', color: 'var(--state-idle)' },
  planned: { label: 'Planned', color: 'var(--state-planned)' },
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

/* --------------------------------------------------------------------------
   Story accents
   --------------------------------------------------------------------------
   Every story carries an accent from its own AniList artwork (`coverImage.color`).
   These helpers turn that colour into the custom properties the UI reads, with
   two guard rails:

     · AniList occasionally returns a near-black or near-white "dominant colour"
       for a cover. Those make useless accents, so they fall through to
       StoryDex indigo rather than producing an invisible or blinding accent.
     · The accent is used for *fill* (progress, nodes, bars), never for small
       text on a dark ground, because we cannot guarantee its contrast. Text
       keeps to ink and the brand ramp.
   -------------------------------------------------------------------------- */

function usableAccent(accent?: string | null): string | null {
  if (!accent) return null
  const rgb = hexToRgb(accent)
  if (!rgb) return null
  const [r, g, b] = rgb
  const luma = (0.2126 * r + 0.7152 * g + 0.2107 * b) / 255
  if (luma <= 0.12 || luma >= 0.9) return null
  // Very desaturated greys read as "broken UI" rather than "that story's colour".
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max - min < 18) return null
  return accent.trim()
}

/**
 * The CSS custom properties for a story's accent.
 * Spread onto any element: `<div style={accentVars(franchise)}>`.
 */
export function accentVars(
  input: string | { id: string; accentColor?: string | null } | null | undefined,
): CSSProperties {
  const accent = typeof input === 'string' ? null : usableAccent(input?.accentColor)
  const id = typeof input === 'string' ? input : (input?.id ?? '')
  if (!accent) {
    return {
      '--accent': 'var(--brand)',
      '--accent-strong': 'var(--brand-strong)',
      '--accent-soft': 'var(--brand-soft)',
    } as CSSProperties
  }
  return {
    '--accent': accent,
    '--accent-strong': `color-mix(in oklab, ${accent} 70%, white)`,
    '--accent-soft': `color-mix(in oklab, ${accent} 22%, transparent)`,
    '--accent-id': id,
  } as CSSProperties
}

/** A single colour for a story's accent, for the rare inline use. */
export function accentColor(
  input: string | { id: string; accentColor?: string | null },
): string {
  if (typeof input !== 'string') {
    const usable = usableAccent(input.accentColor)
    if (usable) return usable
  }
  return `hsl(${262 + storyHue(typeof input === 'string' ? input : input.id)} 82% 62%)`
}

/* --------------------------------------------------------------------------
   Artwork selection
   -------------------------------------------------------------------------- */

export interface StoryArtwork {
  src: string
  /** True when this is a real AniList banner rather than a cover standing in. */
  isBanner: boolean
}

/**
 * The widest artwork a story has.
 *
 * AniList banners exist for a minority of titles and are exactly the right
 * shape for a cinematic hero; when one is missing, the cover is used in the
 * same slot and the frame crops it (never blends, never generates anything).
 */
export function storyArtwork(
  input: { posterUrl: string; bannerUrl?: string | null },
): StoryArtwork | null {
  if (input.bannerUrl && /^https?:\/\//i.test(input.bannerUrl)) {
    return { src: input.bannerUrl, isBanner: true }
  }
  if (input.posterUrl && /^https?:\/\//i.test(input.posterUrl)) {
    return { src: input.posterUrl, isBanner: false }
  }
  return null
}

/** How much of an entry is watched, 0–1. Completed entries are always 1. */
export function entryRatio(entry: Season): number {
  const status = getEntryStatus(entry)
  if (status === 'watched') return 1
  if (!entry.episodes || entry.episodes <= 0) return 0
  return Math.max(0, Math.min(1, (entry.progress ?? 0) / entry.episodes))
}

/** "Episode 9 of 14" / "3 of 13 episodes" — the honest phrasing for one entry. */
export function episodeLabel(entry: Season): string {
  const total = entry.episodes || 0
  const watched = entry.progress ?? 0
  if (total <= 0) return 'Episode count unknown'
  if (total === 1) return getEntryStatus(entry) === 'watched' ? 'Film · watched' : 'Film'
  return `Episode ${watched} of ${total}`
}

/**
 * The entry the user is inside right now, or the next one they could open.
 *
 * Lives here rather than in a card component because every surface needs it:
 * the stage, the hero, the ladder, the map.
 */
export function currentEntry(franchise: Franchise): Season | null {
  const watching = franchise.seasons.find((entry) => getEntryStatus(entry) === 'watching')
  return watching ?? getNextEntry(franchise)
}

/** A story phase expressed in the entry-status vocabulary, so chips match. */
export function phaseToStatus(phase: StoryPhase): EntryStatus {
  switch (phase) {
    case 'complete':
      return 'watched'
    case 'watching':
      return 'watching'
    case 'caught-up':
      return 'planned'
    case 'dropped':
      return 'dropped'
    case 'paused':
      return 'paused'
    case 'planned':
      return 'planned'
    default:
      return 'unwatched'
  }
}
