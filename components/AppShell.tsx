'use client'

import { MotionConfig } from 'framer-motion'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLibrary, type LibraryState } from '@/lib/useLibrary'
import { Masthead } from '@/components/Masthead'
import { ImportDialog } from '@/components/ImportDialog'
import { loadLibrary } from '@/lib/storage'

/* ==========================================================================
   AppShell
   --------------------------------------------------------------------------
   One client boundary around every route, so the header, the import dialogue
   and the library state exist exactly once. Pages stay presentational and ask
   for what they need through context.

   Why the shell rather than each page: the header's sentence needs the library,
   and three different pages can open the import dialogue. Duplicating either
   would mean the counts in the header could disagree with the counts on the
   page, which is the kind of small lie that makes an app feel fake.
   ========================================================================== */

interface LibraryContextValue {
  library: LibraryState
  openImport: () => void
  closeImport: () => void
  importOpen: boolean
  /** ISO date of the stored import, for the settings popover. */
  importedAt: string | null
}

const LibraryContext = createContext<LibraryContextValue | null>(null)

export function useLibraryContext(): LibraryContextValue {
  const value = useContext(LibraryContext)
  if (!value) {
    throw new Error('useLibraryContext must be used inside <AppShell>')
  }
  return value
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const library = useLibrary()
  const [importOpen, setImportOpen] = useState(false)

  const openImport = useCallback(() => setImportOpen(true), [])
  const closeImport = useCallback(() => setImportOpen(false), [])

  const [importedAt, setImportedAt] = useState<string | null>(null)

  // Read after mount, never during render: the stored date is browser-only and
  // must not make the server and client markup disagree.
  useEffect(() => {
    if (!library.isImported) {
      setImportedAt(null)
      return
    }
    setImportedAt(loadLibrary()?.importedAt ?? null)
  }, [library.isImported, library.franchises.length])

  const value = useMemo<LibraryContextValue>(
    () => ({ library, openImport, closeImport, importOpen, importedAt }),
    [library, openImport, closeImport, importOpen, importedAt],
  )

  return (
    <LibraryContext.Provider value={value}>
      {/* `reducedMotion="user"` makes every animation in the app honour the OS
          setting, including the ones that only exist as JS transforms. */}
      <MotionConfig reducedMotion="user">
        <Masthead
          franchises={library.franchises}
          username={library.username}
          importedAt={importedAt}
          onReimport={openImport}
        />

        <main>{children}</main>

        <footer className="shell mt-24 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-t border-line py-8 text-small text-ink-3">
          <p>
            Metadata and artwork from{' '}
            <a
              href="https://anilist.co"
              target="_blank"
              rel="noreferrer"
              className="text-ink-2 transition-colors hover:text-ink"
            >
              AniList
            </a>
            . Your library is stored in this browser.
          </p>
          {library.username && <p className="num">@{library.username}</p>}
        </footer>

        <ImportDialog
          isOpen={importOpen}
          onClose={closeImport}
          initialUsername={library.username ?? ''}
          replacing={library.isImported}
        />
      </MotionConfig>
    </LibraryContext.Provider>
  )
}
