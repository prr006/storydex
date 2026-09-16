'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Cover, FormatMark } from '@/components/Cover'
import { StatusChip } from '@/components/StatusMark'
import { cn } from '@/lib/utils'
import {
  accentVars,
  canContinue,
  formatEpisodes,
  formatFormat,
  getEntryStatus,
  getNextEntry,
  getStoryPhase,
  getStoryProgress,
  isUpcoming,
  storyArtwork,
} from '@/lib/design'
import type { Franchise, Season } from '@/lib/franchise'

/* ==========================================================================
   UpNextCard — the queued shelf
   --------------------------------------------------------------------------
   Everything that is *not* "resume right now":

     · the next entry of a story that isn't started yet
     · a story you paused, which keeps its place but isn't offered as Continue
     · entries that exist but haven't aired, with their year

   Compact on purpose — this shelf is a queue, not a shelf of things to open
   this minute. It keeps artwork and colour, but at a smaller scale than the
   Continue cards so the hierarchy reads at a glance.
   ========================================================================== */

export interface UpNextRow {
  franchise: Franchise
  entry: Season
  reason: 'next' | 'paused' | 'upcoming'
}

const REASON_LABEL: Record<UpNextRow['reason'], string> = {
  next: 'Next up',
  paused: 'On hold',
  upcoming: 'Upcoming',
}

export function UpNextCard({
  franchise,
  entry,
  reason,
  index = 0,
  className,
}: UpNextRow & { index?: number; className?: string }) {
  const art = storyArtwork(franchise)
  const status = getEntryStatus(entry)
  const year = entry.year > 0 ? entry.year : null

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: Math.min(index * 0.04, 0.2), ease: [0.22, 1, 0.36, 1] }}
      className={cn('group/art w-[264px] shrink-0 snap-start', className)}
      style={accentVars(franchise)}
    >
      <Link
        href={`/franchise/${franchise.id}`}
        className="flex h-[86px] items-center gap-3 overflow-hidden rounded-md border border-line bg-surface p-2.5 transition-all duration-300 ease-out group-hover/art:-translate-y-0.5 group-hover/art:border-white/15 group-hover/art:bg-surface-2"
      >
        {/* Small plate — the artwork still leads, just at queue scale. */}
        <span className="relative block h-[66px] w-[47px] shrink-0 overflow-hidden rounded-sm">
          <Cover
            src={entry.posterUrl || art?.src}
            alt=""
            tint={franchise.accentColor}
            ratio="2/3"
            edged={false}
            rounded={false}
            sizes="48px"
            className="h-full w-full"
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span
              className="text-[0.625rem] font-semibold uppercase tracking-[0.08em]"
              style={{ color: reason === 'upcoming' ? 'var(--state-upcoming)' : 'var(--accent-strong)' }}
            >
              {REASON_LABEL[reason]}
            </span>
            <FormatMark format={entry.format} />
          </span>

          <span className="clamp-2 mt-1 block text-small font-semibold leading-snug text-ink">
            {entry.name}
          </span>

          <span className="num mt-0.5 block truncate text-[0.6875rem] text-ink-3">
            {franchise.name}
            {reason === 'upcoming' ? (year ? ` · ${year}` : '') : ` · ${formatEpisodes(entry)}`}
          </span>
        </span>

        {reasontag(status, reason)}
      </Link>
    </motion.article>
  )
}

function reasontag(status: ReturnType<typeof getEntryStatus>, reason: UpNextRow['reason']) {
  if (reason === 'upcoming' || status === 'paused' || status === 'dropped') {
    return <StatusChip status={status} size="xs" className="shrink-0 self-start" />
  }
  return null
}

/* -------------------------------------------------------------------------- */

/**
 * The queue: next entries of stories not yet started, stories on hold, and
 * anything already in the library that hasn't aired.
 *
 * `excludeId` keeps the hero's story out of its own queue — it is already the
 * biggest thing on the page.
 */
export function upcomingEntries(franchises: Franchise[], excludeId?: string): UpNextRow[] {
  const rows: UpNextRow[] = []

  for (const franchise of franchises) {
    if (franchise.id === excludeId) continue
    const phase = getStoryPhase(franchise)
    if (phase === 'complete' || phase === 'dropped') continue

    const next = getNextEntry(franchise)
    if (!next) continue

    const status = getEntryStatus(next)
    const started = getStoryProgress(franchise).started

    if (isUpcoming(next)) {
      rows.push({ franchise, entry: next, reason: 'upcoming' })
    } else if (!started || phase === 'backlog' || phase === 'planned') {
      rows.push({ franchise, entry: next, reason: 'next' })
    } else if (canContinue(franchise)) {
      rows.push({ franchise, entry: next, reason: 'next' })
    }
  }

  // Paused stories keep their place in the queue, clearly labelled.
  for (const franchise of franchises) {
    if (franchise.id === excludeId) continue
    if (getStoryPhase(franchise) !== 'paused') continue
    if (rows.some((row) => row.franchise.id === franchise.id)) continue
    const next = getNextEntry(franchise)
    if (next && !isUpcoming(next)) rows.push({ franchise, entry: next, reason: 'paused' })
  }

  return rows.sort((a, b) => {
    const order = { next: 0, paused: 1, upcoming: 2 }
    return order[a.reason] - order[b.reason] || a.franchise.name.localeCompare(b.franchise.name)
  })
}
