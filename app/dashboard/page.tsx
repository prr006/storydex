'use client'

import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  MapPin,
  Play,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { Navbar } from '@/components/Navbar'
import { ImportDialog } from '@/components/ImportDialog'
import { StoryPlate } from '@/components/StoryPlate'
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
import { heroSummary } from '@/lib/franchise'
import type { Franchise } from '@/lib/franchise'

const MotionLink = motion.create(Link)

/* -------------------------------------------------------------------------- */
/* per-story journey geometry, shared by the cover route and the index glyphs */
/* -------------------------------------------------------------------------- */

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

/**
 * The current story as a full-bleed world.
 *
 * Motion's useScroll is called HERE — inside the component that owns the
 * ref'd <section> — so the ref is always attached before Motion measures it.
 * (A ref whose element mounts later, or never, makes useScroll throw
 * "Target ref is defined but not hydrated".)
 */
function DashboardCover({
  story,
  pos,
  storyNumber,
  total,
  originYear,
  epNow,
}: {
  story: Franchise
  pos: { total: number; pos: number; fill: number; complete: boolean }
  storyNumber: number
  total: number
  originYear: string
  epNow: number | null
}) {
  const next = story.nextToWatch
  const coverRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: coverRef,
    offset: ['start start', 'end start'],
  })
  const artY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])
  const hazeY = useTransform(scrollYProgress, [0, 1], ['0%', '-7%'])

  return (
    <section
      ref={coverRef}
      className="cover"
      style={storyAccentVars(story.id)}
      aria-labelledby="current-story-title"
    >
      <motion.div className="cover__art" style={{ y: artY }} aria-hidden="true">
        <Image
          src={story.bannerUrl || story.posterUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>
      <motion.div className="cover__light" style={{ y: hazeY }} aria-hidden="true" />
      <div className="cover__atmos" aria-hidden="true" />

      <div className="cover__inner">
        <div className="cover__body">
          <div className="cover__toplink">
            <span className="label">
              <i className="label__dot label__dot--live" aria-hidden="true" /> Current story
            </span>
          </div>

          {/* one compact metadata zone: human-facing line + factual line */}
          <div className="cover__meta">
            <span className="cover__meta--genres">
              {story.genres.slice(0, 2).join(' · ') || 'unclassified'}
            </span>
            <span className="cover__meta--facts">
              {String(storyNumber).padStart(2, '0')} / {String(total).padStart(2, '0')} in your atlas
              {originYear ? ` · ${originYear}` : ''} · {String(story.completedSeasons).padStart(2, '0')} / {String(story.totalSeasons).padStart(2, '0')} recorded
            </span>
          </div>

          <h1 id="current-story-title" className="cover__title">
            <WordReveal text={story.name} as="span" delay={0.45} emphasizeLast />
          </h1>

          <p className="cover__desc">{heroSummary(story)}</p>

          <div className="cover__cta">
            <Link href={`/franchise/${story.id}`} className="cta">
              Enter the story <ArrowRight aria-hidden="true" />
            </Link>
            {next?.siteUrl && epNow && (
              <a href={next.siteUrl} target="_blank" rel="noreferrer" className="cta cta--accent">
                Resume EP {epNow} <Play aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        <div className="cover__plate">
          <StoryPlate
            src={story.posterUrl}
            alt={story.name}
            plate="01"
            caption={`origin — ${originYear || '—'}`}
            size="md"
            state="current"
            tilt
            eager
          />
        </div>

        {/* Your position on the story — the route crosses the world */}
        <div className="cover__route">
          <div className="route">
            <div className="route__ends">
              <span>Origin{originYear ? ` — ${originYear}` : ''}</span>
              <span>{story.seasons.length} entries</span>
              <span>Horizon</span>
            </div>
            <div
              className="route__track"
              style={{ '--route-fill': `${pos.fill * 100}%` } as CSSProperties}
            >
              <div className="route__baseline" />
              <div className="route__ink" />
              {story.seasons.map((season, index) => {
                const state = pos.complete
                  ? 'past'
                  : index < pos.pos
                    ? 'past'
                    : index === pos.pos && !pos.complete
                      ? 'current'
                      : 'future'
                return (
                  <Link
                    key={season.id}
                    href={`/franchise/${story.id}`}
                    className={`route__tick route__tick--${state}`}
                    style={{ left: `${pos.total > 1 ? (index / (pos.total - 1)) * 100 : 0}%` }}
                    aria-label={season.name}
                  >
                    <i />
                  </Link>
                )
              })}
              {!pos.complete && (
                <Beacon
                  style={{ left: `${pos.fill * 100}%` }}
                  flag={
                    <span className={`beacon__flag${pos.fill > 0.82 ? ' beacon__flag--end' : ''}`}>
                      <MapPin aria-hidden="true" />
                      <b>You</b>
                      {next ? (
                        <em>
                          {next.name}
                          {epNow ? ` · EP ${epNow}/${next.episodes || '?'}` : ''}
                        </em>
                      ) : null}
                    </span>
                  }
                />
              )}
              {pos.complete && (
                <Beacon
                  style={{ left: '100%' }}
                  flag={
                    <span className="beacon__flag beacon__flag--end">
                      <Check aria-hidden="true" />
                      <b>Complete</b>
                    </span>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

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

  const next = activeStory?.nextToWatch ?? null
  const activePos = activeStory ? storyPosition(activeStory) : null
  const epNow = next && next.episodes > 0 ? Math.min((next.progress ?? 0) + 1, next.episodes) : null
  const activeStoryNumber = activeStory ? Math.max(filtered.indexOf(activeStory) + 1, 1) : 1
  const firstYear = activeStory?.seasons[0]?.year
  const originYear = firstYear ? String(firstYear) : ''

  return (
    <div className="app-shell" style={activeStory ? storyAccentVars(activeStory.id) : undefined}>
      <Navbar onImportClick={() => setIsImportOpen(true)} />

      <main>
        {!loading && !isImported && (
          <div className="field-note">
            <span><i aria-hidden="true" /> Sample atlas active</span>
            <button onClick={() => setIsImportOpen(true)} className="cta cta--dim" type="button">
              Import your AniList <ArrowRight aria-hidden="true" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="dashboard-skeleton"><div className="skeleton-hero" /></div>
        ) : activeStory && activePos ? (
          <>
            {/* ═══ THE WORLD — the current story, full-bleed ═══════════ */}
            <DashboardCover
              story={activeStory}
              pos={activePos}
              storyNumber={activeStoryNumber}
              total={filtered.length}
              originYear={originYear}
              epNow={epNow}
            />

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
