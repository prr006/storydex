'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Play, Plus } from 'lucide-react'
import { ArtworkBackdrop } from '@/components/Cover'
import { ProgressBar, SegmentBar } from '@/components/Bars'
import { StatusChip } from '@/components/StatusMark'
import { cn } from '@/lib/utils'
import {
  accentVars,
  episodeLabel,
  formatFormat,
  getEntryStatus,
  getEpisodeProgress,
  getStoryPhase,
  getStoryProgress,
  isUpcoming,
  phaseCopy,
  storyArtwork,
} from '@/lib/design'
import { currentEntry, phaseToStatus, progressOfEntry } from '@/components/Cards'
import { EASE } from '@/lib/motion'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   StoryHero
   --------------------------------------------------------------------------
   The first five seconds. Real AniList artwork fills the frame; the type sits
   in the left third behind a two-stop scrim, so the subject of the image is
   never covered by the copy.

   It answers three things, in this order, before the user reads anything:

     1. WHAT  — the story's name, at hero scale.
     2. WHERE — the current entry, its episode, and a filled bar.
     3. WHAT NEXT — one indigo button, which is the only loud control on the
                    page.

   Statistics are deliberately absent here. They live in the ledger below,
   where they can be read properly instead of skimmed.
   ========================================================================== */

export function StoryHero({ franchise }: { franchise: Franchise }) {
  const art = storyArtwork(franchise)
  const progress = getStoryProgress(franchise)
  const phase = getStoryPhase(franchise)
  const entry = currentEntry(franchise)
  const episodes = getEpisodeProgress(franchise)
  const entryStatus = entry ? getEntryStatus(entry) : null
  const ratio = entry ? progressOfEntry(entry) : progress.ratio
  const percent = Math.round(ratio * 100)
  const years = franchise.seasons.map((season) => season.year).filter((year) => year > 0)

  return (
    <section
      className="relative isolate"
      style={accentVars(franchise)}
      aria-label={`${franchise.name} — ${phaseCopy(phase).label}`}
    >
      <ArtworkBackdrop
        src={art?.src}
        alt=""
        tint={franchise.accentColor}
        isBanner={art?.isBanner}
        priority
        className="h-[clamp(24rem,58vh,40rem)] w-full"
        sizes="100vw"
        overlay="scrim-hero"
      />

      <div className="absolute inset-0">
        <div className="shell flex h-full flex-col justify-end pb-10 lg:pb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="max-w-[46rem]"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="eyebrow" style={{ color: 'var(--accent-strong)' }}>
                {phase === 'watching' ? 'Continue watching' : phaseCopy(phase).label}
              </span>
              {years.length > 0 && (
                <span className="num text-small text-ink-3">
                  {Math.min(...years)}–{Math.max(...years)}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-hero font-bold text-ink">{franchise.name}</h1>

            {entry && (
              <p className="mt-3 text-lead text-ink-2">
                <span className="text-ink">{entry.name}</span>
                <span className="text-ink-3"> · {formatFormat(entry.format)}</span>
                {entry.year > 0 && <span className="num text-ink-3"> · {entry.year}</span>}
              </p>
            )}

            {/* Where you are, as a bar and a sentence. */}
            <div className="mt-5 max-w-[34rem]">
              <div className="flex items-baseline justify-between gap-4">
                <span className="num text-body font-semibold text-ink">
                  {entry ? episodeLabel(entry) : `${progress.completed} of ${progress.total} entries`}
                </span>
                <span className="num text-body font-semibold" style={{ color: 'var(--accent-strong)' }}>
                  {percent}% watched
                </span>
              </div>
              <ProgressBar
                value={ratio}
                height="md"
                className="mt-2.5"
                label={entry ? episodeLabel(entry) : undefined}
              />
            </div>

            {/* The action row. One loud button, one quiet one. */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {entry ? (
                <a
                  href={entry.siteUrl ?? `https://anilist.co/anime/${entry.aniListId ?? ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-body font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-brand-strong"
                >
                  <Play className="size-4 fill-current" aria-hidden />
                  {entryStatus === 'upcoming'
                    ? `Opens ${entry.year || 'soon'}`
                    : `Continue — ${formatFormat(entry.format)} ${entry.progress ?? 0}/${entry.episodes || '?'}`}
                </a>
              ) : (
                <Link
                  href="/library"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-body font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <Play className="size-4 fill-current" aria-hidden />
                  Browse your library
                </Link>
              )}

              <Link
                href={`/franchise/${franchise.id}`}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-black/30 px-5 text-body font-medium text-ink backdrop-blur-sm transition-colors duration-200 hover:bg-white/[0.08]"
              >
                <Plus className="size-4" aria-hidden />
                The whole story
              </Link>
            </div>

            {/* Story shape, then the facts that don't fit in a sentence. */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <SegmentBar entries={franchise.seasons} className="max-w-[13rem] flex-1" animate />
              <p className="num text-small text-ink-3">
                {progress.completed}/{progress.total} entries · {episodes.watched.toLocaleString('en-US')} of{' '}
                {episodes.total.toLocaleString('en-US')} eps
              </p>
              {franchise.genres.length > 0 && (
                <ul className="flex flex-wrap items-center gap-2">
                  {franchise.genres.slice(0, 3).map((genre) => (
                    <li key={genre}>
                      <span className="rounded-full border border-line-strong px-2.5 py-[3px] text-small text-ink-2">
                        {genre}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* The current entry, as a floating panel in the right third — the one
          place on the page where the artwork's own subject is left clear. */}
      {entry && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: EASE }}
          className={cn(
            'pointer-events-none absolute right-[var(--spacing-shell)] bottom-12 hidden w-[19rem] xl:block',
          )}
        >
          <div className="pointer-events-auto rounded-md border border-line-strong bg-black/45 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <span className="eyebrow">Currently watching</span>
              <StatusChip status={phaseToStatus(phase)} size="xs" />
            </div>

            <h2 className="clamp-2 mt-2.5 text-card font-semibold text-ink">{entry.name}</h2>
            <p className="mt-1 text-small text-ink-3">
              {formatFormat(entry.format)}
              {entry.year > 0 && <span className="num"> · {entry.year}</span>}
            </p>

            <p className="num mt-3 text-body text-ink-2">
              {isUpcoming(entry) ? 'Not aired yet' : episodeLabel(entry)}
            </p>
            <ProgressBar value={ratio} height="sm" className="mt-2" />

            <a
              href={entry.siteUrl ?? `https://anilist.co/anime/${entry.aniListId ?? ''}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3.5 inline-flex h-9 w-full items-center justify-center gap-2 rounded-full bg-brand text-small font-semibold text-white transition-colors hover:bg-brand-strong"
            >
              <Play className="size-3.5 fill-current" aria-hidden />
              Resume episode {entry.progress ?? 0}
            </a>
          </div>
        </motion.div>
      )}
    </section>
  )
}
