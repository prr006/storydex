import { cn } from '@/lib/utils'
import { statusVisual, type EntryStatus } from '@/lib/design'

/* ==========================================================================
   StatusMark
   --------------------------------------------------------------------------
   A word and a dot. Not a pill, not a tinted badge with a border — the previous
   design's badge layer is gone entirely.

   Every status also carries a shape, so colour is never the only signal:
     watched   → a filled disc
     watching  → a half-filled disc (you are between episodes)
     planned   → a hollow disc
     not aired → a hollow disc at low contrast
     stopped   → a bar (a hard stop)
   ========================================================================== */

interface StatusMarkProps {
  status: EntryStatus
  /** Override the wording, e.g. "Caught up" for a story rather than an entry. */
  label?: string
  /** `sm` for tables and cards, `md` in rows and headers. */
  size?: 'sm' | 'md'
  /** Render the dot before the word. */
  dot?: boolean
  className?: string
  /** Colour only, no dot — for tight spaces. */
  bare?: boolean
}

export function StatusMark({
  status,
  label,
  size = 'sm',
  dot = true,
  className,
  bare = false,
}: StatusMarkProps) {
  const visual = statusVisual(status)
  const text = label ?? visual.label

  if (bare) {
    return (
      <span className={cn('font-medium', size === 'sm' ? 'text-small' : 'text-body', className)}
        style={{ color: visual.color }}>
        {text}
      </span>
    )
  }

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

/** The mark itself. Shape distinguishes what colour alone cannot. */
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
    // Half-filled: you are between episodes.
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

/**
 * The single "you are here" token.
 * Clay is the only warm colour in the product, so this needs no emphasis
 * beyond being the only clay thing on screen.
 */
export function CurrentMark({ label = 'Current', className }: { label?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-small font-medium text-current', className)}>
      <StatusDot status="watching" />
      {label}
    </span>
  )
}
