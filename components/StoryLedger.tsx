'use client'

import { motion } from 'framer-motion'
import { Ring } from '@/components/Bars'
import { StoryPath } from '@/components/Path'
import { StatusChip } from '@/components/StatusMark'
import { cn } from '@/lib/utils'
import {
  accentVars,
  getEntryStatus,
  getEpisodeProgress,
  getEpisodeTotal,
  getStoryPhase,
  getStoryProgress,
  phaseToStatus,
  statusVisual,
} from '@/lib/design'
import { EASE } from '@/lib/motion'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   StoryDeck — the story's arithmetic, stated once
   --------------------------------------------------------------------------
   The hero answers "what is this and where am I". This answers "how much of it
   is left", and it does so as three instruments rather than a stats row:

     the ring      completion, as a shape
     the ledger    one bar per entry, its length proportional to that entry's
                   real episode count, its colour that entry's state — so the
                   *mass* of a story is visible: a 366-episode run beside a
                   single-episode special is obvious before you read a label
     the route     the same story as the path, for the third time on this page
                   and never once as a percentage bar in a card

   Everything is drawn from real numbers. Nothing here is estimated from a
   percentage, and nothing is invented to fill a column.
   ========================================================================== */

export function StoryLedger({ franchise }: { franchise: Franchise }) {
  const progress = getStoryProgress(franchise)
  const episodes = getEpisodeProgress(franchise)
  const total = getEpisodeTotal(franchise)
  const remaining = Math.max(0, episodes.total - episodes.watched)
  const phase = getStoryPhase(franchise)

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
      className="shell relative z-10"
      style={accentVars(franchise)}
    >
      <div className="float-panel grid gap-6 p-5 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-9 lg:p-6">
        {/* ── Completion ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-5">
          <Ring value={progress.ratio} size={104} stroke={7}>
            <div className="text-center">
              <p className="num text-[1.6rem] font-bold leading-none text-ink">
                {Math.round(progress.ratio * 100)}%
              </p>
              <p className="mt-1 text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
                complete
              </p>
            </div>
          </Ring>

          <div className="min-w-0">
            <p className="text-title font-bold text-ink">
              {progress.completed}
              <span className="text-ink-3">/{progress.total}</span>
            </p>
            <p className="mt-1 text-small text-ink-3">entries watched</p>

            <p className="num mt-3 text-body text-ink-2">
              {episodes.watched.toLocaleString('en-US')}
              <span className="text-ink-3"> / {episodes.total.toLocaleString('en-US')} eps</span>
            </p>
            <p className="mt-0.5 text-small text-ink-3">
              {phase === 'complete'
                ? 'Everything watched'
                : remaining > 0
                  ? `${remaining.toLocaleString('en-US')} episodes remaining`
                  : 'Nothing left that exists'}
            </p>

            <StatusChip status={phaseToStatus(phase)} size="xs" className="mt-3" />
          </div>
        </div>

        {/* ── Ledger + route ───────────────────────────────────────────── */}
        <div className="lg:border-l lg:border-line lg:pl-9">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="text-card font-bold text-ink">Episode ledger</h2>
            <p className="num text-small text-ink-3">
              <span className="text-ink-2">{episodes.watched.toLocaleString('en-US')}</span> watched
              <span className="mx-1.5 text-line-strong">·</span>
              <span className="text-ink-2">{remaining.toLocaleString('en-US')}</span> remaining
            </p>
          </div>

          {/* Bars sized by episode count, coloured by state, labelled by year. */}
          <div className="mt-4 space-y-2.5">
            {franchise.seasons.map((season, index) => {
              const status = getEntryStatus(season)
              const visual = statusVisual(status)
              const share = total > 0 ? Math.max(0.05, (season.episodes || 0) / total) : 0.1
              const current = status === 'watching'

              return (
                <motion.div
                  key={season.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.16 + index * 0.05, ease: EASE }}
                  className="flex items-center gap-3"
                >
                  <span
                    className={cn('h-2.5 shrink-0 rounded-full', current && 'node-halo')}
                    style={{
                      background: visual.color,
                      opacity: status === 'watched' ? 0.95 : current ? 1 : 0.5,
                      width: `${Math.min(100, share * 100)}%`,
                      maxWidth: 300,
                      minWidth: 12,
                    }}
                    title={`${season.name} — ${season.episodes || 0} episodes`}
                  />
                  <span
                    className={cn(
                      'num shrink-0 text-[0.6875rem]',
                      current ? 'font-semibold text-ink' : 'text-ink-3',
                    )}
                  >
                    {season.year > 0 ? season.year : '—'}
                  </span>
                  {current && (
                    <span className="shrink-0 text-[0.6875rem] font-semibold" style={{ color: 'var(--accent-strong)' }}>
                      now
                    </span>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* The route, again — at this size it reads as the story's timeline,
              and it is the one element that appears on every story surface. */}
          <div className="mt-6 border-t border-line pt-4">
            <StoryPath entries={franchise.seasons} size="rail" dashedAhead />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.6875rem] text-ink-3">
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
      </div>
    </motion.section>
  )
}
