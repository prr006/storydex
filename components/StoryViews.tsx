'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Cover } from '@/components/Cover'
import { StoryPath } from '@/components/Path'
import { StoryObject } from '@/components/StoryObject'
import { StatusChip } from '@/components/StatusMark'
import { cn } from '@/lib/utils'
import {
  accentVars,
  formatEpisodes,
  formatScore,
  getEntryStatus,
  getEpisodeTotal,
  getNextEntry,
  getStoryPhase,
  getStoryProgress,
  phaseCopy,
  phaseToStatus,
  type StoryPhase,
} from '@/lib/design'
import { EASE } from '@/lib/motion'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   The archive, at three densities
   --------------------------------------------------------------------------
   One dataset, three reading behaviours — and all three stay in the story
   language rather than becoming a poster wall:

     Archival   grouped by where each story stands with you, and drawn as story
                objects (covers fanned, path across the foot). Standing alone in
                a story is the loudest thing on the page, which is the point of
                an archive you actually keep.
     List       scanning by progress. Plate, path, next entry.
     Table      comparing many at once. Dense metadata, artwork kept.

   Grouping is the archive's spine: the section headings are the same lifecycle
   words used everywhere else in StoryDex, so the library reads as a shelf you
   have organised — not a bag of results. Grouping only appears when there is
   enough on the page to group.
   ========================================================================== */

/** The order a shelf is actually browsed in: inside first, then waiting, then done. */
const SHELF_ORDER: { phase: StoryPhase; title: string; note: string }[] = [
  { phase: 'watching', title: 'Inside right now', note: 'Part-way through' },
  { phase: 'caught-up', title: 'Caught up', note: 'Waiting on more' },
  { phase: 'paused', title: 'On hold', note: 'Set down for now' },
  { phase: 'backlog', title: 'Not started', note: 'Kept, nothing watched' },
  { phase: 'planned', title: 'Planned', note: 'Marked for later' },
  { phase: 'complete', title: 'Completed', note: 'Start to end' },
  { phase: 'dropped', title: 'Set aside', note: 'Walked away from' },
]

/* -------------------------------------------------------------------------- */
/* Archival — the default density                                             */
/* -------------------------------------------------------------------------- */

export function StoryGrid({
  franchises,
  grouped = true,
}: {
  franchises: Franchise[]
  grouped?: boolean
}) {
  if (!grouped) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {franchises.map((franchise, index) => (
          <StoryObject key={franchise.id} franchise={franchise} index={index} />
        ))}
      </div>
    )
  }

  const shelves = SHELF_ORDER.map((shelf) => ({
    ...shelf,
    items: franchises.filter((franchise) => getStoryPhase(franchise) === shelf.phase),
  })).filter((shelf) => shelf.items.length > 0)

  return (
    <div className="space-y-14">
      {shelves.map((shelf) => (
        <section key={shelf.phase}>
          {/* The shelf heading: a word, a count, a rule to the edge of the page. */}
          <div className="flex items-center gap-4">
            <h2 className="text-card font-bold text-ink">{shelf.title}</h2>
            <span className="num text-small text-ink-3">{shelf.items.length}</span>
            <span className="h-px flex-1 bg-line" aria-hidden />
            <span className="hidden text-small text-ink-3 sm:block">{shelf.note}</span>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shelf.items.map((franchise, index) => (
              <StoryObject key={franchise.id} franchise={franchise} index={index} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* List                                                                       */
/* -------------------------------------------------------------------------- */

export function StoryList({ franchises }: { franchises: Franchise[] }) {
  return (
    <ul className="space-y-2">
      {franchises.map((franchise, index) => (
        <StoryRow key={franchise.id} franchise={franchise} index={index} />
      ))}
    </ul>
  )
}

function StoryRow({ franchise, index }: { franchise: Franchise; index: number }) {
  const progress = getStoryProgress(franchise)
  const phase = getStoryPhase(franchise)
  const next = getNextEntry(franchise)
  const episodes = getEpisodeTotal(franchise)
  const art = franchise.bannerUrl || franchise.posterUrl

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.18), ease: EASE }}
      style={accentVars(franchise)}
    >
      <Link
        href={`/franchise/${franchise.id}`}
        className="group/art flex items-center gap-4 rounded-md border border-line bg-surface p-3 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/15 hover:bg-surface-2"
      >
        <span className="relative block h-[76px] w-[128px] shrink-0 overflow-hidden rounded-sm">
          <Cover
            src={art}
            alt=""
            tint={franchise.accentColor}
            isBanner={Boolean(franchise.bannerUrl)}
            ratio="16/9"
            edged={false}
            rounded={false}
            hoverZoom
            sizes="128px"
            className="h-full w-full"
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-3">
            <span className="truncate text-card font-semibold text-ink">{franchise.name}</span>
            <StatusChip status={phaseToStatus(phase)} size="xs" className="shrink-0" />
          </span>

          <span className="mt-1 block truncate text-small text-ink-3">
            {next
              ? `Next: ${next.name}`
              : `${phaseCopy(phase).label} — nothing left to watch`}
          </span>

          <span className="mt-3 block max-w-[30rem]">
            <StoryPath entries={franchise.seasons} size="rail" dashedAhead />
          </span>
        </span>

        <span className="hidden w-[14rem] shrink-0 text-right lg:block">
          <span className="num block text-body text-ink-2">
            {progress.completed}/{progress.total} entries
          </span>
          <span className="num mt-1 block text-small text-ink-3">
            {episodes.toLocaleString('en-US')} eps · {Math.round(progress.ratio * 100)}%
          </span>
        </span>
      </Link>
    </motion.li>
  )
}

/* -------------------------------------------------------------------------- */
/* Table                                                                      */
/* -------------------------------------------------------------------------- */

export function StoryTable({ franchises }: { franchises: Franchise[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <caption className="sr-only">Every story in your library</caption>
          <thead>
            <tr className="border-b border-line">
              <Th className="w-[320px] pl-4">Story</Th>
              <Th className="w-[100px]">Entries</Th>
              <Th className="w-[150px]">Progress</Th>
              <Th className="w-[160px]">Episodes</Th>
              <Th className="w-[130px]">Status</Th>
              <Th className="w-[150px]">Next up</Th>
              <Th className="w-[80px] pr-4 text-right">Score</Th>
            </tr>
          </thead>
          <tbody>
            {franchises.map((franchise) => (
              <StoryTableRow key={franchise.id} franchise={franchise} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StoryTableRow({ franchise }: { franchise: Franchise }) {
  const progress = getStoryProgress(franchise)
  const phase = getStoryPhase(franchise)
  const next = getNextEntry(franchise)
  const episodes = getEpisodeTotal(franchise)
  const scores = franchise.seasons.map((entry) => entry.score ?? 0).filter((score) => score > 0)
  const average = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0

  return (
    <tr
      className="border-b border-line transition-colors last:border-b-0 hover:bg-white/[0.03]"
      style={accentVars(franchise)}
    >
      <td className="py-3 pl-4 pr-4">
        <Link href={`/franchise/${franchise.id}`} className="group/row flex items-center gap-3">
          <span className="relative block h-12 w-9 shrink-0 overflow-hidden rounded-xs">
            <Cover
              src={franchise.posterUrl}
              alt=""
              tint={franchise.accentColor}
              ratio="2/3"
              edged={false}
              rounded={false}
              sizes="36px"
              className="h-full w-full"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-body font-semibold text-ink transition-colors group-hover/row:text-brand-strong">
              {franchise.name}
            </span>
            <span className="mt-1.5 block max-w-[9rem]">
              <StoryPath entries={franchise.seasons} size="spark" dashedAhead />
            </span>
          </span>
        </Link>
      </td>

      <td className="num py-3 pr-4 text-body text-ink-2">{progress.total}</td>

      <td className="py-3 pr-4">
        <span className="flex items-center gap-2.5">
          <span className="block h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
            <span
              className="block h-full rounded-full"
              style={{ background: 'var(--accent)', width: `${Math.round(progress.ratio * 100)}%` }}
            />
          </span>
          <span className="num text-small text-ink-2">{Math.round(progress.ratio * 100)}%</span>
        </span>
      </td>

      <td className="num py-3 pr-4 text-small text-ink-2">
        {progress.completed}/{progress.total} · {episodes.toLocaleString('en-US')} eps
      </td>

      <td className="py-3 pr-4">
        <StatusChip status={phaseToStatus(phase)} size="xs" />
      </td>

      <td className="py-3 pr-4">
        {next ? (
          <span className="block max-w-[160px]">
            <span className="block truncate text-small text-ink-2">{next.name}</span>
            <span className="num block text-[0.6875rem] text-ink-3">
              {getEntryStatus(next) === 'upcoming'
                ? `Not aired${next.year > 0 ? ` · ${next.year}` : ''}`
                : formatEpisodes(next)}
            </span>
          </span>
        ) : (
          <span className="text-small text-ink-3">—</span>
        )}
      </td>

      <td className="num py-3 pr-4 text-right text-small text-ink-2">
        {formatScore(average) ?? '—'}
      </td>
    </tr>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        'py-3 pr-4 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-3',
        className,
      )}
    >
      {children}
    </th>
  )
}
