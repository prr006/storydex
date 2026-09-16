import { cn } from '@/lib/utils'
import { statusVisual, type EntryStatus } from '@/lib/design'

/* ==========================================================================
   Status
   --------------------------------------------------------------------------
   Every state in StoryDex is one of six, and each one is drawn the same way at
   every scale: a tinted chip, a word, or a dot.

     watched   → emerald   "Completed"
     watching  → indigo    "Watching"
     planned   → blue      "Planned"
     upcoming  → amber     "Upcoming"
     paused    → grey      "On hold"
     dropped   → red       "Stopped"

   The chip is the app's workhorse: it sits on artwork (posters, timeline cards)
   and in tables, always at the same size and weight, so state is legible
   anywhere without a legend. Colour alone never carries it — the word is always
   there, and the dot variant keeps a shape distinction for tight spaces.
   ========================================================================== */

/** A tinted chip. Safe on artwork: solid fill, no transparency behind text. */
export function StatusChip({
  status,
  label,
  className,
  size = 'sm',
}: {
  status: EntryStatus
  label?: string
  className?: string
  size?: 'xs' | 'sm'
}) {
  const visual = statusVisual(status)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap',
        size === 'xs'
          ? 'px-1.5 py-[3px] text-[0.625rem] tracking-[0.06em] uppercase'
          : 'px-2 py-[3px] text-[0.6875rem] tracking-[0.04em]',
        className,
      )}
      style={{
        color: visual.color,
        background: `color-mix(in oklab, ${visual.color} 24%, #05060a)`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${visual.color} 34%, transparent)`,
      }}
    >
      {label ?? visual.label}
    </span>
  )
}

/** The dot. Shape distinguishes what colour cannot. */
export function StatusDot({ status, className }: { status: EntryStatus; className?: string }) {
  const visual = statusVisual(status)
  const base = 'inline-block shrink-0'

  if (status === 'dropped') {
    return (
      <span
        className={cn(base, 'h-[3px] w-2.5 rounded-full', className)}
        style={{ background: visual.color }}
        aria-hidden
      />
    )
  }

  if (status === 'watching') {
    return (
      <span
        className={cn(base, 'relative size-2 rounded-full', className)}
        style={{ boxShadow: `inset 0 0 0 1.5px ${visual.color}` }}
        aria-hidden
      >
        <span
          className="absolute inset-y-[2px] left-[2px] w-[3px] rounded-full"
          style={{ background: visual.color }}
        />
      </span>
    )
  }

  return (
    <span
      className={cn(base, 'size-2 rounded-full', className)}
      style={
        status === 'watched'
          ? { background: visual.color }
          : { boxShadow: `inset 0 0 0 1.5px ${visual.color}` }
      }
      aria-hidden
    />
  )
}

/** Dot + word, for rows and headers where a chip would be too loud. */
export function StatusMark({
  status,
  label,
  size = 'sm',
  dot = true,
  className,
}: {
  status: EntryStatus
  label?: string
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
}) {
  const visual = statusVisual(status)
  const text = label ?? visual.label

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        size === 'sm' ? 'text-small' : 'text-body',
        className,
      )}
      style={{ color: visual.color }}
    >
      {dot && <StatusDot status={status} />}
      {text}
    </span>
  )
}

/** The single "you are here" token. */
export function CurrentMark({ label = 'Watching', className }: { label?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-small font-medium', className)}
      style={{ color: 'var(--accent-strong)' }}>
      <StatusDot status="watching" />
      {label}
    </span>
  )
}
