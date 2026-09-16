'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, LayoutGrid, List, Search, Table2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DURATION, EASE } from '@/lib/motion'

/* ==========================================================================
   Library controls
   --------------------------------------------------------------------------
   Browsing controls must support the collection without competing with it, so
   everything here is one row of small pills and menus above the grid:

     search   a real field, wide enough to type in
     status   a segmented control — the facet people actually use
     menus    format · genre · franchise · sort, collapsed into labelled
              dropdowns so the row never grows into a filter wall
     density  grid · list · table, as icon buttons

   The counts stay attached to the options (as they are in a real index), and a
   zero-count option is dimmed rather than hidden, so the row never reflows
   under the pointer.
   ========================================================================== */

/* -------------------------------------------------------------------------- */
/* Search                                                                     */
/* -------------------------------------------------------------------------- */

export function SearchField({
  value,
  onChange,
  placeholder = 'Search titles and arcs',
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
        aria-hidden
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search your library"
        className="h-10 w-full rounded-full border border-line bg-surface-2 pl-10 pr-9 text-body text-ink placeholder:text-ink-3 transition-colors focus:border-brand focus:outline-none"
        style={{ borderColor: undefined }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-ink-3 transition-colors hover:bg-white/[0.08] hover:text-ink"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Segmented status                                                           */
/* -------------------------------------------------------------------------- */

export interface SegmentOption {
  value: string
  label: string
  count?: number
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
}: {
  options: SegmentOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <div
      role="group"
      className={cn(
        'rail flex items-center gap-1 overflow-x-auto rounded-full border border-line bg-surface-2 p-1',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        const empty = (option.count ?? 0) === 0 && !active
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              'relative shrink-0 rounded-full px-3 py-1.5 text-small font-medium whitespace-nowrap transition-colors duration-200',
              active ? 'text-white' : empty ? 'text-ink-3/60 hover:text-ink-2' : 'text-ink-2 hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId="segment-pill"
                className="absolute inset-0 rounded-full bg-brand"
                transition={{ type: 'spring', stiffness: 460, damping: 38 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Dropdown                                                                   */
/* -------------------------------------------------------------------------- */

export interface MenuOption {
  value: string
  label: string
  count?: number
}

export function Dropdown({
  label,
  options,
  value,
  onChange,
  allLabel,
  className,
}: {
  label: string
  options: MenuOption[]
  value: string
  onChange: (value: string) => void
  /** Label used when nothing is selected, e.g. "All genres". */
  allLabel: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = options.find((option) => option.value === value)
  const isDefault = !active || active.value === 'all'

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-full border px-3.5 text-small transition-colors duration-200',
          isDefault
            ? 'border-line bg-surface-2 text-ink-2 hover:text-ink'
            : 'border-brand/40 bg-brand-soft text-ink',
        )}
      >
        <span className="truncate">{isDefault ? allLabel : active?.label}</span>
        <ChevronDown
          className={cn('size-3.5 shrink-0 text-ink-3 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: DURATION.overlay, ease: EASE }}
            className="rail absolute left-0 top-full z-40 mt-2 max-h-80 w-56 overflow-y-auto rounded-md border border-line-strong bg-surface py-1 lift"
          >
            {options.map((option) => {
              const selected = option.value === value
              const empty = (option.count ?? 0) === 0 && !selected
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-body transition-colors',
                      selected ? 'text-ink' : empty ? 'text-ink-3/60' : 'text-ink-2 hover:bg-white/[0.05] hover:text-ink',
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {option.count !== undefined && (
                        <span className="num text-small text-ink-3">{option.count}</span>
                      )}
                      {selected && <Check className="size-3.5 text-brand-strong" aria-hidden />}
                    </span>
                  </button>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Density                                                                    */
/* -------------------------------------------------------------------------- */

const DENSITY_ICON = {
  grid: LayoutGrid,
  list: List,
  table: Table2,
} as const

export function DensityToggle({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; hint: string }[]
}) {
  return (
    <div
      className="flex items-center gap-1 rounded-full border border-line bg-surface-2 p-1"
      role="group"
      aria-label="Result density"
    >
      {options.map((option) => {
        const Icon = DENSITY_ICON[option.value as keyof typeof DENSITY_ICON] ?? LayoutGrid
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            title={`${option.label} — ${option.hint}`}
            className={cn(
              'grid size-8 place-items-center rounded-full transition-colors duration-200',
              active ? 'bg-white/[0.10] text-ink' : 'text-ink-3 hover:bg-white/[0.05] hover:text-ink-2',
            )}
          >
            <Icon className="size-4" aria-hidden />
            <span className="sr-only">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
