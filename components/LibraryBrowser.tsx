'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { StoryGrid, StoryList, StoryTable } from '@/components/StoryViews'
import { DensityToggle, Dropdown, SearchField, SegmentedControl } from '@/components/LibraryControls'
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
import { DURATION, EASE } from '@/lib/motion'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   LibraryBrowser
   --------------------------------------------------------------------------
   The browsing surface, shared by Home and the Library page.

   The composition mirrors a real library: **the collection is the page, the
   controls are a toolbar above it**. One row of small pills and menus, then
   nothing but artwork until the next screenful.

   · Status is the one facet worth a segmented control, because it is the one
     people actually switch between.
   · Formats, genres and franchises collapse into labelled dropdowns so the
     toolbar can never grow into a wall of chips.
   · Counts ride on the options, computed against the *other* facets, so a
     number is always a promise about what clicking it would do.
   · Three densities, because "find it" and "compare it" are different tasks.
   ========================================================================== */

interface LibraryBrowserProps {
  franchises: Franchise[]
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
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchField
          value={filters.query}
          onChange={(value) => set('query', value)}
          className="w-full lg:max-w-[16rem]"
        />

        <SegmentedControl
          options={STATUS_FACETS.map((facet) => ({
            value: facet.value,
            label: facet.label,
            count: counts.status[facet.value] ?? 0,
          }))}
          value={filters.status}
          onChange={(value) => set('status', value as StatusFacet)}
          className="lg:max-w-[34rem]"
        />

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          {variant === 'full' && (
            <Dropdown
              label="Format"
              allLabel="All formats"
              value={filters.format}
              onChange={(value) => set('format', value as FormatFacet)}
              options={FORMAT_FACETS.map((facet) => ({
                value: facet.value,
                label: facet.label,
                count: counts.format[facet.value] ?? 0,
              }))}
              className="w-[9.5rem]"
            />
          )}

          <Dropdown
            label="Genre"
            allLabel="All genres"
            value={filters.genre}
            onChange={(value) => set('genre', value)}
            options={[
              { value: 'all', label: 'All genres', count: franchises.length },
              ...counts.genre.map((genre) => ({
                value: genre.value,
                label: genre.label,
                count: genre.count,
              })),
            ]}
            className="w-[9.5rem]"
          />

          <Dropdown
            label="Sort"
            allLabel="Sort"
            value={filters.sort}
            onChange={(value) => set('sort', value as SortKey)}
            options={SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            className="w-[11.5rem]"
          />

          <DensityToggle
            value={filters.density}
            onChange={(value) => set('density', value as Density)}
            options={DENSITIES}
          />
        </div>
      </div>

      {/* ── Result line ─────────────────────────────────────────────────── */}
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-small text-ink-3">
          <span className="num text-ink-2">{results.length}</span>{' '}
          {results.length === 1 ? 'story' : 'stories'}
          {activeFacetSummary.length > 0 && <span> in {activeFacetSummary.join(' · ')}</span>}
        </p>

        {isFiltered && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-small text-ink-2 transition-colors hover:text-ink"
          >
            <X className="size-3.5" aria-hidden />
            Clear filters
          </button>
        )}
      </div>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      <div className="mt-6">
        {results.length === 0 ? (
          <NoMatches onReset={reset} summary={activeFacetSummary} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={filters.density}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: DURATION.enter, ease: EASE }}
            >
              {filters.density === 'grid' && (
                <StoryGrid franchises={shown} grouped={!isFiltered && shown.length > 4} />
              )}
              {filters.density === 'list' && <StoryList franchises={shown} />}
              {filters.density === 'table' && <StoryTable franchises={shown} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {hidden > 0 && (
        <p className="mt-8">
          <a
            href="/library"
            className="inline-flex items-center gap-1.5 text-body font-medium text-brand-strong transition-colors hover:text-ink"
          >
            Browse all {results.length} stories
            <span aria-hidden>→</span>
          </a>
        </p>
      )}
    </section>
  )
}

/* -------------------------------------------------------------------------- */

function NoMatches({ onReset, summary }: { onReset: () => void; summary: string[] }) {
  return (
    <div className="rounded-md border border-line bg-surface px-6 py-16 text-center">
      <p className="text-lead font-medium text-ink">Nothing in your collection matches that.</p>
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
        className={cn(
          'mt-6 inline-flex h-10 items-center rounded-full border border-line-strong px-5 text-body font-medium text-ink',
          'transition-colors hover:bg-white/[0.06]',
        )}
      >
        Clear filters
      </button>
    </div>
  )
}
