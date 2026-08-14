'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { X, AlertCircle, Loader2 } from 'lucide-react'
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
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/50">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Import from AniList</h2>
                  <p className="text-sm text-foreground/60 mt-1">
                    Enter your AniList username to import your anime list
                  </p>
                </div>
                <motion.button
                  onClick={handleClose}
                  className="p-2 -mr-2 hover:bg-border/50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  aria-label="Close dialog"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5 text-foreground/60" aria-hidden="true" />
                </motion.button>
              </div>

              {/* Input */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-foreground/80 mb-2 block">
                    AniList Username
                  </label>
                  <input
                    type="text"
                    placeholder="unacknowledged000"
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
                    className="w-full px-4 py-2 min-h-[44px] bg-background border border-border/50 rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 min-h-[44px] border border-border/50 rounded-lg text-foreground hover:bg-border/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand font-medium"
                >
                  Cancel
                </button>
                <motion.div
                  className="flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleImport}
                    disabled={!username.trim() || isLoading}
                    className="w-full min-h-[44px] bg-brand hover:bg-brand-dark text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand/20 font-medium"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                        Importing...
                      </>
                    ) : (
                      'Import'
                    )}
                  </Button>
                </motion.div>
              </div>

              {/* Info Text */}
              <p className="text-xs text-foreground/50 mt-4 text-center">
                Pulls your public list directly from AniList. Nothing is stored on a server.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
