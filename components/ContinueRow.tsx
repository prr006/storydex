'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Cover } from '@/components/Cover'
import { EntryRuler, EpisodeRuler } from '@/components/EntryRuler'
import { StatusMark } from '@/components/StatusMark'
import { statusTokenFor } from '@/components/StoryCard'
import {
  canContinue,
  formatEpisodes,
  formatFormat,
  getEntryStatus,
  getEpisodeProgress,
  getNextEntry,
  getStoryPhase,
  getStoryProgress,
  phaseCopy,
} from '@/lib/design'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   ContinueRow
   --------------------------------------------------------------------------
   The primary surface of the product, and the reason it stops being a wall of
   posters. One active story per row, at full width, so "where am I" is
   answerable in a single downward glance instead of by comparing tiles.

   The whole row is the link. There is no button inside it: the entire object
   is the action, which is why the affordance at the end is a word and an arrow
   rather than a bordered rectangle.

   Default order is by phase (in progress above stalled) and then by how close
   the story is to being finished — the honest "what should I pick up" order.
   ========================================================================== */

export function ContinueList({ franchises }: { franchises: Franchise[] }) {
  return (
    <ul className="mt-8 border-t border-rule">
      {franchises.map((franchise, index) => (
        <ContinueRow key={franchise.id} franchise={franchise} index={index} />
      ))}
    </ul>
  )
}

export function ContinueRow({ franchise, index = 0 }: { franchise: Franchise; index?: number }) {
  const progress = getStoryProgress(franchise)
  const phase = getStoryPhase(franchise)
  const meta = phaseCopy(phase)
  const next = getNextEntry(franchise)
  const nextStatus = next ? getEntryStatus(next) : null
  const watching = franchise.seasons.find((entry) => getEntryStatus(entry) === 'watching')
  const activeEntry = watching ?? next

  const watchable = activeEntry?.episodes && activeEntry.episodes > 0
  const watchedHere = watching?.progress ?? 0

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.04, 0.2), ease: [0.22, 1, 0.36, 1] }}
      className="border-b border-rule"
    >
      <Link
        href={`/franchise/${franchise.id}`}
        className="group/row flex items-start gap-5 py-6 transition-colors duration-150 hover:bg-sunk/40 sm:gap-7"
      >
        <Cover
          src={franchise.posterUrl}
          alt={franchise.name}
          tint={franchise.accentColor}
          ratio="2/3"
          sizes="72px"
          className="w-[72px] shrink-0 transition-transform duration-300 ease-out group-hover/row:scale-[1.015]"
        />

        <div className="min-w-0 flex-1">
          {/* Title + status, on one baseline. */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h3 className="min-w-0 text-title font-semibold text-ink">{franchise.name}</h3>
            <StatusMark
              status={statusTokenFor(phase)}
              label={meta.label}
              size="md"
              className="shrink-0"
            />
          </div>

          {/* Where you are, in words. */}
          <p className="mt-1.5 text-body text-ink-2">
            {progress.complete ? (
              <>All {progress.total} entries watched</>
            ) : next ? (
              <>
                {nextStatus === 'upcoming' ? 'Waiting on ' : 'Next: '}
                <span className="text-ink">{next.name}</span>
                <span className="text-ink-3">
                  {' · '}
                  {formatFormat(next.format)}
                  {next.year > 0 && ` · ${next.year}`}
                </span>
              </>
            ) : (
              <>Nothing left to watch</>
            )}
          </p>

          {/* The signature ruler: one block per entry, countable. */}
          <EntryRuler
            entries={franchise.seasons}
            size="md"
            animate
            className="mt-3.5 max-w-2xl"
          />

          {/* Episode-level truth, only when there is episode-level progress. */}
          {watching && watchable && (
            <div className="mt-3 flex max-w-2xl items-center gap-3">
              <EpisodeRuler
                watched={watchedHere}
                total={watching.episodes}
                size="sm"
                className="max-w-[220px]"
              />
              <span className="num shrink-0 text-small text-ink-3">
                Episode {watchedHere} of {watching.episodes}
              </span>
            </div>
          )}
        </div>

        {/* Counts + affordance. */}
        <div className="hidden shrink-0 flex-col items-end gap-2 self-center md:flex">
          <span className="num text-body text-ink">
            {progress.completed}
            <span className="text-ink-3"> / {progress.total}</span>
          </span>
          <span className="text-small text-ink-3">
            {activeEntry ? formatEpisodes(activeEntry) : '—'}
          </span>
          <span className="mt-1 inline-flex items-center gap-1.5 text-small font-medium text-brand-text">
            {meta.label === 'In progress' ? 'Resume' : 'Open'}
            <span
              className="transition-transform duration-200 ease-out group-hover/row:translate-x-0.5"
              aria-hidden
            >
              →
            </span>
          </span>
        </div>
      </Link>
    </motion.li>
  )
}

/* -------------------------------------------------------------------------- */

/**
 * Stories you are *inside right now*.
 *
 * `canContinue` alone is not enough: a story marked Planned on AniList has a
 * next entry and is technically continuable, but nothing has been watched, so
 * putting it under a heading called Continue would be a lie. Likewise episode
 * progress has to count — One Piece is 1082 episodes into a single entry that
 * AniList reports as CURRENT, which means zero *entries* finished but a very
 * long way in.
 */
export function isActive(franchise: Franchise): boolean {
  if (!canContinue(franchise)) return false
  if (getStoryProgress(franchise).started) return true
  return getEpisodeProgress(franchise).watched > 0
}

/** Active stories, best candidate first. */
export function continuableStories(franchises: Franchise[]): Franchise[] {
  return franchises
    .filter(isActive)
    .sort((a, b) => {
      const rank = (franchise: Franchise) => (getStoryPhase(franchise) === 'watching' ? 0 : 1)
      const byRank = rank(a) - rank(b)
      if (byRank !== 0) return byRank
      return getStoryProgress(b).ratio - getStoryProgress(a).ratio || a.name.localeCompare(b.name)
    })
}
