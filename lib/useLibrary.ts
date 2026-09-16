'use client'

import { useEffect, useState, useCallback } from 'react'
import { loadLibrary, type StoredLibrary } from './storage'
import type { Franchise } from './franchise'

export interface LibraryState {
  franchises: Franchise[]
  username: string | null
  /** True once a real AniList import has been stored in this browser. */
  isImported: boolean
  /** True while the stored library is being read on mount. */
  loading: boolean
}

/**
 * Reads the imported AniList library from localStorage on mount and keeps it in
 * sync with future imports (in this tab or another).
 *
 * There is deliberately no bundled sample data. Every franchise rendered by the
 * app comes from a real AniList list that the user imported, which means the
 * empty state is a genuine state the UI has to handle well rather than a
 * placeholder to be papered over. Screens that would otherwise look bare before
 * an import (the welcome page, the empty dashboard) pull live trending artwork
 * from AniList instead — real data, no bundled assets.
 */
export function useLibrary(): LibraryState {
  const [state, setState] = useState<LibraryState>({
    franchises: [],
    username: null,
    isImported: false,
    loading: true,
  })

  const refresh = useCallback(() => {
    const stored: StoredLibrary | null = loadLibrary()
    if (stored && stored.franchises.length > 0) {
      setState({
        franchises: stored.franchises,
        username: stored.username,
        isImported: true,
        loading: false,
      })
    } else {
      setState({ franchises: [], username: null, isImported: false, loading: false })
    }
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener('storydex:library-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('storydex:library-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [refresh])

  return state
}
