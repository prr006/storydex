import { fetchMediaByIds, type AniListListEntry, type AniListMedia, type AniListRelationType, type AniListRelationEdge, type MediaType } from './anilist'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
// Kept intentionally close to the original mock data shape so every existing
// component (FranchiseCard, franchise detail page) keeps working unmodified.

export interface Season {
  id: string
  name: string
  /** Which AniList media type this entry is. Always known for new imports;
   *  legacy (v1) stored entries default to ANIME. */
  mediaType: MediaType
  year: number
  completed: boolean
  /** Raw AniList list status for this entry (CURRENT, COMPLETED, DROPPED, ...) */
  status?: string
  /** Format of this entry (TV, MOVIE, OVA, MANGA, NOVEL, ONE_SHOT, ...) */
  format?: string
  /** User's score for this entry, 0 if unscored */
  score?: number
  /** Total episodes — anime entries only. */
  episodes?: number
  /** Total chapters — manga entries only. Never masquerades as episodes. */
  chapters?: number
  /** Total volumes — novel entries only. */
  volumes?: number
  /**
   * Progress in the entry's native unit:
   * episodes watched (anime) / chapters read (manga) / volumes read (novel).
   */
  progress?: number
  aniListId?: number
  posterUrl?: string
  siteUrl?: string | null
  isExpanded?: boolean
  airingStatus?: string | null
}

/** The entry's total count in its native unit (0 for films / one-shots). */
export function seasonTotal(season: Pick<Season, 'mediaType' | 'format' | 'episodes' | 'chapters' | 'volumes'>): number {
  if (season.mediaType === 'MANGA') {
    if (season.format === 'NOVEL') return season.volumes ?? 0
    if (season.format === 'ONE_SHOT') return 0
    return season.chapters ?? 0
  }
  if (season.format === 'MOVIE') return 1
  return season.episodes ?? 0
}

/** Short progress unit for this entry: EP / CH / VOL, or null (film, one-shot). */
export function unitShort(season: Pick<Season, 'mediaType' | 'format'>): 'EP' | 'CH' | 'VOL' | null {
  if (season.mediaType === 'MANGA') {
    if (season.format === 'NOVEL') return 'VOL'
    if (season.format === 'ONE_SHOT') return null
    return 'CH'
  }
  if (season.format === 'MOVIE') return null
  return 'EP'
}

/** Long human word for the entry's unit: episodes / chapters / volumes / film / one shot. */
export function unitLong(season: Pick<Season, 'mediaType' | 'format'>): string {
  const unit = unitShort(season)
  if (unit === 'CH') return 'chapters'
  if (unit === 'VOL') return 'volumes'
  if (unit === 'EP') return 'episodes'
  if (season.mediaType === 'MANGA') return season.format === 'NOVEL' ? 'volumes' : 'one shot'
  return 'film'
}

/** "24 episodes" · "120 chapters" · "12 volumes" · "film" · "one shot" */
export function totalLabel(season: Pick<Season, 'mediaType' | 'format' | 'episodes' | 'chapters' | 'volumes'>): string {
  const unit = unitShort(season)
  if (season.mediaType === 'MANGA' && season.format === 'ONE_SHOT') return 'one shot'
  if (unit === null) return season.mediaType === 'MANGA' ? 'one shot' : 'film'
  const total = seasonTotal(season)
  if (total <= 0) return unitLong(season)
  return `${total} ${unitLong(season)}`
}

/** "24 ep" · "120 ch" · "12 vol" · "film" · "one shot" */
export function totalShort(season: Pick<Season, 'mediaType' | 'format' | 'episodes' | 'chapters' | 'volumes'>): string {
  const unit = unitShort(season)
  if (season.mediaType === 'MANGA' && season.format === 'ONE_SHOT') return 'one shot'
  if (unit === null) return season.mediaType === 'MANGA' ? 'one shot' : 'film'
  const total = seasonTotal(season)
  if (total <= 0) return unitLong(season)
  return `${total} ${unit.toLowerCase()}`
}

/** "EP 12 / 24" · "CH 42 / 120" · "VOL 3 / 12" · "—" (no numbered progress) */
export function progressLabel(season: Pick<Season, 'mediaType' | 'format' | 'episodes' | 'chapters' | 'volumes' | 'progress'>): string {
  const unit = unitShort(season)
  if (!unit) return '—'
  const total = seasonTotal(season)
  if (total <= 0) return '—'
  const done = Math.min(season.progress ?? 0, total)
  return `${unit} ${done} / ${total}`
}

/** The next numbered position for a resume CTA, or null for films / one-shots. */
export function resumePosition(season: Pick<Season, 'mediaType' | 'format' | 'episodes' | 'chapters' | 'volumes' | 'progress'>): number | null {
  const total = seasonTotal(season)
  if (total <= 1 || !unitShort(season)) return null
  return Math.min((season.progress ?? 0) + 1, total)
}

/** "Resume EP 12" · "Resume CH 42" · "Resume VOL 3" · "Resume" */
export function resumeLabel(season: Pick<Season, 'mediaType' | 'format' | 'episodes' | 'chapters' | 'volumes' | 'progress'>): string {
  const pos = resumePosition(season)
  if (pos === null) return 'Resume'
  return `Resume ${unitShort(season)} ${pos}`
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
 * Groups a user's flat AniList entries (anime and manga) into
 * franchises ("stories").
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
  // Queued ids each carry their AniList media type — manga ids must never be
  // fetched through a type: ANIME query (and vice versa).
  let queued = new Map<number, MediaType>()

  const queueEdge = (edges: AniListRelationEdge[] | undefined) => {
    for (const edge of edges ?? []) {
      if (!FRANCHISE_RELATIONS.has(edge.relationType)) continue
      if (edge.node.type !== 'ANIME' && edge.node.type !== 'MANGA') continue
      if (!visitedIds.has(edge.node.id)) queued.set(edge.node.id, edge.node.type)
    }
  }

  for (const entry of entries) {
    queueEdge(entry.media.relations?.edges)
  }

  while (queued.size > 0) {
    const byType = new Map<MediaType, number[]>()
    for (const [id, type] of queued) {
      visitedIds.add(id)
      const list = byType.get(type) ?? []
      list.push(id)
      byType.set(type, list)
    }
    queued = new Map()

    for (const [type, ids] of byType) {
      const fetchedMedia = await fetchMediaByIds(ids, type)
      for (const media of fetchedMedia) {
        expandedEntries.push({
          id: 0, // Mock ID for list entry
          score: 0,
          progress: 0,
          progressVolumes: 0,
          media,
          isExpanded: true,
        })
        queueEdge(media.relations?.edges)
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
      const existingPriority = existing.status ? (STATUS_PRIORITY[existing.status] ?? 0) : 0
      const newPriority = entry.status ? (STATUS_PRIORITY[entry.status] ?? 0) : 0
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
  // Media-aware: ANIME↔ANIME, MANGA↔MANGA and cross-media edges all count,
  // but ONLY for the conservative "same story" relation types — an anime
  // adaptation of a manga (ADAPTATION/SOURCE) is deliberately NOT a merge.
  for (const entry of entries) {
    const edges = entry.media.relations?.edges ?? []
    for (const edge of edges) {
      if (!FRANCHISE_RELATIONS.has(edge.relationType)) continue
      if (edge.node.type !== 'ANIME' && edge.node.type !== 'MANGA') continue
      if (!byId.has(edge.node.id)) continue // only merge within the user's own list
      ds.union(entry.media.id, edge.node.id)
    }
  }

  // Pass 2: normalized-title fallback, grouped by media type + normalized
  // base string. The type in the key keeps a manga and its anime adaptation
  // (same title, different medium) as two distinct stories.
  const byNormalizedTitle = new Map<string, number[]>()
  for (const entry of entries) {
    const normalized = normalizeTitle(preferredTitle(entry.media.title))
    if (normalized.length < 3) continue // too short/generic to trust
    const key = `${entry.media.type}:${normalized}`
    const bucket = byNormalizedTitle.get(key)
    if (bucket) {
      bucket.push(entry.media.id)
    } else {
      byNormalizedTitle.set(key, [entry.media.id])
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
      const mediaType: MediaType = entry.media.type === 'MANGA' ? 'MANGA' : 'ANIME'
      const format = entry.media.format ?? (mediaType === 'MANGA' ? 'MANGA' : 'TV')
      // Each medium maps from its OWN AniList fields — never a substitute:
      //   ANIME    → media.episodes
      //   MANGA    → media.chapters   (NOT media.episodes)
      //   NOVEL    → media.volumes
      //   ONE_SHOT → no numbered total
      const isNovel = mediaType === 'MANGA' && format === 'NOVEL'
      return {
        id: String(entry.media.id),
        name: preferredTitle(entry.media.title),
        mediaType,
        year: entry.media.seasonYear ?? entry.media.startDate?.year ?? 0,
        completed,
        status: entry.status,
        format,
        score: entry.score ?? 0,
        episodes: mediaType === 'ANIME' ? (entry.media.episodes ?? 0) : undefined,
        chapters:
          mediaType === 'MANGA' && format === 'MANGA' ? (entry.media.chapters ?? 0) : undefined,
        volumes: isNovel ? (entry.media.volumes ?? 0) : undefined,
        // Progress is native per medium:
        //   ANIME / MANGA → list "progress" (episodes watched / chapters read)
        //   NOVEL         → list "progressVolumes" (volumes read). The novel
        //                   "progress" field is NOT a volume count, so it is
        //                   deliberately ignored for novels.
        //   ONE_SHOT      → no numbered progress.
        progress: isNovel ? (entry.progressVolumes ?? 0) : (entry.progress ?? 0),
        aniListId: entry.media.id,
        posterUrl: entry.media.coverImage?.extraLarge || entry.media.coverImage?.large || '/placeholder.svg',
        siteUrl: entry.media.siteUrl,
        isExpanded: entry.isExpanded,
        airingStatus: entry.media.status?.status ?? null,
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

// ---------------------------------------------------------------------------
// Media-scope presentation views (ALL / ANIME / MANGA)
// ---------------------------------------------------------------------------
// The dashboard's Anime/Manga filter is a PRESENTATION concern, not a data
// one. The stored library keeps every franchise complete (anime + manga
// seasons together); this derives a display subset for the active scope and
// recomputes the fields the UI reads from it. It never mutates the input.

/** Which medium the current dashboard view shows. */
export type MediaScope = 'ALL' | 'ANIME' | 'MANGA'

/**
 * Derived view of the library for a media scope:
 *  - ALL   → every season of every franchise (the stored library, as-is)
 *  - ANIME → only seasons where mediaType === 'ANIME'
 *  - MANGA → only seasons where mediaType === 'MANGA'
 *
 * Franchises with no season in the scoped medium are excluded entirely.
 * `totalSeasons`, `completedSeasons` and `nextToWatch` are recomputed from
 * the subset so every derived UI (index glyph, reel route, resume CTA,
 * sorting, progress and completion math) operates on the scoped seasons —
 * never on a hidden season of the other medium.
 *
 * The original franchises are never split, mutated or re-stored; the
 * franchise detail page still renders the complete story from the stored
 * library.
 */
export function applyMediaScope(franchises: Franchise[], scope: MediaScope): Franchise[] {
  if (scope === 'ALL') return franchises
  const type = scope // 'ANIME' | 'MANGA'
  const result: Franchise[] = []
  for (const franchise of franchises) {
    const seasons = franchise.seasons.filter((s) => s.mediaType === type)
    if (seasons.length === 0) continue
    const completedSeasons = seasons.filter((s) => s.completed).length
    result.push({
      ...franchise,
      seasons,
      totalSeasons: seasons.length,
      completedSeasons,
      nextToWatch: seasons.find((s) => !s.completed && s.status !== 'DROPPED') || null,
    })
  }
  return result
}

/**
 * Short editorial line for hero compositions. Derived strictly from the
 * franchise's own stored data (never invented): the first sentence of the
 * description, truncated at a word boundary. When no description exists it
 * falls back to a plain fact line built from the seasons.
 */
export function heroSummary(franchise: Franchise, maxLen = 140): string {
  const raw = (franchise.description || '').replace(/\s+/g, ' ').trim()
  const meaningful = raw && raw !== 'No description available.' ? raw : ''
  if (!meaningful) {
    const movements = franchise.seasons.length
    const firstYear = franchise.seasons[0]?.year
    const yearBit = firstYear ? `${firstYear} · ` : ''
    return `${yearBit}${movements} recorded ${movements === 1 ? 'movement' : 'movements'} on one continuous route`
  }
  const first = (meaningful.match(/^[^.!?]+[.!?]*/) || [meaningful])[0].trim()
  if (first.length <= maxLen) return first
  return first.slice(0, maxLen).replace(/\s+\S*$/, '') + '…'
}
