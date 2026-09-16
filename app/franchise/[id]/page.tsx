'use client'

import Link from 'next/link'
import { use } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useLibraryContext } from '@/components/AppShell'
import { StoryHero } from '@/components/StoryHero'
import { StoryLedger } from '@/components/StoryLedger'
import { StoryMap } from '@/components/StoryMap'
import { EntriesTable } from '@/components/EntriesTable'
import { ContinueStory } from '@/components/ContinueStory'
import { StoryObject } from '@/components/StoryObject'
import { Atmosphere, ArtworkAura } from '@/components/Atmosphere'
import { accentVars, getStoryPhase, getStoryProgress, storyArtwork } from '@/lib/design'
import { EASE } from '@/lib/motion'

/* ==========================================================================
   Story — /franchise/[id]
   --------------------------------------------------------------------------
   Entering a story universe, in five descents:

     1  HERO      the artwork owns the screen; the title is set at poster scale
     2  DECK      the arithmetic: completion, the episode ledger, the route
     3  JOURNEY   every entry as a milestone along one spine — the signature
     4  ENTRIES   the reference table, for looking things up
     5  ONWARD    what to watch next, and what else lives nearby

   The page does not open with a header block and then list rows. It opens with
   the story, states how far in you are, and then *shows you the shape of it*.
   ========================================================================== */

export default function FranchisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { library, openImport } = useLibraryContext()
  const franchise = library.franchises.find((item) => item.id === id)

  /* ── Not in this browser's library ──────────────────────────────────── */
  if (!franchise) {
    return (
      <div className="relative">
        <Atmosphere />
        <div className="shell relative py-24">
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
      </div>
    )
  }

  const progress = getStoryProgress(franchise)
  const phase = getStoryPhase(franchise)
  const art = storyArtwork(franchise)

  const related = library.franchises
    .filter(
      (item) =>
        item.id !== franchise.id && item.genres.some((genre) => franchise.genres.includes(genre)),
    )
    .sort((a, b) => b.seasons.length - a.seasons.length)
    .slice(0, 3)

  return (
    <div className="relative pb-24" style={accentVars(franchise)}>
      {/* The story's air, running the length of the page. */}
      <Atmosphere
        story={franchise}
        intensity="faint"
        className="sticky top-0 h-screen opacity-40"
      />
      <ArtworkAura src={art?.src} position="top-right" opacity={0.07} />

      <div className="relative">
        <div className="shell pt-5">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-small text-ink-3 transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Library
          </Link>
        </div>

        {/* 1 ── Enter the story */}
        <StoryHero franchise={franchise} />

        {/* 2 ── The deck */}
        <div className="mt-2">
          <StoryLedger franchise={franchise} />
        </div>

        <div className="shell">
          {/* 3 ── The journey */}
          <motion.section
            id="journey"
            className="mt-24 scroll-mt-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
              <div>
                <p className="eyebrow">The journey</p>
                <h2 className="mt-2 text-head font-bold text-ink">
                  {franchise.seasons.length} entries, in the order they happened
                </h2>
              </div>
              <p className="num text-small text-ink-3">
                {progress.completed}/{progress.total} · {Math.round(progress.ratio * 100)}%
              </p>
            </div>

            <StoryMap franchise={franchise} />
          </motion.section>

          {/* 4 ── The record */}
          <section className="mt-24">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
              <div>
                <p className="eyebrow">The record</p>
                <h2 className="mt-2 text-head font-bold text-ink">Every entry</h2>
              </div>
              <p className="num text-small text-ink-3">{franchise.seasons.length} rows</p>
            </div>

            <EntriesTable entries={franchise.seasons} />
          </section>

          {/* 5 ── Onward */}
          <div className="mt-24">
            <ContinueStory franchise={franchise} />
          </div>

          {related.length > 0 && (
            <section className="mt-24">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
                <div>
                  <p className="eyebrow">Nearby</p>
                  <h2 className="mt-2 text-head font-bold text-ink">
                    More {franchise.genres[0] ?? 'stories'} on your shelf
                  </h2>
                </div>
                <Link
                  href="/franchises"
                  className="text-small font-medium text-ink-2 transition-colors hover:text-ink"
                >
                  All collections →
                </Link>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item, index) => (
                  <StoryObject key={item.id} franchise={item} index={index} />
                ))}
              </div>
            </section>
          )}

          {phase !== 'complete' && (
            <p className="mt-16 text-small text-ink-3">
              {progress.total - progress.completed} of {progress.total} entries left in this story.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
