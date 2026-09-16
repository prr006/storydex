'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Cover, FormatMark } from '@/components/Cover'
import { ProgressBar, SegmentBar } from '@/components/Bars'
import { StatusChip } from '@/components/StatusMark'
import { PosterCard, phaseToStatus } from '@/components/Cards'
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
} from '@/lib/design'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   The three densities
   --------------------------------------------------------------------------
   One dataset, three reading behaviours — the answer to "don't force one giant
   poster wall" without giving up a poster wall:

     Grid   scanning by artwork. Large posters, minimal text. The default.
     List   scanning by progress. 16:9 plates with the bar given room to read.
     Table  comparing many at once. Dense metadata, dark rows, artwork kept.

   All three stay inside the same visual language: artwork plates, one accent
   bar, status chips, type set at the same scale.
   ========================================================================== */

/* -------------------------------------------------------------------------- */
/* Grid                                                                       */
/* -------------------------------------------------------------------------- */

export function StoryGrid({ franchises }: { franchises: Franchise[] }) {
  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {franchises.map((franchise, index) => (
        <PosterCard key={franchise.id} franchise={franchise} index={index} />
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
      transition={{ duration: 0.3, delay: Math.min(index * 0.025, 0.2), ease: [0.22, 1, 0.36, 1] }}
      style={accentVars(franchise)}
    >
      <Link
        href={`/franchise/${franchise.id}`}
        className="group/art flex items-center gap-4 rounded-md border border-line bg-surface p-3 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/15 hover:bg-surface-2"
      >
        <span className="relative block h-[72px] w-[124px] shrink-0 overflow-hidden rounded-sm">
          <Cover
            src={art}
            alt=""
            tint={franchise.accentColor}
            isBanner={Boolean(franchise.bannerUrl)}
            ratio="16/9"
            edged={false}
            rounded={false}
            hoverZoom
            sizes="124px"
            className="h-full w-full"
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-3">
            <span className="truncate text-card font-semibold text-ink">{franchise.name}</span>
            <StatusChip status={phaseToStatus(phase)} size="xs" className="shrink-0" />
          </span>

          <span className="mt-1 block truncate text-small text-ink-3">
            {next ? `Next: ${next.name}` : 'Everything watched'}
          </span>

          <span className="mt-2.5 flex max-w-[26rem] items-center gap-3">
            <ProgressBar value={progress.ratio} height="sm" animate={false} className="flex-1" />
            <span className="num shrink-0 text-small text-ink-2">
              {progress.completed}/{progress.total}
            </span>
          </span>
        </span>

        <span className="hidden w-[13rem] shrink-0 lg:block">
          <SegmentBar entries={franchise.seasons} height="xs" animate={false} />
          <span className="num mt-2 block text-small text-ink-3">
            {franchise.seasons.length} entries · {episodes.toLocaleString('en-US')} eps
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
              <Th className="w-[92px]">Entries</Th>
              <Th className="w-[150px]">Progress</Th>
              <Th className="w-[110px]">Episodes</Th>
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
            <span className="mt-1 block">
              <SegmentBar entries={franchise.seasons} height="xs" animate={false} className="max-w-[8rem]" />
            </span>
          </span>
        </Link>
      </td>

      <td className="num py-3 pr-4 text-body text-ink-2">{progress.total}</td>

      <td className="py-3 pr-4">
        <span className="flex items-center gap-2.5">
          <ProgressBar value={progress.ratio} height="sm" animate={false} className="w-20" />
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
