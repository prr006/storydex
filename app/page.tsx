'use client'

import Link from 'next/link'
import { useLibraryContext } from '@/components/AppShell'
import { EmptyLibrary } from '@/components/EmptyLibrary'
import { StoryHero } from '@/components/StoryHero'
import { StoryLadder } from '@/components/StoryLadder'
import { Atmosphere } from '@/components/Atmosphere'
import { continueWatching, libraryTotals } from '@/lib/summaries'

/* ==========================================================================
   Welcome — /
   --------------------------------------------------------------------------
   Two states, and the difference matters:

     no library  → the pitch, the import, and real AniList artwork (delegated
                   entirely to EmptyLibrary, which is also the empty state for
                   Home, Library and Collections)
     library     → the story you were last inside, entered at full size, then
                   the rest of the stories you are inside

   A returning user should never be greeted with marketing copy for a product
   they already use, and never with a heading where artwork should be. So this
   page is the front door of Home: one story owns the screen, the others follow
   as rungs, and the three destinations sit quietly at the foot.
   ========================================================================== */

export default function WelcomePage() {
  const { library, openImport } = useLibraryContext()
  const { franchises, loading, isImported } = library

  if (loading) {
    return (
      <div className="shell relative pt-16">
        <Atmosphere />
        <div className="h-16 w-[28rem] max-w-full animate-pulse rounded-md bg-surface-2" />
      </div>
    )
  }

  if (!isImported || franchises.length === 0) {
    return <EmptyLibrary onImport={openImport} />
  }

  const active = continueWatching(franchises)
  const lead = active[0] ?? null
  const rest = active.slice(1, 5)
  const totals = libraryTotals(franchises)

  return (
    <div className="pb-24">
      {lead ? (
        <StoryHero franchise={lead} />
      ) : (
        <section className="relative">
          <Atmosphere />
          <div className="shell relative py-24">
            <p className="eyebrow">Your collection</p>
            <h1 className="mt-4 text-display font-bold text-ink">
              {totals.stories} {totals.stories === 1 ? 'story' : 'stories'}, all watched.
            </h1>
            <p className="mt-5 max-w-[58ch] text-body text-ink-2">
              Nothing in progress. Everything in this library has been seen through to the end —
              the shelf is ready for something new.
            </p>
            <Link
              href="/discover"
              className="mt-8 inline-flex h-11 items-center rounded-full bg-brand px-5 text-body font-semibold text-white transition-colors hover:bg-brand-strong"
            >
              Find the next story
            </Link>
          </div>
        </section>
      )}

      <div className="shell">
        {rest.length > 0 && (
          <section className="mt-16">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h2 className="text-head font-bold text-ink">Also in progress</h2>
                <p className="text-small text-ink-3">{rest.length} more stories</p>
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

            <StoryLadder stories={rest} />
          </section>
        )}

        <section className="mt-20 grid gap-4 sm:grid-cols-3">
          {[
            { href: '/library', label: 'Library', detail: 'Search, filter, three densities' },
            { href: '/franchises', label: 'Collections', detail: 'Every story as one object' },
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
