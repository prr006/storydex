// AniList GraphQL API client.
// Public, unauthenticated, CORS-enabled endpoint — no API key or server needed.
//
// AniList models its catalogue as Media of two types — ANIME and MANGA — and
// every list/query must say which type it means. Manga formats include
// MANGA, NOVEL and ONE_SHOT. We never assume type: ANIME retrieves "everything".

import type { Franchise } from './franchise'

const ANILIST_API_URL = 'https://graphql.anilist.co'

/** The two AniList media types. */
export type MediaType = 'ANIME' | 'MANGA'

/** Formats that belong to the MANGA media type. */
export const MANGA_FORMATS = new Set(['MANGA', 'NOVEL', 'ONE_SHOT'])

export interface AniListTitle {
  romaji: string | null
  english: string | null
  native: string | null
}

export type AniListRelationType =
  | 'ADAPTATION'
  | 'PREQUEL'
  | 'SEQUEL'
  | 'PARENT'
  | 'SIDE_STORY'
  | 'CHARACTER'
  | 'SUMMARY'
  | 'ALTERNATIVE'
  | 'SPIN_OFF'
  | 'OTHER'
  | 'SOURCE'
  | 'COMPILATION'
  | 'CONTAINS'

export type AniListMediaFormat =
  | 'TV'
  | 'TV_SHORT'
  | 'MOVIE'
  | 'SPECIAL'
  | 'OVA'
  | 'ONA'
  | 'MUSIC'
  | 'MANGA'
  | 'NOVEL'
  | 'ONE_SHOT'

export type AniListMediaStatus =
  | 'CURRENT'
  | 'PLANNING'
  | 'COMPLETED'
  | 'DROPPED'
  | 'PAUSED'
  | 'REPEATING'

export interface AniListRelationNode {
  id: number
  title: AniListTitle
  format: AniListMediaFormat | null
  type: 'ANIME' | 'MANGA'
}

export interface AniListRelationEdge {
  relationType: AniListRelationType
  node: AniListRelationNode
}

export interface AniListMediaAiringStatus {
  status: 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS'
}

export interface AniListMedia {
  id: number
  idMal: number | null
  type: MediaType
  title: AniListTitle
  format: AniListMediaFormat | null
  /** Total episodes — anime entries only (null for manga). */
  episodes: number | null
  /** Total chapters — manga entries only (null for anime). */
  chapters: number | null
  /** Total volumes — novel entries only. */
  volumes: number | null
  duration: number | null
  seasonYear: number | null
  season: string | null
  startDate: { year: number | null; month: number | null; day: number | null } | null
  genres: string[]
  description: string | null
  coverImage: { large: string | null; extraLarge: string | null; color: string | null } | null
  bannerImage: string | null
  siteUrl: string | null
  /** Airing/publication status of the media itself. */
  status: AniListMediaAiringStatus | null
  relations: { edges: AniListRelationEdge[] } | null
}

export interface AniListListEntry {
  id: number
  status?: AniListMediaStatus
  score: number
  /**
   * AniList's `progress` — the consumed count in the medium's primary unit:
   * anime → episodes watched, manga → chapters read. For NOVEL entries this
   * is NOT the volume count; use `progressVolumes` instead.
   */
  progress: number
  /**
   * AniList's `progressVolumes` — volumes read (NOVEL entries only).
   */
  progressVolumes: number
  media: AniListMedia
}

export interface AniListSearchResult {
  id: number
  type: MediaType
  title: AniListTitle
  format: AniListMediaFormat | null
  seasonYear: number | null
  /** Anime total (null for manga). */
  episodes: number | null
  /** Manga total (null for anime) — never substitute `episodes`. */
  chapters: number | null
  /** Novel total. */
  volumes: number | null
  coverImage: { large: string | null; extraLarge: string | null } | null
  bannerImage: string | null
  description: string | null
}

const MEDIA_FIELDS = `
  id
  idMal
  type
  title {
    romaji
    english
    native
  }
  format
  status
  episodes
  chapters
  volumes
  duration
  seasonYear
  season
  startDate {
    year
    month
    day
  }
  genres
  description(asHtml: false)
  coverImage {
    large
    extraLarge
    color
  }
  bannerImage
  siteUrl
  relations {
    edges {
      relationType
      node {
        id
        type
        format
        title {
          romaji
          english
          native
        }
      }
    }
  }
`

const LIBRARY_QUERY = `
query ($userName: String, $type: MediaType!, $chunk: Int, $perChunk: Int) {
  MediaListCollection(userName: $userName, type: $type, chunk: $chunk, perChunk: $perChunk, sort: SCORE_DESC) {
    hasNextChunk
    lists {
      name
      status
      entries {
        id
        status
        score(format: POINT_100)
        progress
        progressVolumes
        media {
          ${MEDIA_FIELDS}
        }
      }
    }
  }
}
`

const MEDIA_QUERY = `
query ($ids: [Int], $type: MediaType!) {
  Page {
    media(id_in: $ids, type: $type) {
      ${MEDIA_FIELDS}
    }
  }
}
`

const SEARCH_QUERY = `
query ($search: String, $type: MediaType!) {
  Page(perPage: 24) {
    media(search: $search, type: $type, sort: POPULARITY_DESC) {
      id
      type
      title {
        romaji
        english
        native
      }
      format
      seasonYear
      episodes
      chapters
      volumes
      coverImage {
        large
        extraLarge
      }
      bannerImage
      description(asHtml: false)
    }
  }
}
`

export class AniListError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'AniListError'
    this.status = status
  }
}

async function graphqlRequest<T>(query: string, variables: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new AniListError('Could not reach AniList. Check your connection and try again.')
  }

  let json: any
  try {
    json = await response.json()
  } catch {
    throw new AniListError('AniList returned an unexpected response. Please try again.', response.status)
  }

  if (!response.ok || json.errors) {
    const message: string = json?.errors?.[0]?.message || 'Failed to reach AniList.'
    if (response.status === 404 || /not found|no user/i.test(message)) {
      throw new AniListError(`AniList user not found. Double-check the username and try again.`, 404)
    }
    if (response.status === 429) {
      throw new AniListError('AniList is rate-limiting requests right now. Please wait a moment and try again.', 429)
    }
    if (/private|not public|unauthorized|forbidden/i.test(message)) {
      throw new AniListError(
        "Couldn't access this AniList user's lists. Check the username, or that the list is public.",
        response.status,
      )
    }
    throw new AniListError(message, response.status)
  }

  return json.data as T
}

/* -------------------------------------------------------------------------- */
/* Whole-profile import — BOTH media types, fetched separately               */
/* -------------------------------------------------------------------------- */

export interface ProfileImportResult {
  username: string
  anime: AniListListEntry[]
  manga: AniListListEntry[]
  /** Non-fatal notes, e.g. "This user's manga list is empty." */
  warnings: string[]
}

export type ProfileImportProgress = (type: MediaType, entriesSoFar: number) => void

const FETCH_CHUNK_SIZE = 500
const MAX_CHUNKS = 20

/** Wire shape of a MediaListCollection entry — both counters are nullable Int. */
type RawListEntry = Omit<AniListListEntry, 'progress' | 'progressVolumes'> & {
  progress: number | null
  progressVolumes: number | null
}

async function fetchListForType(
  username: string,
  type: MediaType,
): Promise<AniListListEntry[]> {
  const entries: AniListListEntry[] = []
  let chunk = 1

  while (chunk <= MAX_CHUNKS) {
    const data = await graphqlRequest<{
      MediaListCollection: { hasNextChunk: boolean; lists: { entries: RawListEntry[] }[] } | null
    }>(LIBRARY_QUERY, { userName: username, type, chunk, perChunk: FETCH_CHUNK_SIZE })

    const collection = data.MediaListCollection
    if (!collection) break

    for (const list of collection.lists) {
      for (const raw of list.entries) {
        // Sensible defaults when AniList returns null.
        entries.push({
          ...raw,
          progress: raw.progress ?? 0,
          progressVolumes: raw.progressVolumes ?? 0,
        })
      }
    }
    if (!collection.hasNextChunk) break
    chunk += 1
  }

  return entries
}

/**
 * Imports a whole public AniList profile — the anime list AND the manga list,
 * fetched separately (MediaListCollection requires a media type).
 *
 * Outcome rules:
 * - user not found / lists private  → AniListError (say what actually happened)
 * - one side empty                  → import the other side + a warning
 * - both sides empty                → AniListError("no anime or manga entries")
 */
export async function fetchAniListLibrary(
  username: string,
  onProgress?: ProfileImportProgress,
): Promise<ProfileImportResult> {
  const trimmed = username.trim()
  if (!trimmed) {
    throw new AniListError('Please enter an AniList username.')
  }

  const warnings: string[] = []

  const anime = await fetchListForType(trimmed, 'ANIME')
  onProgress?.('ANIME', anime.length)

  let manga: AniListListEntry[] = []
  try {
    manga = await fetchListForType(trimmed, 'MANGA')
  } catch (err) {
    // A private/missing manga list must not destroy a perfectly good anime list.
    if (anime.length === 0) throw err
    if (err instanceof AniListError) {
      warnings.push(err.message)
    } else {
      warnings.push("Couldn't read this user's manga list.")
    }
  }
  onProgress?.('MANGA', manga.length)

  if (anime.length === 0 && manga.length === 0) {
    throw new AniListError(
      `This AniList user has no anime or manga entries in their lists.`,
    )
  }
  if (anime.length === 0) warnings.push("This user's anime list is empty — imported manga only.")
  if (manga.length === 0) warnings.push("This user's manga list is empty — imported anime only.")

  return { username: trimmed, anime, manga, warnings }
}

/* -------------------------------------------------------------------------- */
/* Media by ID — type is meaningful in AniList, so batch per media type      */
/* -------------------------------------------------------------------------- */

export const FETCH_MEDIA_BATCH_SIZE = 50

/**
 * Fetches media of ONE AniList type. Sending manga ids through a
 * `type: ANIME` query silently returns nothing — callers must batch by type.
 */
export async function fetchMediaByIds(ids: number[], type: MediaType): Promise<AniListMedia[]> {
  const uniqueIds = Array.from(new Set(ids))
  const results: AniListMedia[] = []

  for (let i = 0; i < uniqueIds.length; i += FETCH_MEDIA_BATCH_SIZE) {
    const batch = uniqueIds.slice(i, i + FETCH_MEDIA_BATCH_SIZE)
    const data = await graphqlRequest<{ Page: { media: AniListMedia[] } | null }>(
      MEDIA_QUERY,
      { ids: batch, type },
    )
    if (data.Page?.media) {
      results.push(...data.Page.media)
    }
  }

  return results
}

/** Fetches a mix of anime and manga ids, batching each type separately. */
export async function fetchMixedMediaByIds(
  idsWithType: { id: number; type: MediaType }[],
): Promise<AniListMedia[]> {
  const byType = new Map<MediaType, number[]>()
  for (const { id, type } of idsWithType) {
    const list = byType.get(type) ?? []
    list.push(id)
    byType.set(type, list)
  }
  const results: AniListMedia[] = []
  for (const [type, ids] of byType) {
    results.push(...(await fetchMediaByIds(ids, type)))
  }
  return results
}

/* -------------------------------------------------------------------------- */
/* Search — per media type; "all" merges two real queries                    */
/* -------------------------------------------------------------------------- */

export async function searchAniList(
  query: string,
  type: MediaType,
  signal?: AbortSignal,
): Promise<AniListSearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed) {
    throw new AniListError('Type a title to search AniList.')
  }
  const data = await graphqlRequest<{ Page: { media: AniListSearchResult[] } | null }>(
    SEARCH_QUERY,
    { search: trimmed, type },
    signal,
  )
  return data.Page?.media ?? []
}

/**
 * "All" search: two separate AniList queries (one per media type), merged
 * and deduplicated by AniList id. AniList has a single id space, so the same
 * title existing as both anime and manga can never overwrite itself — each
 * is a distinct, selectable entry.
 */
export async function searchAniListAll(
  query: string,
  signal?: AbortSignal,
): Promise<AniListSearchResult[]> {
  const [anime, manga] = await Promise.all([
    searchAniList(query, 'ANIME', signal),
    searchAniList(query, 'MANGA', signal),
  ])
  const seen = new Set<number>()
  const merged: AniListSearchResult[] = []
  // Interleave so both media kinds are visible in one list.
  const max = Math.max(anime.length, manga.length)
  for (let i = 0; i < max; i++) {
    for (const item of [anime[i], manga[i]]) {
      if (item && !seen.has(item.id)) {
        seen.add(item.id)
        merged.push(item)
      }
    }
  }
  return merged
}

/**
 * Wraps the EXACT media the user selected ("Find a story") as library
 * entries so they flow through the same grouping pipeline as a profile
 * import. Only the given media become entries — nothing related is fetched
 * or added. New entries are marked CURRENT with no progress, which anchors
 * "you are here" at the start.
 */
export function entriesFromMedia(media: AniListMedia[]): AniListListEntry[] {
  return media.map((m) => ({
    id: 0,
    status: 'CURRENT',
    score: 0,
    progress: 0,
    progressVolumes: 0,
    media: m,
  }))
}

/**
 * Merges newly imported franchises into an existing stored library
 * (single-story "Find a story" flow). New franchises are appended; a
 * franchise that already exists is merged PER SEASON by AniList id:
 * - seasons already in the library keep their recorded data;
 * - a season previously DISCOVERED (inUserList=false) that the user now
 *   explicitly imported becomes inUserList=true with the fresh entry data —
 *   explicit selection is the only thing that grants provenance;
 * - newly discovered seasons are added as inUserList=false.
 *
 * Whole-profile imports do NOT use this — they replace the stored library.
 */
export function mergeFranchises(existing: Franchise[], additions: Franchise[]): Franchise[] {
  const merged = [...existing]
  const indexById = new Map(merged.map((f, i) => [f.id, i]))
  const seasonIdsOf = (franchise: Franchise) => new Set(franchise.seasons.map((season) => season.id))

  for (const addition of additions) {
    let idx = indexById.get(addition.id)
    if (idx === undefined) {
      // Same-story detection: franchise ids are pinned to each import's
      // primary user entry, so two imports of the SAME story can carry
      // different ids. Sharing even one AniList media id means the same
      // story (AniList ids are unique per work) — merge, don't duplicate.
      const addSeasonIds = seasonIdsOf(addition)
      for (let i = 0; i < merged.length; i++) {
        const currentIds = seasonIdsOf(merged[i])
        let overlaps = false
        for (const sid of addSeasonIds) {
          if (currentIds.has(sid)) { overlaps = true; break }
        }
        if (overlaps) { idx = i; break }
      }
    }
    if (idx === undefined) {
      merged.push(addition)
      indexById.set(addition.id, merged.length - 1)
      continue
    }
    const current = merged[idx]
    const bySeasonId = new Map(current.seasons.map((season, i) => [season.id, i]))
    const seasons = [...current.seasons]
    let changed = false

    for (const incoming of addition.seasons) {
      const prevIdx = bySeasonId.get(incoming.id)
      if (prevIdx === undefined) {
        seasons.push(incoming)
        bySeasonId.set(incoming.id, seasons.length - 1)
        changed = true
      } else if (!seasons[prevIdx].inUserList && incoming.inUserList) {
        // Explicit user import promotes a discovered entry; everything else
        // (poster, totals) comes from the fresh entry — the media is the
        // same AniList work.
        seasons[prevIdx] = { ...incoming, inUserList: true }
        changed = true
      }
    }

    if (!changed) continue

    // Keep the existing franchise's identity (its primary is a user entry)
    // and re-derive the user-owned fields from the merged seasons.
    const userSeasons = seasons.filter((season) => season.inUserList)
    merged[idx] = {
      ...current,
      seasons,
      totalSeasons: userSeasons.length,
      completedSeasons: userSeasons.filter((season) => season.completed).length,
      nextToWatch: userSeasons.find((season) => !season.completed && season.status !== 'DROPPED') || null,
    }
  }

  return merged
}
