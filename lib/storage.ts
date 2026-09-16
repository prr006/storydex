'use client'

import type { Franchise } from './franchise'

// No auth, no Supabase, no database - the imported library just lives in the
// browser's localStorage so it survives navigation between the dashboard and
// franchise detail pages. Re-importing simply overwrites it.

const STORAGE_KEY = 'storydex:library:v1'

export interface StoredLibrary {
  username: string
  importedAt: string
  franchises: Franchise[]
}

export function saveLibrary(username: string, franchises: Franchise[]): StoredLibrary {
  const data: StoredLibrary = {
    username,
    importedAt: new Date().toISOString(),
    franchises,
  }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    window.dispatchEvent(new Event('storydex:library-updated'))
  }
  return data
}

export function loadLibrary(): StoredLibrary | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return sanitize(JSON.parse(raw) as StoredLibrary)
  } catch {
    return null
  }
}

/**
 * Drops any artwork reference that isn't a real remote URL.
 *
 * StoryDex renders only AniList CDN artwork, so a stored library that predates
 * that rule (or was written by an older build) could still carry a local asset
 * path — a file this app no longer ships. Rather than render a broken image,
 * the URL is blanked and the poster falls back to its designed placeholder.
 */
function sanitize(library: StoredLibrary): StoredLibrary {
  const isRemote = (src?: string | null) => Boolean(src && /^https?:\/\//i.test(src))

  return {
    ...library,
    franchises: (library.franchises ?? []).map((franchise) => ({
      ...franchise,
      posterUrl: isRemote(franchise.posterUrl) ? franchise.posterUrl : '',
      bannerUrl: isRemote(franchise.bannerUrl) ? franchise.bannerUrl : null,
      seasons: (franchise.seasons ?? []).map((season) => ({
        ...season,
        posterUrl: isRemote(season.posterUrl) ? season.posterUrl : '',
      })),
    })),
  }
}

export function clearLibrary() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('storydex:library-updated'))
}
