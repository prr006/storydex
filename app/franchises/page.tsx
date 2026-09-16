'use client'

import Link from 'next/link'
import { useLibraryContext } from '@/components/AppShell'
import { StoryCollectionCard } from '@/components/Cards'
import { EmptyLibrary } from '@/components/EmptyLibrary'
import { libraryTotals } from '@/lib/summaries'
import { getStoryPhase, type StoryPhase } from '@/lib/design'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   Franchises — /franchises
   --------------------------------------------------------------------------
   "Every story, whole."

   This is the page that makes StoryDex's premise physical. Each collection is
   a wide banner with its own artwork and, overlapping its bottom edge, the
   actual covers of its entries stacked in order — so a six-entry saga and a
   single film are different shapes before you read a single word.

   Groups are lifecycle states, not genres: what you are in, what you've
   finished, what's waiting. That is how a collection is actually browsed.
   ========================================================================== */

const GROUPS: { phase: StoryPhase; title: string; note: string }[] = [
  { phase: 'watching', title: 'In progress', note: 'Stories you are inside right now' },
  { phase: 'caught-up', title: 'Caught up', note: 'Everything that exists is watched' },
  { phase: 'complete', title: 'Completed', note: 'Start to end' },
  { phase: 'paused', title: 'On hold', note: 'Started, then set down' },
  { phase: 'backlog', title: 'Not started', note: 'On the list, nothing watched' },
  { phase: 'planned', title: 'Planned', note: 'Marked as planned on AniList' },
  { phase: 'dropped', title: 'Stopped', note: 'Walked away from — kept, never suggested' },
]

export default function FranchisesPage() {
  const { library, openImport } = useLibraryContext()
  const { franchises, loading, isImported } = library

  if (loading) {
    return (
      <div className="shell py-14">
        <div className="h-12 w-[26rem] animate-pulse rounded-sm bg-surface-2" />
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
  const multi = franchises.filter((franchise) => franchise.seasons.length > 1).length

  const groups = GROUPS.map((group) => ({
    ...group,
    items: franchises
      .filter((franchise) => getStoryPhase(franchise) === group.phase)
      .sort(bySize),
  })).filter((group) => group.items.length > 0)

  return (
    <div className="shell pb-24 pt-12">
      <header>
        <p className="eyebrow">Collections</p>
        <h1 className="mt-2.5 text-display font-bold text-ink">Every story, whole.</h1>
        <p className="mt-4 max-w-[68ch] text-body text-ink-2">
          <span className="num text-ink">{totals.stories}</span> franchises ·{' '}
          <span className="num text-ink">{totals.entries}</span> entries ·{' '}
          <span className="num text-ink">{totals.episodes.toLocaleString('en-US')}</span> episodes.
          Seasons, films, OVAs and specials, grouped into the story they belong to
          {multi > 0 && <> — {multi} of them across more than one entry</>}.
        </p>

        <p className="mt-4 text-small text-ink-3">
          Looking for one title?{' '}
          <Link
            href="/library"
            className="font-medium text-brand-strong transition-colors hover:text-ink"
          >
            Search the library
          </Link>
          .
        </p>
      </header>

      <div className="mt-16 space-y-20">
        {groups.map((group) => (
          <section key={group.phase}>
            <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <h2 className="text-head font-bold text-ink">{group.title}</h2>
              <span className="num text-small text-ink-3">{group.items.length}</span>
              <p className="text-small text-ink-3">{group.note}</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((franchise, index) => (
                <StoryCollectionCard key={franchise.id} franchise={franchise} index={index} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function bySize(a: Franchise, b: Franchise): number {
  return b.seasons.length - a.seasons.length || a.name.localeCompare(b.name)
}
