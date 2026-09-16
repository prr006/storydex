'use client'

import Link from 'next/link'
import { use } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useLibraryContext } from '@/components/AppShell'
import { StoryHero } from '@/components/StoryHero'
import { StoryLedger } from '@/components/StoryLedger'
import { StoryMap } from '@/components/StoryMap'
import { EntriesTable } from '@/components/EntriesTable'
import { ContinueStory } from '@/components/ContinueStory'
import { RailSection } from '@/components/Rail'
import { PosterCard } from '@/components/Cards'
import { accentVars, getStoryPhase, getStoryProgress } from '@/lib/design'

/* ==========================================================================
   Story — /franchise/[id]
   --------------------------------------------------------------------------
   Entering a story universe. Five movements, in the order the question gets
   asked:

     1  Hero        real artwork at full width, title, current entry, one action
     2  Ledger      what the story is made of, and where you are inside it
     3  Story map   the entries as a timeline of milestones (the signature view)
     4  Entries     the reference table, for looking things up
     5  Continue    a closing banner that names the next episode

   The hero does the emotional work; the ledger does the arithmetic; the map
   does the remembering. Each one is given the whole width of the page rather
   than sharing a column with the others.
   ========================================================================== */

export default function FranchisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { library, openImport } = useLibraryContext()
  const franchise = library.franchises.find((item) => item.id === id)

  /* ── Not in this browser's library ──────────────────────────────────── */
  if (!franchise) {
    return (
      <div className="shell py-24">
        <p className="eyebrow">Not in your library</p>
        <h1 className="mt-4 text-display font-bold text-ink">
          {library.loading ? 'Reading your library…' : 'No story with that address.'}
        </h1>
        {!library.loading && (
          <>
            <p className="mt-5 max-w-[54ch] text-body text-ink-2">
              {library.isImported
                ? 'This story isn’t part of the library stored in this browser. It may have been removed by a re-import.'
                : 'There’s no library in this browser yet. Import your AniList list and every story you own appears here.'}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {!library.isImported && (
                <button
                  type="button"
                  onClick={openImport}
                  className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-body font-semibold text-white transition-colors hover:bg-brand-strong"
                >
                  Import from AniList
                </button>
              )}
              <Link
                href="/library"
                className="inline-flex items-center gap-2 text-body font-medium text-ink-2 transition-colors hover:text-ink"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Back to the library
              </Link>
            </div>
          </>
        )}
      </div>
    )
  }

  const progress = getStoryProgress(franchise)
  const phase = getStoryPhase(franchise)

  /* ── Sibling stories: other franchises sharing a genre ──────────────── */
  const related = library.franchises
    .filter(
      (item) =>
        item.id !== franchise.id &&
        item.genres.some((genre) => franchise.genres.includes(genre)),
    )
    .sort((a, b) => b.seasons.length - a.seasons.length)
    .slice(0, 7)

  return (
    <div className="pb-24" style={accentVars(franchise)}>
      <div className="shell pt-5">
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-small text-ink-3 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Library
        </Link>
      </div>

      {/* 1 ── Hero */}
      <div className="mt-4">
        <StoryHero franchise={franchise} />
      </div>

      {/* 2 ── Ledger */}
      <StoryLedger franchise={franchise} />

      <div className="shell">
        {/* 3 ── Story map */}
        <section className="mt-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <div>
              <h2 className="text-head font-bold text-ink">Story timeline</h2>
              <p className="mt-1.5 text-body text-ink-3">
                How the entries connect, in the order they are meant to be watched.
              </p>
            </div>
            <p className="num text-small text-ink-3">
              {progress.completed}/{progress.total} entries · {Math.round(progress.ratio * 100)}%
            </p>
          </div>

          <StoryMap franchise={franchise} />
        </section>

        {/* 4 ── Entries */}
        <section className="mt-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <div>
              <h2 className="text-head font-bold text-ink">All entries</h2>
              <p className="mt-1.5 text-body text-ink-3">
                The same story as a table, for looking things up rather than reading.
              </p>
            </div>
            <p className="num text-small text-ink-3">
              {franchise.seasons.length} in this collection
            </p>
          </div>

          <EntriesTable entries={franchise.seasons} />
        </section>

        {/* 5 ── Continue */}
        <div className="mt-20">
          <ContinueStory franchise={franchise} />
        </div>

        {/* Same universe */}
        {related.length > 0 && (
          <RailSection
            title="More like this"
            meta={`Because you're tracking ${franchise.genres.slice(0, 2).join(' and ') || 'similar stories'}`}
            action={{ href: '/franchises', label: 'All franchises' }}
            className="mt-20"
          >
            <div className="grid grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
              {related.map((item, index) => (
                <PosterCard key={item.id} franchise={item} index={index} />
              ))}
            </div>
          </RailSection>
        )}

        {/* Where you stand, restated once, plainly. */}
        {phase !== 'complete' && (
          <p className="mt-16 text-small text-ink-3">
            {progress.total - progress.completed} of {progress.total} entries left in this story.
          </p>
        )}
      </div>
    </div>
  )
}
