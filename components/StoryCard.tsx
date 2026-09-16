'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { Poster } from '@/components/Artwork'
import { StatusDot } from '@/components/Status'
import { StoryBar } from '@/components/Progress'
import { cn } from '@/lib/utils'
import { EASE } from '@/lib/motion'
import {
  formatScore,
  formatSpan,
  getEntryStatus,
  getNextEntry,
  getStoryPhase,
  getStoryProgress,
  phaseCopy,
  pluralize,
} from '@/lib/design'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   StoryCard — the franchise card
   --------------------------------------------------------------------------
   Design decisions:
     · 2:3 portrait. The poster IS the card; there is no card chrome.
     · Default state shows: artwork, mono progress counter, index rule, title,
       year span, and a 2px progress rule. Nothing else. No badges, no score
       on the face — the score is a hover detail because it's a nice-to-have.
     · On hover the artwork scales slowly (1.04) while the scrim deepens and a
       second layer is revealed: phase tag, entry count, and the next entry
       with its "continue" affordance.
     · The "watching" story gets a warm ember progress rule. That single warm
       thread across an otherwise violet grid is what makes the library
       scannable in under a second.
   ========================================================================== */

interface StoryCardProps {
  franchise: Franchise
  index?: number
  /** `feature` renders larger (2 columns on desktop) for the top of a grid. */
  variant?: 'default' | 'feature'
}

export function StoryCard({ franchise, index = 0, variant = 'default' }: StoryCardProps) {
  const progress = getStoryProgress(franchise)
  const phase = getStoryPhase(franchise)
  const phaseMeta = phaseCopy(phase)
  const next = getNextEntry(franchise)
  const score = formatScore(franchise.seasons.find((s) => s.score && s.score > 0)?.score)
  const nextStatus = next ? getEntryStatus(next) : null

  const accent = progress.complete
    ? 'var(--color-jade)'
    : phase === 'watching'
      ? 'var(--color-ember)'
      : 'var(--color-brand-400)'

  const isFeature = variant === 'feature'

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: EASE, delay: Math.min(index * 0.045, 0.5) }}
      className="group/story relative"
    >
      <Link
        href={`/franchise/${franchise.id}`}
        className="block focus-visible:outline-none"
        aria-label={`${franchise.name} — ${progress.completed} of ${progress.total} entries watched`}
      >
        <div
          className={cn(
            'relative aspect-[2/3] overflow-hidden rounded-[22px] bg-ink-800 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
            'group-hover/story:-translate-y-1.5 group-hover/story:rim-hover group-focus-visible/story:rim-hover',
          )}
        >
          {/* ── Artwork ─────────────────────────────────────────────── */}
          <div className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/story:scale-[1.045]">
            <Poster
              src={franchise.posterUrl}
              alt={franchise.name}
              tint={franchise.accentColor}
              className="h-full w-full"
              sizes={isFeature ? '(max-width: 768px) 50vw, 32vw' : '(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 17vw'}
            />
          </div>

          {/* Base scrim: always present so the title is legible on any art. */}
          <div className="scrim-b absolute inset-0" />
          {/* Hover scrim: deepens the lower third to make room for details. */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-transparent opacity-0 transition-opacity duration-500 group-hover/story:opacity-100" />

          {/* ── Top row: counter + status ───────────────────────────── */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
            <span className="numeric rounded-full bg-ink-950/45 px-2.5 py-1 text-[11px] text-chalk/90 backdrop-blur-md">
              {progress.completed}
              <span className="text-chalk/35">/</span>
              {progress.total}
            </span>
            <StatusDot status={nextStatus ?? (progress.complete ? 'watched' : 'planned')} size={8} />
          </div>

          {/* ── Bottom content ──────────────────────────────────────── */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            {/* Hover-revealed detail layer. Occupies space always (no layout
                jump) but only fades in, so the card feels like it opens. */}
            <div className="mb-2.5 translate-y-2 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/story:translate-y-0 group-hover/story:opacity-100">
              <div className="mb-2 flex items-center gap-2">
                <span className="label text-[9px]" style={{ color: phaseMeta.color }}>
                  {phaseMeta.label}
                </span>
                <span className="h-3 w-px bg-white/15" />
                <span className="label text-[9px] text-mist">{pluralize(progress.total, 'entry', 'entries')}</span>
              </div>

              {next && !progress.complete && (
                <div className="flex items-center gap-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-chalk/95 text-ink-950">
                    <Play className="size-3 fill-current" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="label block text-[9px] text-ember">Next</span>
                    <span className="block truncate text-[12px] font-medium text-chalk">{next.name}</span>
                  </span>
                </div>
              )}

              {progress.complete && (
                <p className="text-[12px] font-medium text-jade">
                  Story complete — {pluralize(progress.total, 'entry', 'entries')} watched
                </p>
              )}

              {score && (
                <p className="mt-2 numeric text-[10px] text-veil">
                  Your score <span className="text-mist">{score}</span>
                </p>
              )}
            </div>

            {/* Title */}
            <h3
              className={cn(
                'font-semibold leading-[1.15] tracking-[-0.01em] text-chalk drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]',
                isFeature ? 'text-[22px]' : 'text-[17px]',
              )}
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {franchise.name}
            </h3>

            {/* Meta line */}
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="numeric text-[10px] text-mist">
                {formatSpan(franchise.seasons.map((s) => s.year))}
              </span>
              <span className="numeric text-[10px]" style={{ color: accent }}>
                {progress.percent}%
              </span>
            </div>

            {/* Progress rule — 2px, colour-coded by phase. */}
            <StoryBar
              ratio={progress.ratio}
              complete={progress.complete}
              ticks={progress.total}
              delay={Math.min(index * 0.05, 0.4)}
              className="mt-2.5"
              height={2}
            />
          </div>

          {/* Hover light: a faint violet wash from the top-left, as if the card
              were catching light. Subtle enough to feel physical, not neon. */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover/story:opacity-100"
            style={{
              background: `radial-gradient(120% 80% at 12% 0%, color-mix(in oklab, ${accent} 14%, transparent), transparent 60%)`,
            }}
          />
        </div>
      </Link>
    </motion.div>
  )
}

/* Alias kept so existing imports of `FranchiseCard` keep resolving. */
export const FranchiseCard = StoryCard
