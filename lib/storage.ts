'use client'

import type { Franchise, Season } from './franchise'

// No auth, no Supabase, no database — the imported library just lives in the
// browser's localStorage so it survives navigation between the dashboard and
// franchise detail pages.
//
// v1 (storydex:library:v1) stored anime-only libraries without a mediaType on
// each season. v2 adds mediaType (+ chapters/volumes). On first read after an
// upgrade, a v1 library is migrated in place: every season defaults to
// mediaType 'ANIME' — safe, because v1 could only contain anime — and is
// re-saved under the v2 key. Nothing is dropped, nothing is forced to
// re-import.

const STORAGE_KEY = 'storydex:library:v2'
const LEGACY_KEY = 'storydex:library:v1'

export interface StoredLibrary {
  username: string
  importedAt: string
  franchises: Franchise[]
}

function migrateV1(data: unknown): StoredLibrary | null {
  try {
    const v1 = data as { username?: string; importedAt?: string; franchises?: Franchise[] }
    if (!Array.isArray(v1?.franchises)) return null
    const franchises: Franchise[] = v1.franchises.map((franchise) => ({
      ...franchise,
      seasons: (franchise.seasons ?? []).map((season) => ({
        ...season,
        mediaType: (season as Season).mediaType ?? 'ANIME',
      })) as Season[],
    }))
    return {
      username: v1.username ?? '',
      importedAt: v1.importedAt ?? new Date().toISOString(),
      franchises,
    }
  } catch {
    return null
  }
}

export function saveLibrary(username: string, franchises: Franchise[]): StoredLibrary {
  const data: StoredLibrary = {
    username,
    importedAt: new Date().toISOString(),
    franchises,
  }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      // A new v2 write makes any leftover v1 data stale — clear it so the
      // two keys can never disagree about whose library is stored.
      window.localStorage.removeItem(LEGACY_KEY)
    } catch {
      // Storage full/blocked — importing still works for this session.
    }
    window.dispatchEvent(new Event('storydex:library-updated'))
  }
  return data
}

export function loadLibrary(): StoredLibrary | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StoredLibrary
  } catch {
    return null
  }

  // First read after an upgrade: migrate a v1 anime-only library.
  try {
    const legacyRaw = window.localStorage.getItem(LEGACY_KEY)
    if (!legacyRaw) return null
    const migrated = migrateV1(JSON.parse(legacyRaw))
    if (migrated && migrated.franchises.length > 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      window.localStorage.removeItem(LEGACY_KEY)
    }
    return migrated
  } catch {
    return null
  }
}

export function clearLibrary() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
  window.localStorage.removeItem(LEGACY_KEY)
  window.dispatchEvent(new Event('storydex:library-updated'))
}
