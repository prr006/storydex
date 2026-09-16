'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ArrowRight, Loader2, X } from 'lucide-react'
import { fetchAniListLibrary, AniListError } from '@/lib/anilist'
import { groupFranchises, expandFranchises } from '@/lib/franchise'
import { saveLibrary } from '@/lib/storage'
import { EASE } from '@/lib/motion'

/* ==========================================================================
   ImportDialog
   --------------------------------------------------------------------------
   The first real interaction a new user has with StoryDex, so it sets the
   tone: ink-black sheet, a single underlined field, an editorial headline,
   and one filled button. No nested card, no border-on-border, no gradient
   hero inside the modal.

   Deliberately kept the honest microcopy about local storage — the app has
   no backend, and saying so is a feature.
   ========================================================================== */

interface ImportDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ImportDialog({ isOpen, onClose }: ImportDialogProps) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImport = async () => {
    if (!username.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const entries = await fetchAniListLibrary(username)
      const expandedEntries = await expandFranchises(entries)
      const franchises = groupFranchises(expandedEntries)
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
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (isLoading) return
    setError(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-ink-950/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-title"
            className="pointer-events-none fixed inset-0 z-[81] grid place-items-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className="grain glass rim pointer-events-auto relative w-full max-w-[480px] overflow-hidden rounded-[28px] p-7 md:p-9"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.42, ease: EASE }}
            >
              {/* Violet bloom in the corner — one soft light source. */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full blur-[70px]"
                style={{ background: 'radial-gradient(circle, rgba(113,55,234,0.5), transparent 70%)' }}
              />

              <div className="relative">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <span className="label text-brand-300">AniList</span>
                    <h2
                      id="import-title"
                      className="text-editorial mt-3 text-[30px] leading-[1.05] text-chalk"
                    >
                      Bring your list across
                    </h2>
                    <p className="mt-3 max-w-[38ch] text-body-sm leading-relaxed text-mist">
                      StoryDex reads your public AniList list and regroups every entry into the
                      franchises they belong to.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    aria-label="Close"
                    className="grid size-9 shrink-0 place-items-center rounded-full text-mist transition-colors hover:bg-white/[0.07] hover:text-chalk disabled:opacity-40"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* The field is a rule, not a box. */}
                <div className="mt-8">
                  <label htmlFor="anilist-username" className="label text-veil">
                    Username
                  </label>
                  <div className="relative mt-3">
                    <input
                      id="anilist-username"
                      type="text"
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      placeholder="your-anilist-handle"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value)
                        if (error) setError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && username.trim() && !isLoading) handleImport()
                      }}
                      disabled={isLoading}
                      aria-invalid={!!error}
                      className="w-full bg-transparent pb-3 text-[19px] text-chalk placeholder:text-veil/70 focus:outline-none disabled:opacity-50"
                    />
                    <span className="absolute inset-x-0 bottom-0 h-px bg-white/[0.12]" />
                    <motion.span
                      className="absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-brand-500 via-brand-300 to-transparent"
                      initial={false}
                      animate={{ scaleX: error ? 0 : username ? 1 : 0.25 }}
                      transition={{ duration: 0.45, ease: EASE }}
                    />
                  </div>
                  {!error && (
                    <p className="mt-3 text-[12px] text-veil">
                      Public lists only. Nothing is sent to a StoryDex server — your library is kept
                      in this browser.
                    </p>
                  )}
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -6, height: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-coral/[0.09] px-4 py-3">
                        <AlertCircle className="mt-0.5 size-4 shrink-0 text-coral" aria-hidden />
                        <p className="text-body-sm text-chalk/90">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="h-12 flex-1 rounded-full bg-white/[0.06] text-[15px] font-medium text-chalk transition-colors hover:bg-white/[0.12] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!username.trim() || isLoading}
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-chalk text-[15px] font-semibold text-ink-950 transition-all duration-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Reading list…
                      </>
                    ) : (
                      <>
                        Import
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
