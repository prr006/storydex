'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { fetchAniListLibrary, AniListError } from '@/lib/anilist'
import { groupFranchises, expandFranchises } from '@/lib/franchise'
import { saveLibrary } from '@/lib/storage'

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
        <div className="dlg" role="dialog" aria-modal="true" aria-label="Import from AniList">
          <motion.div
            className="dlg__scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className="dlg__panel"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              onClick={handleClose}
              className="dlg__close"
              aria-label="Close dialog"
              type="button"
            >
              <X aria-hidden="true" />
            </button>

            <p className="dlg__kicker">Begin the expedition</p>
            <h2>Import from AniList</h2>
            <p className="dlg__sub">
              Enter your AniList username and StoryDex will chart every season, film, and
              special in your library.
            </p>

            <label className="dlg__label" htmlFor="anilist-username">
              AniList username
            </label>
            <input
              id="anilist-username"
              className="dlg__input"
              type="text"
              placeholder="e.g. unacknowledged000"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                if (error) setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && username.trim() && !isLoading) {
                  handleImport()
                }
              }}
              disabled={isLoading}
              aria-invalid={!!error}
              autoComplete="off"
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="dlg__error"
                role="alert"
              >
                <AlertCircle aria-hidden="true" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="dlg__actions">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="dlg__cancel"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!username.trim() || isLoading}
                className="dlg__submit"
                type="button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" /> Importing
                  </>
                ) : (
                  <>
                    <ArrowRight aria-hidden="true" /> Begin import
                  </>
                )}
              </button>
            </div>

            <p className="dlg__foot">
              Pulls your public list directly from AniList. Nothing is stored on a server.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
