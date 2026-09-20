'use client'

import { use, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  Check,
  Film,
  MapPin,
  Play,
  Route,
  Tv,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { Navbar } from '@/components/Navbar'
import { ImportDialog } from '@/components/ImportDialog'
import { StoryPlate } from '@/components/StoryPlate'
import { WordReveal } from '@/components/Reveal'
import { Beacon } from '@/components/Beacon'
import { StoryPath, StoryWaypoint, getWaypointStates, storyPosition } from '@/components/StoryPath'
import { useLibrary } from '@/lib/useLibrary'
import { storyAccentVars } from '@/lib/storyAccent'
import type { Franchise, Season } from '@/lib/franchise'

interface PageProps {
  params: Promise<{ id: string }>
}

function formatIcon(format?: string) {
  return format === 'MOVIE' ? <Film aria-hidden="true" /> : <Tv aria-hidden="true" />
}

function formatWord(format?: string) {
  if (format === 'MOVIE') return 'film'
  return format?.toLowerCase() || 'tv'
}

function currentSeason(franchise: { seasons: Season[]; nextToWatch?: Season | null }) {
  return franchise.nextToWatch || franchise.seasons.find((season) => season.status === 'CURRENT') || null
}

/**
 * The story world — full-bleed cover of a franchise.
 *
 * Motion's useScroll is called HERE, inside the component that owns the
 * ref'd <section>, so the ref is always attached before Motion measures it.
 * (A ref whose element mounts later, or never, makes useScroll throw
 * "Target ref is defined but not hydrated".)
 */
function FranchiseCover({
  franchise,
  pos,
  years,
  originYear,
  epNow,
}: {
  franchise: Franchise
  pos: { total: number; pos: number; fill: number; complete: boolean }
  years: string
  originYear: string
  epNow: number | null
}) {
  const coverRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: coverRef,
    offset: ['start start', 'end start'],
  })
  const artY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])
  const next = franchise.nextToWatch
  const pct = pos.fill * 100

  return (
    <section
      ref={coverRef}
      className="cover cover--deep"
      style={storyAccentVars(franchise.id)}
      aria-labelledby="franchise-title"
    >
      <motion.div className="cover__art" style={{ y: artY }} aria-hidden="true">
        <Image
          src={franchise.bannerUrl || franchise.posterUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>
      <div className="cover__light" aria-hidden="true" />
      <div className="cover__atmos" aria-hidden="true" />
      <span className="cover__watermark" aria-hidden="true">{franchise.name}</span>

      <div className="cover__inner">
        <div className="cover__body">
          <div className="cover__toplink">
            <Link href="/dashboard" className="back-link">
              <ArrowLeft aria-hidden="true" /> All stories
            </Link>
            <a href="#route" className="back-link back-link--accent">
              Trace the route <ArrowDown aria-hidden="true" />
            </a>
          </div>

          <p className="cover__kicker">
            <b>{franchise.genres.slice(0, 3).join(' · ') || 'unclassified'}</b>
            <span>a story in {franchise.seasons.length} movements</span>
            <span className="coords coords--dim" style={{ letterSpacing: '0.1em' }}>{years}</span>
          </p>

          <h1 id="franchise-title" className="cover__title">
            <WordReveal text={franchise.name} as="span" delay={0.45} emphasizeLast />
          </h1>

          <p className="cover__desc">{franchise.description}</p>

          <div className="cover__cta">
            <a href="#route" className="cta">
              Walk the route <ArrowDown aria-hidden="true" />
            </a>
            {next?.siteUrl && epNow && (
              <a href={next.siteUrl} target="_blank" rel="noreferrer" className="cta cta--accent">
                Resume EP {epNow} <Play aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        <div className="cover__plate">
          <StoryPlate
            src={franchise.posterUrl}
            alt={franchise.name}
            plate="01"
            caption={`origin — ${originYear || '—'}`}
            size="md"
            state="current"
            tilt
            eager
          />
        </div>

        <div className="cover__route">
          <div className="route">
            <div className="route__ends">
              <span>Origin{originYear ? ` — ${originYear}` : ''}</span>
              <span>{franchise.seasons.length} entries</span>
              <span>Horizon</span>
            </div>
            <div className="route__track" style={{ '--route-fill': `${pct}%` } as CSSProperties}>
              <div className="route__baseline" />
              <div className="route__ink" />
              {franchise.seasons.map((season, index) => {
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
                    href="#route"
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
                  style={{ left: `${pct}%` }}
                  flag={
                    <span className={`beacon__flag${pct > 82 ? ' beacon__flag--end' : ''}`}>
                      <MapPin aria-hidden="true" />
                      <b>You</b>
                      {next && <em>{next.name}</em>}
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
    const pos = storyPosition(franchise)
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
      pos,
      behind: waypoints.filter((w) => w.state === 'past').length,
      horizon: remaining.length,
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
          <div className="not-found__rose" aria-hidden="true">
            <div className="tp__ring" />
            <div className="tp__ring tp__ring--2" />
            <div className="tp__ring tp__ring--3" />
            <div className="tp__cross-h" />
            <div className="tp__cross-v" />
            <span className="tp__beacon"><Beacon /></span>
          </div>
          <p className="label"><i className="label__dot" aria-hidden="true" /> Unmapped territory</p>
          <h1>
            That story is not<br />in your <em>library.</em>
          </h1>
          <Link href="/dashboard" className="cta">
            <ArrowLeft aria-hidden="true" /> Back to the map
          </Link>
        </section>
        <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      </div>
    )
  }

  const epProgress = data.currentEntry && data.currentEntry.episodes > 0
    ? Math.min(100, ((data.currentEntry.progress ?? 0) / data.currentEntry.episodes) * 100)
    : 0
  const pct = data.pos.fill * 100
  const firstYear = franchise.seasons[0]?.year
  const originYear = firstYear ? String(firstYear) : ''
  const next = data.next

  return (
    <div className="app-shell" style={storyAccentVars(franchise.id)}>
      <Navbar onImportClick={() => setIsImportOpen(true)} />

      <main>
        {/* ═══ THE WORLD — entering a story ═══════════════════════════ */}
        <FranchiseCover
          franchise={franchise}
          pos={data.pos}
          years={data.years}
          originYear={originYear}
          epNow={data.epNow}
        />

        {/* ═══ THE GATE — next destination, full width ════════════════ */}
        {next && (
          <motion.section
            className="gate"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Next destination"
          >
            <div className="gate__art">
              <Image
                src={next.posterUrl || franchise.posterUrl}
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
              />
              <div className="gate__atmos" aria-hidden="true" />
              <div className="gate__art-wash" aria-hidden="true" />
              <span className="gate__cap">
                Waypoint <b>{String(data.nextIndex + 1).padStart(2, '0')}</b> / {String(franchise.seasons.length).padStart(2, '0')}
                {' — '}{formatWord(next.format)} · {next.year || 'undated'}
                {next.episodes ? ` · ${next.episodes} ep` : ''}
              </span>
              {next.siteUrl && (
                <a
                  href={next.siteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="gate__play"
                  aria-label={`Open ${next.name} on AniList`}
                >
                  <Play aria-hidden="true" />
                </a>
              )}
            </div>

            <div className="gate__body">
              <p className="label label--accent">
                <i className="label__dot" aria-hidden="true" /> Next destination
              </p>
              <h2 className="gate__title">
                <WordReveal text={next.name} as="span" inView emphasizeLast />
              </h2>
              <div className="gate__meta">
                <span>{formatIcon(next.format)} {next.format || 'TV'}</span>
                <span>{next.year || 'undated'}</span>
                <span>{next.episodes || '?'} episodes</span>
              </div>
              <div className="gate__cta">
                {next.siteUrl ? (
                  <a href={next.siteUrl} target="_blank" rel="noreferrer" className="cta">
                    Continue watching <ArrowUpRight aria-hidden="true" />
                  </a>
                ) : (
                  <span className="cta cta--dim" aria-disabled="true">Continue watching</span>
                )}
                <a href="#route" className="cta cta--dim">
                  View on the route <ArrowDown aria-hidden="true" />
                </a>
              </div>
            </div>
          </motion.section>
        )}

        {/* ═══ YOU ARE HERE — full-width route readout ════════════════ */}
        <section className="here" aria-label="Your position">
          <div className="here__ends">
            <span>Origin{originYear ? ` — ${originYear}` : ''}</span>
            <span>Horizon</span>
          </div>
          <div className="here__line">
            <motion.div
              className="here__ink"
              style={{ width: `0%` }}
              initial={{ width: '0%' }}
              whileInView={{ width: `${pct}%` }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
            <Beacon className="here__beacon" style={{ left: `${pct}%` }} />
          </div>

          <div className="here__grid">
            <div className="here__zone here__zone--left">
              <span className="here__num">{data.behind}</span>
              <span className="here__label">Behind you</span>
              <span className="here__note">{data.behind === 1 ? 'entry recorded' : 'entries recorded'}</span>
            </div>

            <div className="here__zone here__zone--center">
              <span className="here__you"><i aria-hidden="true" /> You are here</span>
              {data.currentEntry ? (
                <>
                  <h2 className="here__story">{data.currentEntry.name}</h2>
                  {data.currentEntry.episodes > 0 && (
                    <div className="here__ep">
                      <div className="here__ep-line">
                        <span style={{ width: `${epProgress}%` }} />
                      </div>
                      <div className="here__ep-meta">
                        <span>EP {data.epNow || 1}</span>
                        <span>{data.currentEntry.episodes} total</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <h2 className="here__story">
                  <Check aria-hidden="true" /> Route complete
                </h2>
              )}
            </div>

            <div className="here__zone">
              <span className="here__num">{data.horizon}</span>
              <span className="here__label">On the horizon</span>
              <span className="here__note">{data.horizon === 1 ? 'entry ahead' : 'entries ahead'}</span>
            </div>
          </div>
        </section>

        {/* ═══ CHAPTERS — walking the route ═══════════════════════════ */}
        <div id="route">
          <StoryPath franchise={franchise} />
        </div>

        {/* ═══ THE RECORD — ledger of every place you've been ═════════ */}
        <section className="ledger" aria-labelledby="record-title">
          <div className="chapters__head">
            <div>
              <p className="label"><i className="label__dot" aria-hidden="true" /> The record</p>
              <h2 id="record-title" className="h-section">
                Every place <em>you&apos;ve been.</em>
              </h2>
            </div>
          </div>
          <div>
            {data.waypoints.map(({ season, state }, index) => (
              <StoryWaypoint key={season.id} season={season} state={state} index={index} />
            ))}
          </div>
        </section>

        {/* ═══ DISTANCE — what remains, fading into the fog ═══════════ */}
        <section className="distance" aria-labelledby="distance-title">
          <div className="chapters__head">
            <div>
              <p className="label"><i className="label__dot" aria-hidden="true" /> What remains</p>
              <h2 id="distance-title" className="h-section">
                The distance to <em>horizon.</em>
              </h2>
            </div>
          </div>
          {data.remaining.length > 0 ? (
            <div className="distance__list">
              {data.remaining.map(({ season }, index) => (
                <div
                  key={season.id}
                  className="distance__row"
                  style={{ opacity: 1 - Math.min(index * 0.16, 0.65) }}
                >
                  <span className="distance__mark">{String(index + 1).padStart(2, '0')}</span>
                  <span className="distance__name">{season.name}</span>
                  <span className="distance__fill" aria-hidden="true" />
                  <span className="distance__meta">
                    {season.year || '—'} · {season.episodes || '?'} ep
                  </span>
                  {season.siteUrl && (
                    <a
                      href={season.siteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="distance__link"
                      aria-label={`Open ${season.name}`}
                    >
                      <ArrowUpRight aria-hidden="true" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="distance__done">
              <Check aria-hidden="true" />
              <p>
                Nothing remains. <strong>This route is complete</strong> — every entry recorded.
              </p>
            </div>
          )}
        </section>

        {/* ═══ ALMANAC — field data ═══════════════════════════════════ */}
        <aside className="almanac">
          <div>
            <p className="label label--accent">
              <Route aria-hidden="true" style={{ width: 14, height: 14 }} /> Route note
            </p>
            <p className="almanac__note">
              {franchise.name} is a continuous story, told across{' '}
              <em>{franchise.seasons.length} {franchise.seasons.length === 1 ? 'entry' : 'entries'}</em>{' '}
              from {data.years}. You have recorded {franchise.completedSeasons} and stand at the{' '}
              {data.currentEntry ? `threshold of ${data.currentEntry.name}` : 'end of the line'}.
            </p>
          </div>
          <dl>
            <div className="almanac__row">
              <dt>Timeline</dt>
              <span className="fill" aria-hidden="true" />
              <dd>{data.years}</dd>
            </div>
            <div className="almanac__row">
              <dt>Entries</dt>
              <span className="fill" aria-hidden="true" />
              <dd>{franchise.totalSeasons}</dd>
            </div>
            <div className="almanac__row">
              <dt>Episodes logged</dt>
              <span className="fill" aria-hidden="true" />
              <dd>{data.completedEpisodes} / {data.totalEpisodes || '—'}</dd>
            </div>
            <div className="almanac__row">
              <dt>Formats</dt>
              <span className="fill" aria-hidden="true" />
              <dd>{data.formats.join(' · ')}</dd>
            </div>
            <div className="almanac__row">
              <dt>Distance traveled</dt>
              <span className="fill" aria-hidden="true" />
              <dd>{data.progress}%</dd>
            </div>
            <div className="almanac__row">
              <dt>Source</dt>
              <span className="fill" aria-hidden="true" />
              <dd>your AniList library</dd>
            </div>
          </dl>
        </aside>

        {/* ═══ ROUTE END — the closing marker ═════════════════════════ */}
        <div className="route-end">
          <div className="route-end__line">
            <Beacon style={{ left: '50%' }} />
          </div>
          <p className="route-end__text">
            {data.pos.complete ? (
              <>The route is complete — <em>every place you have been, recorded.</em></>
            ) : (
              <>The route continues. <em>{data.horizon} {data.horizon === 1 ? 'entry' : 'entries'} still ahead</em> of you.</>
            )}
          </p>
        </div>
      </main>

      <footer className="colophon">
        <span>StoryDex — a map for the stories you carry</span>
        <span>
          {franchise.completedSeasons} of {franchise.totalSeasons} recorded
        </span>
      </footer>

      <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  )
}
