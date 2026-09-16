'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Trash2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DURATION, EASE } from '@/lib/motion'

/* ==========================================================================
   SettingsMenu
   --------------------------------------------------------------------------
   A popover, not a route. Four things live here and nothing else: the account,
   re-import, the storage disclosure, and destroying the local copy.

   The disclosure is deliberate product honesty. StoryDex keeps your library in
   this browser only; a "Clear data" button that doesn't say that is a trap, so
   the sentence sits above the button rather than in a footnote.
   ========================================================================== */

interface SettingsMenuProps {
  username: string | null
  importedAt?: string | null
  franchiseCount: number
  onReimport: () => void
}

export function SettingsMenu({
  username,
  importedAt,
  franchiseCount,
  onReimport,
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function clearData() {
    try {
      localStorage.removeItem('storydex:library:v1')
    } catch {
      // Storage unavailable — nothing was stored to begin with.
    }
    window.dispatchEvent(new Event('storydex:library-updated'))
    setOpen(false)
  }

  const imported = importedAt ? new Date(importedAt).toLocaleDateString() : null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Account and settings"
        className="flex items-center gap-2 rounded-full border border-transparent py-0.5 pl-0.5 pr-2.5 transition-colors duration-200 hover:bg-white/[0.06]"
      >
        <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-brand to-[#4b3ce0] text-[0.6875rem] font-bold uppercase text-white art-edge">
          {username ? username.slice(0, 1) : '·'}
        </span>
        {username && (
          <span className="hidden text-small font-medium text-ink-2 sm:block">{username}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
            <motion.div
              role="dialog"
              aria-label="Account and settings"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: DURATION.overlay, ease: EASE }}
              className="absolute right-0 top-full z-50 mt-2.5 w-72 overflow-hidden rounded-md border border-line-strong bg-surface lift"
            >
              <div className="border-b border-line px-4 py-3.5">
                <p className="eyebrow">AniList</p>
                {username ? (
                  <p className="mt-1.5 text-body text-ink">
                    <span className="font-medium">@{username}</span>
                    <span className="text-ink-3"> · {franchiseCount} stories</span>
                  </p>
                ) : (
                  <p className="mt-1.5 text-body text-ink-2">No library imported yet</p>
                )}
                {imported && <p className="mt-0.5 text-small text-ink-3">Imported {imported}</p>}
              </div>

              <div className="border-b border-line px-4 py-3.5">
                <Link
                  href="/library"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between text-body text-ink-2 transition-colors hover:text-ink"
                >
                  Browse your library
                  <span aria-hidden>→</span>
                </Link>
              </div>

              <div className="px-4 py-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onReimport()
                  }}
                  className="flex w-full items-center gap-2.5 text-body text-ink-2 transition-colors hover:text-ink"
                >
                  <Upload className="size-4 text-ink-3" aria-hidden />
                  {username ? 'Re-import from AniList' : 'Import from AniList'}
                </button>

                <p className="mt-3.5 text-small leading-relaxed text-ink-3">
                  Your library lives in this browser only. Nothing is sent to a StoryDex server, so
                  clearing it here cannot be undone.
                </p>

                {username && (
                  <button
                    type="button"
                    onClick={clearData}
                    className={cn(
                      'mt-3 flex w-full items-center gap-2.5 text-body transition-opacity hover:opacity-80',
                    )}
                    style={{ color: 'var(--state-stopped)' }}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    Clear this library
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
