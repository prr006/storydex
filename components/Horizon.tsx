'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Cover, FormatMark } from '@/components/Cover'
import { StatusChip } from '@/components/StatusMark'
import { StoryPath } from '@/components/Path'
import { cn } from '@/lib/utils'
import {
  accentVars,
  getEntryStatus,
  getStoryProgress,
  isUpcoming,
  storyArtwork,
} from '@/lib/design'
import type { UpNextRow } from '@/lib/queue'
import { EASE } from '@/lib/motion'

/* ==========================================================================
   Horizon — what's ahead of you, in the two senses that matter
   --------------------------------------------------------------------------
   "Up next" in StoryDex means two different things, and conflating them is how
   a queue stops being trustworthy:

     READY      entries that already exist and are waiting for you — a story
                you planned, a story you set down. These are *here*.
     AHEAD      entries that have not aired. These are *later*, and the only
                place in the product where a year is genuinely a future date.

   So the section runs in two banks with different shapes. Ready rows carry the
   artwork and the action. Ahead rows are arranged under giant dim year
   numerals — the same era device the journey map uses — because there, the year
   *is* the content.

   The entry you are currently watching never appears here. It is already the
   biggest thing on the page, and a queue that repeats the thing you are inside
   is a queue you stop reading.
   ========================================================================== */

export function Horizon({ ready, ahead }: { ready: UpNextRow[]; ahead: UpNextRow[] }) {
  if (ready.length === 0 && ahead.length === 0) return null

  const eras = groupByYear(ahead)

  return (
    <div className="space-y-14">
      {ready.length > 0 && (
        <div>
          <p className="eyebrow">Ready when you are</p>
          <ul className="mt-4 space-y-2">
            {ready.map((row) => (
              <ReadyRow key={`${row.franchise.id}-${row.entry.id}`} row={row} />
            ))}
          </ul>
        </div>
      )}

      {eras.length > 0 && (
        <div>
          <p className="eyebrow">Not aired yet</p>
          <div className="mt-5 space-y-9">
            {eras.map((era, index) => (
              <motion.div
                key={era.year}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.42, delay: Math.min(index * 0.06, 0.24), ease: EASE }}
                className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-6 lg:grid-cols-[11rem_minmax(0,1fr)]"
              >
                {/* The era marker: a numeral big enough to read as time. */}
                <div className="flex items-baseline gap-2 sm:flex-col sm:items-start sm:gap-1">
                  <span className="text-era font-bold text-white/[0.13]">{era.year}</span>
                  <span className="text-small text-ink-3">
                    {era.items.length} {era.items.length === 1 ? 'entry' : 'entries'} ahead
                  </span>
                </div>

                <ul className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  {era.items.map((row) => (
                    <AheadRow key={`${row.franchise.id}-${row.entry.id}`} row={row} />
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

/** A story you could start or restart right now: artwork, state, one action. */
function ReadyRow({ row }: { row: UpNextRow }) {
  const { franchise, entry, reason } = row
  const art = storyArtwork(franchise)
  const progress = getStoryProgress(franchise)
  const status = getEntryStatus(entry)

  const why =
    reason === 'paused'
      ? 'On hold'
      : progress.started
        ? `Return to ${franchise.name}`
        : `${progress.total} ${progress.total === 1 ? 'entry' : 'entries'}, nothing started`

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      style={accentVars(franchise)}
      className="group/row"
    >
      <Link
        href={`/franchise/${franchise.id}`}
        className="relative flex items-center gap-4 overflow-hidden rounded-md border border-line bg-surface py-3 pl-0 pr-4 transition-all duration-400 ease-out hover:border-white/15 hover:card-shadow"
      >
        {/* Artwork bleeding in from the left edge, not boxed beside the text. */}
        <span className="relative block h-[78px] w-[132px] shrink-0 overflow-hidden">
          {art ? (
            <span
              aria-hidden
              className="absolute inset-0 block bg-cover transition-transform duration-[900ms] ease-out group-hover/row:scale-105"
              style={{ backgroundImage: `url(${art.src})`, backgroundPosition: art.isBanner ? 'center' : 'center 22%' }}
            />
          ) : null}
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, rgba(5,6,9,0.15) 0%, rgba(5,6,9,0.5) 55%, var(--surface) 100%)',
            }}
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="truncate text-card font-semibold text-ink">{franchise.name}</span>
            <StatusChip status={status} size="xs" />
          </span>
          <span className="mt-1 block truncate text-small text-ink-3">
            {why} · <span className="text-ink-2">{entry.name}</span>
          </span>
          <span className="mt-2.5 block max-w-[24rem]">
            <StoryPath entries={franchise.seasons} size="rail" dashedAhead />
          </span>
        </span>

        <span
          className="hidden shrink-0 items-center gap-1.5 text-small font-semibold transition-transform duration-200 group-hover/row:translate-x-0.5 sm:flex"
          style={{ color: 'var(--accent-strong)' }}
        >
          {progress.started ? 'Resume' : 'Start'}
          <ArrowUpRight className="size-3.5" aria-hidden />
        </span>
      </Link>
    </motion.li>
  )
}

/** An entry that has not aired: poster, title, when. */
function AheadRow({ row }: { row: UpNextRow }) {
  const { franchise, entry } = row
  const art = entry.posterUrl || storyArtwork(franchise)?.src

  return (
    <li className="group/art" style={accentVars(franchise)}>
      <Link href={`/franchise/${franchise.id}`} className="block">
        <div className="flex items-center gap-3.5">
          <span className="relative block h-[76px] w-[54px] shrink-0 overflow-hidden rounded-sm art-edge">
            {art ? (
              <span
                aria-hidden
                className="absolute inset-0 block bg-cover opacity-60 saturate-[0.65] transition-all duration-500 ease-out group-hover/art:opacity-90 group-hover/art:saturate-100"
                style={{ backgroundImage: `url(${art})`, backgroundPosition: 'center 24%' }}
              />
            ) : null}
          </span>

          <span className="min-w-0">
            <span className="clamp-2 block text-small font-semibold leading-snug text-ink">
              {entry.name}
            </span>
            <span className="mt-1 block truncate text-[0.6875rem] text-ink-3">
              {franchise.name}
            </span>
            <span className="num mt-1 flex items-center gap-2 text-[0.6875rem] text-ink-3">
              <FormatMark format={entry.format} />
              {entry.episodes > 0 ? `${entry.episodes} episodes` : 'Episode count TBA'}
            </span>
          </span>
        </div>
      </Link>
    </li>
  )
}

/* -------------------------------------------------------------------------- */

/**
 * Year buckets for entries that haven't aired. Anything without an announced
 * year collects under a single "TBA" group at the end, because "we don't know"
 * is genuinely less useful than a date you can plan around.
 */
function groupByYear(rows: UpNextRow[]): { year: number | string; items: UpNextRow[] }[] {
  const map = new Map<number, UpNextRow[]>()
  const undated: UpNextRow[] = []

  for (const row of rows) {
    if (row.entry.year > 0) {
      const bucket = map.get(row.entry.year)
      if (bucket) bucket.push(row)
      else map.set(row.entry.year, [row])
    } else {
      undated.push(row)
    }
  }

  const eras = [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, items]) => ({ year: year as number | string, items }))

  if (undated.length > 0) eras.push({ year: 'TBA', items: undated })
  return eras
}
