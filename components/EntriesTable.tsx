'use client'

import { Cover } from '@/components/Cover'
import { ProgressBar } from '@/components/Bars'
import { StatusChip } from '@/components/StatusMark'
import { cn } from '@/lib/utils'
import {
  entryRatio,
  episodeLabel,
  formatFormat,
  formatScore,
  getEntryStatus,
  isUpcoming,
} from '@/lib/design'
import type { Season } from '@/lib/franchise'

/* ==========================================================================
   EntriesTable
   --------------------------------------------------------------------------
   The reference section of the story page. The story map above is for
   understanding; this is for looking things up — "which entry was the OVA",
   "what did I score the film", "where does the 366-episode run sit".

   Set on a dark panel with hairline rows, so it belongs to the same system as
   everything else without competing with the map for attention. Every row links
   out to AniList, so the page is a catalogue rather than a dead end.
   ========================================================================== */

export function EntriesTable({ entries }: { entries: Season[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <caption className="sr-only">Every entry in this story, in watch order</caption>
          <thead>
            <tr className="border-b border-line">
              <Th className="w-[320px] pl-4">Entry</Th>
              <Th className="w-[100px]">Format</Th>
              <Th className="w-[80px]">Year</Th>
              <Th className="w-[120px]">Episodes</Th>
              <Th className="w-[130px]">Status</Th>
              <Th className="w-[90px]">Score</Th>
              <Th className="w-[180px] pr-4">Progress</Th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <Row key={entry.id} entry={entry} index={index} total={entries.length} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Row({ entry, index, total }: { entry: Season; index: number; total: number }) {
  const status = getEntryStatus(entry)
  const score = formatScore(entry.score)
  const ratio = entryRatio(entry)
  const current = status === 'watching'

  return (
    <tr
      className={cn(
        'border-b border-line transition-colors last:border-b-0 hover:bg-white/[0.03]',
        current && 'bg-white/[0.035]',
      )}
    >
      <td className="py-2.5 pl-4 pr-4">
        <span className="flex items-center gap-3">
          <span className="relative block h-[54px] w-10 shrink-0 overflow-hidden rounded-xs">
            <Cover
              src={entry.posterUrl}
              alt=""
              ratio="2/3"
              rounded={false}
              edged={false}
              sizes="40px"
              className="h-full w-full"
            />
          </span>
          <span className="min-w-0">
            {entry.siteUrl ? (
              <a
                href={entry.siteUrl}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-body font-semibold text-ink transition-colors hover:text-brand-strong"
              >
                {entry.name}
              </a>
            ) : (
              <span className="block truncate text-body font-semibold text-ink">{entry.name}</span>
            )}
            {/* Where this entry sits in its story — the one fact the rest of
                the row doesn't already carry. */}
            <span className="num mt-0.5 block truncate text-[0.6875rem] text-ink-3">
              Entry {index + 1} of {total}
              {current ? ` · ${episodeLabel(entry)}` : isUpcoming(entry) ? ' · not aired yet' : ''}
            </span>
          </span>
        </span>
      </td>

      <td className="py-2.5 pr-4 text-small text-ink-2">{formatFormat(entry.format)}</td>
      <td className="num py-2.5 pr-4 text-small text-ink-2">{entry.year > 0 ? entry.year : '—'}</td>
      <td className="num py-2.5 pr-4 text-small text-ink-2">
        {entry.episodes > 0 ? entry.episodes : '—'}
      </td>
      <td className="py-2.5 pr-4">
        <StatusChip status={status} size="xs" />
      </td>
      <td className="num py-2.5 pr-4 text-small text-ink-2">
        {score ? (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden style={{ color: 'var(--state-upcoming)' }}>
              ★
            </span>
            {score}
          </span>
        ) : (
          '—'
        )}
      </td>
      <td className="py-2.5 pr-4">
        <span className="flex items-center gap-2.5">
          <ProgressBar value={ratio} height="xs" animate={false} className="w-24" />
          <span className="num text-small text-ink-3">{Math.round(ratio * 100)}%</span>
        </span>
      </td>
    </tr>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        'py-2.5 pr-4 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-3',
        className,
      )}
    >
      {children}
    </th>
  )
}
