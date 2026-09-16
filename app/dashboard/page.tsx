'use client'

import Link from 'next/link'
import { useLibraryContext } from '@/components/AppShell'
import { Statement } from '@/components/Statement'
import { ContinueList, continuableStories } from '@/components/ContinueRow'
import { UpNextTable, upcomingRows } from '@/components/UpNextTable'
import { LibraryBrowser } from '@/components/LibraryBrowser'
import { CollectionSection } from '@/components/CollectionSection'
import { EmptyLibrary } from '@/components/EmptyLibrary'
import { SectionHead } from '@/components/Chapter'
import { getStoryProgress } from '@/lib/design'
import { formatToday, libraryTotals } from '@/lib/summaries'

/* ==========================================================================
   Home — /dashboard
   --------------------------------------------------------------------------
   Five blocks, in the order the questions get asked:

     1  Statement     where am I, in one sentence           (all numbers, once)
     2  Continue      the primary action, one story per row
     3  Up next       what exists but hasn't aired
     4  Library       search · facets · sort · three densities
     5  Franchises    the stories as shapes, grouped by lifecycle

   Statistics appear in exactly one place — the statement — and never as a
   card, ring, ledger or sparkline. The page is a list of stories, not a
   report about them.
   ========================================================================== */

export default function DashboardPage() {
  const { library, openImport } = useLibraryContext()
  const { franchises, loading, isImported } = library

  if (loading) {
    return <HomeLoading />
  }

  if (!isImported || franchises.length === 0) {
    return <EmptyLibrary onImport={openImport} />
  }

  const continuable = continuableStories(franchises)
  const upcoming = upcomingRows(franchises)
  const totals = libraryTotals(franchises)
  const lead = continuable[0]

  return (
    <div className="shell pb-24 pt-14">
      {/* 1 — Where am I */}
      <Statement
        date={formatToday()}
        figures={[
          { label: 'stories', value: String(franchises.length) },
          { label: 'in progress', value: String(totals.active) },
          { label: 'entries watched', value: `${totals.watched}/${totals.entries}` },
        ]}
      >
        {lead ? (
          <>
            {`You’re ${getStoryProgress(lead).completed} entries into `}
            <Link
              href={`/franchise/${lead.id}`}
              className="underline decoration-rule-strong decoration-1 underline-offset-[6px] transition-colors hover:decoration-brand"
            >
              {lead.name}
            </Link>
            .
          </>
        ) : (
          <>Your collection, and exactly where you are in it.</>
        )}
      </Statement>

      {/* 2 — Continue */}
      {continuable.length > 0 && (
        <Section
          id="continue"
          title="Continue"
          lead="One row per story you are somewhere inside. Ordered by how little is left."
        >
          <ContinueList franchises={continuable.slice(0, 6)} />
          {continuable.length > 6 && (
            <p className="mt-6">
              <Link
                href="/library?status=watching"
                className="text-body font-medium text-brand-text underline decoration-brand/30 underline-offset-4 hover:decoration-brand"
              >
                {continuable.length - 6} more in progress
              </Link>
            </p>
          )}
        </Section>
      )}

      {/* 3 — Up next */}
      {upcoming.length > 0 && (
        <Section id="up-next" title="Up next" lead="Airing later — kept separate from Continue.">
          <UpNextTable franchises={franchises} />
        </Section>
      )}

      {/* 4 — Library */}
      <Section
        title="Your library"
        lead="Search, narrow by status, format or genre, then choose how densely you want to read it."
        action={
          <Link
            href="/library"
            className="text-body font-medium text-brand-text underline decoration-brand/30 underline-offset-4 hover:decoration-brand"
          >
            Open the library
          </Link>
        }
        className="mt-20"
      >
        <LibraryBrowser franchises={franchises} variant="compact" limit={10} defaults={{ density: 'grid' }} />
      </Section>

      {/* 5 — Franchises */}
      <Section
        title="Franchises"
        lead="Every story as a shape: seasons, films, OVAs and specials, grouped by where you are with them."
        action={
          <Link
            href="/franchises"
            className="text-body font-medium text-brand-text underline decoration-brand/30 underline-offset-4 hover:decoration-brand"
          >
            All collections
          </Link>
        }
        className="mt-20"
      >
        <CollectionSection franchises={franchises.slice(0, 24)} />
      </Section>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function Section({
  title,
  lead,
  action,
  children,
  className,
  id,
}: {
  title: string
  lead?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={`scroll-mt-24 section-rule mt-16 pt-10 ${className ?? ''}`}>
      <SectionHead title={title} lead={lead} action={action} />
      <div className="mt-8">{children}</div>
    </section>
  )
}

function HomeLoading() {
  return (
    <div className="shell pb-24 pt-8">
      <div className="section-rule pt-8">
        <div className="h-3 w-28 animate-pulse rounded-xs bg-sunk" />
        <div className="mt-5 h-12 w-full max-w-xl animate-pulse rounded-sm bg-sunk" />
      </div>
      <div className="mt-16 space-y-6">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex gap-6 border-b border-rule pb-6">
            <div className="h-[108px] w-[72px] animate-pulse rounded-md bg-sunk" />
            <div className="flex-1 space-y-3 pt-1">
              <div className="h-5 w-1/2 animate-pulse rounded-xs bg-sunk" />
              <div className="h-3 w-1/3 animate-pulse rounded-xs bg-sunk" />
              <div className="h-2 w-2/3 animate-pulse rounded-xs bg-sunk" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
