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
    return JSON.parse(raw) as StoredLibrary
  } catch {
    return null
  }
}

export function clearLibrary() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('storydex:library-updated'))
}
