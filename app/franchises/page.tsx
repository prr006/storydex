'use client'

import Link from 'next/link'
import { useLibraryContext } from '@/components/AppShell'
import { StoryObject, StoryRowObject } from '@/components/StoryObject'
import { SpineShelf } from '@/components/StorySpines'
import { EmptyLibrary } from '@/components/EmptyLibrary'
import { Atmosphere } from '@/components/Atmosphere'
import { libraryTotals } from '@/lib/summaries'
import { getStoryPhase, getStoryProgress, type StoryPhase } from '@/lib/design'
import { EASE } from '@/lib/motion'
import { motion } from 'framer-motion'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   Collections — /franchises
   --------------------------------------------------------------------------
   The premise of the product, made physical: a franchise is not a tile, it is
   an object with a size, a spine and an inside.

   Each shelf therefore has its own shape, because the stories on it are in
   different relationships with you:

     IN PROGRESS   large objects — covers fanned along the foot, the path drawn
                   across them, the story you are inside given the most room
     CAUGHT UP     the shelf proper: upright spines, pressed together, pullable
     COMPLETED     the same shelf, in green, in the same order you finished
     NOT STARTED   rows — smaller, quieter, no artwork wasted on a story with
                   nothing to show yet
     SET ASIDE     the same rows, dimmed, so a dropped story stays findable
                   without ever competing for attention

   That rhythm is the page. Nothing here is a uniform grid of equal cards.
   ========================================================================== */

const SHELVES: { phase: StoryPhase; title: string; note: string; shape: 'objects' | 'shelf' | 'rows' }[] = [
  { phase: 'watching', title: 'In progress', note: 'Stories you are inside right now', shape: 'objects' },
  { phase: 'caught-up', title: 'Caught up', note: 'Everything that exists is watched — waiting on more', shape: 'shelf' },
  { phase: 'complete', title: 'Completed', note: 'Start to end, nothing skipped', shape: 'shelf' },
  { phase: 'backlog', title: 'Not started', note: 'On the list, nothing watched yet', shape: 'rows' },
  { phase: 'planned', title: 'Planned', note: 'Marked as planned on AniList', shape: 'rows' },
  { phase: 'paused', title: 'On hold', note: 'Started, then set down', shape: 'rows' },
  { phase: 'dropped', title: 'Set aside', note: 'Walked away from — kept, never suggested', shape: 'rows' },
]

export default function FranchisesPage() {
  const { library, openImport } = useLibraryContext()
  const { franchises, loading, isImported } = library

  if (loading) {
    return (
      <div className="shell py-14">
        <div className="h-14 w-[26rem] animate-pulse rounded-sm bg-surface-2" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-[19rem] animate-pulse rounded-lg bg-surface-2" />
          ))}
        </div>
      </div>
    )
  }

  if (!isImported || franchises.length === 0) {
    return <EmptyLibrary onImport={openImport} />
  }

  const totals = libraryTotals(franchises)
  const multi = franchises.filter((franchise) => franchise.seasons.length > 1)
  const deepest = [...franchises].sort((a, b) => b.seasons.length - a.seasons.length)[0]
  const totalEntries = franchises.reduce((sum, franchise) => sum + franchise.seasons.length, 0)
  const completedEntries = franchises.reduce(
    (sum, franchise) => sum + getStoryProgress(franchise).completed,
    0,
  )

  const shelves = SHELVES.map((shelf) => ({
    ...shelf,
    stories: franchises
      .filter((franchise) => getStoryPhase(franchise) === shelf.phase)
      .sort((a, b) => b.seasons.length - a.seasons.length || a.name.localeCompare(b.name)),
  })).filter((shelf) => shelf.stories.length > 0)

  return (
    <div className="relative pb-24">
      <Atmosphere intensity="default" />

      {/* ── The wall ─────────────────────────────────────────────────── */}
      <header className="shell relative pt-14">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="eyebrow">Collections</p>
          <h1 className="mt-4 max-w-[22ch] text-display font-bold text-ink">
            Every story you own, whole.
          </h1>
          <p className="mt-5 max-w-[62ch] text-body text-ink-2">
            {totals.stories} stories, {totalEntries} entries, {multi.length} of them longer than a
            single film. Each collection is one continuous story —{' '}
            {deepest ? `the longest, ${deepest.name}, runs ${deepest.seasons.length} entries deep.` : ''}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3">
            <Figure value={totals.stories} label="stories" />
            <Figure value={completedEntries} label="entries watched" suffix={`of ${totalEntries}`} />
            <Figure value={`${Math.round((completedEntries / Math.max(1, totalEntries)) * 100)}%`} label="walked" />
            <Link
              href="/library"
              className="ml-auto text-small font-medium text-ink-2 transition-colors hover:text-ink"
            >
              Open the archive →
            </Link>
          </div>
        </motion.div>
      </header>

      {/* ── The shelves ──────────────────────────────────────────────── */}
      <div className="shell relative mt-16 space-y-20">
        {shelves.map((shelf) => (
          <section key={shelf.phase}>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h2 className="text-head font-bold text-ink">{shelf.title}</h2>
                <p className="num text-small text-ink-3">
                  {shelf.stories.length} {shelf.stories.length === 1 ? 'story' : 'stories'}
                </p>
              </div>
              <p className="text-small text-ink-3">{shelf.note}</p>
            </div>

            <div className="mt-6">
              {shelf.shape === 'objects' && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {shelf.stories.map((franchise, index) => (
                    <StoryObject key={franchise.id} franchise={franchise} index={index} />
                  ))}
                </div>
              )}

              {shelf.shape === 'shelf' && (
                <div className="relative rounded-md border border-line bg-surface/40 p-4 sm:p-5">
                  <SpineShelf stories={shelf.stories} />
                </div>
              )}

              {shelf.shape === 'rows' && (
                <ul className={shelf.phase === 'dropped' ? 'space-y-2 opacity-70' : 'space-y-2'}>
                  {shelf.stories.map((franchise, index) => (
                    <li key={franchise.id}>
                      <StoryRowObject
                        franchise={franchise}
                        index={index}
                        reason={
                          shelf.phase === 'backlog'
                            ? 'nothing started'
                            : shelf.phase === 'planned'
                              ? 'planned'
                              : undefined
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function Figure({
  value,
  label,
  suffix,
}: {
  value: number | string
  label: string
  suffix?: string
}) {
  return (
    <div>
      <p className="num text-head font-bold leading-none text-ink">
        {typeof value === 'number' ? value.toLocaleString('en-US') : value}
        {suffix && <span className="text-ink-3"> {suffix}</span>}
      </p>
      <p className="mt-1.5 text-small text-ink-3">{label}</p>
    </div>
  )
}
