'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Franchise } from './franchise'
import { loadLibrary } from './storage'

export interface LibraryState {
  /** The imported library. Empty until the user has actually imported from AniList. */
  franchises: Franchise[]
  /** The AniList username this library was imported from, if any. */
  username: string | null
  /**
   * True only when a real library exists in local storage — never inferred from
   * bundled or demo content.
   */
  isImported: boolean
  /** True while the local library is being read. Shows a neutral loading state —
   *  never demo content — so the first paint is honest. */
  loading: boolean
}

const EMPTY: LibraryState = { franchises: [], username: null, isImported: false, loading: true }

export function useLibrary() {
  const [state, setState] = useState<LibraryState>(EMPTY)

  const refresh = useCallback(() => {
    const stored = loadLibrary()
    if (stored && stored.franchises.length > 0) {
      setState({
        franchises: stored.franchises,
        username: stored.username,
        isImported: true,
        loading: false,
      })
    } else {
      // No imported library — the atlas is genuinely empty.
      setState({ franchises: [], username: null, isImported: false, loading: false })
    }
  }, [])

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [refresh])

  return { ...state, refresh }
}
