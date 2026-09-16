'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Search, X } from 'lucide-react'

import { Navbar } from '@/components/Navbar'
import { ImportDialog } from '@/components/ImportDialog'
import { ContinueWatching } from '@/components/ContinueWatching'
import { Poster } from '@/components/Artwork'
import { StoryCard } from '@/components/StoryCard'
import { ProgressRingStat } from '@/components/ProgressRingStat'
import { Ledger } from '@/components/Progress'
import { FilterRail } from '@/components/FilterRail'
import { SpotlightRail } from '@/components/SpotlightRail'
import { useLibrary } from '@/lib/useLibrary'
import { useDashboardControls } from '@/lib/useDashboardControls'
import { cascade, fadeIn, riseIn } from '@/lib/motion'
import {
  canContinue,
  formatCount,
  getEpisodeProgress,
  getNextEntry,
  getStoryPhase,
  getStoryProgress,
  phaseCopy,
} from '@/lib/design'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   Dashboard — "The Shelf"
   --------------------------------------------------------------------------
   Hierarchy, top to bottom. Each level answers exactly one question:

     1. ContinueWatching   → where am I right now?   (cinematic, full-bleed)
     2. Library summary    → how far have I come?    (one number, one ledger)
     3. Up next rail       → what should I open?     (5 titles, poster-driven)
     4. The shelf          → what do I own?          (search / filter / grid)
     5. Unfinished stories → what have I abandoned?  (restrained, end-of-page)

   Deliberately removed from the previous version:
     · The "YOUR STORIES" 72px all-caps banner. A dashboard is not a poster.
     · Four equal stat boxes. Progress is one story, told once.
     · The sticky glass control bar. Filters now live inline with the shelf
       they filter, so they can be a quiet rail instead of a floating panel.
   ========================================================================== */

export default function DashboardPage() {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const { franchises, isImported, username, loading } = useLibrary()
  const { query, setQuery, sort, setSort, activeFilter, setActiveFilter, filtered, counts } =
    useDashboardControls(franchises)


  const summary = useMemo(() => buildSummary(franchises), [franchises])
  const upNext = useMemo(() => buildUpNext(franchises), [franchises])
  const unfinished = useMemo(() => buildUnfinished(franchises), [franchises])

  const isFiltering = query.trim().length > 0 || activeFilter !== 'all'

  return (
    <div className="relative min-h-screen">
      <Navbar onImportClick={() => setIsImportOpen(true)} />

      <main className="pt-[88px] pb-32">
        {/* ── 0. Imported-from strip ─────────────────────────────────────
            A hairline, not a card. When a real list is loaded it states its
            provenance quietly; there is no "demo mode" any more. */}
        {!loading && isImported && (
          <motion.div variants={fadeIn} initial="hidden" animate="visible" className="shell">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] py-3">
              <p className="numeric text-[11px] text-veil">
                Imported from AniList
                {username && (
                  <>
                    {' · '}
                    <span className="text-mist">@{username}</span>
                  </>
                )}
                {' · '}
                {franchises.length} {franchises.length === 1 ? 'story' : 'stories'}
              </p>
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="group inline-flex items-center gap-1.5 text-body-sm font-medium text-brand-300 transition-colors hover:text-brand-100"
              >
                Re-import
                <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── 1. The hero ────────────────────────────────────────────────
            Full-bleed, outside the shell, so it reads as cinema rather
            than a component sitting in a layout.

            Three states, all real:
              · library imported + something watchable → the staging hero
              · library imported + nothing watchable  → "you are caught up"
              · nothing imported                      → the import invitation
            ContinueWatching owns the first two, so there is never a hole. */}
        {!loading && (
          <div className="mt-4 px-0 md:px-6">
            {franchises.length > 0 ? (
              <ContinueWatching franchises={franchises} />
            ) : (
              <EmptyHero onImport={() => setIsImportOpen(true)} />
            )}
          </div>
        )}

        {/* ── 2. Library summary ─────────────────────────────────────────
            One ring, one ledger. Sits on a hairline, not in a card. */}
        {!loading && franchises.length > 0 && (
          <motion.section
            variants={riseIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="shell mt-20 md:mt-28"
          >
            <div className="flex flex-col gap-12 border-y border-white/[0.07] py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
              {/* Left: the number */}
              <div className="flex items-center gap-10">
                <ProgressRingStat
                  storiesComplete={summary.storiesComplete}
                  storiesTotal={summary.storiesTotal}
                  episodesWatched={summary.episodesWatched}
                  episodesTotal={summary.episodesTotal}
                  entriesWatched={summary.entriesWatched}
                  entriesTotal={summary.entriesTotal}
                />
              </div>

              {/* Right: the shape of the library */}
              <div className="min-w-0 flex-1 lg:max-w-md">
                <div className="mb-4 flex items-baseline justify-between gap-4">
                  <span className="label text-veil">Library composition</span>
                  <span className="numeric text-veil">{summary.storiesTotal} stories</span>
                </div>

                <Ledger
                  segments={[
                    { label: 'Complete', value: summary.byPhase.complete, color: 'var(--color-jade)' },
                    { label: 'In progress', value: summary.byPhase.watching, color: 'var(--color-ember)' },
                    { label: 'Caught up', value: summary.byPhase['caught-up'], color: 'var(--color-azure)' },
                    { label: 'Backlog', value: summary.byPhase.backlog, color: 'var(--color-brand-400)' },
                    { label: 'Planned', value: summary.byPhase.planned, color: 'var(--color-lilac)' },
                    { label: 'Paused', value: summary.byPhase.paused, color: 'var(--color-slate)' },
                    { label: 'Dropped', value: summary.byPhase.dropped, color: 'var(--color-coral)' },
                  ]}
                />

                <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                  {PHASE_ORDER.map((phase) => (
                    <div key={phase} className="flex items-center gap-2.5">
                      <span
                        className="size-1.5 rounded-full"
                        style={{ background: phaseCopy(phase).color }}
                      />
                      <span className="text-body-sm text-mist">{phaseCopy(phase).label}</span>
                      <span className="ml-auto numeric text-[11px] text-chalk">
                        {summary.byPhase[phase]}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-body-sm leading-relaxed text-veil">
                  {summary.episodesTotal > 0 ? (
                    <>
                      You&apos;ve watched{' '}
                      <span className="text-mist">{formatCount(summary.episodesWatched)}</span> of{' '}
                      <span className="text-mist">{formatCount(summary.episodesTotal)}</span> episodes
                      across your library
                      {summary.longestStory && (
                        <>
                          . Longest road ahead:{' '}
                          <Link
                            href={`/franchise/${summary.longestStory.id}`}
                            className="text-brand-300 underline decoration-brand-300/30 underline-offset-4 transition-colors hover:text-brand-100"
                          >
                            {summary.longestStory.name}
                          </Link>
                        </>
                      )}
                      .
                    </>
                  ) : (
                    <>Progress across every story you track, measured in whole stories — not seasons.</>
                  )}
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* ── 3. Up next rail ────────────────────────────────────────────
            Five posters. No cards, no borders — artwork in a row with a
            mono caption underneath. This is a "what do I open" prompt. */}
        {!loading && upNext.length > 0 && (
          <UpNextRail stories={upNext} />
        )}

        {/* ── 4. The shelf ────────────────────────────────────────────────
            Only rendered when there is a library. With nothing imported the
            hero and the trending rail own the page — showing an empty grid
            with "no results" copy would imply a failed search rather than an
            empty library. */}
        {!loading && franchises.length > 0 && (
          <section id="library" className="shell mt-24 md:mt-32">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="label text-veil">The shelf</span>
                <h2 className="text-editorial mt-2 text-[clamp(2rem,4vw,3rem)] leading-none text-chalk">
                  {isFiltering ? 'Matching stories' : 'Every story you own'}
                </h2>
              </div>
              <p className="numeric text-mist">
                {filtered.length}
                <span className="text-veil"> of {franchises.length}</span>
              </p>
            </div>

            <FilterRail
              query={query}
              setQuery={setQuery}
              sort={sort}
              setSort={setSort}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              counts={counts}
            />

            {filtered.length > 0 ? (
              <motion.div
                variants={cascade}
                initial="hidden"
                animate="visible"
                className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
              >
                {filtered.map((franchise, i) => (
                  <StoryCard key={franchise.id} franchise={franchise} index={i} />
                ))}
              </motion.div>
            ) : (
              <NoResults
                onClear={() => {
                  setQuery('')
                  setActiveFilter('all')
                }}
              />
            )}
          </section>
        )}

        {/* ── 5. Unfinished stories ──────────────────────────────────────
            The most emotionally interesting data in the app, given the
            quietest treatment: a ledger at the very end of the page. */}
        {!loading && unfinished.length > 0 && !isFiltering && (
          <UnfinishedStories stories={unfinished} />
        )}

        {/* ── 6. Before an import ────────────────────────────────────────
            No sampled library, so show real AniList artwork instead: something
            to look at while the user decides to import, with the section
            explicitly labelled as not-yours so it can never be mistaken for
            their own collection. */}
        {!loading && franchises.length === 0 && (
          <SpotlightRail
            className="shell mt-24 md:mt-32"
            title="Trending on AniList"
            note="Nothing imported yet, so these aren't your stories. Import your AniList list and this page fills in with your own."
          />
        )}

        {loading && <DashboardSkeleton />}
      </main>

      <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  )
}

/* ==========================================================================
   Sections
   ========================================================================== */

/** Poster rail. Artwork, a two-line caption, and a hover play affordance. */
function UpNextRail({ stories }: { stories: Franchise[] }) {
  return (
    <section className="mt-20 md:mt-28" aria-label="Stories to pick up next">
      <div className="shell mb-7 flex items-end justify-between gap-6">
        <div>
          <span className="label text-ember">Pick up where you left off</span>
          <h2 className="text-editorial mt-2 text-[clamp(1.75rem,3vw,2.5rem)] leading-none text-chalk">
            Up next
          </h2>
        </div>
        <span className="hidden text-body-sm text-veil sm:block">
          {stories.length} stories in progress
        </span>
      </div>

      <div className="scroll-px-[var(--shell-x)] overflow-x-auto rail">
        <div className="flex w-max gap-5 px-[var(--shell-x)] pb-4">
          {stories.map((story, i) => {
            const progress = getStoryProgress(story)
            const next = getNextEntry(story)
            return (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group w-[152px] shrink-0 sm:w-[172px]"
              >
                <Link href={`/franchise/${story.id}`} className="block">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-ink-800 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5 group-hover:rim-hover">
                    <StoryCardArtwork franchise={story} />
                    <div className="scrim-soft absolute inset-0" />

                    {/* Play disc slides in from below on hover. */}
                    <span className="absolute bottom-3 left-3 grid size-9 translate-y-3 place-items-center rounded-full bg-chalk text-ink-950 opacity-0 shadow-xl transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100">
                      <PlayGlyph />
                    </span>
                  </div>

                  <div className="mt-3.5">
                    <p className="truncate text-[14px] font-semibold text-chalk">{story.name}</p>
                    <p className="mt-1 truncate numeric text-[10px] text-veil">
                      {next ? `Next · ${next.name}` : `${progress.percent}% complete`}
                    </p>
                    <div className="mt-2.5 h-[2px] w-full overflow-hidden rounded-full bg-white/[0.09]">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-300"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function StoryCardArtwork({ franchise }: { franchise: Franchise }) {
  return (
    <div className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]">
      <Poster
        src={franchise.posterUrl}
        alt={franchise.name}
        tint={franchise.accentColor}
        className="h-full w-full"
        sizes="180px"
      />
    </div>
  )
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 translate-x-[1px] fill-current" aria-hidden>
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  )
}

/** The ledger at the end of the page: stories you started and left. */
function UnfinishedStories({ stories }: { stories: Franchise[] }) {
  return (
    <section className="shell mt-24 md:mt-32" aria-label="Stories left unfinished">
      <div className="mb-8 flex items-end justify-between gap-6 border-t border-white/[0.07] pt-10">
        <div>
          <span className="label text-veil">Loose threads</span>
          <h2 className="text-editorial mt-2 text-[clamp(1.75rem,3vw,2.5rem)] leading-none text-chalk">
            Stories you left halfway
          </h2>
        </div>
        <span className="hidden numeric text-veil sm:block">{stories.length}</span>
      </div>

      <motion.ul variants={cascade} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
        {stories.map((story) => {
          const progress = getStoryProgress(story)
          const next = getNextEntry(story)
          return (
            <motion.li key={story.id} variants={riseIn}>
              <Link
                href={`/franchise/${story.id}`}
                className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-5 border-b border-white/[0.07] py-5 transition-colors duration-300 hover:border-white/20"
              >
                <span className="numeric w-8 text-[11px] text-veil">
                  {String(progress.percent).padStart(2, '0')}%
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium text-chalk transition-colors group-hover:text-brand-100">
                    {story.name}
                  </span>
                  <span className="mt-1 block truncate numeric text-[10px] text-veil">
                    Stopped after {progress.completed} of {progress.total}
                    {next ? ` · next up ${next.name}` : ''}
                  </span>
                </span>

                <span className="hidden w-40 sm:block">
                  <span className="block h-[2px] w-full overflow-hidden rounded-full bg-white/[0.09]">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-ember-dim to-ember"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </span>
                </span>
              </Link>
            </motion.li>
          )
        })}
      </motion.ul>
    </section>
  )
}

function EmptyHero({ onImport }: { onImport: () => void }) {
  return (
    <div className="grain relative isolate overflow-hidden rounded-[32px] border border-white/[0.07] bg-ink-900 px-6 py-20 md:py-24">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 60% at 50% 10%, rgba(113,55,234,0.28), transparent 62%)',
        }}
      />

      <div className="relative grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
        <div className="mx-auto w-full max-w-lg text-center lg:mx-0 lg:text-left">
          <span className="label text-brand-300">StoryDex</span>
          <h1 className="text-editorial mt-4 text-[clamp(2.25rem,5vw,3.5rem)] leading-[0.98] text-chalk">
            Count stories,
            <br />
            not seasons.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-lead text-mist lg:mx-0">
            Import your AniList list and StoryDex will regroup every entry into the franchises they
            actually belong to — then show you what to watch next.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <button
              type="button"
              onClick={onImport}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-chalk px-7 text-[15px] font-semibold text-ink-950 transition-colors hover:bg-white"
            >
              Import from AniList
              <ArrowRight className="size-4" />
            </button>
          </div>

          <p className="mt-6 numeric text-[11px] text-veil">
            Public lists only · nothing is stored on a server
          </p>
        </div>

        {/* Three plates showing what the dashboard becomes. Line drawings in
            markup, not artwork — the real posters live in the rail below. */}
        <div className="hidden lg:block">
          <EmptyPreview />
        </div>
      </div>
    </div>
  )
}

/** A miniature of the dashboard, drawn in markup so it needs no assets. */
function EmptyPreview() {
  return (
    <div className="glass rim rounded-3xl p-5">
      <div className="flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-ember" />
        <span className="label text-[9px] text-ember">Your place in the story</span>
      </div>
      <div className="mt-4 h-2.5 w-4/5 rounded-full bg-white/[0.12]" />
      <div className="mt-2.5 h-2.5 w-3/5 rounded-full bg-white/[0.08]" />

      <div className="mt-5 h-px w-full bg-white/[0.08]" />

      <div className="mt-5 flex items-end gap-3">
        <div className="grid size-14 shrink-0 place-items-center rounded-full border border-white/10">
          <span className="numeric text-[13px] text-mist">—</span>
        </div>
        <div className="flex-1 space-y-2.5">
          <div className="h-1.5 w-full rounded-full bg-white/[0.08]">
            <div className="h-full w-0 rounded-full bg-brand-400" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/[0.08]">
            <div className="h-full w-0 rounded-full bg-jade" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/[0.08]">
            <div className="h-full w-0 rounded-full bg-ember" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2.5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="aspect-[2/3] rounded-lg border border-white/[0.07] bg-white/[0.02]" />
        ))}
      </div>
    </div>
  )
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="mt-16 flex flex-col items-center py-20 text-center">
      <div className="grid size-12 place-items-center rounded-full border border-white/10 text-veil">
        <Search className="size-5" />
      </div>
      <p className="mt-5 text-[17px] font-medium text-chalk">Nothing on this shelf</p>
      <p className="mt-1.5 max-w-xs text-body-sm text-mist">
        No story matches that search and filter combination.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-4 py-2 text-body-sm text-chalk transition-colors hover:bg-white/[0.12]"
      >
        <X className="size-3.5" />
        Clear filters
      </button>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="shell mt-10">
      <div className="h-[420px] animate-pulse rounded-[32px] bg-white/[0.03]" />
      <div className="mt-16 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="aspect-[2/3] animate-pulse rounded-[22px] bg-white/[0.03]" />
        ))}
      </div>
    </div>
  )
}

/* ==========================================================================
   Data
   ========================================================================== */

const PHASE_ORDER = [
  'complete',
  'watching',
  'caught-up',
  'backlog',
  'planned',
  'paused',
  'dropped',
] as const

type PhaseCounts = Record<(typeof PHASE_ORDER)[number], number>

function buildSummary(franchises: Franchise[]) {
  const byPhase: PhaseCounts = {
    complete: 0,
    watching: 0,
    'caught-up': 0,
    backlog: 0,
    planned: 0,
    paused: 0,
    dropped: 0,
  }

  let entriesWatched = 0
  let entriesTotal = 0
  let episodesWatched = 0
  let episodesTotal = 0
  let longestStory: Franchise | null = null
  let longestRemaining = 0

  for (const franchise of franchises) {
    byPhase[getStoryPhase(franchise)] += 1

    const progress = getStoryProgress(franchise)
    entriesWatched += progress.completed
    entriesTotal += progress.total

    const eps = getEpisodeProgress(franchise)
    episodesWatched += eps.watched
    episodesTotal += eps.total

    const remaining = eps.total - eps.watched
    if (!progress.complete && remaining > longestRemaining) {
      longestRemaining = remaining
      longestStory = franchise
    }
  }

  return {
    storiesComplete: byPhase.complete,
    storiesTotal: franchises.length,
    entriesWatched,
    entriesTotal,
    episodesWatched,
    episodesTotal,
    byPhase,
    longestStory,
  }
}

/**
 * The rail shows stories that are genuinely mid-flight: something watched,
 * something left, in release order. Fully-unstarted backlog stories are not
 * "up next" — they belong to the shelf.
 */
function buildUpNext(franchises: Franchise[]): Franchise[] {
  return franchises
    .filter((f) => {
      const progress = getStoryProgress(f)
      return progress.started && !progress.complete && canContinue(f)
    })
    .sort((a, b) => {
      const ea = getEpisodeProgress(a)
      const eb = getEpisodeProgress(b)
      // Closest to completion first: finishing things feels better than
      // starting things, and it's the honest ordering.
      const ra = ea.total > 0 ? ea.watched / ea.total : 0
      const rb = eb.total > 0 ? eb.watched / eb.total : 0
      return rb - ra
    })
    .slice(0, 8)
}

/**
 * Started, then stalled: at least one entry watched, still incomplete, and
 * with something actually available to watch. Stories that are merely "caught
 * up" are not loose threads.
 */
function buildUnfinished(franchises: Franchise[]): Franchise[] {
  return franchises
    .filter((f) => {
      const progress = getStoryProgress(f)
      return progress.started && !progress.complete && canContinue(f)
    })
    .sort((a, b) => getStoryProgress(b).percent - getStoryProgress(a).percent)
    .slice(0, 5)
}
