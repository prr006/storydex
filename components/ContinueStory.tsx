'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Play } from 'lucide-react'
import { ArtworkBackdrop } from '@/components/Cover'
import { ProgressBar } from '@/components/Bars'
import { currentEntry, progressOfEntry } from '@/components/Cards'
import {
  accentVars,
  episodeLabel,
  formatFormat,
  getEntryStatus,
  getStoryProgress,
  isUpcoming,
  storyArtwork,
} from '@/lib/design'
import { EASE } from '@/lib/motion'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   ContinueStory  — the end of the story page
   --------------------------------------------------------------------------
   The last thing on the page answers the one question the product exists for:
   *what am I supposed to watch next?* It should never require hunting.

   So the closing block is not a footer — it is a wide artwork banner of the
   next entry, its episode, and one button. When there is nothing left to
   watch, the same block says so plainly, because "you're done" is also an
   answer and it deserves a proper ending rather than a missing section.
   ========================================================================== */

export function ContinueStory({ franchise }: { franchise: Franchise }) {
  const entry = currentEntry(franchise)
  const progress = getStoryProgress(franchise)
  const phase = getEntryStatus(entry ?? franchise.seasons[0])
  const ratio = entry ? progressOfEntry(entry) : progress.ratio

  if (!entry) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: EASE }}
        className="relative overflow-hidden rounded-lg border border-line bg-surface p-8 text-center"
      >
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-state-done/15">
          <Check className="size-5 text-state-done" strokeWidth={2.5} aria-hidden />
        </span>
        <h2 className="mt-4 text-head font-bold text-ink">Story finished</h2>
        <p className="mx-auto mt-2 max-w-[46ch] text-body text-ink-2">
          Every entry in {franchise.name} is watched — {progress.total} of {progress.total}. Nothing
          here needs your attention, which is the point of keeping track.
        </p>
        <Link
          href="/library"
          className="mt-6 inline-flex h-10 items-center rounded-full border border-line-strong px-5 text-body font-medium text-ink transition-colors hover:bg-white/[0.06]"
        >
          Back to the library
        </Link>
      </motion.section>
    )
  }

  const art = storyArtwork(franchise)
  const upcoming = isUpcoming(entry)

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: EASE }}
      style={accentVars(franchise)}
      className="relative overflow-hidden rounded-lg border border-line-strong"
    >
      {/* Artwork, with the entry's own poster standing in for the scene. */}
      <ArtworkBackdrop
        src={entry.posterUrl || art?.src}
        alt=""
        tint={franchise.accentColor}
        isBanner={false}
        className="h-[16rem] w-full sm:h-[15rem]"
        overlay="scrim-hero"
        sizes="(max-width: 1024px) 100vw, 1240px"
      />

      <div className="absolute inset-0 flex flex-col justify-center gap-6 p-6 sm:p-9 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-[38rem]">
          <p className="eyebrow" style={{ color: 'var(--accent-strong)' }}>
            Continue the story
          </p>
          <h2 className="mt-2.5 text-head font-bold text-ink">{entry.name}</h2>
          <p className="num mt-2 text-body text-ink-2">
            {formatFormat(entry.format)}
            {entry.year > 0 && ` · ${entry.year}`}
            {' · '}
            {upcoming ? 'Not aired yet' : episodeLabel(entry)}
          </p>

          <div className="mt-4 max-w-[24rem]">
            <ProgressBar value={ratio} height="sm" label={episodeLabel(entry)} />
            <p className="mt-2 text-small text-ink-3">
              {upcoming
                ? `Nothing to resume — this one arrives${entry.year > 0 ? ` in ${entry.year}` : ' later'}.`
                : phase === 'watching'
                  ? `You are ${Math.round(ratio * 100)}% through this entry.`
                  : 'Ready when you are.'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <a
            href={entry.siteUrl ?? `https://anilist.co/anime/${entry.aniListId ?? ''}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-body font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-brand-strong"
          >
            <Play className="size-4 fill-current" aria-hidden />
            {upcoming ? 'View on AniList' : `Watch episode ${entry.progress ?? 0}`}
          </a>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center rounded-full border border-line-strong bg-black/30 px-5 text-body font-medium text-ink backdrop-blur-sm transition-colors hover:bg-white/[0.08]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </motion.section>
  )
}
