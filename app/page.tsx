'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLibraryContext } from '@/components/AppShell'
import { EmptyLibrary } from '@/components/EmptyLibrary'
import { ContinueList, continuableStories } from '@/components/ContinueRow'
import { getStoryProgress } from '@/lib/design'
import { libraryTotals } from '@/lib/summaries'
import { DURATION, EASE } from '@/lib/motion'

/* ==========================================================================
   Welcome — /
   --------------------------------------------------------------------------
   Two states, one page, and the difference matters:

     no library  → the pitch, the import, and real AniList artwork (delegated
                   entirely to EmptyLibrary, which is also the empty state for
                   Home, Library and Franchises)
     library     → "you're four entries into Re:ZERO" and the three stories you
                   should probably open; the pitch becomes a footer line

   A returning user should never be greeted with marketing copy for a product
   they are already using, which is why the second state exists at all.
   ========================================================================== */

export default function WelcomePage() {
  const { library, openImport } = useLibraryContext()
  const { franchises, loading, isImported } = library

  if (loading) {
    return (
      <div className="shell pt-16">
        <div className="h-4 w-32 animate-pulse rounded-xs bg-sunk" />
        <div className="mt-6 h-14 w-full max-w-2xl animate-pulse rounded-sm bg-sunk" />
        <div className="mt-4 h-14 w-2/3 max-w-xl animate-pulse rounded-sm bg-sunk" />
      </div>
    )
  }

  if (!isImported || franchises.length === 0) {
    return <EmptyLibrary onImport={openImport} />
  }

  const continuable = continuableStories(franchises)
  const totals = libraryTotals(franchises)
  const lead = continuable[0]

  return (
    <div className="shell pb-24 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.enter, ease: EASE }}
      >
        <p className="eyebrow">
          {totals.stories} stories · {totals.watched} of {totals.entries} entries watched
        </p>
        <h1 className="mt-4 text-display font-semibold text-ink">
          {lead ? (
            <>
              Back to{' '}
              <Link
                href={`/franchise/${lead.id}`}
                className="underline decoration-rule-strong decoration-1 underline-offset-[6px] transition-colors hover:decoration-brand"
              >
                {lead.name}
              </Link>
              .
            </>
          ) : (
            <>Your collection, across {totals.stories} stories.</>
          )}
          <br />
          <span className="text-ink-3">
            {lead
              ? `You're ${getStoryProgress(lead).completed} of ${getStoryProgress(lead).total} entries in.`
              : 'Everything on your list is watched.'}
          </span>
        </h1>
      </motion.div>

      {continuable.length > 0 && (
        <div className="mt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
            <h2 className="text-head font-semibold text-ink">Pick up where you left off</h2>
            <Link
              href="/dashboard"
              className="text-body font-medium text-brand-text underline decoration-brand/30 underline-offset-4 hover:decoration-brand"
            >
              Everything on Home
            </Link>
          </div>
          <ContinueList franchises={continuable.slice(0, 3)} />
        </div>
      )}

      <div className="mt-20 grid gap-x-12 gap-y-10 border-t border-rule pt-10 sm:grid-cols-2">
        <div>
          <h2 className="text-lead font-semibold text-ink">StoryDex groups your list into stories</h2>
          <p className="reading mt-3 max-w-[52ch] text-ink-2">
            AniList relations are followed to their ends, so a prequel, a sequel, a film and an OVA
            you&rsquo;ve watched all land in the same story — and the story is what you track, not the
            row.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
          <WelcomeLink href="/library" label="Library" detail="Search, filter, three densities" />
          <WelcomeLink href="/franchises" label="Franchises" detail="Every story as a shape" />
          <WelcomeLink href="/discover" label="Discover" detail="Live AniList, marked against yours" />
        </div>
      </div>
    </div>
  )
}

function WelcomeLink({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <Link href={href} className="group/w max-w-[16rem]">
      <span className="block text-body font-medium text-ink underline decoration-rule-strong underline-offset-4 transition-colors group-hover/w:decoration-brand">
        {label}
      </span>
      <span className="mt-1 block text-small text-ink-3">{detail}</span>
    </Link>
  )
}
