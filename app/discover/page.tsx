'use client'

import { useLibraryContext } from '@/components/AppShell'
import { DiscoverBoard } from '@/components/DiscoverBoard'

/* ==========================================================================
   Discover — /discover
   --------------------------------------------------------------------------
   Live AniList data, cross-referenced with what you already own. No login, no
   write access, no invented catalogue: the same public API the import reads.

   The page opens on one featured title rather than a heading, because
   discovery should look like discovery. Works with an empty library too —
   that is the point of a discover page.
   ========================================================================== */

export default function DiscoverPage() {
  const { library, openImport } = useLibraryContext()

  return (
    <div>
      {!library.isImported && (
        <div className="shell pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-line bg-surface px-5 py-4">
            <p className="text-body text-ink-2">
              Import your AniList list and Discover will mark everything you already own.
            </p>
            <button
              type="button"
              onClick={openImport}
              className="inline-flex h-10 items-center rounded-full bg-brand px-5 text-body font-semibold text-white transition-colors hover:bg-brand-strong"
            >
              Import from AniList
            </button>
          </div>
        </div>
      )}

      <DiscoverBoard franchises={library.franchises} />
    </div>
  )
}
