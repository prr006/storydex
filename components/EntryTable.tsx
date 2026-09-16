'use client'

import { Cover } from '@/components/Cover'
import { StatusMark } from '@/components/StatusMark'
import { cn } from '@/lib/utils'
import { formatEpisodes, formatFormat, formatScore, getEntryStatus } from '@/lib/design'
import type { Season } from '@/lib/franchise'

/* ==========================================================================
   EntryTable
   --------------------------------------------------------------------------
   The reference section of the story page. The timeline above it is for
   understanding; this is for looking things up — "which entry was the OVA",
   "what did I score the film".

   Set as a real table with tabular figures and hairline rules, because this is
   the one place in the product where columns should line up exactly. Every row
   links out to AniList when we have a URL, so the page stays a catalogue rather
   than a dead end.
   ========================================================================== */

export function EntryTable({ entries }: { entries: Season[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-left">
        <caption className="sr-only">Every entry in this story, in watch order</caption>
        <thead>
          <tr className="border-b border-rule-strong">
            <Th className="w-[320px]">Entry</Th>
            <Th className="w-[110px]">Format</Th>
            <Th className="w-[80px]">Year</Th>
            <Th className="w-[100px]">Episodes</Th>
            <Th className="w-[110px]">Status</Th>
            <Th className="w-[80px]">Score</Th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <Row key={entry.id} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Row({ entry }: { entry: Season }) {
  const status = getEntryStatus(entry)
  const score = formatScore(entry.score)
  const progressNote =
    status === 'watching' && entry.progress ? ` · episode ${entry.progress}` : ''

  return (
    <tr className="border-b border-rule align-middle transition-colors duration-150 hover:bg-sunk/40">
      <td className="py-3 pr-4">
        <span className="flex items-center gap-3">
          <Cover
            src={entry.posterUrl}
            alt=""
            tint={entry.isExpanded ? 'var(--brand)' : undefined}
            ratio="2/3"
            rounded={false}
            sizes="32px"
            className="w-8 shrink-0"
          />
          <span className="min-w-0">
            {entry.siteUrl ? (
              <a
                href={entry.siteUrl}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-body font-medium text-ink underline decoration-transparent underline-offset-4 transition-colors hover:decoration-rule-strong"
              >
                {entry.name}
              </a>
            ) : (
              <span className="block truncate text-body font-medium text-ink">{entry.name}</span>
            )}
            {progressNote && <span className="num text-small text-ink-3">{progressNote}</span>}
          </span>
        </span>
      </td>

      <td className="py-3 pr-4 text-small text-ink-2">{formatFormat(entry.format)}</td>
      <td className="num py-3 pr-4 text-small text-ink-2">{entry.year > 0 ? entry.year : '—'}</td>
      <td className="num py-3 pr-4 text-small text-ink-2">{formatEpisodes(entry)}</td>
      <td className="py-3 pr-4">
        <StatusMark status={status} />
      </td>
      <td className="num py-3 text-small text-ink-2">{score ?? '—'}</td>
    </tr>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        'pb-2.5 pr-4 text-micro font-semibold uppercase tracking-[0.08em] text-ink-3',
        className,
      )}
    >
      {children}
    </th>
  )
}
