'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, Loader2, ArrowRight, Check, Search } from 'lucide-react'
import {
  fetchAniListLibrary,
  fetchMixedMediaByIds,
  searchAniList,
  searchAniListAll,
  entriesFromMedia,
  AniListError,
  type AniListListEntry,
  type AniListMedia,
  type AniListSearchResult,
  type MediaType,
} from '@/lib/anilist'
import {
  groupFranchises,
  expandFranchises,
  mergeFranchises,
  canonicalizeFranchises,
} from '@/lib/franchise'
import { loadLibrary, saveLibrary } from '@/lib/storage'

interface ImportDialogProps {
  isOpen: boolean
  onClose: () => void
}

type Mode = 'find' | 'list'
/** Which media types the search covers. 'all' = two real AniList queries, merged. */
type SearchScope = 'all' | 'anime' | 'manga'

function resultTitle(result: AniListSearchResult): string {
  return result.title.english || result.title.romaji || result.title.native || 'Untitled'
}

function resultMeta(result: AniListSearchResult): string {
  const bits: string[] = []
  if (result.seasonYear) bits.push(String(result.seasonYear))
  // Kind is always identified: a manga is never labelled "anime".
  const format = result.format
  const kindWord =
    format === 'MOVIE'
      ? 'film'
      : format === 'ONE_SHOT'
        ? 'one shot'
        : format === 'NOVEL'
          ? 'novel'
          : format === 'MANGA'
            ? 'manga'
            : format
              ? format.toLowerCase()
              : result.type === 'MANGA'
                ? 'manga'
                : 'anime'
  bits.push(kindWord)
  // Totals in the medium's native AniList field — media.chapters for manga
  // (never media.episodes), media.volumes for novels, media.episodes for
  // anime.
  if (result.type === 'MANGA') {
    if (format === 'NOVEL' && result.volumes) bits.push(`${result.volumes} vol`)
    else if (format !== 'ONE_SHOT' && result.chapters) bits.push(`${result.chapters} ch`)
  } else if (format !== 'MOVIE' && result.episodes) {
    bits.push(`${result.episodes} ep`)
  }
  return bits.join(' · ')
}

/**
 * Import from AniList — two real flows:
 *
 *  find  — search AniList, see the actual returned anime, select one or
 *          more, and import exactly the selected media (nothing related is
 *          added automatically). Merges into any existing library instead
 *          of overwriting it.
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
  const [searchScope, setSearchScope] = useState<SearchScope>('all')
  const [results, setResults] = useState<AniListSearchResult[] | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const abortRef = useRef<AbortController | null>(null)

  // list mode
  const [username, setUsername] = useState('')
  /** Live whole-list import status, e.g. "Anime: 123 · Manga: 87". */
  const [importStatus, setImportStatus] = useState<string | null>(null)

  // shared
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /**
   * Non-fatal outcome notice: the import SUCCEEDED (the user's data is
   * saved), but franchise discovery could not complete. Never rendered as
   * an error — the profile import itself did not fail.
   */
  const [warning, setWarning] = useState<string | null>(null)

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
      // "All" is TWO separate AniList queries (one per media type), merged
      // and deduped — never a single query asked to return both datasets.
      const found =
        searchScope === 'all'
          ? await searchAniListAll(q, controller.signal)
          : await searchAniList(q, searchScope === 'anime' ? 'ANIME' : 'MANGA', controller.signal)
      setResults(found)
      setSelected(new Set())
      if (found.length === 0) {
        const kind =
          searchScope === 'anime' ? 'anime' : searchScope === 'manga' ? 'manga' : 'stories'
        setError(
          `No ${kind} found for that title on AniList. Try a different spelling — or another media type.`,
        )
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

  /**
   * Stage B of an import: franchise-graph expansion. Discovery is an
   * enhancement over the user's own data, never a precondition for keeping
   * it — a 429/network failure HERE must not fail the import. Returns the
   * discovered media (possibly empty) plus a precise non-fatal warning.
   */
  const expandWithFallback = async (entries: AniListListEntry[]) => {
    try {
      const discovered = await expandFranchises(entries)
      return { discovered, warning: null as string | null }
    } catch (err) {
      const rateLimited = err instanceof AniListError && err.status === 429
      return {
        discovered: [] as AniListMedia[],
        warning: rateLimited
          ? 'Your list imported successfully, but AniList rate-limited franchise discovery — related entries may be missing. Import again in a minute to complete the graph.'
          : 'Your list imported successfully, but franchise discovery could not reach AniList — related entries may be missing. Import again later to complete the graph.',
      }
    }
  }

  const handleImportSelected = async () => {
    if (selected.size === 0 || busy) return
    setIsImporting(true)
    setError(null)
    setWarning(null)
    try {
      // Each selection keeps its own media type — manga ids must never be
      // sent through a type: ANIME query.
      const typeById = new Map((results ?? []).map((r) => [r.id, r.type]))
      const idsWithType = Array.from(selected).map((id) => ({
        id,
        type: (typeById.get(id) ?? 'ANIME') as MediaType,
      }))
      const media = await fetchMixedMediaByIds(idsWithType)
      // The selected media become user entries (inUserList=true); their
      // franchise graph is completed with relation-discovered media, which
      // are marked inUserList=false — discovered, never watched.
      const entries = entriesFromMedia(media)
      // Stage B (expansion) is resilient: the explicit selections are saved
      // even when relation discovery is rate-limited or unreachable.
      const { discovered, warning } = await expandWithFallback(entries)
      const imported = groupFranchises(entries, discovered)
      const stored = loadLibrary()
      // Canonical merge: franchises sharing ANY AniList media id become one
      // franchise (identity re-derived from user seasons; a promoted entry
      // never spawns a second franchise).
      const merged = canonicalizeFranchises(mergeFranchises(stored?.franchises ?? [], imported))
      saveLibrary(stored?.username ?? '', merged)
      if (warning) {
        // Non-fatal: the selection IS imported. Stay open, say exactly what
        // happened, and let the user continue — never the generic
        // "check your connection" failure.
        setWarning(warning)
        return
      }
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
    // One import, two real AniList queries (the profile's anime list and
    // manga list are fetched separately and merged). The status line keeps
    // the user informed as each side lands.
    const counts: Partial<Record<MediaType, number>> = {}
    const report = () =>
      setImportStatus(`Anime: ${counts.ANIME ?? '…'} · Manga: ${counts.MANGA ?? '…'}`)
    report()
    try {
      // STAGE A — the user's actual AniList list (deduplicated by media.id
      // at fetch time; counts reported are UNIQUE media counts). A failure
      // here is a genuine import failure and uses the precise taxonomy.
      const result = await fetchAniListLibrary(username.trim(), (type, count) => {
        counts[type] = count
        report()
      })
      // The user's list entries are inUserList=true; their relation graph
      // is completed with discovered media (inUserList=false) so each
      // franchise shows the full story route — with the user's state only
      // on the entries they actually own.
      const allEntries = [...result.anime, ...result.manga]
      // STAGE B — franchise discovery. Resilient: if AniList rate-limits or
      // is unreachable HERE, the user's exact list is still saved (stage A
      // succeeded) with a non-fatal warning — the profile import itself did
      // not fail, so no generic "check your connection" error.
      const { discovered, warning } = await expandWithFallback(allEntries)
      // Canonical form before saving: the stored library itself must contain
      // ONE franchise per story graph, never two objects sharing media ids.
      const franchises = canonicalizeFranchises(groupFranchises(allEntries, discovered))
      // Whole-list import = this profile IS the library: it replaces any
      // previously stored one, and the imported username becomes the
      // stored identity.
      saveLibrary(result.username, franchises)
      if (warning) {
        setWarning(`${warning}${result.warnings.length > 0 ? ` (${result.warnings[0]})` : ''}`)
        return
      }
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
    setSearchScope('all')
    setResults(null)
    setHasSearched(false)
    setSelected(new Set())
    setUsername('')
    setImportStatus(null)
    setWarning(null)
  }

  /** After a successful-but-degraded import: continue to the dashboard. */
  const continueToDashboard = () => {
    resetAll()
    onClose()
    router.push('/dashboard')
  }

  // The component stays mounted (it renders AnimatePresence), so reset the
  // transient state on every open — each opening starts clean on the
  // "Find a story" tab.
  useEffect(() => {
    if (isOpen) {
      setMode('find')
      resetAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleClose = () => {
    if (busy) return
    setError(null)
    setWarning(null)
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
              Find a story to add to your atlas — or chart an entire public AniList
              library, anime and manga alike.
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
                <div className="dlg__types" role="group" aria-label="Media type">
                  {(
                    [
                      ['all', 'All'],
                      ['anime', 'Anime'],
                      ['manga', 'Manga'],
                    ] as [SearchScope, string][]
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={searchScope === value ? 'dlg__type is-active' : 'dlg__type'}
                      aria-pressed={searchScope === value}
                      onClick={() => {
                        setSearchScope(value)
                        clearError()
                      }}
                      disabled={busy}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="dlg__search">
                  <Search aria-hidden="true" />
                  <input
                    className="dlg__input"
                    type="text"
                    placeholder="Search AniList — e.g. Re:Zero, Gintama, Berserk"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      clearError()
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch()
                    }}
                    disabled={busy}
                    aria-label="Search AniList"
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
                            <span className="dlg__result-meta">
                              {resultMeta(result) || (result.type === 'MANGA' ? 'manga' : 'anime')}
                            </span>
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
                <p className="dlg__hint">
                  Charts the profile&apos;s whole public list — anime and manga — in one
                  import. It becomes the library in your browser.
                </p>

                {importStatus && (
                  <p className="dlg__import-status" role="status">
                    <i className="dlg__status-dot" aria-hidden="true" />
                    {importStatus}
                  </p>
                )}

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

            {warning && !error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="dlg__warn-note"
                role="status"
              >
                <Check aria-hidden="true" />
                <span>{warning}</span>
                <button type="button" className="dlg__tab dlg__warn-go" onClick={continueToDashboard}>
                  Go to dashboard
                </button>
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
