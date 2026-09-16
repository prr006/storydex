'use client'

import Link from 'next/link'
import { useLibraryContext } from '@/components/AppShell'
import { EmptyLibrary } from '@/components/EmptyLibrary'
import { StoryHero } from '@/components/StoryHero'
import { MediaCard } from '@/components/Cards'
import { Rail } from '@/components/Rail'
import { continueWatching, libraryTotals } from '@/lib/summaries'

/* ==========================================================================
   Welcome — /
   --------------------------------------------------------------------------
   Two states, and the difference matters:

     no library  → the pitch, the import, and real AniList artwork (delegated
                   entirely to EmptyLibrary, which is also the empty state for
                   Home, Library and Franchises)
     library     → the story you were last inside, full bleed, plus the rest of
                   your active stories

   A returning user should never be greeted with marketing copy for a product
   they are already using — and they should never have to read a sentence
   before they can see their own artwork.
   ========================================================================== */

export default function WelcomePage() {
  const { library, openImport } = useLibraryContext()
  const { franchises, loading, isImported } = library

  if (loading) {
    return (
      <div>
        <div className="h-[clamp(24rem,58vh,40rem)] w-full animate-pulse bg-surface" />
      </div>
    )
  }

  if (!isImported || franchises.length === 0) {
    return <EmptyLibrary onImport={openImport} />
  }

  const active = continueWatching(franchises)
  const lead = active[0] ?? null
  const rest = active.slice(1)
  const totals = libraryTotals(franchises)

  return (
    <div className="pb-24">
      {lead ? (
        <StoryHero franchise={lead} />
      ) : (
        <section className="shell pt-16">
          <p className="eyebrow">Your collection</p>
          <h1 className="mt-3 text-hero font-bold text-ink">
            {totals.stories} {totals.stories === 1 ? 'story' : 'stories'}, all watched.
          </h1>
        </section>
      )}

      <div className="shell">
        {rest.length > 0 && (
          <section className="mt-14">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <div className="flex items-baseline gap-3">
                <h2 className="text-head font-semibold text-ink">Pick up where you left off</h2>
                <p className="text-small text-ink-3">
                  {rest.length} more in progress
                </p>
              </div>
              <Link
                href="/dashboard"
                className="group/all inline-flex items-center gap-1.5 text-small font-medium text-ink-2 transition-colors hover:text-ink"
              >
                Everything on Home
                <span aria-hidden className="transition-transform duration-200 group-hover/all:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>

            <Rail itemWidth={340}>
              {rest.map((franchise, index) => (
                <MediaCard key={franchise.id} franchise={franchise} index={index} />
              ))}
            </Rail>
          </section>
        )}

        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            { href: '/library', label: 'Library', detail: 'Search, filter, three densities' },
            { href: '/franchises', label: 'Franchises', detail: 'Every story as a collection' },
            { href: '/discover', label: 'Discover', detail: 'Live AniList, marked against yours' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group/all rounded-md border border-line bg-surface p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/15 hover:bg-surface-2"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-lead font-semibold text-ink">{item.label}</span>
                <span
                  aria-hidden
                  className="text-ink-3 transition-transform duration-200 group-hover/all:translate-x-0.5"
                >
                  →
                </span>
              </span>
              <span className="mt-1.5 block text-small text-ink-3">{item.detail}</span>
            </Link>
          ))}
        </section>
      </div>
    </div>
  )
}
