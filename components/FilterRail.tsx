'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE } from '@/lib/motion'
import { FILTER_CHIPS, SORT_OPTIONS, type FilterChip, type SortOption } from '@/lib/useDashboardControls'

/* ==========================================================================
   FilterRail — controls that read as typography, not as UI
   --------------------------------------------------------------------------
   Replaces the sticky glass control bar. Three decisions:

     1. Search is a single underline rule with a mono prompt, not a rounded
        input with a magnifier parked inside it. It looks like the top of a
        card catalogue drawer, which is the right metaphor for this product.
     2. Filters are underlined text buttons with a count. Chips with 0 results
        fade to 35% instead of disappearing, so the rail never reflows while
        you're using it.
     3. Sort is a custom popover — the native <select> is the single fastest
        way to make a careful interface look unfinished.
   ========================================================================== */

interface FilterRailProps {
  query: string
  setQuery: (value: string) => void
  sort: SortOption
  setSort: (value: SortOption) => void
  activeFilter: FilterChip
  setActiveFilter: (value: FilterChip) => void
  counts: Record<FilterChip, number>
}

export function FilterRail({
  query,
  setQuery,
  sort,
  setSort,
  activeFilter,
  setActiveFilter,
  counts,
}: FilterRailProps) {
  const [sortOpen, setSortOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ⌘K / Ctrl+K focuses search — the one keyboard affordance worth having.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') setSortOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!sortOpen) return
    const onClick = (e: MouseEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [sortOpen])

  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Sort'

  return (
    <div className="mt-9 border-b border-white/[0.07]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        {/* ── Search ──────────────────────────────────────────────────── */}
        <div className="relative w-full lg:max-w-sm">
          <div className="flex items-center gap-3 pb-2.5">
            <Search
              className={cn(
                'size-4 shrink-0 transition-colors duration-300',
                focused ? 'text-brand-300' : 'text-veil',
              )}
              aria-hidden
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search titles and entries"
              aria-label="Search your library"
              className="w-full bg-transparent text-[15px] text-chalk placeholder:text-veil focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="grid size-5 shrink-0 place-items-center rounded-full text-veil transition-colors hover:text-chalk"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          {/* The rule is the input's real container; it lights up on focus. */}
          <span className="absolute inset-x-0 bottom-0 h-px bg-white/[0.12]" />
          <motion.span
            className="absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-brand-500 via-brand-300 to-transparent"
            initial={false}
            animate={{ scaleX: focused || query ? 1 : 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          />
        </div>

        {/* ── Sort ────────────────────────────────────────────────────── */}
        <div className="relative shrink-0" ref={sortRef}>
          <button
            type="button"
            onClick={() => setSortOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={sortOpen}
            className="group flex items-baseline gap-2 pb-2.5 text-body-sm transition-colors"
          >
            <span className="label text-veil">Sort</span>
            <span className="text-chalk group-hover:text-brand-100">{activeSortLabel}</span>
            <ChevronDown
              className={cn(
                'size-3.5 translate-y-[-1px] text-veil transition-transform duration-300',
                sortOpen && 'rotate-180',
              )}
            />
          </button>

          <AnimatePresence>
            {sortOpen && (
              <motion.div
                role="listbox"
                initial={{ opacity: 0, y: -6, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.985 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="glass rim absolute right-0 top-full z-40 mt-3 w-56 overflow-hidden rounded-2xl p-1.5 shadow-2xl"
              >
                {SORT_OPTIONS.map((option) => {
                  const selected = option.value === sort
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setSort(option.value)
                        setSortOpen(false)
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-body-sm transition-colors',
                        selected ? 'bg-white/[0.06] text-chalk' : 'text-mist hover:bg-white/[0.04] hover:text-chalk',
                      )}
                    >
                      {option.label}
                      {selected && <Check className="size-3.5 shrink-0 text-brand-300" />}
                    </button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Filter rail ──────────────────────────────────────────────── */}
      {/* pb-4 gives the active underline room to sit inside the scroll
          container: `overflow-x: auto` clips vertically too, so an underline
          hung outside this box would never paint. */}
      <div className="mt-5 flex items-center gap-6 overflow-x-auto rail pb-4">
        {FILTER_CHIPS.map((chip) => {
          const count = counts[chip.value] ?? 0
          const isActive = activeFilter === chip.value
          const isEmpty = count === 0 && !isActive

          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => setActiveFilter(chip.value)}
              aria-pressed={isActive}
              className={cn(
                'group relative shrink-0 pb-1 text-body-sm transition-colors duration-300',
                isActive ? 'text-chalk' : isEmpty ? 'text-veil/40' : 'text-mist hover:text-chalk',
              )}
            >
              <span className="flex items-baseline gap-1.5">
                {chip.label}
                <span className={cn('numeric text-[10px]', isActive ? 'text-brand-300' : 'text-veil/70')}>
                  {count}
                </span>
              </span>
              {isActive && (
                <motion.span
                  layoutId="filter-active"
                  className="absolute inset-x-0 -bottom-4 h-px bg-brand-300"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
