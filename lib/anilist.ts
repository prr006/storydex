// AniList GraphQL API client.
// Public, unauthenticated, CORS-enabled endpoint - no API key or server needed.

const ANILIST_API_URL = 'https://graphql.anilist.co'

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

export type AniListMediaAiringStatus =
  | 'FINISHED'
  | 'RELEASING'
  | 'NOT_YET_RELEASED'
  | 'CANCELLED'
  | 'HIATUS'

export interface AniListMedia {
  id: number
  idMal: number | null
  title: AniListTitle
  format: AniListMediaFormat | null
  episodes: number | null
  duration: number | null
  seasonYear: number | null
  season: string | null
  startDate: { year: number | null; month: number | null; day: number | null } | null
  genres: string[]
  description: string | null
  coverImage: { large: string | null; extraLarge: string | null; color: string | null } | null
  bannerImage: string | null
  siteUrl: string | null
  status: AniListMediaAiringStatus | null
  /** AniList community score, 0–100. */
  averageScore: number | null
  /** How many AniList users have this on a list. */
  popularity: number | null
  relations: { edges: AniListRelationEdge[] } | null
}

export interface AniListListEntry {
  id: number
  status?: AniListMediaStatus
  score: number
  progress: number
  media: AniListMedia
  isExpanded?: boolean
}

const MEDIA_FIELDS = `
  id
  idMal
  title {
    romaji
    english
    native
  }
  format
  status
  episodes
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
query ($userName: String, $chunk: Int, $perChunk: Int) {
  MediaListCollection(userName: $userName, type: ANIME, chunk: $chunk, perChunk: $perChunk, sort: SCORE_DESC) {
    hasNextChunk
    lists {
      name
      status
      entries {
        id
        status
        score(format: POINT_100)
        progress
        media {
          ${MEDIA_FIELDS}
        }
      }
    }
  }
}
`

const MEDIA_QUERY = `
query ($ids: [Int]) {
  Page {
    media(id_in: $ids, type: ANIME) {
      ${MEDIA_FIELDS}
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

async function graphqlRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })

  let json: any
  try {
    json = await response.json()
  } catch {
    throw new AniListError('AniList returned an unexpected response. Please try again.', response.status)
  }

  if (!response.ok || json.errors) {
    const message: string = json?.errors?.[0]?.message || 'Failed to reach AniList.'
    if (response.status === 404 || /not found/i.test(message)) {
      throw new AniListError(`AniList user not found. Double-check the username and try again.`, 404)
    }
    if (response.status === 429) {
      throw new AniListError('AniList is rate-limiting requests right now. Please wait a moment and try again.', 429)
    }
    throw new AniListError(message, response.status)
  }

  return json.data as T
}

/**
 * Fetches a user's entire anime list from AniList, paging through chunks
 * until the API reports there are no more entries left.
 */
export async function fetchAniListLibrary(username: string): Promise<AniListListEntry[]> {
  const trimmed = username.trim()
  if (!trimmed) {
    throw new AniListError('Please enter an AniList username.')
  }

  const entries: AniListListEntry[] = []
  let chunk = 1
  const perChunk = 500
  // Safety cap so a malformed API response can never spin forever.
  const maxChunks = 20

  while (chunk <= maxChunks) {
    const data = await graphqlRequest<{
      MediaListCollection: { hasNextChunk: boolean; lists: { entries: AniListListEntry[] }[] } | null
    }>(LIBRARY_QUERY, { userName: trimmed, chunk, perChunk })

    const collection = data.MediaListCollection

    if (!collection) {
      break
    }

    for (const list of collection.lists) {
      entries.push(...list.entries)
    }

    if (!collection.hasNextChunk) {
      break
    }
    chunk += 1
  }

  if (entries.length === 0) {
    // Could be an empty list or a user with a private list - either way there's
    // nothing to import, so surface a clear message instead of a blank dashboard.
    throw new AniListError(
      'No anime entries found for that username. The list may be empty or private.',
    )
  }

  return entries
}

export const FETCH_MEDIA_BATCH_SIZE = 50

export async function fetchMediaByIds(ids: number[]): Promise<AniListMedia[]> {
  const uniqueIds = Array.from(new Set(ids))
  const results: AniListMedia[] = []

  for (let i = 0; i < uniqueIds.length; i += FETCH_MEDIA_BATCH_SIZE) {
    const batch = uniqueIds.slice(i, i + FETCH_MEDIA_BATCH_SIZE)
    const data = await graphqlRequest<{
      Page: { media: AniListMedia[] } | null
    }>(MEDIA_QUERY, { ids: batch })
    
    if (data.Page?.media) {
      results.push(...data.Page.media)
    }
  }

  return results
}

// ---------------------------------------------------------------------------
// Spotlight — a small slice of real AniList data used to give pre-import
// screens genuine artwork. This is the only "content" the app renders that
// doesn't come from the user's own list, and it is always live from the API:
// nothing about it is hard-coded or bundled.
// ---------------------------------------------------------------------------

const SPOTLIGHT_QUERY = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
      id
      idMal
      title {
        romaji
        english
        native
      }
      format
      status
      episodes
      duration
      seasonYear
      season
      averageScore
      popularity
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
    }
  }
}
`

/**
 * Fetches trending anime straight from AniList.
 *
 * Deliberately returns `[]` on failure rather than throwing: every caller is a
 * decorative surface (the landing artwork wall, the empty dashboard), and a
 * screensaver must never block a page from rendering.
 */
/* --------------------------------------------------------------------------
   Discover
   --------------------------------------------------------------------------
   Three lists, one request. AniList lets several `Page` blocks be aliased in a
   single query, so Trending / This season / Not yet aired arrive together and
   the Discover page costs exactly one round trip.

   Like the spotlight, this never throws: Discover is a place to browse, and a
   failed request should leave the page standing with an honest note rather than
   an error screen.
   -------------------------------------------------------------------------- */

export type DiscoverSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'

export interface DiscoverBoards {
  trending: AniListMedia[]
  seasonal: AniListMedia[]
  upcoming: AniListMedia[]
  /** The season the `seasonal` board was queried for. */
  season: DiscoverSeason
  seasonYear: number
}

const DISCOVER_QUERY = `
query ($perPage: Int, $season: MediaSeason, $seasonYear: Int) {
  trending: Page(page: 1, perPage: $perPage) {
    media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {${MEDIA_FIELDS}}
  }
  seasonal: Page(page: 1, perPage: $perPage) {
    media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, isAdult: false) {${MEDIA_FIELDS}}
  }
  upcoming: Page(page: 1, perPage: $perPage) {
    media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, isAdult: false) {${MEDIA_FIELDS}}
  }
}
`

/** The AniList season a given month falls in. */
export function seasonOf(date = new Date()): { season: DiscoverSeason; year: number } {
  const month = date.getMonth() // 0-based
  const season: DiscoverSeason =
    month <= 2 ? 'WINTER' : month <= 5 ? 'SPRING' : month <= 8 ? 'SUMMER' : 'FALL'
  return { season, year: date.getFullYear() }
}

interface DiscoverResponse {
  trending: { media: AniListMedia[] } | null
  seasonal: { media: AniListMedia[] } | null
  upcoming: { media: AniListMedia[] } | null
}

function usable(media: AniListMedia[] | undefined): AniListMedia[] {
  return (media ?? []).filter(
    (item) => Boolean(item.coverImage?.extraLarge || item.coverImage?.large),
  )
}

export async function fetchDiscoverAnime(perPage = 12): Promise<DiscoverBoards> {
  const { season, year } = seasonOf()
  const empty: DiscoverBoards = { trending: [], seasonal: [], upcoming: [], season, seasonYear: year }

  try {
    const data = await graphqlRequest<DiscoverResponse>(DISCOVER_QUERY, {
      perPage,
      season,
      seasonYear: year,
    })
    return {
      trending: usable(data.trending?.media),
      seasonal: usable(data.seasonal?.media),
      upcoming: usable(data.upcoming?.media),
      season,
      seasonYear: year,
    }
  } catch {
    return empty
  }
}

export async function fetchSpotlightAnime(perPage = 12): Promise<AniListMedia[]> {
  try {
    const data = await graphqlRequest<{ Page: { media: AniListMedia[] } | null }>(
      SPOTLIGHT_QUERY,
      { page: 1, perPage },
    )
    return data.Page?.media?.filter((media) => Boolean(media.coverImage?.extraLarge || media.coverImage?.large)) ?? []
  } catch {
    return []
  }
}
