import type { Franchise } from './franchise'
import {
  canContinue,
  getEpisodeProgress,
  getEpisodeTotal,
  getStoryPhase,
  getStoryProgress,
} from './design'

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

/* --------------------------------------------------------------------------
   Continue watching
   --------------------------------------------------------------------------
   The stories offered as "pick this up". A story qualifies when there is
   something watchable left AND the user has actually begun it — either by
   finishing an entry, or by being partway through one.

   That second clause matters more than it looks: One Piece is 1,082 episodes
   into a single AniList entry, which means zero *entries* completed but a very
   long way in. Judging activity by entry count alone would hide it.
   -------------------------------------------------------------------------- */

export function continueWatching(list: Franchise[]): Franchise[] {
  return list
    .filter((franchise) => {
      if (!canContinue(franchise)) return false
      if (getStoryProgress(franchise).started) return true
      return getEpisodeProgress(franchise).watched > 0
    })
    .sort((a, b) => {
      const rank = (franchise: Franchise) => (getStoryPhase(franchise) === 'watching' ? 0 : 1)
      return (
        rank(a) - rank(b) ||
        getStoryProgress(b).ratio - getStoryProgress(a).ratio ||
        a.name.localeCompare(b.name)
      )
    })
}
