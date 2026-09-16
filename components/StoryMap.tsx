'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Cover, FormatMark } from '@/components/Cover'
import { ProgressBar } from '@/components/Bars'
import { StatusChip } from '@/components/StatusMark'
import { cn } from '@/lib/utils'
import {
  accentVars,
  episodeLabel,
  getEntryStatus,
  isUpcoming,
  type EntryStatus,
} from '@/lib/design'
import { progressOfEntry } from '@/components/Cards'
import { EASE } from '@/lib/motion'
import type { Franchise, Season } from '@/lib/franchise'

/* ==========================================================================
   StoryMap  — the signature view
   --------------------------------------------------------------------------
   StoryDex's whole premise is that a franchise is *one story*, and this is the
   only screen that makes that visible at a glance.

   A horizontal rail of entries in watch order. Above each column, the year it
   arrived — set large and dim, the way a printed timeline sets its era, so the
   gaps between 2004 and 2022 are felt rather than read. Below it, a card with
   the entry's own artwork, its format, its episode count and its progress bar.
   A connecting rail with a node per entry joins them, and the node states use
   the same vocabulary as every other mark in the product:

     completed  → filled emerald node with a check
     watching   → indigo ring with a filled centre — the "you are here" mark,
                  scaled up and glowing very slightly, because on this page it
                  is the single most important thing to find
     upcoming   → hollow amber node
     planned    → hollow blue node
     stopped    → a short bar

   It scrolls sideways rather than wrapping, because a story has an order and a
   wrapped grid destroys it.
   ========================================================================== */

export function StoryMap({ franchise }: { franchise: Franchise }) {
  const entries = franchise.seasons

  return (
    <div style={accentVars(franchise)}>
      <div className="rail -mx-[var(--spacing-shell)] overflow-x-auto px-[var(--spacing-shell)] pb-4">
        <ol className="flex min-w-max items-start gap-0 pt-2">
          {entries.map((entry, index) => (
            <TimelineStop
              key={entry.id}
              entry={entry}
              index={index}
              total={entries.length}
              isFirst={index === 0}
              isLast={index === entries.length - 1}
            />
          ))}
        </ol>
      </div>

      <p className="mt-2 text-small text-ink-3">
        {entries.length} entries in watch order
        {entries.length > 4 && <span className="hidden md:inline"> — scroll the timeline sideways to see them all</span>}
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function TimelineStop({
  entry,
  index,
  total,
  isFirst,
  isLast,
}: {
  entry: Season
  index: number
  total: number
  isFirst: boolean
  isLast: boolean
}) {
  const status = getEntryStatus(entry)
  const current = status === 'watching'
  const ratio = progressOfEntry(entry)
  const percent = Math.round(ratio * 100)

  return (
    <motion.li
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: Math.min(index * 0.06, 0.5), ease: EASE }}
      className="group/stop flex w-[228px] shrink-0 flex-col sm:w-[252px]"
    >
      {/* ── Era ─────────────────────────────────────────────────────────── */}
      <div className="flex items-baseline gap-2 pl-4">
        <span
          className={cn(
            'num text-[2rem] font-bold leading-none tracking-[-0.04em]',
            current ? 'text-accent-strong' : 'text-ink-3/35',
          )}
          style={current ? { color: 'var(--accent-strong)' } : undefined}
        >
          {entry.year > 0 ? entry.year : '—'}
        </span>
        <span className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-ink-3/70">
          {ordinal(index + 1)}
        </span>
      </div>

      {/* ── Rail ────────────────────────────────────────────────────────── */}
      <div className="relative mt-3 flex h-8 items-center pl-4">
        {!isFirst && (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2"
            style={{ background: 'var(--line-strong)' }}
          />
        )}
        {!isLast && (
          <span
            aria-hidden
            className="absolute right-0 top-1/2 h-px w-4 -translate-y-1/2"
            style={{ background: 'var(--line-strong)' }}
          />
        )}

        {/* The node. */}
        <span
          className={cn(
            'relative z-10 grid size-[18px] shrink-0 place-items-center rounded-full transition-transform duration-300',
            current && 'scale-110',
          )}
          style={
            status === 'watched'
              ? { background: 'var(--state-done)' }
              : current
                ? {
                    background: 'var(--accent)',
                    boxShadow: '0 0 0 4px color-mix(in oklab, var(--accent) 22%, transparent)',
                  }
                : status === 'dropped'
                  ? { background: 'var(--state-stopped)' }
                  : {
                      background: 'var(--canvas)',
                      boxShadow: `inset 0 0 0 2px ${statusColor(status)}`,
                    }
          }
          aria-hidden
        >
          {status === 'watched' && <Check className="size-3 text-[#04120c]" strokeWidth={3} />}
          {current && (
            <span className="size-[6px] rounded-full bg-white" />
          )}
        </span>

        {!isLast && (
          <span
            aria-hidden
            className="h-px flex-1"
            style={{
              background: status === 'watched' ? 'color-mix(in oklab, var(--state-done) 45%, transparent)' : 'var(--line)',
            }}
          />
        )}
      </div>

      {/* ── Card ────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'group/art mr-4 mt-1 block overflow-hidden rounded-md border bg-surface transition-all duration-300 ease-out hover:-translate-y-1 hover:card-shadow',
          current ? 'border-[var(--accent)]/60' : 'border-line hover:border-white/15',
        )}
        style={{
          boxShadow: current ? '0 0 0 1px color-mix(in oklab, var(--accent) 35%, transparent)' : undefined,
        }}
      >
        <div className="relative">
          <Cover
            src={entry.posterUrl}
            alt=""
            ratio="16/9"
            scrim="card"
            edged={false}
            rounded={false}
            hoverZoom
            focus="upper"
            sizes="252px"
            className="h-full w-full"
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
            <FormatMark format={entry.format} />
            {status !== 'watching' && <StatusChip status={status} size="xs" />}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-3">
            <h3 className="clamp-2 text-small font-semibold leading-snug text-white">{entry.name}</h3>
            <p className="num mt-1 text-[0.6875rem] text-white/65">
              {isUpcoming(entry) ? 'Not aired' : episodeLabel(entry)}
            </p>

            <div className="mt-2 flex items-center gap-2">
              <ProgressBar value={ratio} height="xs" track="strong" animate />
              <span className="num shrink-0 text-[0.6875rem] font-semibold text-white/80">
                {percent}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.li>
  )
}

/* -------------------------------------------------------------------------- */

function statusColor(status: EntryStatus): string {
  switch (status) {
    case 'watched':
      return 'var(--state-done)'
    case 'watching':
      return 'var(--accent)'
    case 'upcoming':
      return 'var(--state-upcoming)'
    case 'planned':
      return 'var(--state-planned)'
    case 'paused':
      return 'var(--state-paused)'
    case 'dropped':
      return 'var(--state-stopped)'
    default:
      return 'var(--state-idle)'
  }
}

function ordinal(value: number): string {
  const suffix =
    value % 10 === 1 && value !== 11
      ? 'st'
      : value % 10 === 2 && value !== 12
        ? 'nd'
        : value % 10 === 3 && value !== 13
          ? 'rd'
          : 'th'
  return `${value}${suffix}`
}

