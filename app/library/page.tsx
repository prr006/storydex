'use client'

import { useLibraryContext } from '@/components/AppShell'
import { LibraryBrowser } from '@/components/LibraryBrowser'
import { EmptyLibrary } from '@/components/EmptyLibrary'
import { Atmosphere } from '@/components/Atmosphere'
import { libraryTotals } from '@/lib/summaries'
import { getStoryPhase } from '@/lib/design'

/* ==========================================================================
   Library — /library
   --------------------------------------------------------------------------
   A personal archive, not a results page. A quiet title, three real figures,
   one line that says how the shelf is arranged, then the toolbar and the
   stories themselves — which are grouped by where you stand with them.

   The figures are deliberately plain — entries, episodes watched, completed —
   and sit to the right of the title rather than in cards, because they are
   context for the collection, not the subject of it. The subject is the shelf
   below, and browsing it has to stay fast.
   ========================================================================== */

export default function LibraryPage() {
  const { library, openImport } = useLibraryContext()
  const { franchises, loading, isImported } = library

  if (loading) {
    return (
      <div className="shell py-14">
        <div className="h-11 w-56 animate-pulse rounded-sm bg-surface-2" />
        <div className="mt-10 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="aspect-[2/3] animate-pulse rounded-md bg-surface-2" />
          ))}
        </div>
      </div>
    )
  }

  if (!isImported || franchises.length === 0) {
    return <EmptyLibrary onImport={openImport} />
  }

  const totals = libraryTotals(franchises)
  const inside = franchises.filter((franchise) => getStoryPhase(franchise) === 'watching').length
  const waiting = franchises.filter((franchise) => {
    const phase = getStoryPhase(franchise)
    return phase === 'backlog' || phase === 'planned'
  }).length

  return (
    <div className="relative pb-24">
      <Atmosphere intensity="faint" />

      <div className="shell relative pt-12">
      <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div>
          <p className="eyebrow">Your archive</p>
          <h1 className="mt-2.5 text-display font-bold text-ink">Library</h1>
          <p className="mt-4 max-w-[58ch] text-body text-ink-2">
            {totals.stories} {totals.stories === 1 ? 'story' : 'stories'}, kept whole — every season,
            film, OVA and special grouped under the story it belongs to.
            {inside > 0 && ` ${inside} you are still inside`}
            {waiting > 0 && `, ${waiting} waiting to start`}.
          </p>
        </div>

        <dl className="flex flex-wrap items-end gap-x-10 gap-y-4">
          <Figure value={String(totals.entries)} label="Entries" />
          <Figure
            value={totals.episodesWatched.toLocaleString('en-US')}
            label="Episodes watched"
          />
          <Figure value={String(totals.watched)} label="Completed" />
        </dl>
      </header>

      <div className="mt-10">
        <LibraryBrowser franchises={franchises} variant="full" syncUrl />
      </div>
      </div>
    </div>
  )
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dd className="num text-head font-bold leading-none text-ink">{value}</dd>
      <dt className="eyebrow mt-2">{label}</dt>
    </div>
  )
}
