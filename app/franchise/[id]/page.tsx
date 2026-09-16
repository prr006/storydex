'use client'

import Link from 'next/link'
import { use } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useLibraryContext } from '@/components/AppShell'
import { Chapter } from '@/components/Chapter'
import { Cover, FormatMark } from '@/components/Cover'
import { CompositionStrip, EntryRuler, EpisodeRuler } from '@/components/EntryRuler'
import { StatusMark } from '@/components/StatusMark'
import { statusTokenFor } from '@/components/StoryCard'
import { EntryTimeline } from '@/components/EntryTimeline'
import { EntryTable } from '@/components/EntryTable'
import { NextActionBar } from '@/components/NextActionBar'
import {
  formatEpisodes,
  formatFormat,
  getEntryStatus,
  getEpisodeProgress,
  getNextEntry,
  getStoryPhase,
  getStoryProgress,
  isUpcoming,
  phaseCopy,
  seasonVisual,
} from '@/lib/design'
import { DURATION, EASE } from '@/lib/motion'

/* ==========================================================================
   Story — /franchise/[id]
   --------------------------------------------------------------------------
   Five chapters, in the order the question gets asked:

     01 Identity    what is this story
     02 Progress    where am I inside it, stated in words and drawn as blocks
     03 Timeline    the entries, in watch order, labelled by what they are
     04 Entries     the reference table
     05 Next action the sticky bar that appears once the CTA scrolls away

   There is deliberately **no full-bleed backdrop**. The previous design spent
   the first screen on the story's own artwork, which pushed the title below the
   fold and made every franchise look the same. Identity is a title page now:
   the cover is the artwork moment, and the page is paper.

   The segment ruler is the hero instead — one block per entry, so "3 of 4" is
   countable rather than estimated.
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
        <h1 className="mt-4 text-display font-semibold text-ink">
          {library.loading ? 'Reading your library…' : 'No story with that address.'}
        </h1>
        {!library.loading && (
          <>
            <p className="reading mt-5 max-w-[54ch] text-ink-2">
              {library.isImported
                ? 'This story isn’t part of the library stored in this browser. It may have been removed by a re-import.'
                : 'There’s no library in this browser yet. Import your AniList list and every story you own appears here.'}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {!library.isImported && (
                <button
                  type="button"
                  onClick={openImport}
                  className="inline-flex h-11 items-center rounded-sm bg-brand px-5 text-body font-medium text-brand-ink transition-opacity hover:opacity-90"
                >
                  Import from AniList
                </button>
              )}
              <Link
                href="/library"
                className="inline-flex items-center gap-2 text-body font-medium text-brand-text underline decoration-brand/30 underline-offset-4 hover:decoration-brand"
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
  const meta = phaseCopy(phase)
  const next = getNextEntry(franchise)
  const nextStatus = next ? getEntryStatus(next) : null
  const episodes = getEpisodeProgress(franchise)
  const watchingEntry = franchise.seasons.find((entry) => getEntryStatus(entry) === 'watching')
  const years = franchise.seasons.map((entry) => entry.year).filter((year) => year > 0)
  const formats = [...new Set(franchise.seasons.map((entry) => formatFormat(entry.format)))]

  return (
    <div className="pb-28">
      {/* ═══ 01 · IDENTITY ══════════════════════════════════════════════ */}
      <div className="shell pt-10">
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-small text-ink-3 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Library
        </Link>

        <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:gap-11">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.enter, ease: EASE }}
            className="shrink-0"
          >
            <Cover
              src={franchise.posterUrl}
              alt={franchise.name}
              tint={franchise.accentColor}
              ratio="2/3"
              sizes="196px"
              priority
              className="w-[150px] sm:w-[196px]"
            />
          </motion.div>

          <div className="min-w-0 flex-1">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.enter, delay: 0.06, ease: EASE }}
            >
              <p className="eyebrow">{meta.label}</p>
              <h1 className="mt-3 text-display font-semibold text-ink">{franchise.name}</h1>

              {/* One line of hard facts, no badges, no chips. */}
              <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-body text-ink-2">
                {years.length > 0 && (
                  <span className="num">
                    {years.length > 1
                      ? `${Math.min(...years)}–${Math.max(...years)}`
                      : String(years[0])}
                  </span>
                )}
                <Dot />
                <span className="num">
                  {franchise.seasons.length}{' '}
                  {franchise.seasons.length === 1 ? 'entry' : 'entries'}
                </span>
                <Dot />
                <span className="num">{episodes.total.toLocaleString('en-US')} episodes</span>
                <Dot />
                <span>{formats.join(', ')}</span>
                {franchise.genres.length > 0 && (
                  <>
                    <Dot />
                    <span className="text-ink-3">{franchise.genres.slice(0, 3).join(' · ')}</span>
                  </>
                )}
              </p>

              {franchise.description && (
                <p className="reading mt-6 max-w-[62ch] text-ink-2">{stripHtml(franchise.description)}</p>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ═══ 02 · PROGRESS ══════════════════════════════════════════════ */}
      <div className="shell">
        <Chapter
          index={2}
          title="Progress"
          className="mt-16"
          lead="One block per entry, in watch order. Filled means watched, half means you're inside it, hollow means there's nothing there yet."
          meta={
            <span className="num">
              {progress.completed} of {progress.total} entries
            </span>
          }
        >
          <EntryRuler entries={franchise.seasons} size="lg" animate className="max-w-3xl" />

          {/* Entry legend, beneath the ruler it describes. */}
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            {franchise.seasons.map((entry, index) => {
              const visual = seasonVisual(entry)
              return (
                <li key={entry.id} className="flex items-center gap-2 text-small text-ink-3">
                  <span className="num text-ink-3">{index + 1}</span>
                  <span
                    className="size-2 rounded-full"
                    style={{ background: visual.color, opacity: visual.dim ? 0.55 : 1 }}
                    aria-hidden
                  />
                  <span className="max-w-[180px] truncate text-ink-2">{entry.name}</span>
                </li>
              )
            })}
          </ul>

          {/* Counts in words, then the next action. */}
          <div className="mt-10 grid gap-8 border-t border-rule pt-8 sm:grid-cols-2 lg:grid-cols-4">
            <Fact
              label="Entries"
              value={`${progress.completed} of ${progress.total} watched`}
              detail={progress.complete ? 'Story finished' : `${progress.total - progress.completed} to go`}
            />
            <Fact
              label="Episodes"
              value={`${episodes.watched.toLocaleString('en-US')} of ${episodes.total.toLocaleString('en-US')}`}
              detail={
                episodes.total > 0
                  ? `${Math.round((episodes.watched / episodes.total) * 100)}% of the story's runtime`
                  : 'Episode counts unavailable'
              }
            />
            <Fact
              label="State"
              value={meta.label}
              detail={
                phase === 'caught-up'
                  ? 'Everything that exists is watched'
                  : phase === 'dropped'
                    ? 'Excluded from Continue on purpose'
                    : progress.started
                      ? 'In your active shelf'
                      : 'Nothing watched yet'
              }
            />
            <Fact
              label="Next entry"
              value={next ? next.name : 'Nothing left'}
              detail={
                next
                  ? `${formatFormat(next.format)}${next.year > 0 ? ` · ${next.year}` : ''}${isUpcoming(next) ? ' · not aired' : ''}`
                  : 'Every entry watched'
              }
            />
          </div>

          {/* The inline call to action — and the sentinel the sticky bar watches. */}
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            {next ? (
              <>
                <span className="inline-flex items-center gap-3 rounded-sm border border-rule-strong bg-surface px-4 py-3">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: seasonVisual(next).color }}
                    aria-hidden
                  />
                  <span className="text-body">
                    <span className="text-ink-3">{nextStatus === 'upcoming' ? 'Waiting on' : 'Next'}</span>{' '}
                    <span className="font-medium text-ink">{next.name}</span>
                  </span>
                  <FormatMark format={next.format} />
                </span>

                {next.siteUrl && (
                  <a
                    href={next.siteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center rounded-sm bg-brand px-5 text-body font-medium text-brand-ink transition-opacity hover:opacity-90"
                  >
                    {nextStatus === 'watching' ? 'Continue on AniList' : 'Open on AniList'}
                  </a>
                )}

                {watchingEntry && watchingEntry.episodes > 1 && (
                  <span className="flex items-center gap-3">
                    <EpisodeRuler
                      watched={watchingEntry.progress ?? 0}
                      total={watchingEntry.episodes}
                      size="md"
                      className="w-40"
                    />
                    <span className="num text-small text-ink-3">
                      episode {watchingEntry.progress ?? 0} of {watchingEntry.episodes}
                    </span>
                  </span>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-3 rounded-sm border border-rule-strong bg-surface px-4 py-3">
                <StatusMark status="watched" label="Everything in this story is watched" size="md" />
              </span>
            )}
          </div>
        </Chapter>

        {/* ═══ 03 · TIMELINE ════════════════════════════════════════════ */}
        <Chapter
          index={3}
          title="Timeline"
          lead="The story in the order it is meant to be consumed — each entry labelled by what it actually is."
          className="mt-20"
          meta={
            <span className="flex items-center gap-3">
              <CompositionStrip entries={franchise.seasons} />
            </span>
          }
        >
          <EntryTimeline entries={franchise.seasons} />
        </Chapter>

        {/* ═══ 04 · ENTRIES ═════════════════════════════════════════════ */}
        <Chapter
          index={4}
          title="Entries"
          lead="The same story as a reference table, for looking things up rather than reading."
          className="mt-20"
          meta={<span className="num">{franchise.seasons.length} rows</span>}
        >
          <EntryTable entries={franchise.seasons} />
        </Chapter>

        {/* ═══ 05 · NEXT ACTION ═════════════════════════════════════════ */}
        <section className="section-rule mt-20 pt-10">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            <div>
              <h2 className="text-head font-semibold text-ink">
                {next ? 'Keep going' : 'Story finished'}
              </h2>
              <p className="reading mt-2 max-w-[54ch] text-ink-2">
                {next
                  ? 'The next entry stays with you as you scroll, so the only action on this page is never more than a glance away.'
                  : 'Every entry in this story is watched. Nothing here needs your attention — which is the point of keeping track.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center rounded-sm border border-rule-strong px-5 text-body font-medium text-ink transition-colors hover:bg-sunk"
              >
                Back to Continue
              </Link>
              {franchise.aniListId && (
                <a
                  href={`https://anilist.co/anime/${franchise.aniListId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-body text-ink-2 underline decoration-rule-strong underline-offset-4 transition-colors hover:text-ink"
                >
                  View on AniList
                </a>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Appears only once the inline CTA has scrolled out of view. */}
      <NextActionBar franchise={franchise} next={next} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function Fact({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div>
      <p className="text-micro font-semibold uppercase tracking-[0.08em] text-ink-3">{label}</p>
      <p className="mt-2 text-lead font-medium text-ink">{value}</p>
      <p className="mt-1 text-small text-ink-3">{detail}</p>
    </div>
  )
}

function Dot() {
  return (
    <span aria-hidden className="text-rule-strong">
      ·
    </span>
  )
}

/**
 * AniList synopses arrive as HTML. Rather than dangerouslySetInnerHTML a remote
 * string into the page, tags are stripped and entities decoded, so the synopsis
 * renders as the serif prose the chapter expects.
 */
function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, '’')
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/\s+/g, ' ')
    .trim()
}

