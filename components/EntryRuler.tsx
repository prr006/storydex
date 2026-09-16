'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getEntryStatus, type EntryStatus } from '@/lib/design'
import type { Season } from '@/lib/franchise'

/* ==========================================================================
   EntryRuler — the signature component
   --------------------------------------------------------------------------
   Replaces every progress bar, ring and ledger in the product.

   One block per entry, coloured by state:
     watched   → solid pine
     current   → solid clay (the app's only warm mark)
     planned   → ochre outline
     not aired → faint outline
     stopped   → red-brown outline

   Why it matters: "3 of 4" is the number, but the ruler is the *shape of the
   story*. A user can see at a glance that a franchise is four TV seasons, or
   two parts and a film, or one long run — before reading a single word. It is
   also honest at any scale: it never rounds 41 of 64 episodes into "64%".
   ========================================================================== */

const BLOCK_CLASS: Record<EntryStatus, string> = {
  watched: 'bg-state-done',
  watching: 'bg-state-progress',
  planned: 'bg-transparent ring-1 ring-inset ring-state-planned/70',
  upcoming: 'bg-transparent ring-1 ring-inset ring-rule-strong',
  unwatched: 'bg-transparent ring-1 ring-inset ring-rule-strong',
  paused: 'bg-transparent ring-1 ring-inset ring-state-paused/70',
  dropped: 'bg-transparent ring-1 ring-inset ring-state-stopped/70',
}

interface EntryRulerProps {
  entries: Season[]
  /** Visual height of a block. `md` is the default; `sm` for tables. */
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Gap between blocks. */
  gap?: 'tight' | 'normal'
  /** Animate the fill once. Off for repeated renders in long lists. */
  animate?: boolean
  /** Accessible description; falls back to a generated summary. */
  label?: string
}

const HEIGHT = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' } as const
const GAP = { tight: 'gap-[2px]', normal: 'gap-[3px]' } as const

export function EntryRuler({
  entries,
  size = 'md',
  gap = 'normal',
  className,
  animate = false,
  label,
}: EntryRulerProps) {
  if (entries.length === 0) return null

  const statuses = entries.map((entry) => getEntryStatus(entry))
  const watched = statuses.filter((s) => s === 'watched').length

  return (
    <div
      className={cn('flex w-full', GAP[gap], className)}
      role="img"
      aria-label={label ?? `${watched} of ${entries.length} entries watched`}
    >
      {statuses.map((status, index) => {
        const block = (
          <span
            className={cn('flex-1 rounded-xs', HEIGHT[size], BLOCK_CLASS[status])}
            style={{ minWidth: 3 }}
          />
        )

        if (!animate) return <span key={index} className="contents">{block}</span>

        return (
          <motion.span
            key={index}
            className={cn('flex-1 rounded-xs', HEIGHT[size], BLOCK_CLASS[status])}
            style={{ minWidth: 3, transformOrigin: 'left' }}
            initial={{ opacity: 0, scaleX: 0.4 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.28, delay: 0.04 + index * 0.03, ease: [0.22, 1, 0.36, 1] }}
          />
        )
      })}
    </div>
  )
}

/* ==========================================================================
   EpisodeRuler — for a single long-running entry.
   A show with 1,122 episodes cannot have one block per episode, so a single
   entry gets a continuous fill. Used only inside rows that represent one entry.
   ========================================================================== */

export function EpisodeRuler({
  watched,
  total,
  className,
  size = 'sm',
}: {
  watched: number
  total: number
  className?: string
  size?: 'sm' | 'md'
}) {
  if (!total || total <= 0) return null
  const ratio = Math.max(0, Math.min(1, watched / total))

  return (
    <div
      className={cn('w-full overflow-hidden rounded-xs bg-sunk', HEIGHT[size], className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={watched}
      aria-label={`${watched} of ${total} episodes`}
    >
      <motion.span
        className="block h-full rounded-xs bg-state-progress"
        initial={{ width: 0 }}
        animate={{ width: `${ratio * 100}%` }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}

/* ==========================================================================
   CompositionStrip — "what shape is this story?"
   One mark per entry, sized by format, so a franchise's anatomy is legible in
   a single line: ▬▬▬ ▪ ▬ — four TV seasons, a film, then an OVA.
   ========================================================================== */

const FORMAT_SHAPE: Record<string, { width: number; filled: boolean }> = {
  TV: { width: 14, filled: true },
  TV_SHORT: { width: 9, filled: true },
  MOVIE: { width: 7, filled: true },
  OVA: { width: 5, filled: false },
  ONA: { width: 5, filled: false },
  SPECIAL: { width: 4, filled: false },
  MUSIC: { width: 4, filled: false },
}

export function CompositionStrip({
  entries,
  className,
}: {
  entries: Season[]
  className?: string
}) {
  if (entries.length === 0) return null

  return (
    <span className={cn('flex h-3 items-center gap-[3px]', className)} aria-hidden>
      {entries.map((entry, index) => {
        const status = getEntryStatus(entry)
        const shape = FORMAT_SHAPE[entry.format ?? 'TV'] ?? { width: 10, filled: true }
        const done = status === 'watched'
        const current = status === 'watching'

        return (
          <span
            key={index}
            className={cn(
              'h-3 rounded-xs',
              done
                ? 'bg-state-done'
                : current
                  ? 'bg-state-progress'
                  : shape.filled
                    ? 'bg-rule-strong'
                    : 'bg-transparent ring-1 ring-inset ring-rule-strong',
            )}
            style={{ width: shape.width }}
          />
        )
      })}
    </span>
  )
}
