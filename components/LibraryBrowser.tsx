'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, LayoutGrid, Rows3, Search, Table2, X } from 'lucide-react'
import { StoryGrid, StoryList, StoryTable } from '@/components/StoryViews'
import { cn } from '@/lib/utils'
import {
  DENSITIES,
  FORMAT_FACETS,
  SORT_OPTIONS,
  STATUS_FACETS,
  useLibraryView,
  type Density,
  type FormatFacet,
  type LibraryFilters,
  type SortKey,
  type StatusFacet,
} from '@/lib/libraryView'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   LibraryBrowser
   --------------------------------------------------------------------------
   The browsing surface, shared by Home (compact) and the Library page (full).

   Design notes:

   · **A ruled facet block, not a filter bar.** Facets are labelled rows of
     text options with live counts, separated by hairlines — the way an index
     in a printed catalogue is set. Active facets are marked with weight and a
     rule beneath the word, never with a filled pill.
   · **Counts describe what the click would do.** They're computed against the
     other facets, not the whole library, so a number is always a promise.
   · **Zero-result facets stay visible at low contrast** rather than vanishing,
     so the control set never reflows underneath the pointer.
   · **Three densities**, because "find it" and "compare it" are different
     tasks and deserve different layouts.
   ========================================================================== */

interface LibraryBrowserProps {
  franchises: Franchise[]
  /** `full` adds the franchise facet and unlimited results. `compact` trims. */
  variant?: 'full' | 'compact'
  /** Mirror filters into the URL. Only meaningful on a dedicated page. */
  syncUrl?: boolean
  defaults?: Partial<LibraryFilters>
  /** Compact only: how many results before the "browse all" affordance. */
  limit?: number
  id?: string
}

export function LibraryBrowser({
  franchises,
  variant = 'full',
  syncUrl = false,
  defaults,
  limit,
  id,
}: LibraryBrowserProps) {
  const view = useLibraryView({ franchises, syncUrl, defaults })
  const { filters, set, reset, isFiltered, results, counts, genres, activeFacetSummary } = view

  const shown = limit ? results.slice(0, limit) : results
  const hidden = results.length - shown.length

  return (
    <section id={id} className="scroll-mt-24">
      {/* ── Search + sort + density ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b border-rule-strong pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3"
            aria-hidden
          />
          <input
            value={filters.query}
            onChange={(event) => set('query', event.target.value)}
            placeholder="Search titles and entries"
            aria-label="Search your library"
            className="h-10 w-full rounded-sm border border-rule-strong bg-field pl-9 pr-9 text-body text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => set('query', '')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-xs text-ink-3 hover:bg-sunk hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <SortMenu value={filters.sort} onChange={(value) => set('sort', value)} />

          <span aria-hidden className="h-5 w-px bg-rule-strong" />

          <DensityToggle value={filters.density} onChange={(value) => set('density', value)} />
        </div>
      </div>

      {/* ── Facets ──────────────────────────────────────────────────────── */}
      <div className="mt-5 divide-y divide-rule">
        <FacetRow
          label="Status"
          options={STATUS_FACETS.map((facet) => ({
            value: facet.value,
            label: facet.label,
            count: counts.status[facet.value] ?? 0,
          }))}
          value={filters.status}
          onChange={(value) => set('status', value as StatusFacet)}
        />

        <FacetRow
          label="Format"
          options={FORMAT_FACETS.map((facet) => ({
            value: facet.value,
            label: facet.label,
            count: counts.format[facet.value] ?? 0,
          }))}
          value={filters.format}
          onChange={(value) => set('format', value as FormatFacet)}
        />

        <FacetRow
          label="Genre"
          options={[
            { value: 'all', label: 'All', count: franchises.length },
            ...counts.genre.map((genre) => ({
              value: genre.value,
              label: genre.label,
              count: genre.count,
            })),
          ]}
          value={filters.genre}
          onChange={(value) => set('genre', value)}
          max={variant === 'compact' ? 8 : undefined}
        />
      </div>

      {/* ── Result summary ──────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-body text-ink-2">
          <span className="num font-medium text-ink">{results.length}</span>{' '}
          {results.length === 1 ? 'story' : 'stories'}
          {activeFacetSummary.length > 0 && (
            <span className="text-ink-3">
              {' '}
              in {activeFacetSummary.join(' · ')}
            </span>
          )}
        </p>

        {isFiltered && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-small text-ink-2 underline decoration-rule-strong underline-offset-4 transition-colors hover:text-ink"
          >
            <X className="size-3.5" aria-hidden />
            Clear filters
          </button>
        )}
      </div>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      <div className="mt-7">
        {results.length === 0 ? (
          <NoMatches onReset={reset} summary={activeFacetSummary} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={filters.density}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              {filters.density === 'grid' && <StoryGrid franchises={shown} />}
              {filters.density === 'list' && <StoryList franchises={shown} />}
              {filters.density === 'table' && <StoryTable franchises={shown} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {hidden > 0 && (
        <p className="mt-8">
          <Link
            href="/library"
            className="inline-flex items-center gap-1.5 text-body font-medium text-brand-text underline decoration-brand/30 underline-offset-4 hover:decoration-brand"
          >
            Browse all {results.length} stories
            <span aria-hidden>→</span>
          </Link>
        </p>
      )}
    </section>
  )
}

/* ==========================================================================
   FacetRow — a labelled line of text options with live counts
   ========================================================================== */

interface FacetOption {
  value: string
  label: string
  count: number
}

function FacetRow({
  label,
  options,
  value,
  onChange,
  max,
}: {
  label: string
  options: FacetOption[]
  value: string
  onChange: (value: string) => void
  max?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const visible = max && !expanded ? options.slice(0, max) : options
  const hiddenCount = options.length - visible.length

  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-baseline sm:gap-6">
      <span className="w-16 shrink-0 text-small font-medium text-ink-3">{label}</span>

      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        {visible.map((option) => {
          const active = option.value === value
          const empty = option.count === 0 && !active
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              className={cn(
                'group/facet relative pb-0.5 text-body transition-colors duration-150',
                active
                  ? 'font-semibold text-ink'
                  : empty
                    ? 'text-ink-3/50 hover:text-ink-2'
                    : 'text-ink-2 hover:text-ink',
              )}
            >
              {option.label}
              <span className={cn('num ml-1.5 text-small', active ? 'text-current' : 'text-ink-3')}>
                {option.count}
              </span>
              {active && (
                <motion.span
                  layoutId={`facet-${label}`}
                  className="absolute inset-x-0 -bottom-px h-[1.5px] bg-current"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          )
        })}

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-small text-ink-3 underline decoration-rule-strong underline-offset-4 hover:text-ink-2"
          >
            +{hiddenCount} more
          </button>
        )}
        {expanded && max && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-small text-ink-3 underline decoration-rule-strong underline-offset-4 hover:text-ink-2"
          >
            Show fewer
          </button>
        )}
      </div>
    </div>
  )
}

/* ==========================================================================
   Sort + density controls
   ========================================================================== */

function SortMenu({ value, onChange }: { value: SortKey; onChange: (value: SortKey) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = SORT_OPTIONS.find((option) => option.value === value)

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
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 text-body text-ink-2 transition-colors hover:text-ink"
      >
        <span className="text-ink-3">Sort</span>
        <span className="font-medium text-ink">{active?.label}</span>
        <ChevronDown
          className={cn('size-3.5 text-ink-3 transition-transform duration-200', open && 'rotate-180')}
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
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-md border border-rule-strong bg-surface py-1 lift"
          >
            {SORT_OPTIONS.map((option) => {
              const selected = option.value === value
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
                      'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-body transition-colors',
                      selected ? 'text-ink' : 'text-ink-2 hover:bg-sunk hover:text-ink',
                    )}
                  >
                    {option.label}
                    {selected && <Check className="size-3.5 shrink-0 text-brand" aria-hidden />}
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

const DENSITY_ICON = {
  grid: LayoutGrid,
  list: Rows3,
  table: Table2,
} as const

function DensityToggle({ value, onChange }: { value: Density; onChange: (value: Density) => void }) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Result density">
      {DENSITIES.map((density) => {
        const Icon = DENSITY_ICON[density.value]
        const active = density.value === value
        return (
          <button
            key={density.value}
            type="button"
            onClick={() => onChange(density.value)}
            aria-pressed={active}
            title={`${density.label} — ${density.hint}`}
            className={cn(
              'grid size-8 place-items-center rounded-sm border transition-colors duration-150',
              active
                ? 'border-rule-strong bg-sunk text-ink'
                : 'border-transparent text-ink-3 hover:bg-sunk hover:text-ink-2',
            )}
          >
            <Icon className="size-4" aria-hidden />
            <span className="sr-only">{density.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ==========================================================================
   Empty result
   ========================================================================== */

function NoMatches({ onReset, summary }: { onReset: () => void; summary: string[] }) {
  return (
    <div className="border border-rule-strong bg-surface px-6 py-14 text-center">
      <p className="reading-lead text-ink">Nothing in your collection matches that.</p>
      <p className="mx-auto mt-2 max-w-md text-body text-ink-2">
        {summary.length > 0 ? (
          <>
            You&apos;re narrowing by <span className="text-ink">{summary.join(' · ')}</span>.
          </>
        ) : (
          'Try a different search term.'
        )}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex h-9 items-center rounded-sm border border-rule-strong px-4 text-body font-medium text-ink transition-colors hover:bg-sunk"
      >
        Clear filters
      </button>
    </div>
  )
}
