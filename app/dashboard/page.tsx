'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  Filter,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { ImportDialog } from '@/components/ImportDialog'
import { FranchiseCard } from '@/components/FranchiseCard'
import { StoryPath } from '@/components/StoryPath'
import { useLibrary } from '@/lib/useLibrary'
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
    const activeEntries = franchises.reduce(
      (count, franchise) => count + franchise.seasons.filter((season) => season.status === 'CURRENT').length,
      0,
    )
    const upcomingEntries = franchises.reduce(
      (count, franchise) =>
        count + franchise.seasons.filter((season) => season.airingStatus === 'NOT_YET_RELEASED').length,
      0,
    )
    return {
      totalEntries,
      completedEntries,
      activeEntries,
      upcomingEntries,
      completion: totalEntries ? Math.round((completedEntries / totalEntries) * 100) : 0,
    }
  }, [franchises])

  const otherStories = filtered.filter((franchise) => franchise.id !== activeStory?.id)

  return (
    <div className="app-shell">
      <Navbar onImportClick={() => setIsImportOpen(true)} />

      <main>
        {!loading && !isImported && (
          <div className="demo-ribbon">
            <span><Sparkles aria-hidden="true" /> You are walking through a sample library.</span>
            <button onClick={() => setIsImportOpen(true)}>Bring in your AniList <ArrowRight aria-hidden="true" /></button>
          </div>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : activeStory ? (
          <>
            <section className="terrain-hero" aria-labelledby="current-story-title">
              <div className="terrain-hero__image">
                <Image
                  src={activeStory.bannerUrl || activeStory.posterUrl}
                  alt=""
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
              <div className="terrain-hero__grain" />
              <div className="terrain-hero__scrim" />
              <div className="terrain-hero__contour contour-one" />
              <div className="terrain-hero__contour contour-two" />

              <div className="terrain-hero__content">
                <div className="terrain-hero__eyebrow">
                  <span className="eyebrow"><i className="eyebrow__dot eyebrow__dot--live" /> Current story</span>
                  <span className="terrain-hero__coordinates">LIBRARY / 01 · {activeStory.seasons.length} WAYPOINTS</span>
                </div>
                <div className="terrain-hero__copy">
                  <p className="terrain-hero__overline">You are here</p>
                  <h1 id="current-story-title">{activeStory.name}</h1>
                  <p className="terrain-hero__description">{activeStory.description}</p>
                  <div className="terrain-hero__actions">
                    <Link href={`/franchise/${activeStory.id}`} className="button button--light">
                      Enter story <ArrowRight aria-hidden="true" />
                    </Link>
                    {activeStory.nextToWatch && (
                      <span className="terrain-hero__next">
                        <span className="status-pulse" />
                        next · {activeStory.nextToWatch.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="terrain-hero__readout">
                  <div>
                    <span>Progress</span>
                    <strong>{activeStory.totalSeasons ? Math.round((activeStory.completedSeasons / activeStory.totalSeasons) * 100) : 0}%</strong>
                  </div>
                  <div className="readout-line"><span style={{ width: `${activeStory.totalSeasons ? (activeStory.completedSeasons / activeStory.totalSeasons) * 100 : 0}%` }} /></div>
                  <div className="readout-meta">
                    <span>{activeStory.completedSeasons} recorded</span>
                    <span>{activeStory.totalSeasons - activeStory.completedSeasons} ahead</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="dashboard-section dashboard-section--path">
              <div className="section-intro">
                <div>
                  <p className="eyebrow"><i className="eyebrow__dot" /> Orientation</p>
                  <h2>Know where the story goes.</h2>
                </div>
                <p>Every entry is a place on the same route. Your library keeps the distance visible.</p>
              </div>
              <StoryPath franchise={activeStory} />
            </section>

            {activeStory.nextToWatch && (
              <section className="destination-band">
                <div className="destination-band__glow" />
                <div className="destination-band__label">
                  <span className="eyebrow"><i className="eyebrow__dot eyebrow__dot--orange" /> Next destination</span>
                  <span>up next in your route</span>
                </div>
                <div className="destination-band__main">
                  <div className="destination-band__art">
                    <Image
                      src={activeStory.nextToWatch.posterUrl || activeStory.posterUrl}
                      alt=""
                      fill
                      sizes="180px"
                      className="object-cover"
                    />
                    <span><Play aria-hidden="true" /></span>
                  </div>
                  <div className="destination-band__copy">
                    <p>{activeStory.name} · waypoint {activeStory.seasons.findIndex((season) => season.id === activeStory.nextToWatch?.id) + 1}</p>
                    <h2>{activeStory.nextToWatch.name}</h2>
                    <div className="destination-band__meta">
                      <span>{activeStory.nextToWatch.format || 'TV'}</span>
                      <span>{activeStory.nextToWatch.year || 'undated'}</span>
                      <span>{activeStory.nextToWatch.episodes || '?'} episodes</span>
                    </div>
                  </div>
                  <Link href={`/franchise/${activeStory.id}`} className="button button--outline">
                    Continue <ArrowRight aria-hidden="true" />
                  </Link>
                </div>
              </section>
            )}

            <section className="dashboard-section dashboard-section--stories" id="stories">
              <div className="section-intro section-intro--tight">
                <div>
                  <p className="eyebrow"><i className="eyebrow__dot" /> Other stories</p>
                  <h2>Many worlds, one library.</h2>
                </div>
                <span className="section-count">{otherStories.length} routes</span>
              </div>
              {otherStories.length > 0 ? (
                <div className="story-field">
                  {otherStories.map((franchise, index) => (
                    <FranchiseCard key={franchise.id} franchise={franchise} index={index} />
                  ))}
                </div>
              ) : (
                <p className="empty-note">Your current route is the only story in view.</p>
              )}
            </section>

            <section className="archive-section" aria-labelledby="archive-title">
              <div className="archive-section__head">
                <div>
                  <p className="eyebrow"><i className="eyebrow__dot" /> The record</p>
                  <h2 id="archive-title">Archive of stories.</h2>
                </div>
                <div className="archive-section__stats">
                  <span><strong>{franchises.length}</strong> stories</span>
                  <span><strong>{stats.totalEntries}</strong> entries</span>
                  <span><strong>{stats.completion}%</strong> complete</span>
                </div>
              </div>

              <div className="archive-controls">
                <label className="archive-search">
                  <Search aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Find a story or waypoint"
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
                  <button onClick={() => { setQuery(''); setActiveFilter('all') }}>Reset the archive</button>
                </div>
              )}
            </section>
          </>
        ) : (
          <EmptyLibrary onImport={() => setIsImportOpen(true)} />
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

function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="skeleton-hero" />
      <div className="skeleton-block" />
      <div className="skeleton-block skeleton-block--short" />
    </div>
  )
}

function EmptyLibrary({ onImport }: { onImport: () => void }) {
  return (
    <section className="empty-library">
      <div className="empty-library__orbit" />
      <span className="eyebrow"><i className="eyebrow__dot eyebrow__dot--live" /> No route selected</span>
      <h1>Your stories are waiting<br />to become a <em>map.</em></h1>
      <p>Import your public AniList library and StoryDex will find the connections between seasons, films, and the places you have already been.</p>
      <button className="button button--light" onClick={onImport}>Import from AniList <ArrowDown aria-hidden="true" /></button>
      <div className="empty-library__marks"><span><Check /> grouped by story</span><span><Check /> stored locally</span><span><Check /> no account needed</span></div>
    </section>
  )
}