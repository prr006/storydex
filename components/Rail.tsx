'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ==========================================================================
   Rail
   --------------------------------------------------------------------------
   Home, Discover and the story page are all built from the same object: a
   titled row of artwork you can push sideways.

   The scroller is a real overflow container — native momentum scrolling on
   touch, snap points, and keyboard-reachable content — with arrow buttons that
   only appear when there is actually somewhere to go. Nothing auto-advances:
   a library you own should sit still until you move it.
   ========================================================================== */

export function Rail({
  children,
  className,
  itemWidth = 320,
  controls = true,
  controlsId,
}: {
  children: React.ReactNode
  className?: string
  /** Approximate card width, used for one press of an arrow. */
  itemWidth?: number
  controls?: boolean
  controlsId?: string
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)

  const measure = useCallback(() => {
    const node = scrollerRef.current
    if (!node) return
    const max = node.scrollWidth - node.clientWidth
    setAtStart(node.scrollLeft <= 2)
    setAtEnd(node.scrollLeft >= max - 2)
  }, [])

  useEffect(() => {
    measure()
    const node = scrollerRef.current
    if (!node) return
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure, children])

  function nudge(direction: -1 | 1) {
    const node = scrollerRef.current
    if (!node) return
    node.scrollBy({ left: direction * itemWidth * Math.max(1, Math.floor(node.clientWidth / itemWidth) - 1), behavior: 'smooth' })
  }

  const showControls = controls && !(atStart && atEnd)

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={measure}
        id={controlsId}
        className={cn(
          'rail -mx-[var(--spacing-shell)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--spacing-shell)] pb-2',
          className,
        )}
      >
        {children}
        {/* Breathing room at the end so the last card is never flush to the edge. */}
        <span aria-hidden className="w-1 shrink-0" />
      </div>

      {showControls && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <RailButton
            label="Scroll left"
            disabled={atStart}
            onClick={() => nudge(-1)}
            icon={<ChevronLeft className="size-4" aria-hidden />}
          />
          <RailButton
            label="Scroll right"
            disabled={atEnd}
            onClick={() => nudge(1)}
            icon={<ChevronRight className="size-4" aria-hidden />}
          />
        </div>
      )}
    </div>
  )
}

function RailButton({
  label,
  disabled,
  onClick,
  icon,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-controls={undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'grid size-9 place-items-center rounded-full border transition-colors duration-200',
        disabled
          ? 'border-line text-ink-3/40'
          : 'border-line-strong text-ink-2 hover:border-white/25 hover:bg-white/[0.06] hover:text-ink',
      )}
    >
      {icon}
    </button>
  )
}

/* -------------------------------------------------------------------------- */

/**
 * A titled row. The optional `count` and `meta` sit beside the title in the
 * same muted register, so a section never needs a subtitle paragraph.
 */
export function RailSection({
  title,
  meta,
  action,
  children,
  className,
  id,
}: {
  title: string
  meta?: React.ReactNode
  action?: { href: string; label: string }
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={cn('scroll-mt-24', className)}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="flex items-baseline gap-3">
          <h2 className="text-head font-semibold text-ink">{title}</h2>
          {meta && <p className="text-small text-ink-3">{meta}</p>}
        </div>
        {action && (
          <Link
            href={action.href}
            className="group/all inline-flex items-center gap-1.5 text-small font-medium text-ink-2 transition-colors hover:text-ink"
          >
            {action.label}
            <span
              aria-hidden
              className="transition-transform duration-200 group-hover/all:translate-x-0.5"
            >
              →
            </span>
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}
