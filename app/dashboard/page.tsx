'use client'

import { useLibraryContext } from '@/components/AppShell'
import { StoryHero } from '@/components/StoryHero'
import { MediaCard, PosterCard, StoryCollectionCard } from '@/components/Cards'
import { Rail, RailSection } from '@/components/Rail'
import { UpNextCard, upcomingEntries } from '@/components/UpNextRail'
import { EmptyLibrary } from '@/components/EmptyLibrary'
import { continueWatching } from '@/lib/summaries'

/* ==========================================================================
   Home — /dashboard
   --------------------------------------------------------------------------
   Five things, in the order the questions get asked:

     1  Hero          the story you are inside, artwork-led, one action
     2  Continue      every other active story as a large artwork card
     3  Up next       queued, paused and not-yet-aired — compact
     4  Your library  the poster grid
     5  Franchises    the stories as collections

   The page opens on artwork rather than on a sentence about the user. The
   numbers are still here — but they are *on* the hero, attached to the story
   they describe, instead of floating above the page as a header statistic.
   ========================================================================== */

export default function DashboardPage() {
  const { library, openImport } = useLibraryContext()
  const { franchises, loading, isImported } = library

  if (loading) return <HomeLoading />

  if (!isImported || franchises.length === 0) {
    return <EmptyLibrary onImport={openImport} />
  }

  const active = continueWatching(franchises)
  const hero = active[0] ?? null
  const rest = active.slice(1)
  const queued = upcomingEntries(franchises, hero?.id)
  const recent = [...franchises]
    .sort((a, b) => b.seasons.length - a.seasons.length || a.name.localeCompare(b.name))
    .slice(0, 14)
  const collections = [...franchises]
    .sort((a, b) => b.seasons.length - a.seasons.length || a.name.localeCompare(b.name))
    .slice(0, 6)

  return (
    <div className="pb-24">
      {hero && <StoryHero franchise={hero} />}

      <div className="shell">
        {rest.length > 0 && (
          <RailSection
            title="Continue watching"
            meta={`${rest.length} ${rest.length === 1 ? 'story' : 'stories'} in progress`}
            action={{ href: '/library?status=watching', label: 'See all' }}
            className="mt-14"
          >
            <Rail itemWidth={340}>
              {rest.map((franchise, index) => (
                <MediaCard key={franchise.id} franchise={franchise} index={index} />
              ))}
            </Rail>
          </RailSection>
        )}

        {queued.length > 0 && (
          <RailSection
            title="Up next"
            meta="Queued, paused and not yet aired"
            className="mt-14"
          >
            <Rail itemWidth={280}>
              {queued.slice(0, 12).map((row, index) => (
                <UpNextCard
                  key={`${row.franchise.id}-${row.entry.id}`}
                  franchise={row.franchise}
                  entry={row.entry}
                  reason={row.reason}
                  index={index}
                />
              ))}
            </Rail>
          </RailSection>
        )}

        <RailSection
          title="Your library"
          meta={`${franchises.length} ${franchises.length === 1 ? 'story' : 'stories'}`}
          action={{ href: '/library', label: 'Browse all' }}
          className="mt-14"
        >
          <div className="grid grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
            {recent.map((franchise, index) => (
              <PosterCard key={franchise.id} franchise={franchise} index={index} />
            ))}
          </div>
        </RailSection>

        <RailSection
          title="Franchises"
          meta="Stories grouped across seasons, films and specials"
          action={{ href: '/franchises', label: 'All collections' }}
          className="mt-16"
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((franchise, index) => (
              <StoryCollectionCard key={franchise.id} franchise={franchise} index={index} />
            ))}
          </div>
        </RailSection>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function HomeLoading() {
  return (
    <div>
      <div className="h-[clamp(24rem,58vh,40rem)] w-full animate-pulse bg-surface" />
      <div className="shell mt-14">
        <div className="h-7 w-52 animate-pulse rounded-sm bg-surface-2" />
        <div className="mt-4 flex gap-4 overflow-hidden">
          {[0, 1, 2, 3].map((card) => (
            <div key={card} className="h-[190px] w-[330px] shrink-0 animate-pulse rounded-md bg-surface-2" />
          ))}
        </div>
      </div>
    </div>
  )
}
