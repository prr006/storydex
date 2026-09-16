'use client'

import { useMemo, useState } from 'react'
import type { Franchise } from './franchise'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SortOption =
  | 'az'
  | 'za'
  | 'most-seasons'
  | 'most-episodes'
  | 'newest'
  | 'oldest'
  | 'completion'
  | 'next-up'

export type FilterChip =
  | 'all'
  | 'in-progress'
  | 'completed'
  | 'watching'
  | 'planned'
  | 'backlog'
  | 'movies'
  | 'tv'
  | 'upcoming'

/**
 * Filter rail, ordered by usefulness rather than taxonomy. "In progress" and
 * "Completed" are the two questions people actually ask of a library; format
 * filters (movies/TV) are a rarely-used third tier.
 */
export const FILTER_CHIPS: { value: FilterChip; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'watching', label: 'Watching' },
  { value: 'planned', label: 'Planned' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'movies', label: 'Films' },
  { value: 'tv', label: 'Series' },
  { value: 'upcoming', label: 'Upcoming' },
]

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'next-up', label: 'Closest to finishing' },
  { value: 'most-seasons', label: 'Longest story' },
  { value: 'most-episodes', label: 'Most episodes' },
  { value: 'completion', label: 'Completion' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'az', label: 'A\u2013Z' },
  { value: 'za', label: 'Z\u2013A' },
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

function watchedRatio(franchise: Franchise): number {
  const total = franchise.seasons.length
  if (total === 0) return 0
  const done = franchise.seasons.filter(
    (s) => s.completed || s.status === 'COMPLETED' || s.status === 'REPEATING',
  ).length
  return done / total
}

function entryStatus(season: Franchise['seasons'][number]): string {
  if (season.completed || season.status === 'COMPLETED' || season.status === 'REPEATING') return 'watched'
  if (season.status === 'CURRENT') return 'watching'
  if (season.status === 'DROPPED') return 'dropped'
  if (season.status === 'PAUSED') return 'paused'
  if (season.airingStatus === 'NOT_YET_RELEASED' || (!season.airingStatus && season.year > CURRENT_YEAR))
    return 'upcoming'
  if (season.status === 'PLANNING') return 'planned'
  return 'unwatched'
}

export function matchesFilter(franchise: Franchise, filter: FilterChip): boolean {
  const { seasons, completedSeasons, totalSeasons } = franchise
  switch (filter) {
    case 'all':
      return true
    case 'completed':
      return totalSeasons > 0 && completedSeasons === totalSeasons
    case 'in-progress':
      return completedSeasons > 0 && completedSeasons < totalSeasons
    case 'watching':
      return seasons.some((s) => entryStatus(s) === 'watching')
    case 'planned':
      return seasons.some((s) => entryStatus(s) === 'planned')
    case 'backlog':
      return completedSeasons === 0 && !seasons.some((s) => entryStatus(s) === 'planned')
    case 'movies':
      return seasons.some((s) => s.format === 'MOVIE')
    case 'tv':
      return seasons.some((s) => s.format === 'TV' || s.format === 'TV_SHORT')
    case 'upcoming':
      return seasons.some((s) => entryStatus(s) === 'upcoming')
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
        return b.totalSeasons - a.totalSeasons || a.name.localeCompare(b.name)
      case 'most-episodes': {
        const epA = a.seasons.reduce((sum, s) => sum + s.episodes, 0)
        const epB = b.seasons.reduce((sum, s) => sum + s.episodes, 0)
        return epB - epA || a.name.localeCompare(b.name)
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
      case 'completion':
        return watchedRatio(b) - watchedRatio(a) || a.name.localeCompare(b.name)
      case 'next-up':
        return watchedRatio(b) - watchedRatio(a) || a.name.localeCompare(b.name)
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
  filtered: Franchise[]
  /** How many stories each chip would show — lets the rail hide dead filters. */
  counts: Record<FilterChip, number>
}

export function useDashboardControls(franchises: Franchise[]): DashboardControls {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('next-up')
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all')

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeSearch(query)

    const result = franchises.filter((franchise) => {
      if (!matchesFilter(franchise, activeFilter)) return false

      if (normalizedQuery) {
        const nameMatch = normalizeSearch(franchise.name).includes(normalizedQuery)
        const seasonMatch = franchise.seasons.some((s) =>
          normalizeSearch(s.name).includes(normalizedQuery),
        )
        if (!nameMatch && !seasonMatch) return false
      }

      return true
    })

    return sortFranchises(result, sort)
  }, [franchises, query, sort, activeFilter])

  // Counts are computed against the current search only, so the numbers on
  // the chips describe what they'd actually do.
  const counts = useMemo(() => {
    const normalizedQuery = normalizeSearch(query)
    const searchScoped = normalizedQuery
      ? franchises.filter(
          (franchise) =>
            normalizeSearch(franchise.name).includes(normalizedQuery) ||
            franchise.seasons.some((s) => normalizeSearch(s.name).includes(normalizedQuery)),
        )
      : franchises

    const result = {} as Record<FilterChip, number>
    for (const chip of FILTER_CHIPS) {
      result[chip.value] = searchScoped.filter((f) => matchesFilter(f, chip.value)).length
    }
    return result
  }, [franchises, query])

  return { query, setQuery, sort, setSort, activeFilter, setActiveFilter, filtered, counts }
}
