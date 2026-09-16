'use client'

import { useEffect, useState } from 'react'
import { fetchSpotlightAnime, type AniListMedia } from './anilist'

/* ==========================================================================
   useSpotlight
   --------------------------------------------------------------------------
   One AniList request, shared by every decorative surface on a page.

   The landing page wants artwork in two places (the hero wall and the trending
   rail) and the empty dashboard wants it too. Fetching per-component would
   triple the API calls for identical data, so the result is cached at module
   scope and the in-flight promise is shared: the second consumer to mount
   attaches to the first consumer's request instead of starting its own.

   Returns:
     null → still loading
     []   → AniList had nothing usable (network failure, rate limit, no art)
     [...] → real media, every item with a usable cover URL
   ========================================================================== */

const SPOTLIGHT_SIZE = 12

let cache: AniListMedia[] | null = null
let inflight: Promise<AniListMedia[]> | null = null

function load(): Promise<AniListMedia[]> {
  if (cache) return Promise.resolve(cache)
  inflight ??= fetchSpotlightAnime(SPOTLIGHT_SIZE).then((result) => {
    cache = result
    return result
  })
  return inflight
}

export function useSpotlight(): AniListMedia[] | null {
  const [media, setMedia] = useState<AniListMedia[] | null>(cache)

  useEffect(() => {
    if (cache) {
      setMedia(cache)
      return
    }
    let cancelled = false
    load().then((result) => {
      if (!cancelled) setMedia(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return media
}
