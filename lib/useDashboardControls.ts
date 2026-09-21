'use client'

import { useState, useMemo } from 'react'
import { applyMediaScope, seasonTotal, type Franchise, type MediaScope } from './franchise'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SortOption =
  | 'az'
  | 'za'
  | 'most-seasons'
  | 'most-progress'
  | 'newest'
  | 'oldest'
  | 'completion'

export type FilterChip =
  | 'all'
  | 'anime'
  | 'manga'
  | 'completed'
  | 'watching'
  | 'planning'
  | 'movies'
  | 'tv'
  | 'ova'
  | 'ona'
  | 'upcoming'
  | 'in-progress'

export const FILTER_CHIPS: { value: FilterChip; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'anime', label: 'Anime' },
  { value: 'manga', label: 'Manga' },
  { value: 'completed', label: 'Completed' },
  { value: 'watching', label: 'Watching' },
  { value: 'planning', label: 'Planning' },
  { value: 'tv', label: 'TV' },
  { value: 'movies', label: 'Movies' },
  { value: 'ova', label: 'OVA' },
  { value: 'ona', label: 'ONA' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'in-progress', label: 'In Progress' },
]

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'most-seasons', label: 'Most Seasons' },
  { value: 'az', label: 'A\u2013Z' },
  { value: 'za', label: 'Z\u2013A' },
  { value: 'most-progress', label: 'Most Progress' },
  { value: 'newest', label: 'Newest Franchise' },
  { value: 'oldest', label: 'Oldest Franchise' },
  { value: 'completion', label: 'Completion %' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalize a string for case- and punctuation-insensitive matching. */
function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const CURRENT_YEAR = new Date().getFullYear()

/** Map the active chip to the media scope for the derived view. */
function mediaScopeForFilter(filter: FilterChip): MediaScope {
  if (filter === 'anime') return 'ANIME'
  if (filter === 'manga') return 'MANGA'
  return 'ALL'
}

function matchesFilter(franchise: Franchise, filter: FilterChip): boolean {
  const { seasons, completedSeasons, totalSeasons } = franchise
  switch (filter) {
    case 'all':
      return true
    case 'anime':
      return seasons.some((s) => s.mediaType === 'ANIME')
    case 'manga':
      return seasons.some((s) => s.mediaType === 'MANGA')
    case 'completed':
      return totalSeasons > 0 && completedSeasons === totalSeasons
    case 'watching':
      return seasons.some((s) => s.inUserList && s.status === 'CURRENT')
    case 'planning':
      return seasons.some((s) => s.inUserList && s.status === 'PLANNING')
    case 'movies':
      return seasons.some((s) => s.format === 'MOVIE')
    case 'tv':
      return seasons.some((s) => s.format === 'TV')
    case 'ova':
      return seasons.some((s) => s.format === 'OVA')
    case 'ona':
      return seasons.some((s) => s.format === 'ONA')
    case 'upcoming':
      return seasons.some((s) => s.year > CURRENT_YEAR)
    case 'in-progress':
      return completedSeasons > 0 && completedSeasons < totalSeasons
    default:
      return true
  }
}

function sortFranchises(list: Franchise[], sort: SortOption): Franchise[] {
  return [...list].sort((a, b) => {
    switch (sort) {
      case 'az':
        return a.name.localeCompare(b.name)
      case 'za':
        return b.name.localeCompare(a.name)
      case 'most-seasons':
        // Story size = the whole franchise route (user + discovered).
        return b.seasons.length - a.seasons.length || a.name.localeCompare(b.name)
      case 'most-progress': {
        // Media-aware: sums each story's native size (episodes, chapters or
        // volumes) over USER-OWNED entries only, so manga-heavy libraries
        // sort sensibly too and discovered entries never count as progress.
        const sizeOf = (f: Franchise) =>
          f.seasons.filter((s) => s.inUserList).reduce((sum, s) => sum + seasonTotal(s), 0)
        const pA = sizeOf(a)
        const pB = sizeOf(b)
        return pB - pA || a.name.localeCompare(b.name)
      }
      case 'newest': {
        const maxYear = (f: Franchise) =>
          Math.max(0, ...f.seasons.map((s) => s.year).filter((y) => y > 0))
        return maxYear(b) - maxYear(a) || a.name.localeCompare(b.name)
      }
      case 'oldest': {
        const minYear = (f: Franchise) => {
          const years = f.seasons.map((s) => s.year).filter((y) => y > 0)
          return years.length ? Math.min(...years) : Infinity
        }
        return minYear(a) - minYear(b) || a.name.localeCompare(b.name)
      }
      case 'completion': {
        const pctA = a.totalSeasons > 0 ? a.completedSeasons / a.totalSeasons : 0
        const pctB = b.totalSeasons > 0 ? b.completedSeasons / b.totalSeasons : 0
        return pctB - pctA || a.name.localeCompare(b.name)
      }
      default:
        return 0
    }
  })
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface DashboardControls {
  query: string
  setQuery: (q: string) => void
  sort: SortOption
  setSort: (s: SortOption) => void
  activeFilter: FilterChip
  setActiveFilter: (f: FilterChip) => void
  /**
   * The media-scoped view of the library (ALL / only-ANIME / only-MANGA
   * seasons, derived — the stored library is never split). Search, sort,
   * progress, completion and every other presentation concern operates on
   * this subset, so an anime season can never appear inside the Manga view
   * (and vice versa).
   */
  scoped: Franchise[]
  /** scoped + search chip + sort — the rows the index renders. */
  filtered: Franchise[]
}

export function useDashboardControls(franchises: Franchise[]): DashboardControls {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('most-seasons')
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all')

  // 0. Media scope — derived presentation subset (never mutates the input).
  const scoped = useMemo(
    () => applyMediaScope(franchises, mediaScopeForFilter(activeFilter)),
    [franchises, activeFilter],
  )

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeSearch(query)

    let result = scoped.filter((franchise) => {
      // 1. Filter chip (anime/manga are already guaranteed by the scope;
      //    the other chips now evaluate the scoped seasons only)
      if (!matchesFilter(franchise, activeFilter)) return false

      // 2. Search: match franchise name OR any VISIBLE (scoped) season
      //    title, case- and punctuation-insensitive
      if (normalizedQuery) {
        const nameMatch = normalizeSearch(franchise.name).includes(normalizedQuery)
        const seasonMatch = franchise.seasons.some((s) =>
          normalizeSearch(s.name).includes(normalizedQuery),
        )
        if (!nameMatch && !seasonMatch) return false
      }

      return true
    })

    // 3. Sort after filtering (over the scoped totals)
    result = sortFranchises(result, sort)

    return result
  }, [scoped, query, sort, activeFilter])

  return { query, setQuery, sort, setSort, activeFilter, setActiveFilter, scoped, filtered }
}
