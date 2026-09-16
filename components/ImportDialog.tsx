'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Loader2, X } from 'lucide-react'
import { fetchAniListLibrary, AniListError } from '@/lib/anilist'
import { groupFranchises, expandFranchises } from '@/lib/franchise'
import { saveLibrary } from '@/lib/storage'
import { DURATION, EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'

/* ==========================================================================
   ImportDialog
   --------------------------------------------------------------------------
   A dialogue box, not a cinema. Paper sheet, one ruled field, one pine button,
   and the sentence that matters: your library stays in this browser.

   The import runs in two visible stages — reading your list, then following
   AniList's relation graph to group entries into stories — because the second
   stage is the slow one and the reason to wait is the product's whole premise.
   ========================================================================== */

interface ImportDialogProps {
  isOpen: boolean
  onClose: () => void
  /** Pre-filled when re-importing an existing library. */
  initialUsername?: string
  /** True when there is already a library to replace. */
  replacing?: boolean
}

type Stage = 'idle' | 'reading' | 'grouping'

export function ImportDialog({
  isOpen,
  onClose,
  initialUsername = '',
  replacing = false,
}: ImportDialogProps) {
  const router = useRouter()
  const [username, setUsername] = useState(initialUsername)
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState<string | null>(null)
  const busy = stage !== 'idle'

  async function handleImport() {
    if (!username.trim() || busy) return

    setStage('reading')
    setError(null)

    try {
      const entries = await fetchAniListLibrary(username)
      setStage('grouping')
      const expanded = await expandFranchises(entries)
      const franchises = groupFranchises(expanded)
      saveLibrary(username.trim(), franchises)
      setUsername('')
      onClose()
      router.push('/dashboard')
    } catch (err) {
      const message =
        err instanceof AniListError
          ? err.message
          : 'Something went wrong reaching AniList. Please try again.'
      setError(message)
    } finally {
      setStage('idle')
    }
  }

  function handleClose() {
    if (busy) return
    setError(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.overlay }}
            onClick={handleClose}
          />

          <div className="pointer-events-none fixed inset-0 z-[81] grid place-items-center overflow-y-auto p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="import-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: DURATION.overlay, ease: EASE }}
              className="pointer-events-auto relative w-full max-w-[460px] rounded-md border border-rule-strong bg-surface lift"
            >
              {/* ── Corner ruled like a catalogue card ─────────────────── */}
              <div className="flex items-start justify-between gap-6 border-b border-rule px-6 pt-6 pb-5">
                <div>
                  <p className="eyebrow">AniList</p>
                  <h2
                    id="import-title"
                    className="mt-2.5 text-title font-semibold text-ink"
                  >
                    {replacing ? 'Replace your library' : 'Bring your list across'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={busy}
                  aria-label="Close"
                  className="-mr-1.5 -mt-1 grid size-8 shrink-0 place-items-center rounded-sm text-ink-3 transition-colors hover:bg-sunk hover:text-ink disabled:opacity-40"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>

              <div className="px-6 py-6">
                <p className="reading max-w-[44ch] text-ink-2">
                  StoryDex reads your public list and regroups every entry into the franchises they
                  belong to — so a story reads as one story, not twelve rows.
                </p>

                {/* The field is a rule, not a box. */}
                <div className="mt-7">
                  <label
                    htmlFor="anilist-username"
                    className="text-micro font-semibold uppercase tracking-[0.08em] text-ink-3"
                  >
                    AniList username
                  </label>
                  <input
                    id="anilist-username"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="your-anilist-handle"
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value)
                      if (error) setError(null)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') handleImport()
                    }}
                    disabled={busy}
                    aria-invalid={Boolean(error)}
                    className={cn(
                      'mt-2.5 w-full border-b bg-transparent pb-2 text-lead text-ink placeholder:text-ink-3 focus:outline-none disabled:opacity-50',
                      error ? 'border-state-stopped' : 'border-rule-strong focus:border-brand',
                    )}
                  />
                  <p className="mt-3 text-small leading-relaxed text-ink-3">
                    Public lists only. Nothing is sent to a StoryDex server — your library is kept
                    in this browser.
                  </p>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="mt-5 flex items-start gap-2.5 border-l-2 border-state-stopped pl-3 text-body text-ink">
                        <AlertCircle
                          className="mt-0.5 size-4 shrink-0 text-state-stopped"
                          aria-hidden
                        />
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {busy && (
                  <p className="mt-5 flex items-center gap-2.5 text-body text-ink-2">
                    <Loader2 className="size-4 animate-spin text-brand" aria-hidden />
                    {stage === 'reading'
                      ? `Reading ${username.trim()}'s list…`
                      : 'Following the relation graph to group stories…'}
                  </p>
                )}

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={busy}
                    className="inline-flex h-10 items-center justify-center rounded-sm border border-rule-strong px-5 text-body font-medium text-ink transition-colors hover:bg-sunk disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!username.trim() || busy}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-brand px-5 text-body font-medium text-brand-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    {busy ? 'Importing…' : replacing ? 'Replace library' : 'Import library'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
