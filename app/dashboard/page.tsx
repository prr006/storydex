'use client'

import Link from 'next/link'
import { useLibraryContext } from '@/components/AppShell'
import { StoryStage } from '@/components/StoryStage'
import { StoryLadder } from '@/components/StoryLadder'
import { StoryObject } from '@/components/StoryObject'
import { Horizon } from '@/components/Horizon'
import { Rail, RailSection } from '@/components/Rail'
import { EmptyLibrary } from '@/components/EmptyLibrary'
import { Atmosphere } from '@/components/Atmosphere'
import { announcedEntries, upcomingEntries } from '@/lib/queue'
import { continueWatching, libraryTotals } from '@/lib/summaries'
import { getEntryStatus, getStoryPhase, getStoryProgress, isUpcoming } from '@/lib/design'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   Home — /dashboard
   --------------------------------------------------------------------------
   Five movements, each with its own visual rhythm. Nothing here repeats the
   shape of the thing above it, which is what keeps the page from reading as
   "hero, then rails, then a grid":

     1  STAGE      one story owns the screen, and you can move between stories
                   without leaving the page
     2  LADDER     every other active story as a full-width rung — artwork
                   bleeding, facts floating, the path running underneath
     3  HORIZON    what's ahead — rows for what exists, years for what doesn't
     4  ARCHIVE    your collection as story objects (covers fanned, paths drawn)
     5  COLLECTIONS the same objects, larger, for the stories with real depth

   The old composition (hero → rail → rail → grid → cards) is gone: a rail of
   cards is the one thing every media product already looks like, and StoryDex's
   whole claim is that a franchise is a *story*, not a tile.
   ========================================================================== */

export default function DashboardPage() {
  const { library, openImport } = useLibraryContext()
  const { franchises, loading, isImported } = library

  if (loading) return <HomeLoading />

  if (!isImported || franchises.length === 0) {
    return <EmptyLibrary onImport={openImport} />
  }

  const active = continueWatching(franchises)
  const totals = libraryTotals(franchises)
  const stageStories = (active.length > 0 ? active : franchises).slice(0, 6)
  const ladder = active.slice(1)
  // The queue in two honest halves: stories you could start or restart now, and
  // entries that have not aired. Anything you are already inside is in the
  // ladder above, so it is kept out of both.
  const queued = upcomingEntries(franchises, stageStories[0]?.id)
  const activeIds = new Set(active.map((franchise) => franchise.id))
  const ready = queued.filter(
    (row) =>
      !isUpcoming(row.entry) &&
      getEntryStatus(row.entry) !== 'watching' &&
      !activeIds.has(row.franchise.id),
  )
  const ahead = announcedEntries(franchises)
  const archive = sortForArchive(franchises).slice(0, 12)
  const collections = [...franchises]
    .filter((franchise) => franchise.seasons.length > 1)
    .sort((a, b) => b.seasons.length - a.seasons.length)
    .slice(0, 6)

  return (
    <div>
      {/* 1 ── The stage */}
      <StoryStage stories={stageStories} />

      <div className="shell pb-24">
        {/* 2 ── The ladder */}
        {ladder.length > 0 && (
          <section className="mt-16">
            <SectionHead
              title="Part-way through"
              meta={`${ladder.length} more ${ladder.length === 1 ? 'story' : 'stories'} started but not finished`}
              action={{ href: '/library?status=watching', label: 'See all' }}
            />
            <div className="mt-6">
              <StoryLadder stories={ladder} />
            </div>
          </section>
        )}

        {/* 3 ── The horizon */}
        {(ready.length > 0 || ahead.length > 0) && (
          <section className="mt-20">
            <SectionHead
              title="Up next"
              meta="Stories waiting to be started, and entries that haven't aired"
            />
            <div className="mt-6">
              <Horizon ready={ready.slice(0, 5)} ahead={ahead.slice(0, 9)} />
            </div>
          </section>
        )}

        {/* 4 ── The archive */}
        <section className="mt-20">
          <SectionHead
            title="Your archive"
            meta={`${totals.stories} stories · ${totals.episodes.toLocaleString('en-US')} episodes tracked`}
            action={{ href: '/library', label: 'Open the library' }}
          />
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {archive.slice(0, 6).map((franchise, index) => (
              <StoryObject key={franchise.id} franchise={franchise} index={index} />
            ))}
          </div>
        </section>

        {/* 5 ── Collections */}
        {collections.length > 0 && (
          <section className="mt-20">
            <SectionHead
              title="Stories with depth"
              meta="Franchises of more than one entry — the ones you can get lost in"
              action={{ href: '/franchises', label: 'All collections' }}
            />
            <div className="mt-6">
              <Rail itemWidth={380} controls>
                {collections.map((franchise, index) => (
                  <div key={franchise.id} className="w-[340px] shrink-0 snap-start sm:w-[380px]">
                    <StoryObject franchise={franchise} index={index} variant="feature" />
                  </div>
                ))}
              </Rail>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function SectionHead({
  title,
  meta,
  action,
}: {
  title: string
  meta?: string
  action?: { href: string; label: string }
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-head font-bold text-ink">{title}</h2>
        {meta && <p className="text-small text-ink-3">{meta}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group/all inline-flex items-center gap-1.5 text-small font-medium text-ink-2 transition-colors hover:text-ink"
        >
          {action.label}
          <span aria-hidden className="transition-transform duration-200 group-hover/all:translate-x-0.5">
            →
          </span>
        </Link>
      )}
    </div>
  )
}

/**
 * Archive order: what you are inside, then what has the most left to give.
 * A finished one-entry film is a fine thing to own, but it isn't what you came
 * to the page for.
 */
function sortForArchive(franchises: Franchise[]): Franchise[] {
  const weight = (franchise: Franchise) => {
    const phase = getStoryPhase(franchise)
    const progress = getStoryProgress(franchise)
    const phaseScore =
      phase === 'watching' ? 0 : phase === 'caught-up' ? 1 : phase === 'paused' ? 3 : phase === 'backlog' ? 4 : phase === 'planned' ? 5 : phase === 'dropped' ? 6 : 2
    return phaseScore * 100 + (1 - progress.ratio) * 10 - franchise.seasons.length * 0.1
  }
  return [...franchises].sort((a, b) => weight(a) - weight(b) || a.name.localeCompare(b.name))
}

function HomeLoading() {
  return (
    <div>
      <div className="relative h-[clamp(32rem,70vh,44rem)] w-full overflow-hidden">
        <Atmosphere />
        <div className="shell flex h-full flex-col justify-center">
          <div className="h-4 w-40 animate-pulse rounded-sm bg-surface-2" />
          <div className="mt-5 h-20 w-[36rem] max-w-full animate-pulse rounded-md bg-surface-2" />
          <div className="mt-6 h-4 w-72 animate-pulse rounded-sm bg-surface-2" />
        </div>
      </div>
    </div>
  )
}
