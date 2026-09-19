'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Check, Circle, Play, Radio, Sparkles } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { Franchise, Season } from '@/lib/franchise'

interface StoryPathProps {
  franchise: Franchise
  compact?: boolean
}

function getSeasonState(season: Season, index: number, currentIndex: number) {
  if (season.status === 'CURRENT' || index === currentIndex) return 'current'
  if (season.completed || season.status === 'COMPLETED' || season.status === 'REPEATING') return 'past'
  return 'future'
}

function getCurrentIndex(franchise: Franchise) {
  const nextIndex = franchise.nextToWatch
    ? franchise.seasons.findIndex((season) => season.id === franchise.nextToWatch?.id)
    : -1
  if (nextIndex >= 0) return nextIndex
  const watchingIndex = franchise.seasons.findIndex((season) => season.status === 'CURRENT')
  return watchingIndex
}

function pathPosition(index: number, total: number) {
  if (total <= 1) return { left: '50%', top: '52%' }
  const progress = index / (total - 1)
  const wave = Math.sin(progress * Math.PI * 2.15) * 15
  return {
    left: `${8 + progress * 84}%`,
    top: `${52 + wave - progress * 10}%`,
  }
}

function statusLabel(state: string) {
  if (state === 'past') return 'recorded'
  if (state === 'current') return 'your position'
  return 'ahead'
}

export function StoryPath({ franchise, compact = false }: StoryPathProps) {
  const currentIndex = getCurrentIndex(franchise)
  const total = franchise.seasons.length
  const currentStop = currentIndex >= 0 ? (currentIndex / Math.max(total - 1, 1)) * 100 : 100

  return (
    <section className={`story-path ${compact ? 'story-path--compact' : ''}`} aria-labelledby="story-path-title">
      <div className="story-path__heading">
        <div>
          <p className="eyebrow"><span className="eyebrow__dot" /> The journey</p>
          <h2 id="story-path-title">Past, present, and what waits ahead.</h2>
        </div>
        <div className="story-path__legend" aria-label="Story path legend">
          <span><i className="legend-dot legend-dot--past" /> recorded</span>
          <span><i className="legend-dot legend-dot--current" /> your position</span>
          <span><i className="legend-dot legend-dot--future" /> ahead</span>
        </div>
      </div>

      <div className="story-path__canvas">
        <div className="story-path__axis story-path__axis--start">ORIGIN</div>
        <div className="story-path__axis story-path__axis--end">HORIZON</div>
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={`path-gradient-${franchise.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(221,230,218,.24)" />
              <stop offset={`${total ? currentStop : 50}%`} stopColor="rgba(238,126,80,.95)" />
              <stop offset="100%" stopColor="rgba(160,173,174,.14)" />
            </linearGradient>
          </defs>
          <path
            d="M 4 28 C 14 7, 20 34, 31 18 S 48 9, 56 24 S 72 38, 81 17 S 92 8, 97 13"
            fill="none"
            stroke={`url(#path-gradient-${franchise.id})`}
            strokeWidth="0.7"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M 4 28 C 14 7, 20 34, 31 18 S 48 9, 56 24 S 72 38, 81 17 S 92 8, 97 13"
            fill="none"
            stroke="rgba(255,255,255,.08)"
            strokeWidth="0.18"
            strokeDasharray="1 2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {franchise.seasons.map((season, index) => {
          const state = getSeasonState(season, index, currentIndex)
          const position = pathPosition(index, total)
          const content = (
            <>
              <span className={`story-path__node story-path__node--${state}`}>
                {state === 'past' && <Check aria-hidden="true" />}
                {state === 'current' && <Radio aria-hidden="true" />}
                {state === 'future' && <Circle aria-hidden="true" />}
              </span>
              <span className="story-path__label">
                <strong>{season.name}</strong>
                <small>{season.year || 'undated'} · {statusLabel(state)}</small>
              </span>
            </>
          )

          return season.siteUrl ? (
            <Link
              key={season.id}
              href={season.siteUrl}
              target="_blank"
              rel="noreferrer"
              className={`story-path__waypoint story-path__waypoint--${state}`}
              style={{ top: position.top, '--waypoint-left': position.left, '--waypoint-index': index } as CSSProperties}
              aria-label={`Open ${season.name} on AniList`}
            >
              {content}
            </Link>
          ) : (
            <div
              key={season.id}
              className={`story-path__waypoint story-path__waypoint--${state}`}
              style={{ top: position.top, '--waypoint-left': position.left, '--waypoint-index': index } as CSSProperties}
            >
              {content}
            </div>
          )
        })}
      </div>

      {!compact && (
        <div className="story-path__footnote">
          <span><Sparkles aria-hidden="true" /> Your current position is anchored to the next unwatched entry.</span>
          <span>{total} {total === 1 ? 'waypoint' : 'waypoints'} in this story</span>
        </div>
      )}
    </section>
  )
}

interface StoryWaypointProps {
  season: Season
  state: 'past' | 'current' | 'future'
  index: number
}

export function StoryWaypoint({ season, state, index }: StoryWaypointProps) {
  const format = season.format === 'MOVIE' ? 'film' : season.format?.toLowerCase() || 'tv'
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
            {state === 'current' && <Play aria-hidden="true" />}
            {state === 'future' && <Circle aria-hidden="true" />}
            {state === 'current' ? 'current' : state === 'past' ? 'watched' : 'planned'}
          </span>
        </div>
        <p>{format} · {season.year || 'undated'} · {season.episodes || '?'} episodes</p>
        {state === 'current' && season.episodes > 0 && season.progress !== undefined && (
          <div className="story-ledger__progress">
            <span style={{ width: `${Math.min(100, (season.progress / season.episodes) * 100)}%` }} />
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