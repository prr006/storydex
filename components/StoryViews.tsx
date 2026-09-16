'use client'

import Link from 'next/link'
import { Cover, FormatMark } from '@/components/Cover'
import { CompositionStrip, EntryRuler } from '@/components/EntryRuler'
import { StatusMark } from '@/components/StatusMark'
import { StoryCard, statusTokenFor } from '@/components/StoryCard'
import { cn } from '@/lib/utils'
import {
  formatEpisodes,
  getEntryStatus,
  getNextEntry,
  getStoryPhase,
  getStoryProgress,
  phaseCopy,
} from '@/lib/design'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   The three densities
   --------------------------------------------------------------------------
   One dataset, three reading behaviours. This is the answer to "don't force
   one giant poster wall": the same library is browsable by cover, by progress,
   or as a comparison table, and the choice belongs to the user.

     Grid  — scanning by artwork. Cards. 2 → 5 columns.
     List  — scanning by progress. One ruled row per story, cover at 56px.
     Table — comparing many at once. Dense columns, one row per story.
   ========================================================================== */

/* -------------------------------------------------------------------------- */
/* Grid                                                                       */
/* -------------------------------------------------------------------------- */

export function StoryGrid({ franchises }: { franchises: Franchise[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {franchises.map((franchise, index) => (
        <StoryCard key={franchise.id} franchise={franchise} index={index} />
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* List                                                                       */
/* -------------------------------------------------------------------------- */

export function StoryList({ franchises }: { franchises: Franchise[] }) {
  return (
    <ul className="border-t border-rule">
      {franchises.map((franchise) => (
        <StoryListRow key={franchise.id} franchise={franchise} />
      ))}
    </ul>
  )
}

function StoryListRow({ franchise }: { franchise: Franchise }) {
  const progress = getStoryProgress(franchise)
  const phase = getStoryPhase(franchise)
  const meta = phaseCopy(phase)
  const next = getNextEntry(franchise)
  const span = yearSpan(franchise)

  return (
    <li className="border-b border-rule">
      <Link
        href={`/franchise/${franchise.id}`}
        className="group/row flex items-center gap-5 py-4 transition-colors duration-150 hover:bg-sunk/50"
      >
        <Cover
          src={franchise.posterUrl}
          alt={franchise.name}
          tint={franchise.accentColor}
          ratio="2/3"
          rounded={false}
          sizes="80px"
          className="w-14 shrink-0"
        />

        {/* Title + where you are */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[1.0625rem] font-semibold tracking-[-0.012em] text-ink">
            {franchise.name}
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-small text-ink-3">
            <span className="num">{span}</span>
            <span aria-hidden className="text-rule-strong">
              ·
            </span>
            <span className="num">
              {progress.completed} of {progress.total} entries
            </span>
            {next && !progress.complete && (
              <>
                <span aria-hidden className="text-rule-strong">
                  ·
                </span>
                <span className="truncate text-ink-2">Next: {next.name}</span>
              </>
            )}
          </p>
          <EntryRuler entries={franchise.seasons} size="sm" className="mt-2.5 max-w-md" />
        </div>

        {/* Status */}
        <div className="hidden w-32 shrink-0 sm:block">
          <StatusMark status={statusTokenFor(phase)} label={meta.label} />
        </div>
      </Link>
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/* Table                                                                      */
/* -------------------------------------------------------------------------- */

export function StoryTable({ franchises }: { franchises: Franchise[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-rule-strong">
            <Th className="w-[340px]">Story</Th>
            <Th className="w-[92px]">Entries</Th>
            <Th className="w-[160px]">Progress</Th>
            <Th className="w-[120px]">Watched</Th>
            <Th className="w-[130px]">Status</Th>
            <Th className="w-[90px]">Years</Th>
            <Th className="w-[110px]">Next</Th>
          </tr>
        </thead>
        <tbody>
          {franchises.map((franchise) => (
            <StoryTableRow key={franchise.id} franchise={franchise} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StoryTableRow({ franchise }: { franchise: Franchise }) {
  const progress = getStoryProgress(franchise)
  const phase = getStoryPhase(franchise)
  const meta = phaseCopy(phase)
  const next = getNextEntry(franchise)
  const nextStatus = next ? getEntryStatus(next) : null

  return (
    <tr className="border-b border-rule transition-colors duration-150 hover:bg-sunk/50">
      <td className="py-2.5 pr-4">
        <Link
          href={`/franchise/${franchise.id}`}
          className="group/cell flex items-center gap-3"
        >
          <Cover
            src={franchise.posterUrl}
            alt=""
            tint={franchise.accentColor}
            ratio="2/3"
            rounded={false}
            sizes="40px"
            className="w-8 shrink-0"
          />
          <span className="min-w-0">
            <span className="block truncate text-body font-semibold text-ink group-hover/cell:text-brand-text">
              {franchise.name}
            </span>
            <span className="mt-0.5 flex items-center gap-2">
              <CompositionStrip entries={franchise.seasons} />
            </span>
          </span>
        </Link>
      </td>

      <td className="num py-2.5 pr-4 text-body text-ink-2">{progress.total}</td>

      <td className="py-2.5 pr-4">
        <EntryRuler entries={franchise.seasons} size="sm" gap="tight" animate={false} />
      </td>

      <td className="num py-2.5 pr-4 text-body text-ink">
        {progress.completed}
        <span className="text-ink-3"> / {progress.total}</span>
      </td>

      <td className="py-2.5 pr-4">
        <StatusMark status={statusTokenFor(phase)} label={meta.label} />
      </td>

      <td className="num py-2.5 pr-4 text-small text-ink-2">{yearSpan(franchise)}</td>

      <td className="py-2.5">
        {next && !progress.complete ? (
          <span className="block max-w-[130px]">
            <span className="block truncate text-small text-ink-2">{next.name}</span>
            {nextStatus === 'upcoming' ? (
              <span className="text-small text-ink-3">not aired</span>
            ) : (
              <span className="num text-small text-ink-3">{formatEpisodes(next)}</span>
            )}
          </span>
        ) : (
          <span className="text-small text-ink-3">—</span>
        )}
      </td>
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

/* -------------------------------------------------------------------------- */

export function yearSpan(franchise: Franchise): string {
  const years = franchise.seasons.map((s) => s.year).filter((y) => y > 0)
  if (years.length === 0) return '—'
  const min = Math.min(...years)
  const max = Math.max(...years)
  return min === max ? String(min) : `${min}–${max}`
}

export { FormatMark }
