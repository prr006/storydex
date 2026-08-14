'use client'

import { useState, useMemo } from 'react'
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

export type FilterChip =
  | 'all'
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
  { value: 'completed', label: 'Completed' },
  { value: 'watching', label: 'Watching' },
  { value: 'planning', label: 'Planning' },
  { value: 'movies', label: 'Movies' },
  { value: 'tv', label: 'TV' },
  { value: 'ova', label: 'OVA' },
  { value: 'ona', label: 'ONA' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'in-progress', label: 'In Progress' },
]

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'most-seasons', label: 'Most Seasons' },
  { value: 'az', label: 'A\u2013Z' },
  { value: 'za', label: 'Z\u2013A' },
  { value: 'most-episodes', label: 'Most Episodes' },
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

function matchesFilter(franchise: Franchise, filter: FilterChip): boolean {
  const { seasons, completedSeasons, totalSeasons } = franchise
  switch (filter) {
    case 'all':
      return true
    case 'completed':
      return totalSeasons > 0 && completedSeasons === totalSeasons
    case 'watching':
      return seasons.some((s) => s.status === 'CURRENT')
    case 'planning':
      return seasons.some((s) => s.status === 'PLANNING')
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
  filtered: Franchise[]
}

export function useDashboardControls(franchises: Franchise[]): DashboardControls {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('most-seasons')
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all')

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeSearch(query)

    let result = franchises.filter((franchise) => {
      // 1. Filter chip
      if (!matchesFilter(franchise, activeFilter)) return false

      // 2. Search: match franchise name OR any season title, case- and
      //    punctuation-insensitive (normalizeSearch strips all punctuation)
      if (normalizedQuery) {
        const nameMatch = normalizeSearch(franchise.name).includes(normalizedQuery)
        const seasonMatch = franchise.seasons.some((s) =>
          normalizeSearch(s.name).includes(normalizedQuery),
        )
        if (!nameMatch && !seasonMatch) return false
      }

      return true
    })

    // 3. Sort after filtering
    result = sortFranchises(result, sort)

    return result
  }, [franchises, query, sort, activeFilter])

  return { query, setQuery, sort, setSort, activeFilter, setActiveFilter, filtered }
}
