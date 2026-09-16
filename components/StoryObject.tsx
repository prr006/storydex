'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Cover } from '@/components/Cover'
import { Atmosphere } from '@/components/Atmosphere'
import { StoryPath } from '@/components/Path'
import { StatusChip } from '@/components/StatusMark'
import { cn } from '@/lib/utils'
import {
  accentVars,
  getEpisodeTotal,
  getStoryPhase,
  getStoryProgress,
  phaseToStatus,
  storyArtwork,
} from '@/lib/design'
import { EASE } from '@/lib/motion'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   StoryObject
   --------------------------------------------------------------------------
   A franchise rendered as one object, not a card with a picture in it.

   The composition is the same every time, and it is the product's thesis:

     ┌───────────────────────────────────────────────────────────────┐
     │  the story's widest artwork, bleeding past the panel          │
     │                                                               │
     │        ◣◣◣◣  the entry covers, fanned along the foot,         │
     │        ◣◣◣◣  rotated a few degrees, sized by how many there   │
     │        ◣◣◣◣  are — a six-entry saga is a deeper stack than a  │
     │              single film, and you can see that before reading │
     ├───────────────────────────────────────────────────────────────┤
     │  TITLE                          year — year        [state]    │
     │  ●━━●━━●━━◉━━○━━○   the path across the whole story            │
     │  6 entries · 420 eps · 4 watched                    96%       │
     └───────────────────────────────────────────────────────────────┘

   The covers fan out further and straighten on hover: the object opens like a
   hand of cards. It is the one hover effect in the product with any ambition,
   and it exists because the *entries* are the thing worth revealing.
   ========================================================================== */

interface StoryObjectProps {
  franchise: Franchise
  index?: number
  /** `card` for grids, `feature` for the collections page. */
  variant?: 'card' | 'feature'
  className?: string
}

export function StoryObject({ franchise, index = 0, variant = 'card', className }: StoryObjectProps) {
  const progress = getStoryProgress(franchise)
  const phase = getStoryPhase(franchise)
  const art = storyArtwork(franchise)
  const episodes = getEpisodeTotal(franchise)
  const years = franchise.seasons.map((season) => season.year).filter((year) => year > 0)
  const percent = Math.round(progress.ratio * 100)

  // Up to five covers, so the fan never becomes a smear.
  const fan = franchise.seasons.slice(0, 5)
  const feature = variant === 'feature'

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: Math.min(index * 0.05, 0.3), ease: EASE }}
      className={cn('group/obj', className)}
      style={accentVars(franchise)}
    >
      <Link href={`/franchise/${franchise.id}`} className="block">
        <div
          className={cn(
            'relative overflow-hidden rounded-lg border border-line bg-surface transition-all duration-500 ease-out',
            'group-hover/obj:-translate-y-1 group-hover/obj:border-white/15 group-hover/obj:card-shadow',
          )}
        >
          {/* ── Artwork: the story's own widest image, lit by its own air ── */}
          <div className={cn('relative overflow-hidden', feature ? 'aspect-[21/9]' : 'aspect-[16/9]')}>
            <Atmosphere story={franchise} intensity="faint" />

            {art ? (
              <div
                className={cn(
                  'absolute inset-0 bg-cover transition-transform duration-[900ms] ease-out group-hover/obj:scale-[1.04]',
                  art.isBanner ? 'bg-center' : 'bg-[center_26%]',
                )}
                style={{ backgroundImage: `url(${art.src})` }}
                aria-hidden
              />
            ) : (
              <div
                className="absolute inset-0"
                aria-hidden
                style={{
                  background: `radial-gradient(80% 80% at 30% 25%, color-mix(in oklab, var(--accent) 45%, #0b0d12) 0%, #0b0d12 75%)`,
                }}
              />
            )}

            {/* A scrim whose only job is to let the covers read. */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, rgba(5,6,9,0.92) 0%, rgba(5,6,9,0.55) 38%, rgba(5,6,9,0.06) 78%)',
              }}
            />

            {/* State, floating on the artwork — the only chrome up here. */}
            <div className="absolute right-3 top-3">
              <StatusChip status={phaseToStatus(phase)} size="xs" />
            </div>

            {/* ── The entry covers, fanned along the foot ── */}
            <div
              className={cn(
                'absolute bottom-0 flex items-end pl-4',
                feature ? 'h-[104px]' : 'h-[78px]',
              )}
              aria-hidden
            >
              {fan.map((season, position) => {
                const spread = fan.length > 1 ? position - (fan.length - 1) / 2 : 0
                return (
                  <span
                    key={season.id}
                    className={cn(
                      'relative block shrink-0 origin-bottom overflow-hidden rounded-sm art-edge',
                      'transition-all duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                      position > 0 && (feature ? '-ml-5' : '-ml-4'),
                      feature ? 'h-[92px] w-[64px]' : 'h-[70px] w-[48px]',
                    )}
                    style={{
                      zIndex: 10 + position,
                      transform: `rotate(${spread * (feature ? 3.4 : 3)}deg) translateY(${Math.abs(spread) * 3}px)`,
                    }}
                  >
                    <Cover
                      src={season.posterUrl}
                      alt=""
                      ratio="2/3"
                      rounded={false}
                      edged={false}
                      sizes={feature ? '64px' : '48px'}
                      className="h-full w-full"
                    />
                  </span>
                )
              })}

              {franchise.seasons.length > fan.length && (
                <span
                  className={cn(
                    'relative -ml-4 grid shrink-0 place-items-center rounded-sm bg-black/75 text-small font-semibold text-white/85 art-edge',
                    feature ? 'h-[92px] w-[64px]' : 'h-[70px] w-[48px]',
                  )}
                  style={{ zIndex: 20 }}
                >
                  +{franchise.seasons.length - fan.length}
                </span>
              )}
            </div>

            {/* The path runs across the foot of the artwork, over the covers —
                the story's route, visible before you read a number. */}
            <div className="absolute inset-x-4 bottom-3">
              <StoryPath entries={franchise.seasons} size={feature ? 'rail' : 'spark'} className="opacity-95" />
            </div>
          </div>

          {/* ── Facts, in the same rhythm as everything else ── */}
          <div className={cn('px-4', feature ? 'pt-5 pb-5' : 'pt-3.5 pb-4')}>
            <h3
              className={cn(
                'truncate font-bold text-ink transition-colors duration-200 group-hover/obj:text-[var(--accent-strong)]',
                feature ? 'text-title' : 'text-card',
              )}
            >
              {franchise.name}
            </h3>

            <p className="num mt-1 truncate text-small text-ink-3">
              {years.length > 1
                ? `${Math.min(...years)} — ${Math.max(...years)}`
                : years.length === 1
                  ? String(years[0])
                  : 'Years unknown'}
              <span className="mx-2 text-line-strong">·</span>
              {franchise.genres.slice(0, feature ? 3 : 2).join(' · ') || 'Story'}
            </p>

            <div className="mt-3 flex items-baseline justify-between gap-3">
              <p className="num text-small text-ink-2">
                {progress.total} {progress.total === 1 ? 'entry' : 'entries'} ·{' '}
                {episodes.toLocaleString('en-US')} eps · {progress.completed} watched
              </p>
              <p
                className={cn('num shrink-0 font-bold', feature ? 'text-lead' : 'text-small')}
                style={{ color: 'var(--accent-strong)' }}
              >
                {percent}%
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

/* ==========================================================================
   StoryRowObject — the same object, laid out horizontally.
   Used where a vertical stack of cards would break the page's rhythm: an
   archive row, a search result, a related story.
   ========================================================================== */

export function StoryRowObject({
  franchise,
  index = 0,
  reason,
  className,
}: {
  franchise: Franchise
  index?: number
  /** One line saying why this is being shown. */
  reason?: string
  className?: string
}) {
  const progress = getStoryProgress(franchise)
  const phase = getStoryPhase(franchise)
  const art = storyArtwork(franchise)
  const episodes = getEpisodeTotal(franchise)
  const current = franchise.seasons.find((entry) => entry.status === 'CURRENT')

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: Math.min(index * 0.04, 0.24), ease: EASE }}
      className={cn('group/obj', className)}
      style={accentVars(franchise)}
    >
      <Link
        href={`/franchise/${franchise.id}`}
        className="flex items-center gap-5 rounded-md border border-line bg-surface p-3 transition-all duration-500 ease-out hover:-translate-y-0.5 hover:border-white/15 hover:bg-surface-2"
      >
        {/* Artwork plate with the covers fanned at its edge. */}
        <span className="relative block h-[86px] w-[190px] shrink-0">
          <span className="absolute inset-0 overflow-hidden rounded-sm">
            {art && (
              <span
                className="absolute inset-0 bg-cover transition-transform duration-700 group-hover/obj:scale-105"
                style={{ backgroundImage: `url(${art.src})`, backgroundPosition: art.isBanner ? 'center' : 'center 26%' }}
                aria-hidden
              />
            )}
            <span
              aria-hidden
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(5,6,9,0.7), transparent 70%)' }}
            />
          </span>

          <span className="absolute -bottom-1.5 left-2 flex items-end" aria-hidden>
            {franchise.seasons.slice(0, 3).map((season, position) => (
              <span
                key={season.id}
                className={cn(
                  'relative block h-[46px] w-[32px] overflow-hidden rounded-xs art-edge',
                  position > 0 && '-ml-2.5',
                )}
                style={{ zIndex: position }}
              >
                <Cover
                  src={season.posterUrl}
                  alt=""
                  ratio="2/3"
                  rounded={false}
                  edged={false}
                  sizes="32px"
                  className="h-full w-full"
                />
              </span>
            ))}
          </span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-3">
            <span className="truncate text-card font-bold text-ink">{franchise.name}</span>
            <StatusChip status={phaseToStatus(phase)} size="xs" className="shrink-0" />
          </span>

          {reason && <span className="mt-1 block truncate text-small text-ink-2">{reason}</span>}

          <span className="mt-2.5 block max-w-[20rem]">
            <StoryPath entries={franchise.seasons} size="rail" />
          </span>

          <span className="num mt-2 block truncate text-small text-ink-3">
            {current ? `Now on ${current.name}` : `${progress.completed} of ${progress.total} entries watched`}
            <span className="mx-2 text-line-strong">·</span>
            {episodes.toLocaleString('en-US')} eps
          </span>
        </span>

        <span className="hidden shrink-0 flex-col items-end gap-1 pr-2 sm:flex">
          <span className="num text-lead font-bold" style={{ color: 'var(--accent-strong)' }}>
            {Math.round(progress.ratio * 100)}%
          </span>
          <span className="text-small text-ink-3">
            {progress.total - progress.completed} to go
          </span>
        </span>
      </Link>
    </motion.article>
  )
}
