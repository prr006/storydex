'use client'

import { motion } from 'framer-motion'
import { ProgressRing } from '@/components/Progress'
import { formatCount } from '@/lib/design'
import { EASE } from '@/lib/motion'

/* ==========================================================================
   ProgressRingStat — the dashboard's single hero statistic
   --------------------------------------------------------------------------
   "88 of 142 stories complete · 1,284 of 2,110 episodes" with a thin ring.
   This replaces a row of four stat boxes. One number, stated confidently,
   beats four numbers competing for attention.
   ========================================================================== */

interface Props {
  storiesComplete: number
  storiesTotal: number
  episodesWatched: number
  episodesTotal: number
  entriesWatched: number
  entriesTotal: number
}

export function ProgressRingStat({
  storiesComplete,
  storiesTotal,
  episodesWatched,
  episodesTotal,
  entriesWatched,
  entriesTotal,
}: Props) {
  const ratio = storiesTotal > 0 ? storiesComplete / storiesTotal : 0
  const complete = ratio >= 1 && storiesTotal > 0

  return (
    <div className="flex items-center gap-7">
      <ProgressRing ratio={ratio} size={124} thickness={3} complete={complete} delay={0.5}>
        <div className="text-center">
          <div className="text-editorial text-[40px] leading-none text-chalk">
            <Counter to={Math.round(ratio * 100)} />
            <span className="text-[22px] text-brand-300">%</span>
          </div>
          <div className="label mt-1.5 text-[9px] text-veil">complete</div>
        </div>
      </ProgressRing>

      <div className="hidden min-w-0 flex-col gap-4 sm:flex">
        <LedgerRow
          label="Stories"
          value={`${storiesComplete} / ${storiesTotal}`}
          note="finished"
          color="var(--color-jade)"
        />
        <LedgerRow
          label="Entries"
          value={`${entriesWatched} / ${entriesTotal}`}
          note="watched"
          color="var(--color-brand-400)"
        />
        <LedgerRow
          label="Episodes"
          value={
            episodesTotal > 0
              ? `${formatCount(episodesWatched)} / ${formatCount(episodesTotal)}`
              : '—'
          }
          note="of runtime"
          color="var(--color-ember)"
        />
      </div>
    </div>
  )
}

function LedgerRow({
  label,
  value,
  note,
  color,
}: {
  label: string
  value: string
  note: string
  color: string
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="size-1.5 shrink-0 translate-y-[-1px] rounded-full" style={{ background: color }} />
      <span className="w-16 shrink-0 text-body-sm text-mist">{label}</span>
      <span className="numeric text-chalk">{value}</span>
      <span className="text-[11px] text-veil">{note}</span>
    </div>
  )
}

/** Counts up once on mount. Editorial numerals deserve a little arrival. */
function Counter({ to }: { to: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.65 }}
    >
      {to}
    </motion.span>
  )
}
