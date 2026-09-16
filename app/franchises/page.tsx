'use client'

import Link from 'next/link'
import { useLibraryContext } from '@/components/AppShell'
import { CollectionSection } from '@/components/CollectionSection'
import { EmptyLibrary } from '@/components/EmptyLibrary'
import { SectionHead } from '@/components/Chapter'
import { libraryTotals } from '@/lib/summaries'

/* ==========================================================================
   Collections — /franchises
   --------------------------------------------------------------------------
   The counterpart to Library, and deliberately a different page rather than a
   filter on it.

     Library      "find it"        a flat index you narrow
     Collections  "what shape?"    every story drawn as a composition strip,
                                   grouped by where you are with it

   This is the page that makes the product's premise visible: two stories with
   the same entry count look completely different here, because one is four TV
   seasons and the other is a season, a film and two OVAs.
   ========================================================================== */

export default function FranchisesPage() {
  const { library, openImport } = useLibraryContext()
  const { franchises, loading, isImported } = library

  if (loading) {
    return (
      <div className="shell py-16">
        <div className="h-8 w-48 animate-pulse rounded-xs bg-sunk" />
        <div className="mt-10 space-y-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-sm bg-sunk" />
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

  return (
    <div className="shell pb-24 pt-12">
      <SectionHead
        as="h1"
        title="Franchises"
        lead="Each row is one story. The marks are its entries, sized by format — long bars are seasons, short outlines are OVAs and specials."
        action={
          <p className="text-body text-ink-2">
            <span className="num font-medium text-ink">{totals.stories}</span> stories ·{' '}
            <span className="num font-medium text-ink">{multi}</span> with more than one entry ·{' '}
            <span className="num font-medium text-ink">{totals.episodes.toLocaleString('en-US')}</span>{' '}
            episodes
          </p>
        }
      />

      <p className="mt-6 max-w-[62ch] text-body text-ink-3">
        Looking for a specific title instead?{' '}
        <Link
          href="/library"
          className="text-brand-text underline decoration-brand/30 underline-offset-4 hover:decoration-brand"
        >
          Search the library
        </Link>
        .
      </p>

      <CollectionSection franchises={franchises} />
    </div>
  )
}
