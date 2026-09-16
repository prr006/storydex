'use client'

import { useLibraryContext } from '@/components/AppShell'
import { LibraryBrowser } from '@/components/LibraryBrowser'
import { EmptyLibrary } from '@/components/EmptyLibrary'
import { SectionHead } from '@/components/Chapter'
import { libraryTotals } from '@/lib/summaries'

/* ==========================================================================
   Library — /library
   --------------------------------------------------------------------------
   The full index. Home carries a compact version of the same component with a
   result limit; this page is the one that goes all the way down, and it is the
   only place filters are mirrored into the URL, because a library view is the
   thing you want to link or reload.

   The header states the shape of the collection in one line and then gets out
   of the way — the controls and the results are the page.
   ========================================================================== */

export default function LibraryPage() {
  const { library, openImport } = useLibraryContext()
  const { franchises, loading, isImported } = library

  if (loading) {
    return (
      <div className="shell py-16">
        <div className="h-8 w-40 animate-pulse rounded-xs bg-sunk" />
        <div className="mt-4 h-4 w-64 animate-pulse rounded-xs bg-sunk" />
        <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="aspect-[4/5] animate-pulse rounded-md bg-sunk" />
          ))}
        </div>
      </div>
    )
  }

  if (!isImported || franchises.length === 0) {
    return <EmptyLibrary onImport={openImport} />
  }

  const totals = libraryTotals(franchises)

  return (
    <div className="shell pb-24 pt-12">
      <SectionHead
        as="h1"
        title="Library"
        lead="Every story you're tracking, and the entries inside them. Narrow it down, then choose how densely to read it."
        action={
          <p className="text-body text-ink-2">
            <span className="num font-medium text-ink">{totals.stories}</span> stories ·{' '}
            <span className="num font-medium text-ink">{totals.entries}</span> entries ·{' '}
            <span className="num font-medium text-ink">{totals.episodes.toLocaleString('en-US')}</span>{' '}
            episodes
          </p>
        }
      />

      <div className="mt-10">
        <LibraryBrowser franchises={franchises} variant="full" syncUrl />
      </div>
    </div>
  )
}
