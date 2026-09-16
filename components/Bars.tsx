'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/* ==========================================================================
   Bars
   --------------------------------------------------------------------------
   Two instruments, and no others:

     ProgressBar  a continuous fill — "episode 9 of 14". Used for one *entry*:
                  the entry you are inside, a row in the record table, the
                  episode ledger.
     Ring         a completion donut — used once per page, in the deck, for the
                  whole story.

   A story is never drawn as a fill here. Stories are drawn as paths, one node
   per entry (see Path.tsx), because "4 of 6 entries" is a shape and a bar can
   never show which four.

   Every fill reads `var(--accent)`, which is either StoryDex indigo or the
   story's own artwork colour (see `accentVars()` in lib/design). That is what
   makes a bar feel like it belongs to the story it describes.
   ========================================================================== */

export function ProgressBar({
  value,
  className,
  height = 'md',
  track = 'strong',
  animate = true,
  label,
}: {
  /** 0–1. */
  value: number
  className?: string
  height?: 'xs' | 'sm' | 'md'
  track?: 'strong' | 'soft'
  animate?: boolean
  label?: string
}) {
  const ratio = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
  const h = height === 'xs' ? 'h-[2px]' : height === 'sm' ? 'h-1' : 'h-1.5'

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full',
        h,
        track === 'strong' ? 'bg-white/12' : 'bg-white/[0.06]',
        className,
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
      aria-label={label}
    >
      {animate ? (
        <motion.span
          className="block h-full rounded-full"
          style={{ background: 'var(--accent)' }}
          initial={{ width: 0 }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : (
        <span
          className="block h-full rounded-full"
          style={{ background: 'var(--accent)', width: `${ratio * 100}%` }}
        />
      )}
    </div>
  )
}

export function Ring({
  value,
  size = 92,
  stroke = 6,
  className,
  children,
}: {
  /** 0–1. */
  value: number
  size?: number
  stroke?: number
  className?: string
  children?: React.ReactNode
}) {
  const ratio = Math.max(0, Math.min(1, value))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className={cn('relative grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(255 255 255 / 0.10)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - ratio) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}
