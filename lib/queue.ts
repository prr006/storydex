import {
  canContinue,
  getEntryStatus,
  getNextEntry,
  getStoryPhase,
  getStoryProgress,
  isUpcoming,
} from './design'
import type { Franchise, Season } from './franchise'

/* ==========================================================================
   The queue
   --------------------------------------------------------------------------
   Everything that is *not* "resume right now":

     · the next entry of a story that hasn't been started
     · a story you have paused, which keeps its place but is never offered as
       Continue
     · entries that exist but haven't aired

   Kept out of the components because three surfaces need the same answer and
   none of them should own it: Home's Up next board, the library, and anything
   added later.
   ========================================================================== */

export interface UpNextRow {
  franchise: Franchise
  entry: Season
  reason: 'next' | 'paused' | 'upcoming'
}

export function upcomingEntries(franchises: Franchise[], excludeId?: string): UpNextRow[] {
  const rows: UpNextRow[] = []

  for (const franchise of franchises) {
    if (franchise.id === excludeId) continue
    const phase = getStoryPhase(franchise)
    if (phase === 'complete' || phase === 'dropped') continue

    const next = getNextEntry(franchise)
    if (!next) continue

    const status = getEntryStatus(next)
    const started = getStoryProgress(franchise).started

    if (isUpcoming(next)) {
      rows.push({ franchise, entry: next, reason: 'upcoming' })
    } else if (!started || phase === 'backlog' || phase === 'planned') {
      rows.push({ franchise, entry: next, reason: 'next' })
    } else if (canContinue(franchise)) {
      rows.push({ franchise, entry: next, reason: 'next' })
    }
  }

  // Paused stories keep their place in the queue, clearly labelled.
  for (const franchise of franchises) {
    if (franchise.id === excludeId) continue
    if (getStoryPhase(franchise) !== 'paused') continue
    if (rows.some((row) => row.franchise.id === franchise.id)) continue
    const next = getNextEntry(franchise)
    if (next && !isUpcoming(next)) rows.push({ franchise, entry: next, reason: 'paused' })
  }

  return rows.sort((a, b) => {
    const order = { next: 0, paused: 1, upcoming: 2 }
    return order[a.reason] - order[b.reason] || a.franchise.name.localeCompare(b.franchise.name)
  })
}

/**
 * What has been announced but has not aired yet, soonest first, one row per
 * story.
 *
 * Deliberately separate from the queue above: an announced entry is not
 * something you can start, so it must never be mixed in with entries that are
 * waiting for you. It is the only place in the product where a year is
 * genuinely a date in the future.
 */
export function announcedEntries(franchises: Franchise[]): UpNextRow[] {
  const rows: UpNextRow[] = []

  for (const franchise of franchises) {
    if (getStoryPhase(franchise) === 'dropped') continue

    const announced = franchise.seasons
      .filter((entry) => getEntryStatus(entry) === 'upcoming')
      .sort((a, b) => (a.year > 0 ? a.year : 9999) - (b.year > 0 ? b.year : 9999))[0]

    if (announced) rows.push({ franchise, entry: announced, reason: 'upcoming' })
  }

  return rows.sort(
    (a, b) =>
      (a.entry.year > 0 ? a.entry.year : 9999) - (b.entry.year > 0 ? b.entry.year : 9999) ||
      a.franchise.name.localeCompare(b.franchise.name),
  )
}
