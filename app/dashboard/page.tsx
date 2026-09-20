'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Circle,
  Filter,
  MapPin,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { Navbar } from '@/components/Navbar'
import { ImportDialog } from '@/components/ImportDialog'
import { useLibrary } from '@/lib/useLibrary'
import { storyAccentVars } from '@/lib/storyAccent'
import {
  FILTER_CHIPS,
  SORT_OPTIONS,
  useDashboardControls,
} from '@/lib/useDashboardControls'

export default function Dashboard() {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const { franchises, isImported, loading, username } = useLibrary()
  const { query, setQuery, sort, setSort, activeFilter, setActiveFilter, filtered } =
    useDashboardControls(franchises)

  const activeStory = useMemo(
    () =>
      filtered.find((franchise) => franchise.nextToWatch) ||
      filtered.find((franchise) => franchise.completedSeasons < franchise.totalSeasons) ||
      filtered[0],
    [filtered],
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

  const otherStories = filtered.filter((franchise) => franchise.id !== activeStory?.id)

  const next = activeStory?.nextToWatch ?? null
  const nextIndex = next && activeStory
    ? activeStory.seasons.findIndex((season) => season.id === next.id)
    : -1
  const epNow = next && next.episodes > 0 ? Math.min((next.progress ?? 0) + 1, next.episodes) : null
  const storyPct = activeStory?.totalSeasons
    ? Math.round((activeStory.completedSeasons / activeStory.totalSeasons) * 100)
    : 0

  return (
    <div className="app-shell dash">
      <Navbar onImportClick={() => setIsImportOpen(true)} />

      <main>
        {!loading && !isImported && (
          <div className="demo-ribbon">
            <span><Sparkles aria-hidden="true" /> Sample library active</span>
            <button onClick={() => setIsImportOpen(true)}>Import your AniList <ArrowRight aria-hidden="true" /></button>
          </div>
        )}

        {loading ? (
          <div className="dashboard-skeleton"><div className="skeleton-hero" /></div>
        ) : activeStory ? (
          <>
            {/* ═══ THE WORLD — immersive split hero ═══════════════════ */}
            <section
              className="world"
              style={storyAccentVars(activeStory.id)}
              aria-labelledby="current-story-title"
            >
              {/* LEFT: the story environment */}
              <div className="world__env">
                <div className="world__env-art">
                  <Image
                    src={activeStory.bannerUrl || activeStory.posterUrl}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 900px) 100vw, 55vw"
                    className="object-cover"
                  />
                </div>
                <div className="world__env-wash" />
                <div className="world__env-grain" />

                {/* Poster floating in the environment */}
                <div className="world__poster">
                  <Image
                    src={activeStory.posterUrl}
                    alt={activeStory.name}
                    fill
                    sizes="240px"
                    className="object-cover"
                  />
                </div>

                {/* Giant title bleeding into the environment */}
                <span className="world__giant-title" aria-hidden="true">
                  {activeStory.name}
                </span>
              </div>

              {/* RIGHT: the HUD — story coordinates */}
              <div className="world__hud">
                <div className="world__hud-inner">
                  <div className="world__hud-top">
                    <span className="eyebrow"><i className="eyebrow__dot eyebrow__dot--live" /> Current story</span>
                    <span className="world__coord">
                      {String(Math.max(filtered.indexOf(activeStory) + 1, 1)).padStart(2, '0')} / {filtered.length}
                    </span>
                  </div>

                  <h1 id="current-story-title" className="world__title">{activeStory.name}</h1>

                  <p className="world__desc">{activeStory.description}</p>

                  {/* Position readout */}
                  <div className="world__position">
                    <div className="world__position-row">
                      <span className="world__position-label"><MapPin aria-hidden="true" /> Your position</span>
                      {next ? (
                        <span className="world__position-value">
                          {next.name}{epNow ? <em> · EP {epNow}/{next.episodes || '?'}</em> : null}
                        </span>
                      ) : (
                        <span className="world__position-value world__position-value--done"><Check aria-hidden="true" /> Complete</span>
                      )}
                    </div>
                    <div className="readout-line"><span style={{ width: `${storyPct}%` }} /></div>
                    <div className="readout-meta">
                      <span>{activeStory.completedSeasons} recorded</span>
                      <span>{storyPct}% explored</span>
                      <span>{activeStory.totalSeasons - activeStory.completedSeasons} ahead</span>
                    </div>
                  </div>

                  {/* Next destination */}
                  {next && (
                    <div className="world__next">
                      <span className="world__next-label">Next destination</span>
                      <div className="world__next-art">
                        <Image
                          src={next.posterUrl || activeStory.posterUrl}
                          alt=""
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                      </div>
                      <div className="world__next-copy">
                        <strong>{next.name}</strong>
                        <span>{next.format || 'TV'} · {next.year || '—'} · {next.episodes || '?'} ep</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="world__actions">
                    <Link href={`/franchise/${activeStory.id}`} className="button button--light">
                      Enter the story <ArrowRight aria-hidden="true" />
                    </Link>
                    {next?.siteUrl && epNow && (
                      <a href={next.siteUrl} target="_blank" rel="noreferrer" className="button button--ghost">
                        Play EP {epNow} <Play aria-hidden="true" />
                      </a>
                    )}
                  </div>

                  {/* Route timeline */}
                  <div className="world__timeline">
                    <div className="world__timeline-track">
                      <div className="world__timeline-fill" style={{ width: `${activeStory.totalSeasons > 1 ? (nextIndex >= 0 ? (nextIndex / (activeStory.seasons.length - 1)) * 100 : storyPct) : 50}%` }} />
                      {activeStory.seasons.map((season, index) => {
                        const state = index < nextIndex ? 'past' : index === nextIndex ? 'current' : 'future'
                        const left = activeStory.seasons.length > 1
                          ? (index / (activeStory.seasons.length - 1)) * 100
                          : 50
                        return (
                          <Link
                            key={season.id}
                            href={`/franchise/${activeStory.id}`}
                            className={`world__tick world__tick--${state}`}
                            style={{ left: `${left}%` }}
                            aria-label={season.name}
                          >
                            <i />
                            {state === 'current' && <u>You</u>}
                          </Link>
                        )
                      })}
                    </div>
                    <div className="world__timeline-ends">
                      <span>Origin</span>
                      <span>{activeStory.seasons.length} entries</span>
                      <span>Horizon</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ═══ OTHER STORIES — horizontal shelf ═══════════════════ */}
            {otherStories.length > 0 && (
              <section className="shelf" aria-labelledby="shelf-title">
                <div className="shelf__head">
                  <div>
                    <p className="eyebrow"><i className="eyebrow__dot" /> Other stories</p>
                    <h2 id="shelf-title">Further along the shelf.</h2>
                  </div>
                  <span className="section-count">{otherStories.length} routes</span>
                </div>
                <div className="shelf__track">
                  {otherStories.map((franchise, index) => (
                    <Link
                      key={franchise.id}
                      href={`/franchise/${franchise.id}`}
                      className="shelf__item"
                      style={{ '--shelf-i': index } as CSSProperties}
                    >
                      <div className="shelf__art">
                        <Image src={franchise.posterUrl} alt={franchise.name} fill sizes="180px" className="object-cover" />
                      </div>
                      <div className="shelf__info">
                        <strong>{franchise.name}</strong>
                        <span>{franchise.completedSeasons}/{franchise.totalSeasons} · {franchise.genres.slice(0, 2).join(' · ') || '—'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ═══ ARCHIVE ═══════════════════════════════════════════ */}
            <section className="archive-section" aria-labelledby="archive-title">
              <div className="archive-section__head">
                <div>
                  <p className="eyebrow"><i className="eyebrow__dot" /> The record</p>
                  <h2 id="archive-title">Archive of stories.</h2>
                </div>
                <div className="archive-section__stats">
                  <span><strong>{stats.totalEntries}</strong> entries</span>
                  <span><strong>{stats.completedEntries}</strong> recorded</span>
                  <span><strong>{stats.completion}%</strong> complete</span>
                </div>
              </div>

              <div className="archive-controls">
                <label className="archive-search">
                  <Search aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Find a story"
                    aria-label="Search your collection"
                  />
                </label>
                <div className="archive-filters">
                  <Filter aria-hidden="true" />
                  {FILTER_CHIPS.slice(0, 5).map((chip) => (
                    <button
                      key={chip.value}
                      onClick={() => setActiveFilter(chip.value)}
                      className={activeFilter === chip.value ? 'is-active' : ''}
                    >
                      {chip.label}
                    </button>
                  ))}
                  <label className="archive-sort">
                    <SlidersHorizontal aria-hidden="true" />
                    <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} aria-label="Sort library">
                      {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <ChevronDown aria-hidden="true" />
                  </label>
                </div>
              </div>

              {filtered.length > 0 ? (
                <div className="archive-list">
                  {filtered.map((franchise, index) => (
                    <Link key={franchise.id} href={`/franchise/${franchise.id}`} className="archive-row">
                      <span className="archive-row__number">{String(index + 1).padStart(2, '0')}</span>
                      <span className="archive-row__thumb">
                        <Image src={franchise.posterUrl} alt="" fill sizes="48px" />
                      </span>
                      <span className="archive-row__title">{franchise.name}</span>
                      <span className="archive-row__genres">{franchise.genres.slice(0, 2).join(' · ') || '—'}</span>
                      <span className="archive-row__progress"><i style={{ width: `${franchise.totalSeasons ? (franchise.completedSeasons / franchise.totalSeasons) * 100 : 0}%` }} /></span>
                      <span className="archive-row__count">{franchise.completedSeasons}/{franchise.totalSeasons}</span>
                      <ArrowRight className="archive-row__arrow" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Search aria-hidden="true" />
                  <p>No stories match that view.</p>
                  <button onClick={() => { setQuery(''); setActiveFilter('all') }}>Reset</button>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="empty-library">
            <div className="empty-library__orbit" />
            <span className="eyebrow"><i className="eyebrow__dot eyebrow__dot--live" /> No route selected</span>
            <h1>Your stories are waiting<br />to become a <em>map.</em></h1>
            <p>Import your public AniList library and StoryDex will find the connections between seasons, films, and the places you have already been.</p>
            <button className="button button--light" onClick={() => setIsImportOpen(true)}>Import from AniList <ArrowDown aria-hidden="true" /></button>
            <div className="empty-library__marks"><span><Check /> grouped by story</span><span><Check /> stored locally</span><span><Check /> no account needed</span></div>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <span>StoryDex / a map for the stories you carry</span>
        <span>{username ? `mapped from ${username}` : 'powered by AniList'}</span>
      </footer>

      <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  )
}
