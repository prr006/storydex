'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/* ==========================================================================
   Statement
   --------------------------------------------------------------------------
   The opening block on Home. It exists to answer "what is this and where am I"
   in one sentence of plain language, and it is the *only* place in the product
   where aggregate numbers appear as a group — set as one right-aligned
   paragraph, subordinate to the sentence, in the secondary ink.

   The sentence itself is generated from real data ("You're four entries into
   Re:ZERO"), so the app greets you with your own position rather than with a
   greeting.
   ========================================================================== */

export function Statement({
  date,
  children,
  figures,
  className,
}: {
  /** Small caps line above the sentence. */
  date: string
  /** The sentence. Keep it under 70 characters. */
  children: React.ReactNode
  /** `label: value` pairs — rendered as one line, never as cards. */
  figures: { label: string; value: string }[]
  className?: string
}) {
  return (
    <div className={cn('section-rule pt-8', className)}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="max-w-[24ch]">
          <p className="eyebrow">{date}</p>
          <h1 className="mt-3 text-display font-semibold leading-[1.08] tracking-[-0.03em] text-ink">
            {children}
          </h1>
        </div>

        {figures.length > 0 && (
          <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-2 lg:justify-end">
            {figures.map((figure) => (
              <div key={figure.label} className="flex items-baseline gap-2">
                <dt className="text-small text-ink-3">{figure.label}</dt>
                <dd className="num text-body font-medium text-ink">{figure.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </motion.div>
    </div>
  )
}
