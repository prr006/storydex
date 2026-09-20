'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, Check, Circle, Compass, MapPin } from 'lucide-react'
import type { CSSProperties } from 'react'
import { storyAccentVars } from '@/lib/storyAccent'
import type { Franchise, Season } from '@/lib/franchise'

interface StoryPathProps {
  franchise: Franchise
}

// ---------------------------------------------------------------------------
// Route geometry — much larger, spatial variation
// ---------------------------------------------------------------------------
const CANVAS_W = 1100
const ROW_H = 260
const TOP_PAD = 100
const BOTTOM_PAD = 160

function nodeX(index: number, total: number) {
  // Wider wandering with asymmetric rhythm
  const phase = index * 1.8 + 0.9
  const sway = Math.sin(phase) * (CANVAS_W * 0.30)
  // Push first and last nodes toward center for framing
  const edgeFade = index === 0 || index === total - 1 ? 0.6 : 1
  return CANVAS_W / 2 + sway * edgeFade
}

function nodeY(index: number) {
  return TOP_PAD + index * ROW_H
}

interface RoutePoint { x: number; y: number }

function routePathD(points: RoutePoint[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

function cardSide(index: number, x: number): 'left' | 'right' {
  if (x < CANVAS_W * 0.35) return 'right'
  if (x > CANVAS_W * 0.65) return 'left'
  return index % 2 === 0 ? 'right' : 'left'
}

// ---------------------------------------------------------------------------
// Story state
// ---------------------------------------------------------------------------

export function getCurrentIndex(franchise: Franchise) {
  const nextIndex = franchise.nextToWatch
    ? franchise.seasons.findIndex((season) => season.id === franchise.nextToWatch?.id)
    : -1
  if (nextIndex >= 0) return nextIndex
  return franchise.seasons.findIndex((season) => season.status === 'CURRENT')
}

function getSeasonState(season: Season, index: number, currentIndex: number): 'past' | 'current' | 'future' {
  if (index === currentIndex || season.status === 'CURRENT') return 'current'
  if (index < currentIndex) return 'past'
  if (season.completed || season.status === 'COMPLETED' || season.status === 'REPEATING') return 'past'
  return 'future'
}

function formatLabel(format?: string) {
  if (format === 'MOVIE') return 'film'
  return format?.toLowerCase() || 'tv'
}

// ---------------------------------------------------------------------------
// StoryPath — the journey map
// ---------------------------------------------------------------------------

export function StoryPath({ franchise }: StoryPathProps) {
  const seasons = franchise.seasons
  const total = seasons.length
  const currentIndex = getCurrentIndex(franchise)

  const points = seasons.map((_, index) => ({ x: nodeX(index, total), y: nodeY(index) }))
  const canvasH = total > 0 ? nodeY(total - 1) + BOTTOM_PAD : 300

  const states = seasons.map((season, index) => getSeasonState(season, index, currentIndex))
  const behindCount = states.filter((s) => s === 'past').length
  const horizonCount = states.filter((s) => s === 'future').length

  const traveledPoints = points.slice(0, Math.max(currentIndex + 1, 1))
  const aheadPoints = currentIndex >= 0 && currentIndex < total - 1 ? points.slice(currentIndex) : []

  return (
    <section className="journey" style={storyAccentVars(franchise.id)} aria-labelledby="journey-title">
      <header className="journey__head">
        <div className="journey__head-copy">
          <p className="eyebrow"><i className="eyebrow__dot" /> The journey</p>
          <h2 id="journey-title">
            One route,<br />traveled in {total} chapter{total === 1 ? '' : 's'}.
          </h2>
        </div>
        <div className="journey__legend" aria-label="Route legend">
          <span><i className="legend-dot legend-dot--past" /> behind you</span>
          <span><i className="legend-dot legend-dot--current" /> your position</span>
          <span><i className="legend-dot legend-dot--future" /> horizon</span>
        </div>
      </header>

      <div className="journey__viewport">
        <div className="journey__canvas" style={{ height: canvasH }}>
          <span className="journey__axis journey__axis--origin">Origin</span>
          <span className="journey__axis journey__axis--horizon">Horizon</span>

          <svg
            className="journey__route"
            viewBox={`0 0 ${CANVAS_W} ${canvasH}`}
            width={CANVAS_W}
            height={canvasH}
            aria-hidden="true"
          >
            {/* Atmospheric glow along the full path */}
            <path className="journey__route-line journey__route-line--atmosphere" d={routePathD(points)} />
            {/* Ahead portion — faint, dashed */}
            {aheadPoints.length > 1 && (
              <path className="journey__route-line journey__route-line--ahead" d={routePathD(aheadPoints)} />
            )}
            {/* Traveled portion — solid, glowing */}
            {traveledPoints.length > 0 && (
              <>
                <path className="journey__route-line journey__route-line--glow" d={routePathD(traveledPoints)} />
                <path
                  className="journey__route-line journey__route-line--traveled"
                  d={routePathD(traveledPoints)}
                  pathLength={1}
                />
              </>
            )}
          </svg>

          {seasons.map((season, index) => {
            const state = states[index]
            const point = points[index]
            const side = cardSide(index, point.x)
            const isCurrent = state === 'current'
            const isNext = isCurrent && season.id === franchise.nextToWatch?.id
            const isPast = state === 'past'
            const isFuture = state === 'future'
            const showArt = (isCurrent || isNext) && Boolean(season.posterUrl)
            const progressPct = season.episodes > 0 ? Math.min(100, ((season.progress ?? 0) / season.episodes) * 100) : 0
            const epPosition = season.episodes > 0 ? Math.min((season.progress ?? 0) + 1, season.episodes) : null

            // Determine waypoint importance for visual hierarchy
            const importance = isCurrent ? 'dominant' : isNext ? 'prominent' : isPast ? 'visited' : 'distant'

            const card = (
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: Math.min(index * 0.06, 0.35), ease: 'easeOut' }}
                className={`journey__card journey__card--${state} journey__card--${side} journey__card--${importance}`}
              >
                {/* Chapter landmark */}
                <header className="journey__card-head">
                  <span className="journey__chapter">CH. {String(index + 1).padStart(2, '0')}</span>
                  <span className="journey__year">{season.year || 'undated'}</span>
                </header>

                {/* Destination flag */}
                {isNext && (
                  <span className="journey__flag"><MapPin aria-hidden="true" /> Next destination</span>
                )}

                {/* Artwork at key points */}
                {showArt && (
                  <div className="journey__art">
                    <Image src={season.posterUrl as string} alt="" fill sizes="400px" className="object-cover" />
                    <div className="journey__art-wash" />
                  </div>
                )}

                <h3 className="journey__title">{season.name}</h3>
                <p className="journey__meta">
                  {formatLabel(season.format)} · {season.episodes || '?'} episodes
                  {isPast ? ' · recorded' : ''}
                </p>

                {/* Progress for current */}
                {isCurrent && season.episodes > 0 && (
                  <div className="journey__progress">
                    <div className="readout-line"><span style={{ width: `${progressPct}%` }} /></div>
                    <small>
                      {season.progress ? `Resume at EP ${epPosition}` : 'Begin at EP 1'} · {season.episodes} total
                    </small>
                  </div>
                )}

                {isFuture && <p className="journey__await">still on the horizon</p>}
              </motion.article>
            )

            const stopInner = (
              <>
                <span className={`journey__node journey__node--${importance}`} aria-hidden="true">
                  {isPast && <Check />}
                  {isCurrent && <MapPin />}
                  {isFuture && <Circle />}
                </span>
                {isCurrent && <span className="journey__you">You are here</span>}
                {card}
              </>
            )

            return (
              <div
                key={season.id}
                className={`journey__stop journey__stop--${state} journey__stop--${importance}`}
                style={{ '--stop-x': `${point.x}px`, '--stop-y': `${point.y}px` } as CSSProperties}
              >
                {season.siteUrl ? (
                  <Link
                    href={season.siteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="journey__stop-link"
                    aria-label={`Open ${season.name} on AniList`}
                  >
                    {stopInner}
                    <span className="journey__stop-out"><ArrowUpRight aria-hidden="true" /></span>
                  </Link>
                ) : (
                  stopInner
                )}
              </div>
            )
          })}
        </div>
      </div>

      <footer className="journey__footnote">
        <span><Compass aria-hidden="true" /> Your position is anchored to the next unwatched entry.</span>
        <span>{behindCount} behind · {horizonCount} on the horizon</span>
      </footer>
    </section>
  )
}

// ---------------------------------------------------------------------------
// StoryWaypoint — compact record row
// ---------------------------------------------------------------------------

interface StoryWaypointProps {
  season: Season
  state: 'past' | 'current' | 'future'
  index: number
}

export function StoryWaypoint({ season, state, index }: StoryWaypointProps) {
  const format = season.format === 'MOVIE' ? 'film' : formatLabel(season.format)
  const progressPct = season.episodes > 0 && season.progress !== undefined
    ? Math.min(100, (season.progress / season.episodes) * 100) : 0

  const inner = (
    <>
      <div className="story-ledger__index">{String(index + 1).padStart(2, '0')}</div>
      <div className="story-ledger__art">
        <Image src={season.posterUrl || '/placeholder.svg'} alt="" fill sizes="64px" />
      </div>
      <div className="story-ledger__copy">
        <div className="story-ledger__title-row">
          <h3>{season.name}</h3>
          <span className={`status status--${state}`}>
            {state === 'past' && <Check aria-hidden="true" />}
            {state === 'current' && <MapPin aria-hidden="true" />}
            {state === 'future' && <Circle aria-hidden="true" />}
            {state === 'current' ? 'your position' : state === 'past' ? 'recorded' : 'ahead'}
          </span>
        </div>
        <p>{format} · {season.year || 'undated'} · {season.episodes || '?'} episodes</p>
        {state === 'current' && season.episodes > 0 && season.progress !== undefined && (
          <div className="story-ledger__progress">
            <span style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </div>
      <ArrowUpRight className="story-ledger__arrow" aria-hidden="true" />
    </>
  )

  return season.siteUrl ? (
    <Link href={season.siteUrl} target="_blank" rel="noreferrer" className={`story-ledger__row story-ledger__row--${state}`}>
      {inner}
    </Link>
  ) : (
    <div className={`story-ledger__row story-ledger__row--${state}`}>{inner}</div>
  )
}

export function getWaypointStates(franchise: Franchise) {
  const currentIndex = getCurrentIndex(franchise)
  return franchise.seasons.map((season, index) => ({
    season,
    state: getSeasonState(season, index, currentIndex) as 'past' | 'current' | 'future',
  }))
}
