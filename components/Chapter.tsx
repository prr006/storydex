'use client'

import { cn } from '@/lib/utils'

/* ==========================================================================
   Chapter
   --------------------------------------------------------------------------
   The story page is written as five chapters, not as a dashboard. This is the
   only thing that decides how a chapter announces itself:

     ───────────────────────────────────────────────
     02                        Progress    (right: one line of live state)
     ───────────────────────────────────────────────

   A numeral, a name, an optional sentence — and a rule. No icon, no card, no
   background panel. The numbering is not decoration: it tells you the page has
   an order and that you have reached the end of it.
   ========================================================================== */

interface ChapterProps {
  /** Displayed as `01`–`05`. Pass a string to keep the leading zero. */
  index?: number
  title: string
  /** A short sentence under the title, in the reading voice. */
  lead?: string
  /** Right-aligned live state for this chapter, e.g. "3 of 4 watched". */
  meta?: React.ReactNode
  children: React.ReactNode
  className?: string
  /** `first` drops the top rule so chapter 01 sits flush under the masthead. */
  variant?: 'first' | 'default'
  id?: string
}

export function Chapter({
  index,
  title,
  lead,
  meta,
  children,
  className,
  variant = 'default',
  id,
}: ChapterProps) {
  return (
    <section
      id={id}
      className={cn('scroll-mt-24', variant === 'default' && 'section-rule pt-10', className)}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <div className="flex items-baseline gap-4">
          {index !== undefined && (
            <span className="num text-small font-medium text-ink-3">
              {String(index).padStart(2, '0')}
            </span>
          )}
          <h2 className="text-head font-semibold text-ink">{title}</h2>
        </div>
        {meta && <div className="text-body text-ink-2">{meta}</div>}
      </header>

      {lead && (
        <p className="reading mt-3 max-w-[62ch] text-ink-2">
          {lead}
        </p>
      )}

      <div className="mt-8">{children}</div>
    </section>
  )
}

/**
 * The section header used on Home, Library, Discover and Collections.
 * Same rules as Chapter, without the numeral — those pages are lists, not a
 * sequence, and numbering them would be a lie about their structure.
 */
export function SectionHead({
  title,
  lead,
  action,
  className,
  as: Tag = 'h2',
}: {
  title: string
  lead?: string
  action?: React.ReactNode
  className?: string
  as?: 'h1' | 'h2'
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-8 gap-y-3', className)}>
      <div>
        <Tag className="text-head font-semibold text-ink">{title}</Tag>
        {lead && (
          <p className="reading mt-2 max-w-[62ch] text-ink-2">{lead}</p>
        )}
      </div>
      {action}
    </div>
  )
}
