'use client'

import { useEffect, useState, useCallback } from 'react'
import { loadLibrary, type StoredLibrary } from './storage'
import { mockFranchises } from './mockData'
import type { Franchise } from './franchise'

export interface LibraryState {
  franchises: Franchise[]
  username: string | null
  isImported: boolean
  loading: boolean
}

/**
 * Reads the imported AniList library from localStorage on mount and keeps it
 * in sync with future imports (in this tab or another). Falls back to the
 * bundled example franchises when nothing has been imported yet, so the
 * landing page's "Browse Examples" link keeps working.
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
      setState({ franchises: stored.franchises, username: stored.username, isImported: true, loading: false })
    } else {
      setState({ franchises: mockFranchises, username: null, isImported: false, loading: false })
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
