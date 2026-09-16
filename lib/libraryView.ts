'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Franchise, Season } from './franchise'
import { getEntryStatus, getEpisodeTotal, getStoryPhase, getStoryProgress, type StoryPhase } from './design'

/* ==========================================================================
   libraryView — the browsing model
   --------------------------------------------------------------------------
   Supersedes `useDashboardControls`. Same job, but built for a real browse
   surface: four independent facets, three densities, and a sort list made only
   of orderings this data can actually honour.

   Deliberately NOT included: "recently updated". The AniList list payload we
   persist carries no activity timestamp, and a sort option that silently
   re-orders by something else is worse than not offering it.
   ========================================================================== */

export type Density = 'grid' | 'list' | 'table'

export type SortKey =
  | 'closest'
  | 'progress'
  | 'longest'
  | 'episodes'
  | 'newest'
  | 'oldest'
  | 'title'

export type StatusFacet = 'all' | StoryPhase
export type FormatFacet = 'all' | 'TV' | 'MOVIE' | 'OVA' | 'SPECIAL' | 'ONA'

export interface LibraryFilters {
  query: string
  status: StatusFacet
  format: FormatFacet
  genre: string
  /** Multi-select of franchise ids. Empty means "no restriction". */
  franchises: string[]
  sort: SortKey
  density: Density
}

export const DEFAULT_FILTERS: LibraryFilters = {
  query: '',
  status: 'all',
  format: 'all',
  genre: 'all',
  franchises: [],
  sort: 'closest',
  density: 'grid',
}

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'closest', label: 'Closest to finishing' },
  { value: 'progress', label: 'Most progress' },
  { value: 'longest', label: 'Most entries' },
  { value: 'episodes', label: 'Most episodes' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title', label: 'Title A–Z' },
]

export const STATUS_FACETS: { value: StatusFacet; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'watching', label: 'Watching' },
  { value: 'complete', label: 'Completed' },
  { value: 'paused', label: 'On hold' },
  { value: 'planned', label: 'Planned' },
]

export const FORMAT_FACETS: { value: FormatFacet; label: string }[] = [
  { value: 'all', label: 'All formats' },
  { value: 'TV', label: 'TV' },
  { value: 'MOVIE', label: 'Films' },
  { value: 'OVA', label: 'OVA' },
  { value: 'SPECIAL', label: 'Specials' },
  { value: 'ONA', label: 'ONA' },
]

export const DENSITIES: { value: Density; label: string; hint: string }[] = [
  { value: 'grid', label: 'Grid', hint: 'Scan by cover' },
  { value: 'list', label: 'List', hint: 'Scan by progress' },
  { value: 'table', label: 'Table', hint: 'Compare many' },
]

/* -------------------------------------------------------------------------- */
/* Matching                                                                   */
/* -------------------------------------------------------------------------- */

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchesFormat(franchise: Franchise, format: FormatFacet): boolean {
  if (format === 'all') return true
  return franchise.seasons.some((entry) => (entry.format ?? 'TV') === format)
}

/**
 * Status facets operate on the *story*, using the same phase logic as the rest
 * of the app, so a filter can never disagree with the status shown on a card.
 */
function matchesStatus(franchise: Franchise, status: StatusFacet): boolean {
  if (status === 'all') return true
  return getStoryPhase(franchise) === status
}

function matchesQuery(franchise: Franchise, query: string): boolean {
  if (!query) return true
  const needle = normalize(query)
  if (normalize(franchise.name).includes(needle)) return true
  return franchise.seasons.some((entry) => normalize(entry.name).includes(needle))
}

/* -------------------------------------------------------------------------- */
/* Sorting                                                                    */
/* -------------------------------------------------------------------------- */

function maxYear(franchise: Franchise): number {
  const years = franchise.seasons.map((s) => s.year).filter((y) => y > 0)
  return years.length ? Math.max(...years) : 0
}

function minYear(franchise: Franchise): number {
  const years = franchise.seasons.map((s) => s.year).filter((y) => y > 0)
  return years.length ? Math.min(...years) : Infinity
}

function totalEpisodes(franchise: Franchise): number {
  return getEpisodeTotal(franchise)
}

function sortFranchises(list: Franchise[], sort: SortKey): Franchise[] {
  const copy = [...list]
  const byTitle = (a: Franchise, b: Franchise) => a.name.localeCompare(b.name)

  switch (sort) {
    case 'closest':
      // Unfinished stories first (a finished story has nowhere to go), then by
      // how little is left — the honest "what should I pick up" ordering.
      return copy.sort((a, b) => {
        const pa = getStoryProgress(a)
        const pb = getStoryProgress(b)
        if (pa.complete !== pb.complete) return pa.complete ? 1 : -1
        return pb.ratio - pa.ratio || byTitle(a, b)
      })
    case 'progress':
      return copy.sort((a, b) => getStoryProgress(b).ratio - getStoryProgress(a).ratio || byTitle(a, b))
    case 'longest':
      return copy.sort((a, b) => b.seasons.length - a.seasons.length || byTitle(a, b))
    case 'episodes':
      return copy.sort((a, b) => totalEpisodes(b) - totalEpisodes(a) || byTitle(a, b))
    case 'newest':
      return copy.sort((a, b) => maxYear(b) - maxYear(a) || byTitle(a, b))
    case 'oldest':
      return copy.sort((a, b) => minYear(a) - minYear(b) || byTitle(a, b))
    case 'title':
    default:
      return copy.sort(byTitle)
  }
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export interface FacetCounts {
  status: Record<StatusFacet, number>
  format: Record<FormatFacet, number>
  genre: { value: string; label: string; count: number }[]
}

export interface LibraryView {
  filters: LibraryFilters
  set: <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => void
  reset: () => void
  /** True when anything is narrowing the set — drives the "clear" affordance. */
  isFiltered: boolean
  results: Franchise[]
  total: number
  counts: FacetCounts
  /** Genres present in the library, most common first. */
  genres: string[]
  /** Franchises that have more than one entry — the real "collections". */
  multiEntry: Franchise[]
  activeFacetSummary: string[]
}

interface UseLibraryViewOptions {
  franchises: Franchise[]
  /** Mirror the filters into the URL so a view is linkable. `/library` only. */
  syncUrl?: boolean
  defaults?: Partial<LibraryFilters>
}

function readUrlFilters(): Partial<LibraryFilters> {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const out: Partial<LibraryFilters> = {}

  const q = params.get('q')
  if (q) out.query = q

  const status = params.get('status')
  if (status && STATUS_FACETS.some((f) => f.value === status)) out.status = status as StatusFacet

  const format = params.get('format')
  if (format && FORMAT_FACETS.some((f) => f.value === format)) out.format = format as FormatFacet

  const genre = params.get('genre')
  if (genre) out.genre = genre

  const sort = params.get('sort')
  if (sort && SORT_OPTIONS.some((o) => o.value === sort)) out.sort = sort as SortKey

  const density = params.get('view')
  if (density && DENSITIES.some((d) => d.value === density)) out.density = density as Density

  const franchises = params.get('stories')
  if (franchises) out.franchises = franchises.split(',').filter(Boolean)

  return out
}

function writeUrlFilters(filters: LibraryFilters) {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams()
  if (filters.query) params.set('q', filters.query)
  if (filters.status !== 'all') params.set('status', filters.status)
  if (filters.format !== 'all') params.set('format', filters.format)
  if (filters.genre !== 'all') params.set('genre', filters.genre)
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set('sort', filters.sort)
  if (filters.density !== DEFAULT_FILTERS.density) params.set('view', filters.density)
  if (filters.franchises.length) params.set('stories', filters.franchises.join(','))

  const search = params.toString()
  const url = `${window.location.pathname}${search ? `?${search}` : ''}`
  window.history.replaceState(null, '', url)
}

export function useLibraryView({
  franchises,
  syncUrl = false,
  defaults,
}: UseLibraryViewOptions): LibraryView {
  const initial = useMemo<LibraryFilters>(
    () => ({ ...DEFAULT_FILTERS, ...defaults }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const [filters, setFilters] = useState<LibraryFilters>(initial)

  // Hydrate from the URL after mount (client only), then keep it in sync.
  useEffect(() => {
    if (!syncUrl) return
    const fromUrl = readUrlFilters()
    if (Object.keys(fromUrl).length > 0) {
      setFilters((current) => ({ ...current, ...fromUrl }))
    }
  }, [syncUrl])

  useEffect(() => {
    if (syncUrl) writeUrlFilters(filters)
  }, [syncUrl, filters])

  const set = useCallback(<K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }, [])

  const reset = useCallback(() => setFilters((current) => ({ ...DEFAULT_FILTERS, density: current.density })), [])

  /** Everything except the facet being counted — so counts describe what that
   *  facet would actually do, not a set already narrowed by itself. */
  const broader = useMemo(
    () =>
      franchises.filter(
        (franchise) =>
          matchesQuery(franchise, filters.query) &&
          (filters.franchises.length === 0 || filters.franchises.includes(franchise.id)),
      ),
    [franchises, filters.query, filters.franchises],
  )

  const counts = useMemo<FacetCounts>(() => {
    // Status counts ignore the status facet (and the format facet, since format
    // is an independent axis) so each number answers "how many would I get".
    const forStatus = broader.filter((f) => matchesFormat(f, filters.format))
    const status = {} as Record<StatusFacet, number>
    for (const facet of STATUS_FACETS) {
      status[facet.value] = forStatus.filter((f) => matchesStatus(f, facet.value)).length
    }

    const forFormat = broader.filter((f) => matchesStatus(f, filters.status))
    const format = {} as Record<FormatFacet, number>
    for (const facet of FORMAT_FACETS) {
      format[facet.value] = forFormat.filter((f) => matchesFormat(f, facet.value)).length
    }

    // Genre counts respect both other facets.
    const forGenre = forFormat.filter((f) => matchesFormat(f, filters.format))
    const genreMap = new Map<string, number>()
    for (const franchise of forGenre) {
      for (const genre of franchise.genres) {
        genreMap.set(genre, (genreMap.get(genre) ?? 0) + 1)
      }
    }
    const genre = [...genreMap.entries()]
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))

    return { status, format, genre }
  }, [broader, filters.status, filters.format])

  const results = useMemo(() => {
    const matched = franchises.filter((franchise) => {
      if (!matchesQuery(franchise, filters.query)) return false
      if (!matchesStatus(franchise, filters.status)) return false
      if (!matchesFormat(franchise, filters.format)) return false
      if (filters.genre !== 'all' && !franchise.genres.includes(filters.genre)) return false
      if (filters.franchises.length > 0 && !filters.franchises.includes(franchise.id)) return false
      return true
    })
    return sortFranchises(matched, filters.sort)
  }, [franchises, filters])

  const genres = useMemo(() => {
    const present = new Set<string>()
    for (const franchise of franchises) for (const genre of franchise.genres) present.add(genre)
    return [...present].sort((a, b) => a.localeCompare(b))
  }, [franchises])

  const multiEntry = useMemo(
    () => franchises.filter((f) => f.seasons.length > 1).sort((a, b) => b.seasons.length - a.seasons.length),
    [franchises],
  )

  const isFiltered =
    filters.query.trim() !== '' ||
    filters.status !== 'all' ||
    filters.format !== 'all' ||
    filters.genre !== 'all' ||
    filters.franchises.length > 0

  const activeFacetSummary = useMemo(() => {
    const parts: string[] = []
    if (filters.status !== 'all') {
      parts.push(STATUS_FACETS.find((f) => f.value === filters.status)?.label ?? filters.status)
    }
    if (filters.format !== 'all') {
      parts.push(FORMAT_FACETS.find((f) => f.value === filters.format)?.label ?? filters.format)
    }
    if (filters.genre !== 'all') parts.push(filters.genre)
    if (filters.franchises.length === 1) {
      const only = franchises.find((f) => f.id === filters.franchises[0])
      if (only) parts.push(only.name)
    } else if (filters.franchises.length > 1) {
      parts.push(`${filters.franchises.length} stories`)
    }
    if (filters.query.trim()) parts.push(`“${filters.query.trim()}”`)
    return parts
  }, [filters, franchises])

  return {
    filters,
    set,
    reset,
    isFiltered,
    results,
    total: franchises.length,
    counts,
    genres,
    multiEntry,
    activeFacetSummary,
  }
}

/* -------------------------------------------------------------------------- */
/* Small shared helpers used by the density renderers                          */
/* -------------------------------------------------------------------------- */

/** "Season 3" style short label for the next entry, kept short for cards. */
export function nextEntryLine(franchise: Franchise, next: Season | null): string | null {
  if (!next) return null
  return next.name
}

export function entryCountLabel(franchise: Franchise): string {
  const progress = getStoryProgress(franchise)
  return `${progress.completed}/${progress.total}`
}

export function progressOf(franchise: Franchise) {
  return getStoryProgress(franchise)
}

export { getEntryStatus }
