'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight, Check, Circle, MapPin, Play, Star } from 'lucide-react'
import { StoryPlate } from '@/components/StoryPlate'
import { storyAccentVars } from '@/lib/storyAccent'
import type { Franchise, Season } from '@/lib/franchise'

const EASE = [0.22, 1, 0.36, 1] as const

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

/**
 * Where the traveler stands on this story's route, as a 0..1 fraction:
 * 0 = origin, 1 = horizon. Completed routes sit at the horizon.
 */
export function storyPosition(franchise: Franchise) {
  const total = franchise.seasons.length
  const currentIndex = getCurrentIndex(franchise)
  const complete = total > 0 && franchise.completedSeasons === total
  const pos = complete ? total - 1 : currentIndex >= 0 ? currentIndex : 0
  const fill = total > 1 ? pos / (total - 1) : complete ? 1 : 0
  return { total, currentIndex, complete, pos, fill }
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
// StoryPath — chapters along a spine. The ink fills the spine as you scroll,
// so reading the page literally walks the route.
// ---------------------------------------------------------------------------

export function StoryPath({ franchise }: { franchise: Franchise }) {
  const seasons = franchise.seasons
  const total = seasons.length
  const currentIndex = getCurrentIndex(franchise)

  const states = seasons.map((season, index) => getSeasonState(season, index, currentIndex))
  const behindCount = states.filter((s) => s === 'past').length
  const horizonCount = states.filter((s) => s === 'future').length

  const mapRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: mapRef,
    offset: ['start 72%', 'end 85%'],
  })
  const inkHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <section className="chapters" style={storyAccentVars(franchise.id)} aria-labelledby="journey-title">
      <header className="chapters__head">
        <div>
          <p className="eyebrow">
            <i className="eyebrow__dot" aria-hidden="true" /> The journey
          </p>
          <h2 id="journey-title" className="h-section">
            One route, <em>traveled</em> in {total} chapter{total === 1 ? '' : 's'}.
          </h2>
        </div>
        <div className="chapters__legend" aria-label="Route legend">
          <span><i className="legend-dot legend-dot--past" aria-hidden="true" /> behind you</span>
          <span><i className="legend-dot legend-dot--current" aria-hidden="true" /> your position</span>
          <span><i className="legend-dot legend-dot--future" aria-hidden="true" /> the horizon</span>
        </div>
      </header>

      <div className="chapters__map" ref={mapRef}>
        <div className="spine" aria-hidden="true">
          <div className="spine__line" />
          <motion.div className="spine__ink" style={{ height: inkHeight }} />
        </div>

        {seasons.map((season, index) => {
          const state = states[index]
          const isCurrent = state === 'current'
          const isPast = state === 'past'
          const isFuture = state === 'future'
          const isNext = isCurrent && season.id === franchise.nextToWatch?.id
          const progressPct = season.episodes > 0
            ? Math.min(100, ((season.progress ?? 0) / season.episodes) * 100)
            : 0
          const epPosition = season.episodes > 0
            ? Math.min((season.progress ?? 0) + 1, season.episodes)
            : null
          const score = (season.score ?? 0) > 0 ? (season.score ?? 0) / 10 : null

          return (
            <motion.article
              key={season.id}
              className={`chapter chapter--${state}${index % 2 === 1 ? ' chapter--flip' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-70px' }}
              transition={{ duration: 0.75, ease: EASE }}
            >
              <div className="chapter__node" aria-hidden="true">
                <span className={`node node--${state === 'current' ? 'current' : state}`}>
                  <i />
                </span>
                {isCurrent && <span className="node__flag">You are here</span>}
              </div>

              <div className="chapter__copy">
                <div className="chapter__top">
                  <span className="chapter__folio">{String(index + 1).padStart(2, '0')}</span>
                  <span className="chapter__kicker">
                    Chapter {index + 1} · {season.year || 'undated'}
                  </span>
                </div>
                <h3 className="chapter__title">{season.name}</h3>
                <p className="chapter__meta">
                  {formatLabel(season.format)} · {season.episodes || '?'} episodes
                  {isPast ? ' · recorded' : ''}
                </p>

                {isCurrent && season.episodes > 0 && (
                  <div className="chapter__progress">
                    <div className="chapter__progress-line">
                      <span style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className="chapter__progress-meta">
                      <span>{season.progress ? `resume at EP ${epPosition}` : 'begin at EP 1'}</span>
                      <span>{season.episodes} total</span>
                    </div>
                  </div>
                )}

                {isCurrent && isNext && season.siteUrl && epPosition && (
                  <div className="chapter__cta">
                    <a
                      href={season.siteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="cta cta--accent"
                    >
                      Resume EP {epPosition} <Play aria-hidden="true" />
                    </a>
                  </div>
                )}

                <div className="chapter__stamps">
                  {isPast && (
                    <span className="chapter__stamp">
                      <Check aria-hidden="true" /> recorded {season.year || ''}
                    </span>
                  )}
                  {isPast && score !== null && (
                    <span className="chapter__stamp chapter__stamp--score">
                      <Star aria-hidden="true" /> {score.toFixed(1)}
                    </span>
                  )}
                  {isFuture && (
                    <span className="chapter__stamp chapter__stamp--future">not yet reached</span>
                  )}
                </div>
              </div>

              <div className="chapter__plate">
                {isFuture ? (
                  <div className="plate plate--ghost" aria-hidden="true">
                    <span>unreached</span>
                  </div>
                ) : (
                  <StoryPlate
                    src={season.posterUrl || franchise.posterUrl}
                    alt={season.name}
                    plate={String(index + 1).padStart(2, '0')}
                    caption={`${season.year || '—'} · ${formatLabel(season.format)}`}
                    size={isCurrent ? 'lg' : 'sm'}
                    tilt
                  />
                )}
              </div>
            </motion.article>
          )
        })}

        <div className="chapters__end">
          <span className="node node--end" aria-hidden="true"><i /></span>
          <span className="chapters__end-label">Horizon</span>
        </div>
      </div>

      <footer className="chapters__foot">
        <span>Your position is anchored to the next unwatched entry.</span>
        <span>{behindCount} behind · {horizonCount} on the horizon</span>
      </footer>
    </section>
  )
}

// ---------------------------------------------------------------------------
// StoryWaypoint — compact ledger row
// ---------------------------------------------------------------------------

interface StoryWaypointProps {
  season: Season
  state: 'past' | 'current' | 'future'
  index: number
}

export function StoryWaypoint({ season, state, index }: StoryWaypointProps) {
  const format = formatLabel(season.format)
  const progressPct = season.episodes > 0 && season.progress !== undefined
    ? Math.min(100, (season.progress / season.episodes) * 100)
    : 0

  const inner = (
    <>
      <div className="ledger__idx">{String(index + 1).padStart(2, '0')}</div>
      <div className="ledger__art">
        <Image src={season.posterUrl || '/placeholder.svg'} alt="" fill sizes="64px" />
      </div>
      <div className="ledger__copy">
        <div className="ledger__title-row">
          <h3 className="ledger__title">{season.name}</h3>
          <span className={`ledger__state ledger__state--${state}`}>
            {state === 'past' && <Check aria-hidden="true" />}
            {state === 'current' && <MapPin aria-hidden="true" />}
            {state === 'future' && <Circle aria-hidden="true" />}
            {state === 'current' ? 'your position' : state === 'past' ? 'recorded' : 'ahead'}
          </span>
        </div>
        <p className="ledger__meta">
          {format} · {season.year || 'undated'} · {season.episodes || '?'} episodes
        </p>
        {state === 'current' && season.episodes > 0 && season.progress !== undefined && (
          <div className="ledger__progress">
            <span style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </div>
      <ArrowUpRight className="ledger__arrow" aria-hidden="true" />
    </>
  )

  return season.siteUrl ? (
    <Link
      href={season.siteUrl}
      target="_blank"
      rel="noreferrer"
      className={`ledger__row ledger__row--${state}`}
      aria-label={`Open ${season.name} on AniList`}
    >
      {inner}
    </Link>
  ) : (
    <div className={`ledger__row ledger__row--${state}`}>{inner}</div>
  )
}

export function getWaypointStates(franchise: Franchise) {
  const currentIndex = getCurrentIndex(franchise)
  return franchise.seasons.map((season, index) => ({
    season,
    state: getSeasonState(season, index, currentIndex) as 'past' | 'current' | 'future',
  }))
}
