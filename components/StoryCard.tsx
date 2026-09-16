'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Cover } from '@/components/Cover'
import { EntryRuler } from '@/components/EntryRuler'
import { StatusMark } from '@/components/StatusMark'
import { cn } from '@/lib/utils'
import {
  getNextEntry,
  getStoryPhase,
  getStoryProgress,
  phaseCopy,
} from '@/lib/design'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   StoryCard
   --------------------------------------------------------------------------
   Everything the card is allowed to say, and nothing else:

     cover · title · progress · total · status · next entry

   That is six facts, and they are arranged so the eye reads top-to-bottom in
   one pass: what it looks like → what it is → where I am → what's next.

   What was deliberately removed from the previous card: the score, the genre
   list, the year range, the percentage numeral, the hover-reveal overlay, the
   badge layer. Each was individually defensible and collectively a pile. The
   percentage is gone because the ruler *is* the percentage, stated honestly in
   discrete entries rather than rounded to an integer.
   ========================================================================== */

interface StoryCardProps {
  franchise: Franchise
  index?: number
  className?: string
}

export function StoryCard({ franchise, index = 0, className }: StoryCardProps) {
  const progress = getStoryProgress(franchise)
  const phase = getStoryPhase(franchise)
  const meta = phaseCopy(phase)
  const next = getNextEntry(franchise)

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: Math.min(index * 0.02, 0.28), ease: [0.22, 1, 0.36, 1] }}
      className={cn('group/card', className)}
    >
      <Link
        href={`/franchise/${franchise.id}`}
        className="block rounded-md"
        aria-label={`${franchise.name} — ${progress.completed} of ${progress.total} entries watched`}
      >
        {/* ── Plate ─────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-md transition-all duration-200 ease-out group-hover/card:-translate-y-0.5 group-hover/card:lift">
          <Cover
            src={franchise.posterUrl}
            alt={franchise.name}
            tint={franchise.accentColor}
            ratio="4/5"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 16vw"
            className="transition-transform duration-300 ease-out group-hover/card:scale-[1.015]"
          />
          {/* Screen-reader-only and visually absent: the status lives below the
              cover, not on top of the artwork. */}
          <span className="sr-only">{meta.label}</span>
        </div>

        {/* ── Fact panel ────────────────────────────────────────────────── */}
        <div className="mt-3">
          <h3 className="clamp-2 text-[1.0625rem] font-semibold leading-[1.3] tracking-[-0.012em] text-ink">
            {franchise.name}
          </h3>

          <div className="mt-2.5 flex items-center justify-between gap-3">
            <StatusMark status={statusTokenFor(phase)} label={meta.label} />
            <span className="num text-small font-medium text-ink-2">
              {progress.completed}
              <span className="text-ink-3">/{progress.total}</span>
            </span>
          </div>

          <EntryRuler entries={franchise.seasons} size="sm" className="mt-2.5" />

          {/* One line, always present so the grid never reflows on hover. */}
          <p className="mt-2.5 truncate text-small text-ink-3">
            {progress.complete
              ? 'Story complete'
              : next
                ? `Next · ${next.name}`
                : 'Nothing left to watch'}
          </p>
        </div>
      </Link>
    </motion.article>
  )
}

/**
 * A story phase is not an entry status, but the shapes are the same
 * vocabulary. Mapping one onto the other keeps a single visual language.
 */
export function statusTokenFor(phase: ReturnType<typeof getStoryPhase>) {
  switch (phase) {
    case 'complete':
      return 'watched' as const
    case 'watching':
      return 'watching' as const
    case 'caught-up':
      return 'upcoming' as const
    case 'dropped':
      return 'dropped' as const
    case 'paused':
      return 'paused' as const
    case 'planned':
      return 'planned' as const
    default:
      return 'unwatched' as const
  }
}
