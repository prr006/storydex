'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getEntryStatus, type EntryStatus } from '@/lib/design'
import type { Season } from '@/lib/franchise'

/* ==========================================================================
   Bars
   --------------------------------------------------------------------------
   Three ways to draw progress, and no others:

     ProgressBar  a continuous fill — "9 of 14 episodes". Used on the hero, the
                  continue cards and the currently-watching panel.
     SegmentBar   one segment per entry, coloured by state — the *shape* of a
                  story. This is StoryDex's signature: a 6-entry franchise and a
                  single-season one are distinguishable before reading a word.
     Ring         a completion donut, used once per page in the ledger.

   Every fill reads `var(--accent)`, which is either StoryDex indigo or the
   story's own artwork colour (see `accentVars()` in lib/design). The accent is
   what makes a progress bar feel like it belongs to the story it describes.
   ========================================================================== */

/* -------------------------------------------------------------------------- */
/* Continuous                                                                 */
/* -------------------------------------------------------------------------- */

export function ProgressBar({
  value,
  className,
  height = 'md',
  track = 'strong',
  animate = true,
  label,
}: {
  /** 0–1. */
  value: number
  className?: string
  height?: 'xs' | 'sm' | 'md'
  track?: 'strong' | 'soft'
  animate?: boolean
  label?: string
}) {
  const ratio = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
  const h = height === 'xs' ? 'h-[2px]' : height === 'sm' ? 'h-1' : 'h-1.5'

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full',
        h,
        track === 'strong' ? 'bg-white/12' : 'bg-white/[0.06]',
        className,
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
      aria-label={label}
    >
      {animate ? (
        <motion.span
          className="block h-full rounded-full"
          style={{ background: 'var(--accent)' }}
          initial={{ width: 0 }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : (
        <span
          className="block h-full rounded-full"
          style={{ background: 'var(--accent)', width: `${ratio * 100}%` }}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Segmented                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Segment colour is a *state* colour, never the story accent — the accent
 * identifies the story, and the state has to stay readable across every story
 * in the library. The current entry is the exception: it takes the accent so it
 * reads as "this story, right now".
 */
const SEGMENT_STYLE: Record<EntryStatus, string> = {
  watched: 'bg-state-done',
  watching: 'block bg-[var(--accent)]',
  planned: 'bg-state-planned/45',
  upcoming: 'bg-state-upcoming/40',
  unwatched: 'bg-white/12',
  paused: 'bg-state-paused/50',
  dropped: 'bg-state-stopped/60',
}

export function SegmentBar({
  entries,
  className,
  height = 'sm',
  animate = false,
  track = false,
}: {
  entries: Season[]
  className?: string
  height?: 'xs' | 'sm' | 'md'
  animate?: boolean
  /** Draw an unfilled rail behind the segments. */
  track?: boolean
}) {
  if (entries.length === 0) return null

  const h = height === 'xs' ? 'h-[3px]' : height === 'sm' ? 'h-1' : 'h-1.5'
  const statuses = entries.map((entry) => getEntryStatus(entry))
  const watched = statuses.filter((status) => status === 'watched').length

  return (
    <div
      className={cn('flex w-full items-center gap-1', track && 'rounded-full bg-white/[0.06] p-1', className)}
      role="img"
      aria-label={`${watched} of ${entries.length} entries completed`}
    >
      {statuses.map((status, index) => {
        const block = (
          <span
            className={cn('flex-1 rounded-full', h, SEGMENT_STYLE[status])}
            style={{ minWidth: 4 }}
          />
        )

        if (!animate) return <span key={index} className="contents">{block}</span>

        return (
          <motion.span
            key={index}
            className={cn('flex-1 rounded-full', h, SEGMENT_STYLE[status])}
            style={{ minWidth: 4, transformOrigin: 'left' }}
            initial={{ opacity: 0, scaleX: 0.35 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.4, delay: 0.05 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
          />
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Ring                                                                       */
/* -------------------------------------------------------------------------- */

export function Ring({
  value,
  size = 92,
  stroke = 6,
  className,
  children,
}: {
  /** 0–1. */
  value: number
  size?: number
  stroke?: number
  className?: string
  children?: React.ReactNode
}) {
  const ratio = Math.max(0, Math.min(1, value))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className={cn('relative grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(255 255 255 / 0.10)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - ratio) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Ledger row                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * One line of the episode ledger: the entry, its episode count, and a bar whose
 * width is its share of the story's total episodes. Bar colour is the entry's
 * own state, so a ledger reads as a timeline of effort at a glance.
 */
export function LedgerRow({
  entry,
  totalEpisodes,
  active,
  children,
}: {
  entry: Season
  totalEpisodes: number
  active?: boolean
  children?: React.ReactNode
}) {
  const status = getEntryStatus(entry)
  const share = totalEpisodes > 0 ? Math.max(0.04, (entry.episodes || 0) / totalEpisodes) : 0.1

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'h-2 shrink-0 rounded-full',
          SEGMENT_STYLE[status],
          active && 'ring-2 ring-[var(--accent)]/40',
        )}
        style={{ width: `${Math.min(100, share * 100)}%`, maxWidth: 220, minWidth: 10 }}
        aria-hidden
      />
      <span className={cn('num shrink-0 text-small', active ? 'text-ink' : 'text-ink-3')}>
        {entry.year > 0 ? entry.year : '—'}
      </span>
      {children}
    </div>
  )
}
