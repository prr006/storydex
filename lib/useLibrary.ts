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
  // Hydration contract: the initial state is ALWAYS "loading", never
  // "empty". The persisted library is read from localStorage in the mount
  // effect BEFORE the app decides first-run vs. imported — so a refresh can
  // never flash FirstRun and can never be mistaken for an empty atlas.
  // Nothing on mount writes to or clears storage; the only writers are the
  // import flows (saveLibrary) and an explicit clear (clearLibrary), and no
  // mount logic calls either.
  const [state, setState] = useState<LibraryState>(EMPTY)

  const refresh = useCallback(() => {
    try {
      const stored = loadLibrary()
      if (stored && Array.isArray(stored.franchises) && stored.franchises.length > 0) {
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
    } catch {
      // Unreadable/corrupted storage must degrade to an honest first-run,
      // never crash the tree (which would look like a lost library).
      setState({ franchises: [], username: null, isImported: false, loading: false })
    }
  }, [])

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener('storage', handler)
    // saveLibrary()/clearLibrary() announce same-window writes with this
    // event (the `storage` event only reaches OTHER tabs). Listening here is
    // what makes an import refresh the view in the tab that imported it —
    // no stale FirstRun, no manual reload.
    window.addEventListener('storydex:library-updated', handler)
    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('storydex:library-updated', handler)
    }
  }, [refresh])

  return { ...state, refresh }
}
