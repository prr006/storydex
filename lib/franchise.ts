import { fetchMediaByIds, type AniListListEntry, type AniListMedia, type AniListRelationType } from './anilist'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
// Kept intentionally close to the original mock data shape so every existing
// component (FranchiseCard, franchise detail page) keeps working unmodified.

export interface Season {
  id: string
  name: string
  episodes: number
  year: number
  completed: boolean
  /** Raw AniList list status for this entry (CURRENT, COMPLETED, DROPPED, ...) */
  status?: string
  /** Format of this entry (TV, MOVIE, OVA, ...) */
  format?: string
  /** User's score for this entry, 0 if unscored */
  score?: number
  /** Episodes watched so far */
  progress?: number
  aniListId?: number
  posterUrl?: string
  siteUrl?: string | null
  isExpanded?: boolean
  airingStatus?: string | null
}

export interface Franchise {
  id: string
  name: string
  posterUrl: string
  bannerUrl?: string | null
  totalSeasons: number
  completedSeasons: number
  genres: string[]
  description: string
  seasons: Season[]
  aniListId?: number
  nextToWatch?: Season | null
}

// ---------------------------------------------------------------------------
// Relation-based grouping
// ---------------------------------------------------------------------------
// Only these relation types indicate "this is the same overarching story",
// which is exactly what StoryDex groups on. Types like SPIN_OFF, SIDE_STORY,
// CHARACTER, SUMMARY, ADAPTATION, SOURCE, COMPILATION, OTHER are deliberately
// excluded by default - they link *related* media, not necessarily the same
// continuous story (e.g. a spin-off is its own story). Extend this set if a
// different notion of "same franchise" is ever wanted.
const FRANCHISE_RELATIONS: ReadonlySet<AniListRelationType> = new Set([
  'PREQUEL',
  'SEQUEL',
  'PARENT',
  'ALTERNATIVE',
])

// ---------------------------------------------------------------------------
// Title-normalization fallback
// ---------------------------------------------------------------------------
// Used only when relation edges don't connect two entries the user actually
// has in their list (e.g. incomplete relation graphs on AniList). This never
// truncates to a "franchise prefix" - it strips known season/part patterns
// and compares the *whole* remaining title, which is what keeps titles like
// "Re:Zero", "Re:Creators" and "Re:Monster" from colliding: their normalized
// bases ("re zero starting life in another world", "re creators",
// "re monster") are simply different strings.
const SEASON_PATTERNS: RegExp[] = [
  /\bseason\s*\d+\b/g,
  /\b\d+(st|nd|rd|th)\s*season\b/g,
  /\bpart\s*\d+\b/g,
  /\bcour\s*\d+\b/g,
  /\bfinal season\b/g,
  /\bthe final season\b/g,
  /\bthe movie\b/g,
  /\bmovie\s*\d*\b/g,
  /\bova\b/g,
  /\bspecial\b/g,
  /\b(2nd|3rd|4th|5th|6th|7th|8th|9th)\b/g,
  /\b(ii|iii|iv|v|vi|vii|viii|ix|x)\b/g,
  /\b\d+\b/g,
]

export function normalizeTitle(rawTitle: string): string {
  let value = rawTitle.toLowerCase()

  // Unify punctuation to spaces (colons, dashes, apostrophes, etc.) so
  // formatting differences between seasons don't block a match, while
  // leaving the actual words - including anything after a colon - intact.
  value = value.replace(/[^a-z0-9]+/g, ' ')

  for (const pattern of SEASON_PATTERNS) {
    value = value.replace(pattern, ' ')
  }

  value = value.replace(/\s+/g, ' ').trim()
  return value
}

function preferredTitle(title: AniListMedia['title']): string {
  return title.english || title.romaji || title.native || 'Untitled'
}

// ---------------------------------------------------------------------------
// Union-Find (disjoint set) used to merge entries into franchises
// ---------------------------------------------------------------------------
class DisjointSet {
  private parent = new Map<number, number>()

  add(id: number) {
    if (!this.parent.has(id)) this.parent.set(id, id)
  }

  find(id: number): number {
    const parent = this.parent.get(id)
    if (parent === undefined) {
      this.parent.set(id, id)
      return id
    }
    if (parent !== id) {
      const root = this.find(parent)
      this.parent.set(id, root)
      return root
    }
    return id
  }

  union(a: number, b: number) {
    this.add(a)
    this.add(b)
    const rootA = this.find(a)
    const rootB = this.find(b)
    if (rootA !== rootB) this.parent.set(rootA, rootB)
  }
}

/**
 * Groups a user's flat AniList anime entries into franchises ("stories").
 *
 * Strategy:
 * 1. Connect entries that reference each other via a "same story" relation
 *    edge (PREQUEL/SEQUEL/PARENT/ALTERNATIVE) - the strongest signal.
 * 2. As a fallback, connect entries whose normalized titles match exactly -
 *    this catches cases where AniList's relation graph is incomplete for a
 *    given entry, without merging genuinely different shows that merely
 *    share a prefix (e.g. Re:Zero vs Re:Creators vs Re:Monster).
 * 3. Collapse each resulting group into a single Franchise, using the
 *    earliest entry (by release year, then AniList id) as the "primary"
 *    entry for name/poster/banner/description.
 */
/**
 * Expands a user's library by fetching missing media in their franchises.
 */
export async function expandFranchises(entries: AniListListEntry[]): Promise<AniListListEntry[]> {
  const expandedEntries = [...entries]
  const visitedIds = new Set<number>(entries.map((e) => e.media.id))
  let queuedIds = new Set<number>()

  for (const entry of entries) {
    const edges = entry.media.relations?.edges ?? []
    for (const edge of edges) {
      if (!FRANCHISE_RELATIONS.has(edge.relationType) || edge.node.type !== 'ANIME') continue
      if (!visitedIds.has(edge.node.id)) {
        queuedIds.add(edge.node.id)
      }
    }
  }

  while (queuedIds.size > 0) {
    const idsToFetch = Array.from(queuedIds)
    queuedIds = new Set<number>()

    for (const id of idsToFetch) {
      visitedIds.add(id)
    }

    const fetchedMedia = await fetchMediaByIds(idsToFetch)

    for (const media of fetchedMedia) {
      expandedEntries.push({
        id: 0, // Mock ID for list entry
        score: 0,
        progress: 0,
        media,
        isExpanded: true,
      })

      const edges = media.relations?.edges ?? []
      for (const edge of edges) {
        if (!FRANCHISE_RELATIONS.has(edge.relationType) || edge.node.type !== 'ANIME') continue
        if (!visitedIds.has(edge.node.id)) {
          queuedIds.add(edge.node.id)
        }
      }
    }
  }

  return expandedEntries
}

export function groupFranchises(rawEntries: AniListListEntry[]): Franchise[] {
  // ── Pass 0: deduplicate input by AniList media ID ────────────────────────
  // AniList's API can return the same media.id in multiple lists
  // (e.g. once in COMPLETED and once in PLANNING). We keep only the
  // entry with the highest status-priority so the more informative one
  // wins: COMPLETED > CURRENT > REPEATING > PAUSED > DROPPED > PLANNING.
  const STATUS_PRIORITY: Record<string, number> = {
    COMPLETED: 6,
    REPEATING: 5,
    CURRENT: 4,
    PAUSED: 3,
    DROPPED: 2,
    PLANNING: 1,
  }
  const deduped = new Map<number, AniListListEntry>()
  for (const entry of rawEntries) {
    const existing = deduped.get(entry.media.id)
    if (!existing) {
      deduped.set(entry.media.id, entry)
    } else {
      const existingPriority = STATUS_PRIORITY[existing.status] ?? 0
      const newPriority = STATUS_PRIORITY[entry.status] ?? 0
      if (newPriority > existingPriority) {
        deduped.set(entry.media.id, entry)
      }
    }
  }
  const entries = Array.from(deduped.values())

  const byId = new Map<number, AniListListEntry>()
  for (const entry of entries) {
    byId.set(entry.media.id, entry)
  }

  const ds = new DisjointSet()
  for (const id of byId.keys()) ds.add(id)

  // Pass 1: relation edges between entries the user actually owns.
  for (const entry of entries) {
    const edges = entry.media.relations?.edges ?? []
    for (const edge of edges) {
      if (!FRANCHISE_RELATIONS.has(edge.relationType)) continue
      if (edge.node.type !== 'ANIME') continue
      if (!byId.has(edge.node.id)) continue // only merge within the user's own list
      ds.union(entry.media.id, edge.node.id)
    }
  }

  // Pass 2: normalized-title fallback, grouped by normalized base string.
  const byNormalizedTitle = new Map<string, number[]>()
  for (const entry of entries) {
    const normalized = normalizeTitle(preferredTitle(entry.media.title))
    if (normalized.length < 3) continue // too short/generic to trust
    const bucket = byNormalizedTitle.get(normalized)
    if (bucket) {
      bucket.push(entry.media.id)
    } else {
      byNormalizedTitle.set(normalized, [entry.media.id])
    }
  }
  for (const ids of byNormalizedTitle.values()) {
    for (let i = 1; i < ids.length; i++) {
      ds.union(ids[0], ids[i])
    }
  }

  // Collect entries per root.
  const groups = new Map<number, AniListListEntry[]>()
  for (const entry of entries) {
    const root = ds.find(entry.media.id)
    const group = groups.get(root)
    if (group) {
      group.push(entry)
    } else {
      groups.set(root, [entry])
    }
  }

  const franchises: Franchise[] = []

  for (const groupEntries of groups.values()) {
    // ── Final dedup pass within each group ───────────────────────────────
    // The DisjointSet merge is sound, but defensive dedup here ensures no
    // duplicate season rows survive even if the same media.id ends up in a
    // group via multiple relation edges (which can happen in complex graphs
    // like Steel Ball Run or Fate/kaleid liner).
    const visitedIds = new Set<number>()
    const uniqueGroupEntries = groupEntries.filter((e) => {
      if (visitedIds.has(e.media.id)) return false
      visitedIds.add(e.media.id)
      return true
    })

    // Sort chronologically for a sensible timeline (undated entries last).
    const sorted = [...uniqueGroupEntries].sort((a, b) => {
      const yearA = a.media.seasonYear ?? a.media.startDate?.year ?? Infinity
      const yearB = b.media.seasonYear ?? b.media.startDate?.year ?? Infinity
      if (yearA !== yearB) return yearA - yearB
      return a.media.id - b.media.id
    })


    const primary = sorted[0]

    const seasons: Season[] = sorted.map((entry) => {
      const completed = entry.status === 'COMPLETED' || entry.status === 'REPEATING'
      return {
        id: String(entry.media.id),
        name: preferredTitle(entry.media.title),
        episodes: entry.media.episodes ?? entry.progress ?? 0,
        year: entry.media.seasonYear ?? entry.media.startDate?.year ?? 0,
        completed,
        status: entry.status,
        format: entry.media.format ?? 'TV',
        score: entry.score ?? 0,
        progress: entry.progress ?? 0,
        aniListId: entry.media.id,
        posterUrl: entry.media.coverImage?.extraLarge || entry.media.coverImage?.large || '/placeholder.svg',
        siteUrl: entry.media.siteUrl,
        isExpanded: entry.isExpanded,
        airingStatus: entry.media.status,
      }
    })

    const genreSet = new Set<string>()
    for (const entry of sorted) {
      for (const genre of entry.media.genres) genreSet.add(genre)
    }

    const description = (primary.media.description || sorted.find((e) => e.media.description)?.media.description || '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .trim()

    const completedSeasons = seasons.filter((s) => s.completed).length

    franchises.push({
      id: String(primary.media.id),
      name: preferredTitle(primary.media.title),
      posterUrl: primary.media.coverImage?.extraLarge || primary.media.coverImage?.large || '/placeholder.svg',
      bannerUrl: sorted.find((e) => e.media.bannerImage)?.media.bannerImage ?? null,
      totalSeasons: seasons.length,
      completedSeasons,
      genres: Array.from(genreSet),
      description: description || 'No description available.',
      seasons,
      aniListId: primary.media.id,
      nextToWatch: seasons.find((s) => !s.completed && s.status !== 'DROPPED') || null,
    })
  }

  // Most-complete / most-recently-relevant franchises first.
  franchises.sort((a, b) => b.totalSeasons - a.totalSeasons || a.name.localeCompare(b.name))

  return franchises
}
