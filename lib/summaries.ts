import type { Franchise } from './franchise'
import { getEpisodeProgress, getEpisodeTotal, getStoryProgress } from './design'

/* ==========================================================================
   summaries — the small arithmetic behind the one-line statements
   --------------------------------------------------------------------------
   Home, Collections and Library each want to say something true about the
   whole library in a sentence. That arithmetic lives here so the three pages
   can never disagree about the total, and so no page file exports anything
   Next.js doesn't allow.
   ========================================================================== */

export interface LibraryTotals {
  stories: number
  entries: number
  /** Entries finished. */
  watched: number
  /** Stories with at least one entry currently in progress. */
  active: number
  episodes: number
  episodesWatched: number
}

export function libraryTotals(list: Franchise[]): LibraryTotals {
  let entries = 0
  let watched = 0
  let active = 0
  let episodes = 0
  let episodesWatched = 0

  for (const franchise of list) {
    entries += franchise.seasons.length
    watched += getStoryProgress(franchise).completed
    episodes += getEpisodeTotal(franchise)
    episodesWatched += getEpisodeProgress(franchise).watched
    if (franchise.seasons.some((entry) => entry.status === 'CURRENT')) active += 1
  }

  return { stories: list.length, entries, watched, active, episodes, episodesWatched }
}

/** "Tuesday, 16 September" — the dateline above the Home statement. */
export function formatToday(date = new Date()): string {
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Counted words for sentences that shouldn't read like telemetry. */
export function countWord(value: number): string {
  const words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']
  return words[value] ?? String(value)
}
