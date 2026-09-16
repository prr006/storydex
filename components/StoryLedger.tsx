'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { Cover } from '@/components/Cover'
import { ProgressBar, Ring } from '@/components/Bars'
import { StatusChip } from '@/components/StatusMark'
import { currentEntry, phaseToStatus, progressOfEntry } from '@/components/Cards'
import { cn } from '@/lib/utils'
import {
  accentVars,
  episodeLabel,
  formatFormat,
  getEntryStatus,
  getEpisodeProgress,
  getEpisodeTotal,
  getStoryPhase,
  getStoryProgress,
  isUpcoming,
  statusVisual,
} from '@/lib/design'
import { EASE } from '@/lib/motion'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   StoryLedger
   --------------------------------------------------------------------------
   The panel under the hero: what this story is made of, and where you are in
   it, in three parts.

     Completion   a ring, because "96%" deserves a shape as well as a numeral.
     Ledger       one bar per entry, its width proportional to that entry's
                  episode count and its colour its state — so the story's mass
                  distribution is visible: a 366-episode first season beside a
                  single 24-episode epilogue is obvious before you read a label.
     Now          the entry you are inside, with artwork and a resume action.
                  This is the strongest control on the page after the hero.

   Episode counts here are real AniList numbers, summed honestly — never
   estimated from a percentage.
   ========================================================================== */

export function StoryLedger({ franchise }: { franchise: Franchise }) {
  const progress = getStoryProgress(franchise)
  const episodes = getEpisodeProgress(franchise)
  const total = getEpisodeTotal(franchise)
  const phase = getStoryPhase(franchise)
  const entry = currentEntry(franchise)
  const remaining = Math.max(0, episodes.total - episodes.watched)

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
      className="shell -mt-8 relative z-10"
      style={accentVars(franchise)}
    >
      <div className="grid gap-6 rounded-lg border border-line bg-surface/95 p-5 backdrop-blur-xl lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,19rem)] lg:gap-8 lg:p-6">
        {/* ── Completion ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-5">
          <Ring value={progress.ratio} size={96} stroke={7}>
            <div className="text-center">
              <p className="num text-[1.5rem] font-bold leading-none text-ink">
                {Math.round(progress.ratio * 100)}%
              </p>
              <p className="mt-1 text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
                complete
              </p>
            </div>
          </Ring>

          <div className="min-w-0">
            <p className="text-card font-semibold text-ink">
              {progress.completed} of {progress.total} entries
            </p>
            <p className="num mt-1 text-small text-ink-3">
              {episodes.watched.toLocaleString('en-US')} of {episodes.total.toLocaleString('en-US')} eps
            </p>
            <p className="mt-1 text-small text-ink-3">
              {phase === 'complete'
                ? 'Everything watched'
                : remaining > 0
                  ? `${remaining.toLocaleString('en-US')} episodes remaining`
                  : 'Nothing left that exists'}
            </p>
            <StatusChip status={phaseToStatus(phase)} size="xs" className="mt-2.5" />
          </div>
        </div>

        {/* ── Episode ledger ────────────────────────────────────────────── */}
        <div className="lg:border-l lg:border-line lg:pl-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-card font-semibold text-ink">Episode ledger</h2>
            <p className="num text-small text-ink-3">
              <span className="text-ink-2">{episodes.watched.toLocaleString('en-US')}</span> watched
              <span className="mx-1.5 text-line-strong">·</span>
              <span className="text-ink-2">{remaining.toLocaleString('en-US')}</span> remaining
            </p>
          </div>

          {/* Bars sized by episode count, coloured by state, labelled by year. */}
          <div className="mt-4 space-y-2.5">
            {franchise.seasons.map((season) => {
              const status = getEntryStatus(season)
              const visual = statusVisual(status)
              const share = total > 0 ? Math.max(0.05, (season.episodes || 0) / total) : 0.1

              return (
                <div key={season.id} className="flex items-center gap-3">
                  <span
                    className="h-2.5 shrink-0 rounded-full transition-all duration-500"
                    style={{
                      background: visual.color,
                      opacity: status === 'watched' ? 0.95 : status === 'watching' ? 1 : 0.55,
                      width: `${Math.min(100, share * 100)}%`,
                      maxWidth: 260,
                      minWidth: 12,
                    }}
                    title={`${season.name} — ${season.episodes || 0} episodes`}
                  />
                  <span className="num shrink-0 text-[0.6875rem] text-ink-3">
                    {season.year > 0 ? season.year : '—'}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.6875rem] text-ink-3">
            {(['watched', 'watching', 'upcoming'] as const).map((status) => (
              <span key={status} className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ background: statusVisual(status).color }}
                  aria-hidden
                />
                {statusVisual(status).label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Currently watching ────────────────────────────────────────── */}
        <div className="lg:border-l lg:border-line lg:pl-8">
          <p className="eyebrow">Currently watching</p>

          {entry ? (
            <div className="mt-3">
              <div className="flex items-center gap-3">
                <span className="relative block h-[68px] w-[48px] shrink-0 overflow-hidden rounded-sm">
                  <Cover
                    src={entry.posterUrl}
                    alt=""
                    ratio="2/3"
                    edged={false}
                    rounded={false}
                    sizes="48px"
                    className="h-full w-full"
                  />
                </span>
                <div className="min-w-0">
                  <p className="clamp-2 text-card font-semibold leading-snug text-ink">{entry.name}</p>
                  <p className="num mt-0.5 text-small text-ink-3">
                    {formatFormat(entry.format)}
                    {entry.year > 0 && ` · ${entry.year}`}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="num text-small text-ink-2">{episodeLabel(entry)}</span>
                  <span className="num text-small text-ink-3">
                    {Math.round(progressOfEntry(entry) * 100)}%
                  </span>
                </div>
                <ProgressBar value={progressOfEntry(entry)} height="sm" className="mt-2" />
              </div>

              <Link
                href={`/franchise/${franchise.id}`}
                className="mt-3.5 inline-flex h-9 w-full items-center justify-center gap-2 rounded-full bg-brand text-small font-semibold text-white transition-colors hover:bg-brand-strong"
              >
                <Play className="size-3.5 fill-current" aria-hidden />
                {isUpcoming(entry) ? 'Not aired yet' : `Resume episode ${entry.progress ?? 0}`}
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-body text-ink-2">
              Everything in this story is watched. Nothing here needs your attention.
            </p>
          )}
        </div>
      </div>
    </motion.section>
  )
}
