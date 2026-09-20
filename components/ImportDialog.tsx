'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, Loader2, ArrowRight, Check, Search } from 'lucide-react'
import {
  fetchAniListLibrary,
  fetchMediaByIds,
  searchAniList,
  entriesFromMedia,
  mergeFranchises,
  AniListError,
  type AniListSearchResult,
} from '@/lib/anilist'
import { groupFranchises, expandFranchises } from '@/lib/franchise'
import { loadLibrary, saveLibrary } from '@/lib/storage'

interface ImportDialogProps {
  isOpen: boolean
  onClose: () => void
}

type Mode = 'find' | 'list'

function resultTitle(result: AniListSearchResult): string {
  return result.title.english || result.title.romaji || result.title.native || 'Untitled'
}

function resultMeta(result: AniListSearchResult): string {
  const bits: string[] = []
  if (result.seasonYear) bits.push(String(result.seasonYear))
  if (result.format) bits.push(result.format === 'MOVIE' ? 'film' : result.format.toLowerCase())
  if (result.episodes) bits.push(`${result.episodes} ep`)
  return bits.join(' · ')
}

/**
 * Import from AniList — two real flows:
 *
 *  find  — search AniList, see the actual returned anime, select one or
 *          more, and import the selected stories (their full routes are
 *          expanded from AniList relations). Merges into any existing
 *          library instead of overwriting it.
 *  list  — import an entire public AniList library by username.
 *
 * Both flows persist to localStorage and refresh the dashboard via the
 * library event. Nothing is stored on a server.
 */
export function ImportDialog({ isOpen, onClose }: ImportDialogProps) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('find')

  // find mode
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AniListSearchResult[] | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const abortRef = useRef<AbortController | null>(null)

  // list mode
  const [username, setUsername] = useState('')

  // shared
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const busy = isImporting

  // Abort any in-flight search when the dialog closes or unmounts.
  useEffect(() => {
    if (!isOpen) {
      abortRef.current?.abort()
      abortRef.current = null
    }
  }, [isOpen])
  useEffect(() => () => abortRef.current?.abort(), [])

  const clearError = () => setError(null)

  const handleSearch = async () => {
    const q = query.trim()
    if (!q || searching) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setSearching(true)
    setHasSearched(true)
    setError(null)
    try {
      const found = await searchAniList(q, controller.signal)
      setResults(found)
      setSelected(new Set())
      if (found.length === 0) {
        setError('No anime found for that title on AniList. Try a different spelling.')
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(
        err instanceof AniListError
          ? err.message
          : 'Could not reach AniList. Check your connection and try again.',
      )
      setResults(null)
    } finally {
      setSearching(false)
    }
  }

  const toggleSelected = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleImportSelected = async () => {
    if (selected.size === 0 || busy) return
    setIsImporting(true)
    setError(null)
    try {
      const media = await fetchMediaByIds(Array.from(selected))
      const entries = entriesFromMedia(media)
      const expanded = await expandFranchises(entries)
      const imported = groupFranchises(expanded)
      const stored = loadLibrary()
      const merged = mergeFranchises(stored?.franchises ?? [], imported)
      saveLibrary(stored?.username ?? '', merged)
      resetAll()
      onClose()
      router.push('/dashboard')
    } catch (err) {
      setError(
        err instanceof AniListError
          ? err.message
          : 'Something went wrong reaching AniList. Please try again.',
      )
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportLibrary = async () => {
    if (!username.trim() || busy) return
    setIsImporting(true)
    setError(null)
    try {
      const entries = await fetchAniListLibrary(username)
      const expandedEntries = await expandFranchises(entries)
      const franchises = groupFranchises(expandedEntries)
      saveLibrary(username.trim(), franchises)
      resetAll()
      onClose()
      router.push('/dashboard')
    } catch (err) {
      setError(
        err instanceof AniListError
          ? err.message
          : 'Something went wrong reaching AniList. Please try again.',
      )
    } finally {
      setIsImporting(false)
    }
  }

  const resetAll = () => {
    setQuery('')
    setResults(null)
    setHasSearched(false)
    setSelected(new Set())
    setUsername('')
  }

  const handleClose = () => {
    if (busy) return
    setError(null)
    onClose()
  }

  const switchMode = (next: Mode) => {
    if (busy || next === mode) return
    setMode(next)
    setError(null)
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
              disabled={busy}
            >
              <X aria-hidden="true" />
            </button>

            <p className="dlg__kicker">Begin the expedition</p>
            <h2>Import from AniList</h2>
            <p className="dlg__sub">
              Find a story to add to your atlas — or chart an entire public AniList library.
            </p>

            <div className="dlg__tabs" role="tablist" aria-label="Import method">
              <button
                role="tab"
                aria-selected={mode === 'find'}
                className={mode === 'find' ? 'dlg__tab is-active' : 'dlg__tab'}
                onClick={() => switchMode('find')}
                disabled={busy}
                type="button"
              >
                Find a story
              </button>
              <button
                role="tab"
                aria-selected={mode === 'list'}
                className={mode === 'list' ? 'dlg__tab is-active' : 'dlg__tab'}
                onClick={() => switchMode('list')}
                disabled={busy}
                type="button"
              >
                Whole list
              </button>
            </div>

            {mode === 'find' ? (
              <>
                <div className="dlg__search">
                  <Search aria-hidden="true" />
                  <input
                    className="dlg__input"
                    type="text"
                    placeholder="Search anime on AniList — e.g. Re:Zero, Gintama"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      clearError()
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch()
                    }}
                    disabled={busy}
                    aria-label="Search anime on AniList"
                    autoComplete="off"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={!query.trim() || searching || busy}
                    className="dlg__search-btn"
                    type="button"
                    aria-label="Search"
                  >
                    {searching ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Search aria-hidden="true" />}
                  </button>
                </div>

                <div className="dlg__results" aria-live="polite">
                  {searching && (
                    <>
                      <div className="dlg__result is-loading">
                        <div className="dlg__result-art" />
                        <div>
                          <div className="dlg__result-title" />
                          <div className="dlg__result-meta" />
                        </div>
                      </div>
                      <div className="dlg__result is-loading">
                        <div className="dlg__result-art" />
                        <div>
                          <div className="dlg__result-title" />
                          <div className="dlg__result-meta" />
                        </div>
                      </div>
                    </>
                  )}

                  {!searching && hasSearched && results && results.length > 0 && (
                    results.map((result) => {
                      const isSelected = selected.has(result.id)
                      return (
                        <button
                          key={result.id}
                          onClick={() => toggleSelected(result.id)}
                          className={isSelected ? 'dlg__result is-selected' : 'dlg__result'}
                          aria-pressed={isSelected}
                          disabled={busy}
                          type="button"
                        >
                          <div className="dlg__result-art">
                            {result.coverImage?.extraLarge || result.coverImage?.large ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={result.coverImage.extraLarge || result.coverImage.large || ''}
                                alt=""
                                loading="lazy"
                              />
                            ) : null}
                          </div>
                          <div className="dlg__result-copy">
                            <span className="dlg__result-title">{resultTitle(result)}</span>
                            <span className="dlg__result-meta">{resultMeta(result) || 'anime'}</span>
                          </div>
                          <span className="dlg__result-check" aria-hidden="true">
                            {isSelected && <Check />}
                          </span>
                        </button>
                      )
                    })
                  )}

                  {!searching && hasSearched && results && results.length === 0 && !error && (
                    <p className="dlg__empty">Nothing on AniList matches that title.</p>
                  )}
                </div>

                <div className="dlg__actions">
                  <button
                    onClick={handleClose}
                    disabled={busy}
                    className="dlg__cancel"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportSelected}
                    disabled={selected.size === 0 || busy}
                    className="dlg__submit"
                    type="button"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="animate-spin" aria-hidden="true" /> Charting
                      </>
                    ) : (
                      <>
                        <ArrowRight aria-hidden="true" />
                        {selected.size > 0 ? `Import ${selected.size} selected` : 'Import selected'}
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
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
                    clearError()
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && username.trim() && !busy) handleImportLibrary()
                  }}
                  disabled={busy}
                  aria-invalid={!!error}
                  autoComplete="off"
                />

                <div className="dlg__actions">
                  <button
                    onClick={handleClose}
                    disabled={busy}
                    className="dlg__cancel"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportLibrary}
                    disabled={!username.trim() || busy}
                    className="dlg__submit"
                    type="button"
                  >
                    {isImporting ? (
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
              </>
            )}

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

            <p className="dlg__foot">
              Pulls your list directly from AniList. Nothing is stored on a server.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
