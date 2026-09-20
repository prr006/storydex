'use client'

import { use, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  ExternalLink,
  Film,
  MapPin,
  Play,
  Radio,
  Route,
  Tv,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { ImportDialog } from '@/components/ImportDialog'
import { StoryPath, StoryWaypoint, getWaypointStates } from '@/components/StoryPath'
import { useLibrary } from '@/lib/useLibrary'
import { storyAccentVars } from '@/lib/storyAccent'
import type { Season } from '@/lib/franchise'

interface PageProps {
  params: Promise<{ id: string }>
}

function formatIcon(format?: string) {
  return format === 'MOVIE' ? <Film aria-hidden="true" /> : <Tv aria-hidden="true" />
}

function currentSeason(franchise: { seasons: Season[]; nextToWatch?: Season | null }) {
  return franchise.nextToWatch || franchise.seasons.find((season) => season.status === 'CURRENT') || null
}

export default function FranchiseDetail({ params }: PageProps) {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const { id } = use(params)
  const { franchises, loading } = useLibrary()
  const franchise = franchises.find((item) => item.id === id)

  const data = useMemo(() => {
    if (!franchise) return null
    const years = franchise.seasons.map((season) => season.year).filter(Boolean)
    const totalEpisodes = franchise.seasons.reduce((sum, season) => sum + (season.episodes || 0), 0)
    const completedEpisodes = franchise.seasons.reduce((sum, season) => {
      if (season.completed) return sum + (season.episodes || 0)
      return sum + Math.min(season.progress || 0, season.episodes || 0)
    }, 0)
    const formats = Array.from(new Set(franchise.seasons.map((season) => season.format || 'TV')))
    const next = currentSeason(franchise)
    const waypoints = getWaypointStates(franchise)
    const currentIndex = waypoints.findIndex((w) => w.state === 'current')
    const currentEntry = currentIndex >= 0 ? franchise.seasons[currentIndex] : null
    const remaining = waypoints.filter((w) => w.state === 'future')
    return {
      progress: franchise.totalSeasons ? Math.round((franchise.completedSeasons / franchise.totalSeasons) * 100) : 0,
      years: years.length ? `${Math.min(...years)} — ${Math.max(...years)}` : 'undated',
      totalEpisodes,
      completedEpisodes,
      formats,
      next,
      nextIndex: next ? franchise.seasons.findIndex((s) => s.id === next.id) : -1,
      waypoints,
      currentIndex,
      currentEntry,
      remaining,
      epNow: currentEntry && currentEntry.episodes > 0
        ? Math.min((currentEntry.progress ?? 0) + 1, currentEntry.episodes) : null,
    }
  }, [franchise])

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onImportClick={() => setIsImportOpen(true)} />
        <div className="dashboard-skeleton"><div className="skeleton-hero" /></div>
      </div>
    )
  }

  if (!franchise || !data) {
    return (
      <div className="app-shell">
        <Navbar onImportClick={() => setIsImportOpen(true)} />
        <section className="not-found">
          <p className="eyebrow"><i className="eyebrow__dot" /> Unmapped territory</p>
          <h1>That story is not<br />in your library.</h1>
          <Link href="/dashboard" className="button button--light"><ArrowLeft aria-hidden="true" /> Back to the map</Link>
        </section>
        <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      </div>
    )
  }

  const epProgress = data.currentEntry && data.currentEntry.episodes > 0
    ? Math.min(100, ((data.currentEntry.progress ?? 0) / data.currentEntry.episodes) * 100) : 0
  const behind = data.waypoints.filter((w) => w.state === 'past').length
  const horizon = data.remaining.length

  return (
    <div className="app-shell franchise-page" style={storyAccentVars(franchise.id)}>
      <Navbar onImportClick={() => setIsImportOpen(true)} />

      <main>
        {/* ═══ STORY WORLD — atmospheric entry ═══════════════════════ */}
        <section className="franchise-hero">
          <div className="franchise-hero__backdrop">
            <Image src={franchise.bannerUrl || franchise.posterUrl} alt="" fill priority sizes="100vw" className="object-cover" />
          </div>
          <div className="franchise-hero__wash" />
          <div className="franchise-hero__grain" />
          <span className="franchise-hero__landmark" aria-hidden="true">{franchise.name}</span>

          <div className="franchise-hero__content">
            <div className="franchise-hero__nav">
              <Link href="/dashboard" className="back-link"><ArrowLeft aria-hidden="true" /> all stories</Link>
              <a href="#journey" className="back-link back-link--down">trace the route <ArrowDown aria-hidden="true" /></a>
            </div>

            <div className="franchise-hero__body">
              <motion.div
                className="franchise-hero__poster"
                initial={{ opacity: 0, y: 30, rotate: -1.5 }}
                animate={{ opacity: 1, y: 0, rotate: -1.5 }}
                transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
              >
                <Image src={franchise.posterUrl} alt={franchise.name} fill sizes="220px" className="object-cover" />
              </motion.div>

              <motion.div
                className="franchise-hero__copy"
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.25, ease: 'easeOut' }}
              >
                <div className="tag-line">{franchise.genres.slice(0, 4).map((genre) => <span key={genre}>{genre}</span>)}</div>
                <p className="franchise-hero__kicker">A story in {franchise.seasons.length} movements</p>
                <h1>{franchise.name}</h1>
                <p className="franchise-hero__description">{franchise.description}</p>
                <div className="franchise-hero__metrics">
                  <span><strong>{data.progress}%</strong> complete</span>
                  <span><strong>{franchise.completedSeasons}</strong> of {franchise.totalSeasons}</span>
                  {data.currentEntry && <span className="metric-live"><i /> at {data.currentEntry.name}</span>}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══ NEXT DESTINATION — departure gate ═════════════════════ */}
        {data.next && (
          <motion.section
            className="departure"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            aria-label="Next destination"
          >
            <div className="departure__header">
              <span className="eyebrow eyebrow--accent"><i className="eyebrow__dot eyebrow__dot--story" /> Next destination</span>
              <span className="departure__waypoint">waypoint {String(data.nextIndex + 1).padStart(2, '0')} of {franchise.seasons.length}</span>
            </div>
            <div className="departure__body">
              <div className="departure__art">
                <Image src={data.next.posterUrl || franchise.posterUrl} alt="" fill sizes="280px" className="object-cover" />
                <div className="departure__art-wash" />
                {data.next.siteUrl && (
                  <a href={data.next.siteUrl} target="_blank" rel="noreferrer" className="departure__play" aria-label={`Open ${data.next.name} on AniList`}>
                    <Play aria-hidden="true" />
                  </a>
                )}
              </div>
              <div className="departure__copy">
                <h2>{data.next.name}</h2>
                <div className="departure__meta">
                  <span>{formatIcon(data.next.format)} {data.next.format || 'TV'}</span>
                  <span>{data.next.year || 'undated'}</span>
                  <span>{data.next.episodes || '?'} episodes</span>
                </div>
                <div className="departure__actions">
                  {data.next.siteUrl ? (
                    <a href={data.next.siteUrl} target="_blank" rel="noreferrer" className="button button--light">
                      Continue watching <ExternalLink aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="button button--light" aria-disabled="true">Continue watching</span>
                  )}
                  <a href="#journey" className="button button--outline">View on the route <ArrowDown aria-hidden="true" /></a>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* ═══ YOUR POSITION — compass readout ═══════════════════════ */}
        <motion.section
          className="compass"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
          aria-label="Your position"
        >
          <div className="compass__col">
            <span className="compass__label">Behind you</span>
            <strong className="compass__value">{behind}</strong>
            <span className="compass__note">{behind === 1 ? 'entry' : 'entries'} recorded</span>
          </div>
          <div className="compass__center">
            <span className="compass__label"><MapPin aria-hidden="true" /> You are here</span>
            {data.currentEntry ? (
              <>
                <strong className="compass__value compass__value--story">{data.currentEntry.name}</strong>
                {data.currentEntry.episodes > 0 && (
                  <div className="compass__progress">
                    <div className="readout-line"><span style={{ width: `${epProgress}%` }} /></div>
                    <small>EP {data.epNow || 1} of {data.currentEntry.episodes}</small>
                  </div>
                )}
              </>
            ) : (
              <strong className="compass__value compass__value--done"><Check aria-hidden="true" /> Route complete</strong>
            )}
          </div>
          <div className="compass__col compass__col--end">
            <span className="compass__label">On the horizon</span>
            <strong className="compass__value">{horizon}</strong>
            <span className="compass__note">{horizon === 1 ? 'entry' : 'entries'} ahead</span>
          </div>
        </motion.section>

        {/* ═══ THE JOURNEY — the main event ══════════════════════════ */}
        <div id="journey" className="franchise-layout__journey">
          <StoryPath franchise={franchise} />
        </div>

        {/* ═══ THE RECORD — compact strip ════════════════════════════ */}
        <section className="record-strip" aria-labelledby="record-title">
          <div className="record-strip__head">
            <p className="eyebrow"><i className="eyebrow__dot" /> The record</p>
            <h2 id="record-title">Every place you&apos;ve been.</h2>
          </div>
          <div className="record-strip__track">
            {data.waypoints.map(({ season, state }, index) => (
              <StoryWaypoint key={season.id} season={season} state={state} index={index} />
            ))}
          </div>
        </section>

        {/* ═══ WHAT REMAINS — atmospheric ═════════════════════════════ */}
        <section className="horizon" aria-labelledby="horizon-title">
          <div className="horizon__head">
            <p className="eyebrow"><i className="eyebrow__dot" /> What remains</p>
            <h2 id="horizon-title">The distance to horizon.</h2>
          </div>
          {data.remaining.length > 0 ? (
            <div className="horizon__list">
              {data.remaining.map(({ season }, index) => (
                <div key={season.id} className="horizon__item" style={{ opacity: 1 - Math.min(index * 0.15, 0.7) }}>
                  <span className="horizon__mark">{String(index + 1).padStart(2, '0')}</span>
                  <span className="horizon__name">{season.name}</span>
                  <span className="horizon__meta">{season.year || '—'} · {season.episodes || '?'} ep</span>
                  {season.siteUrl && (
                    <a href={season.siteUrl} target="_blank" rel="noreferrer" className="horizon__link" aria-label={`Open ${season.name}`}>
                      <ArrowUpRight aria-hidden="true" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="horizon__done">
              <Check aria-hidden="true" />
              <p>Nothing remains. <strong>This route is complete</strong> — every entry recorded.</p>
            </div>
          )}
        </section>

        {/* ═══ FIELD RAIL ═════════════════════════════════════════════ */}
        <aside className="franchise-rail">
          <div className="rail-sticky">
            <div className="rail-note">
              <Route aria-hidden="true" />
              <p>Route note</p>
              <strong>{franchise.name} is a continuous story told across {franchise.seasons.length} entries.</strong>
            </div>
            <div className="rail-data">
              <p className="eyebrow"><i className="eyebrow__dot" /> Field notes</p>
              <dl>
                <div><dt><CalendarDays /> Timeline</dt><dd>{data.years}</dd></div>
                <div><dt><Clock3 /> Episodes logged</dt><dd>{data.completedEpisodes} / {data.totalEpisodes || '—'}</dd></div>
                <div><dt><Radio /> Formats</dt><dd>{data.formats.join(' · ')}</dd></div>
              </dl>
            </div>
            <div className="rail-progress">
              <div className="rail-progress__top"><span>Distance traveled</span><strong>{data.progress}%</strong></div>
              <div className="readout-line"><span style={{ width: `${data.progress}%` }} /></div>
              <div className="rail-progress__bottom"><span>{franchise.completedSeasons} recorded</span><span>{franchise.totalSeasons - franchise.completedSeasons} remain</span></div>
              <div className="rail-progress__stamp"><Check aria-hidden="true" /> updated from your library</div>
            </div>
          </div>
        </aside>
      </main>

      <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  )
}
