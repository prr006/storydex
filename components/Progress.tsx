'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EASE } from '@/lib/motion'

/* ==========================================================================
   Progress primitives
   --------------------------------------------------------------------------
   A progress bar is the most repeated element in a tracking app and the most
   common place to look cheap. Rules here:

     · Never a rounded pill with a glowing gradient fill.
     · The bar is a 2–3px rule that grows once, on scroll, with an expo-out
       curve. It reads as an instrument, not a decoration.
     · Finished stories change colour to jade rather than changing shape.
   ========================================================================== */

interface StoryBarProps {
  ratio: number
  complete?: boolean
  className?: string
  /** Delay before the grow animation, in seconds. */
  delay?: number
  height?: number
  /** Show subtle tick marks at each entry boundary. */
  ticks?: number
  label?: string
}

export function StoryBar({
  ratio,
  complete = false,
  className,
  delay = 0.15,
  height = 3,
  ticks,
  label,
}: StoryBarProps) {
  const clamped = Math.max(0, Math.min(1, ratio))

  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-full bg-white/[0.09]', className)}
      style={{ height }}
      // Only exposed as a progressbar when it has an accessible name. Decorative
      // bars (the one on every card) are hidden from assistive tech instead of
      // being announced as an unnamed 71%.
      role={label ? 'progressbar' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
      aria-valuenow={label ? Math.round(clamped * 100) : undefined}
    >
      <motion.div
        className="h-full origin-left rounded-full"
        style={{
          background: complete
            ? 'linear-gradient(90deg, var(--color-jade-dim), var(--color-jade))'
            : 'linear-gradient(90deg, var(--color-brand-600), var(--color-brand-300))',
        }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: clamped }}
        viewport={{ once: true, margin: '-30px' }}
        transition={{ duration: 0.95, ease: EASE, delay }}
      />
      {/* Entry boundaries — turns a percentage into a readable segment count. */}
      {ticks && ticks > 1 && ticks < 40 && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {Array.from({ length: ticks - 1 }, (_, i) => (
            <span
              key={i}
              className="absolute top-0 h-full w-px bg-ink-950/70"
              style={{ left: `${((i + 1) / ticks) * 100}%` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* --------------------------------------------------------------------------
   ProgressRing — used exactly twice in the product (dashboard summary and
   franchise detail). Anywhere else it would be set dressing.
   -------------------------------------------------------------------------- */

interface RingProps {
  ratio: number
  size?: number
  thickness?: number
  complete?: boolean
  children?: React.ReactNode
  delay?: number
  className?: string
}

export function ProgressRing({
  ratio,
  size = 132,
  thickness = 3,
  complete = false,
  children,
  delay = 0.2,
  className,
}: RingProps) {
  const clamped = Math.max(0, Math.min(1, ratio))
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const colour = complete ? 'var(--color-jade)' : 'var(--color-brand-400)'

  return (
    <div className={cn('relative grid shrink-0 place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-hairline)"
          strokeWidth={thickness}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colour}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference * (1 - clamped) }}
          viewport={{ once: true }}
          transition={{ duration: 1.35, ease: EASE, delay }}
          style={{ filter: complete ? 'none' : 'drop-shadow(0 0 6px rgba(139,92,246,0.45))' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

/* --------------------------------------------------------------------------
   Segmented ledger — the dashboard's "where does my library stand" strip.
   A single hairline of proportional blocks: the whole library in 40px of
   height, with no card, no chart library, and no decoration.
   -------------------------------------------------------------------------- */

export interface LedgerSegment {
  label: string
  value: number
  color: string
}

export function Ledger({ segments, className }: { segments: LedgerSegment[]; className?: string }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  if (total === 0) return null

  return (
    <div
      className={cn('flex h-1.5 w-full gap-[2px] overflow-hidden rounded-full', className)}
      role="img"
      aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}
    >
      {segments
        .filter((s) => s.value > 0)
        .map((segment, i) => (
          <motion.span
            key={segment.label}
            className="h-full rounded-[2px]"
            style={{ background: segment.color, flexGrow: segment.value, flexBasis: 0 }}
            initial={{ opacity: 0, scaleY: 0.4 }}
            whileInView={{ opacity: 1, scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.1 + i * 0.06 }}
          />
        ))}
    </div>
  )
}
