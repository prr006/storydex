'use client'

import { useLibraryContext } from '@/components/AppShell'
import { DiscoverBoard } from '@/components/DiscoverBoard'
import { SectionHead } from '@/components/Chapter'

/* ==========================================================================
   Discover — /discover
   --------------------------------------------------------------------------
   Live AniList data, cross-referenced with what you already own. No login, no
   write access, no fabricated catalogue: the same API the import reads.

   Works with an empty library too — that's the point of a discover page.
   ========================================================================== */

export default function DiscoverPage() {
  const { library, openImport } = useLibraryContext()

  return (
    <div className="shell pb-24 pt-12">
      <SectionHead
        as="h1"
        title="Discover"
        lead="What AniList is watching right now, what's airing this season, and what's been announced but hasn't started. Anything already in your collection is marked."
        action={
          !library.isImported ? (
            <button
              type="button"
              onClick={openImport}
              className="inline-flex h-10 items-center rounded-sm border border-rule-strong px-4 text-body font-medium text-ink transition-colors hover:bg-sunk"
            >
              Import your list
            </button>
          ) : undefined
        }
      />

      <DiscoverBoard franchises={library.franchises} />
    </div>
  )
}
