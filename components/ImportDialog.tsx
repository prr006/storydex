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
   The first real interaction a new user has, so it sets the tone: a dark sheet
   over a dimmed page, one field, one indigo button, and the sentence that
   matters — your library stays in this browser.

   The import runs in two visible stages: reading the list, then following
   AniList's relation graph to group entries into stories. The second stage is
   the slow one, and saying so makes the wait feel like work rather than lag.
   ========================================================================== */

interface ImportDialogProps {
  isOpen: boolean
  onClose: () => void
  initialUsername?: string
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
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
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
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: DURATION.overlay, ease: EASE }}
              className="pointer-events-auto relative w-full max-w-[440px] overflow-hidden rounded-lg border border-line-strong bg-surface lift"
            >
              {/* A wash of the brand colour, so the sheet belongs to the app. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-24 h-48"
                style={{
                  background:
                    'radial-gradient(60% 100% at 30% 100%, rgba(109,92,255,0.28) 0%, transparent 70%)',
                }}
              />

              <div className="relative flex items-start justify-between gap-6 px-6 pb-5 pt-6">
                <div>
                  <p className="eyebrow" style={{ color: 'var(--brand-strong)' }}>
                    AniList
                  </p>
                  <h2 id="import-title" className="mt-2.5 text-title font-bold text-ink">
                    {replacing ? 'Replace your library' : 'Bring your list across'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={busy}
                  aria-label="Close"
                  className="-mr-1.5 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-white/[0.06] hover:text-ink disabled:opacity-40"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>

              <div className="relative px-6 pb-6">
                <p className="text-body text-ink-2">
                  StoryDex reads your public list and regroups every entry into the franchise it
                  belongs to.
                </p>

                <div className="mt-6">
                  <label
                    htmlFor="anilist-username"
                    className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-3"
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
                      'mt-2.5 h-11 w-full rounded-sm border bg-surface-2 px-3.5 text-body text-ink placeholder:text-ink-3 focus:outline-none disabled:opacity-50',
                      error ? 'border-state-stopped' : 'border-line-strong focus:border-brand',
                    )}
                  />
                  <p className="mt-3 text-small leading-relaxed text-ink-3">
                    Public lists only. Nothing is sent to a StoryDex server — your library is kept in
                    this browser.
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
                      <p
                        className="mt-5 flex items-start gap-2.5 border-l-2 pl-3 text-body text-ink"
                        style={{ borderColor: 'var(--state-stopped)' }}
                      >
                        <AlertCircle
                          className="mt-0.5 size-4 shrink-0"
                          style={{ color: 'var(--state-stopped)' }}
                          aria-hidden
                        />
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {busy && (
                  <p className="mt-5 flex items-center gap-2.5 text-body text-ink-2">
                    <Loader2
                      className="size-4 animate-spin"
                      style={{ color: 'var(--brand-strong)' }}
                      aria-hidden
                    />
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
                    className="inline-flex h-10 items-center justify-center rounded-full border border-line-strong px-5 text-body font-medium text-ink transition-colors hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!username.trim() || busy}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand px-5 text-body font-semibold text-white transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40"
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
