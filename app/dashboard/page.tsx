'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { Navbar } from '@/components/Navbar'
import { ImportDialog } from '@/components/ImportDialog'
import { FirstRun } from '@/components/FirstRun'
import { StoryReel, buildReelStories } from '@/components/StoryReel'
import { WordReveal } from '@/components/Reveal'
import { Beacon } from '@/components/Beacon'
import { storyPosition } from '@/components/StoryPath'
import { useLibrary } from '@/lib/useLibrary'
import { storyAccentVars } from '@/lib/storyAccent'
import {
  FILTER_CHIPS,
  SORT_OPTIONS,
  useDashboardControls,
} from '@/lib/useDashboardControls'
import type { Franchise } from '@/lib/franchise'

const MotionLink = motion.create(Link)

function stateWord(franchise: Franchise) {
  if (franchise.completedSeasons === franchise.totalSeasons && franchise.totalSeasons > 0) {
    return { label: 'complete', tone: 'done' as const }
  }
  const next = franchise.nextToWatch
  if (next) return { label: `now — ${next.name}`, tone: 'live' as const }
  if (franchise.seasons.some((s) => s.status === 'PLANNING')) {
    return { label: 'planned', tone: 'quiet' as const }
  }
  return { label: 'unstarted', tone: 'quiet' as const }
}

export default function Dashboard() {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const { franchises, isImported, loading, username } = useLibrary()
  const { query, setQuery, sort, setSort, activeFilter, setActiveFilter, filtered } =
    useDashboardControls(franchises)

  /* The reel follows the current index view (sorted/filtered) so the hero and
     the table of contents always agree. When the view is empty (a search that
     matches nothing), the hero falls back to the whole library — it never
     disappears, and the index shows its own "no matches" state below. */
  const reelStories = useMemo(
    () => buildReelStories(filtered.length > 0 ? filtered : franchises),
    [filtered, franchises],
  )

  const stats = useMemo(() => {
    const totalEntries = franchises.reduce((count, franchise) => count + franchise.seasons.length, 0)
    const completedEntries = franchises.reduce(
      (count, franchise) => count + franchise.seasons.filter((season) => season.completed).length,
      0,
    )
    return {
      totalEntries,
      completedEntries,
      completion: totalEntries ? Math.round((completedEntries / totalEntries) * 100) : 0,
    }
  }, [franchises])

  return (
    <div className="app-shell">
      <Navbar onImportClick={() => setIsImportOpen(true)} />

      <main>
        {loading ? (
          /* neutral loading — nothing that resembles library content */
          <div className="atlas-loading" role="status" aria-live="polite">
            <span className="atlas-loading__route" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <p>Opening your atlas…</p>
          </div>
        ) : !isImported ? (
          /* genuinely empty — the first page */
          <FirstRun onImportClick={() => setIsImportOpen(true)} />
        ) : reelStories.length > 0 ? (
          <>
            {/* ═══ THE WORLD — the featured stories, rotating ══════════ */}
            <StoryReel stories={reelStories} />

            {/* ═══ THE INDEX — the whole library as a table of contents ══ */}
            <section className="index" id="stories" aria-labelledby="index-title">
              <div className="index__head">
                <div>
                  <p className="label">
                    <i className="label__dot" aria-hidden="true" /> The index
                  </p>
                  <h2 id="index-title" className="h-section">
                    Every story in <em>your atlas.</em>
                  </h2>
                </div>
                <span className="index__count">
                  {filtered.length} routes · {stats.completedEntries} of {stats.totalEntries} entries · {stats.completion}% complete
                </span>
              </div>

              <div className="index__controls">
                <label className="index__search">
                  <Search aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Find a story"
                    aria-label="Search your collection"
                  />
                </label>
                <div className="index__filters">
                  {FILTER_CHIPS.map((chip) => (
                    <button
                      key={chip.value}
                      onClick={() => setActiveFilter(chip.value)}
                      className={activeFilter === chip.value ? 'index__filter is-active' : 'index__filter'}
                      type="button"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                <label className="index__sort">
                  <SlidersHorizontal aria-hidden="true" />
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as typeof sort)}
                    aria-label="Sort library"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" />
                </label>
              </div>

              {filtered.length > 0 ? (
                <div className="index__list">
                  {filtered.map((franchise, index) => {
                    const pos = storyPosition(franchise)
                    const state = stateWord(franchise)
                    const firstYear = franchise.seasons[0]?.year || ''
                    return (
                      <MotionLink
                        key={franchise.id}
                        href={`/franchise/${franchise.id}`}
                        className="idx"
                        style={storyAccentVars(franchise.id)}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-30px' }}
                        transition={{
                          duration: 0.6,
                          delay: Math.min(index * 0.04, 0.28),
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <div
                          className="idx__ghost"
                          style={{ backgroundImage: `url(${franchise.bannerUrl || franchise.posterUrl})` }}
                          aria-hidden="true"
                        />
                        <span className="idx__folio">{String(index + 1).padStart(2, '0')}</span>
                        <div className="idx__identity">
                          <h3 className="idx__name">{franchise.name}</h3>
                          <span className={`idx__state${state.tone === 'done' ? ' idx__state--done' : state.tone === 'quiet' ? ' idx__state--quiet' : ''}`}>
                            {state.tone === 'done' && <Check aria-hidden="true" />}
                            {state.tone === 'live' && <MapPin aria-hidden="true" />}
                            {state.label}
                          </span>
                        </div>
                        <span className="idx__glyph" aria-hidden="true">
                          <span className="glyph" style={{ '--glyph-fill': `${pos.fill * 100}%` } as CSSProperties}>
                            <span className="glyph__line" />
                            <span className="glyph__ink" />
                            {franchise.seasons.map((season, i) => (
                              <span
                                key={season.id}
                                className={`glyph__dot ${
                                  pos.complete
                                    ? 'glyph__dot--past'
                                    : i < pos.pos
                                      ? 'glyph__dot--past'
                                      : i === pos.pos && !pos.complete
                                        ? 'glyph__dot--current'
                                        : 'glyph__dot--future'
                                }`}
                                style={{ left: `${pos.total > 1 ? (i / (pos.total - 1)) * 100 : 0}%` }}
                              />
                            ))}
                          </span>
                        </span>
                        <span className="idx__count">
                          {franchise.completedSeasons}/{franchise.totalSeasons}
                        </span>
                        <span className="idx__year">{firstYear || '—'}</span>
                        <ArrowUpRight className="idx__arrow" aria-hidden="true" />
                      </MotionLink>
                    )
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <Search aria-hidden="true" />
                  <p>No stories match that view.</p>
                  <button
                    onClick={() => { setQuery(''); setActiveFilter('all') }}
                    className="cta cta--dim"
                    type="button"
                  >
                    Reset the view
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          /* imported, but nothing matches the current view */
          <section className="void">
            <div className="void__rose" aria-hidden="true">
              <div className="tp__ring" />
              <div className="tp__ring tp__ring--2" />
              <div className="tp__ring tp__ring--3" />
              <div className="tp__cross-h" />
              <div className="tp__cross-v" />
              <span className="tp__beacon"><Beacon /></span>
            </div>
            <span className="label">
              <i className="label__dot label__dot--live" aria-hidden="true" /> No route selected
            </span>
            <h1>
              Your stories are waiting<br />to become a <em>map.</em>
            </h1>
            <p>
              Import your public AniList library and StoryDex will find the connections
              between seasons, films, and the places you have already been.
            </p>
            <button className="cta" onClick={() => setIsImportOpen(true)} type="button">
              Import from AniList <ArrowDown aria-hidden="true" />
            </button>
            <div className="void__marks">
              <span><Check aria-hidden="true" /> grouped by story</span>
              <span><Check aria-hidden="true" /> stored locally</span>
              <span><Check aria-hidden="true" /> no account needed</span>
            </div>
          </section>
        )}
      </main>

      <footer className="colophon">
        <span>StoryDex — a map for the stories you carry</span>
        <span>{username ? `mapped from ${username}` : 'powered by AniList'}</span>
      </footer>

      <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  )
}
