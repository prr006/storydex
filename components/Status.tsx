import { cn } from '@/lib/utils'
import { statusVisual, type EntryStatus } from '@/lib/design'

/* ==========================================================================
   Status rendering
   --------------------------------------------------------------------------
   Every status indicator in the product is built from these two pieces, so
   "watched / watching / planned" can never drift out of sync between the
   dashboard, the cards and the Franchise Map.

   Deliberately NOT a pill with a tinted background and a border — that's the
   badge soup that makes dashboards look generated. Instead:
     · a small solid dot in the status colour (or a ring for "you are here"),
     · mono uppercase text at 11px with wide tracking,
     · colour that is legible but never loud.
   ========================================================================== */

interface StatusDotProps {
  status: EntryStatus
  size?: number
  /** Earns an animated halo — reserved for the current entry. */
  live?: boolean
  className?: string
}

export function StatusDot({ status, size = 8, live, className }: StatusDotProps) {
  const visual = statusVisual(status)
  const isLive = live ?? visual.live

  if (status === 'watched') {
    // Finished entries get a checkmark, not a dot: it reads instantly at 8px.
    return (
      <svg
        viewBox="0 0 12 12"
        width={size + 3}
        height={size + 3}
        className={cn('shrink-0', className)}
        style={{ color: visual.color }}
        aria-hidden
      >
        <path
          d="M2.2 6.4 4.7 8.9 9.8 3.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <span
      aria-hidden
      className={cn('relative inline-block shrink-0 rounded-full', isLive && 'animate-halo', className)}
      style={{
        width: size,
        height: size,
        background: status === 'watching' ? visual.color : 'transparent',
        boxShadow:
          status === 'watching'
            ? '0 0 10px 0 color-mix(in oklab, var(--color-ember) 60%, transparent)'
            : `inset 0 0 0 1.5px ${visual.color}`,
        opacity: visual.dim ? 0.75 : 1,
      }}
    />
  )
}

interface StatusTagProps {
  status: EntryStatus
  /** Override the mono label (e.g. "BACKLOG" → "NOT STARTED"). */
  label?: string
  className?: string
  /** Slightly larger treatment for hero usage. */
  emphasis?: boolean
}

export function StatusTag({ status, label, className, emphasis = false }: StatusTagProps) {
  const visual = statusVisual(status)
  const text = label ?? visual.tag

  return (
    <span
      className={cn('inline-flex items-center gap-2', emphasis ? 'label' : 'label text-[10px]', className)}
      style={{ color: visual.dim ? 'var(--color-mist)' : visual.color }}
    >
      <StatusDot status={status} />
      {text}
    </span>
  )
}

/**
 * The "you are here" marker for the Franchise Map. This is the one element in
 * the product allowed a warm colour and an animated halo, because it answers
 * the question the entire app exists to answer.
 */
export function YouAreHere({ label = 'You are here', className }: { label?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative grid h-2.5 w-2.5 place-items-center">
        <span className="absolute inset-0 animate-halo rounded-full bg-ember" />
        <span className="h-1.5 w-1.5 rounded-full bg-ember" />
      </span>
      <span className="label text-[10px] text-ember">{label}</span>
    </span>
  )
}
