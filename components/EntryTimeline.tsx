'use client'

import { motion } from 'framer-motion'
import { Cover, FormatMark } from '@/components/Cover'
import { CompositionStrip, EpisodeRuler } from '@/components/EntryRuler'
import { StatusMark } from '@/components/StatusMark'
import {
  formatEpisodes,
  formatScore,
  getEntryStatus,
  statusVisual,
} from '@/lib/design'
import type { Season } from '@/lib/franchise'
import { cn } from '@/lib/utils'

/* ==========================================================================
   EntryTimeline
   --------------------------------------------------------------------------
   "The story, in the order it is meant to be consumed." One entry per stop on
   a vertical rail, each labelled by what it actually is — a season, a film, an
   OVA, a special — because "Season 3" followed by "Season 4" that is secretly
   a two-episode OVA is exactly the confusion this page exists to remove.

   The node marks reuse the entry-status vocabulary from the cards and the
   ruler: filled = watched, half = in progress, hollow = not yet, bar = stopped.
   Same shape, same meaning, at every scale in the product.
   ========================================================================== */

export function EntryTimeline({ entries }: { entries: Season[] }) {
  return (
    <div>
      {/* The whole story's shape, one line, above the detail. */}
      <div className="mb-8 flex items-center gap-4">
        <span className="eyebrow shrink-0">Composition</span>
        <CompositionStrip entries={entries} className="flex-1" />
      </div>

      <ol className="relative">
        {entries.map((entry, index) => (
          <TimelineRow key={entry.id} entry={entry} index={index} last={index === entries.length - 1} />
        ))}
      </ol>
    </div>
  )
}

function TimelineRow({ entry, index, last }: { entry: Season; index: number; last: boolean }) {
  const status = getEntryStatus(entry)
  const visual = statusVisual(status)
  const watchedEpisodes = status === 'watched' ? entry.episodes : (entry.progress ?? 0)
  const showEpisodeProgress = entry.episodes > 1 && (status === 'watched' || status === 'watching')
  const score = formatScore(entry.score)

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: Math.min(index * 0.03, 0.24), ease: [0.22, 1, 0.36, 1] }}
      className="relative flex gap-5 pb-8 last:pb-0 sm:gap-7"
    >
      {/* ── Rail ─────────────────────────────────────────────────────── */}
      <div className="relative flex w-8 shrink-0 flex-col items-center pt-1">
        <span
          className={cn('relative z-10 block shrink-0 rounded-full', nodeClass(status))}
          style={nodeStyle(status, visual.color)}
          aria-hidden
        />
        {!last && <span className="absolute top-4 h-full w-px bg-rule" aria-hidden />}
      </div>

      {/* ── Cover ────────────────────────────────────────────────────── */}
      <Cover
        src={entry.posterUrl}
        alt=""
        tint={entry.isExpanded ? 'var(--brand)' : undefined}
        ratio="2/3"
        sizes="56px"
        className="hidden w-14 shrink-0 sm:block"
      />

      {/* ── Facts ────────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h3 className="text-lead font-semibold leading-snug text-ink">{entry.name}</h3>
          <StatusMark status={status} className="shrink-0" />
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-small text-ink-3">
          <FormatMark format={entry.format} />
          <span className="num">{entry.year > 0 ? entry.year : 'Year unknown'}</span>
          <span aria-hidden className="text-rule-strong">
            ·
          </span>
          <span className="num">{formatEpisodes(entry)}</span>
          {score && (
            <>
              <span aria-hidden className="text-rule-strong">
                ·
              </span>
              <span className="num" title="Your AniList score, out of 10">
                Scored {score}
              </span>
            </>
          )}
          {entry.isExpanded && (
            <span className="text-brand-text">Added by story grouping</span>
          )}
        </div>

        {/* Episode-level progress, only for entries you're actually inside. */}
        {showEpisodeProgress && (
          <div className="mt-3 flex max-w-md items-center gap-3">
            <EpisodeRuler watched={watchedEpisodes} total={entry.episodes} />
            <span className="num shrink-0 text-small text-ink-3">
              {watchedEpisodes}/{entry.episodes}
            </span>
          </div>
        )}

        {entry.siteUrl && (
          <a
            href={entry.siteUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2.5 inline-block text-small text-ink-3 underline decoration-rule-strong underline-offset-4 transition-colors hover:text-ink"
          >
            View on AniList
          </a>
        )}
      </div>
    </motion.li>
  )
}

/* -------------------------------------------------------------------------- */

/** The node shape vocabulary — identical to the card and ruler marks. */
function nodeClass(status: ReturnType<typeof getEntryStatus>): string {
  switch (status) {
    case 'dropped':
      return 'h-[3px] w-5 rounded-full'
    case 'watched':
      return 'size-3 rounded-full'
    case 'watching':
      return 'size-3 rounded-full'
    default:
      return 'size-3 rounded-full'
  }
}

function nodeStyle(status: ReturnType<typeof getEntryStatus>, color: string): React.CSSProperties {
  switch (status) {
    case 'dropped':
    case 'watched':
      return { background: color }
    case 'watching':
      return {
        background: `linear-gradient(90deg, ${color} 0 50%, transparent 50% 100%)`,
        boxShadow: `inset 0 0 0 1.5px ${color}`,
      }
    default:
      return { boxShadow: `inset 0 0 0 1.5px ${color}` }
  }
}
