'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { Atmosphere } from '@/components/Atmosphere'
import { Cover, FormatMark } from '@/components/Cover'
import { StoryPath } from '@/components/Path'
import { StatusChip } from '@/components/StatusMark'
import { cn } from '@/lib/utils'
import {
  accentVars,
  currentEntry,
  episodeLabel,
  formatFormat,
  getEntryStatus,
  getEpisodeProgress,
  getStoryPhase,
  getStoryProgress,
  isUpcoming,
  phaseCopy,
  phaseToStatus,
  storyArtwork,
} from '@/lib/design'
import { nextEntryAfter } from '@/components/StoryStage'
import { EASE } from '@/lib/motion'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   StoryLadder — the rest of your stories, one full-width rung each
   --------------------------------------------------------------------------
   The stage owns the first screenful; this is everything else you are inside.

   A rail of cards would have been the obvious choice and the wrong one: a card
   is a container, and these stories are not containers, they are *places you
   are part-way through*. So each one gets a full-width rung composed from four
   layers that overlap rather than stack:

     1  the story's air                    (a wash of its artwork colour)
     2  artwork, bleeding from the left    (the widest image it has)
     3  the facts, floating on the middle  (title, where you are, next entry)
     4  the path, running the full width   (one node per entry, you on one)

   The whole rung is one link, because the whole rung is one action.
   ========================================================================== */

export function StoryLadder({ stories }: { stories: Franchise[] }) {
  if (stories.length === 0) return null

  return (
    <ul className="space-y-3">
      {stories.map((franchise, index) => (
        <StoryRung key={franchise.id} franchise={franchise} index={index} />
      ))}
    </ul>
  )
}

function StoryRung({ franchise, index }: { franchise: Franchise; index: number }) {
  const progress = getStoryProgress(franchise)
  const episodes = getEpisodeProgress(franchise)
  const phase = getStoryPhase(franchise)
  const entry = currentEntry(franchise)
  const next = nextEntryAfter(franchise, entry)
  const art = storyArtwork(franchise)
  const status = entry ? getEntryStatus(entry) : null

  return (
    <motion.li
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: Math.min(index * 0.06, 0.3), ease: EASE }}
      style={accentVars(franchise)}
    >
      <Link
        href={`/franchise/${franchise.id}`}
        className="group/rung relative block overflow-hidden rounded-lg border border-line bg-surface transition-all duration-500 ease-out hover:border-white/15 hover:card-shadow"
      >
        <Atmosphere story={franchise} intensity="faint" className="opacity-60" />

        <div className="relative grid gap-6 p-5 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:p-6 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)_minmax(0,17rem)] lg:items-center">
          {/* ── Artwork: bleeding out of its own column ── */}
          <div className="relative -mx-5 -mt-5 h-[164px] overflow-hidden sm:-ml-6 sm:-my-6 sm:h-[188px] sm:rounded-l-lg lg:h-[200px]">
            {art ? (
              <div
                className="absolute inset-0 bg-cover transition-transform duration-[900ms] ease-out group-hover/rung:scale-[1.05]"
                style={{
                  backgroundImage: `url(${art.src})`,
                  backgroundPosition: art.isBanner ? 'center' : 'center 24%',
                }}
                aria-hidden
              />
            ) : (
              <div
                className="absolute inset-0"
                aria-hidden
                style={{
                  background: `radial-gradient(80% 80% at 30% 30%, color-mix(in oklab, var(--accent) 42%, #0b0d12) 0%, #0b0d12 78%)`,
                }}
              />
            )}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to right, rgba(5,6,9,0.25) 0%, rgba(5,6,9,0.55) 60%, var(--surface) 100%)',
              }}
            />

            {/* The entry you are inside, standing on the artwork. */}
            {entry && (
              <span className="absolute bottom-3 left-3 flex items-center gap-2.5">
                <span className="relative block h-[62px] w-[44px] overflow-hidden rounded-sm art-edge">
                  <Cover
                    src={entry.posterUrl}
                    alt=""
                    ratio="2/3"
                    rounded={false}
                    edged={false}
                    sizes="44px"
                    className="h-full w-full"
                  />
                </span>
                {/* Only the live state is worth saying twice; on-hold and
                    stopped stories already carry their chip in the body. */}
                {status === 'watching' && (
                  <span className="hidden max-w-[9rem] text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-white/75 sm:block">
                    Now watching
                  </span>
                )}
              </span>
            )}
          </div>

          {/* ── Facts ── */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <StatusChip status={phaseToStatus(phase)} size="xs" />
              <span className="num text-small text-ink-3">
                {progress.completed}/{progress.total} entries ·{' '}
                {episodes.watched.toLocaleString('en-US')}/{episodes.total.toLocaleString('en-US')} eps
              </span>
            </div>

            <h3 className="mt-2.5 text-title font-bold text-ink transition-colors duration-300 group-hover/rung:text-[var(--accent-strong)]">
              {franchise.name}
            </h3>

            <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-body text-ink-2">
              {entry ? (
                <>
                  <span className="text-ink">{entry.name}</span>
                  <FormatMark format={entry.format} />
                  {/* A single-episode entry has already said "Film" or "Special"
                      in the chip above, so the line states its state instead. */}
                  <span className="num text-ink-3">
                    {isUpcoming(entry)
                      ? 'Not aired'
                      : (entry.episodes || 0) <= 1
                        ? status === 'watched'
                          ? 'Watched'
                          : 'Not watched'
                        : episodeLabel(entry)}
                  </span>
                </>
              ) : (
                <span className="text-ink-3">{phaseCopy(phase).label} — nothing left to watch</span>
              )}
            </p>

            <div className="mt-4">
              <StoryPath entries={franchise.seasons} size="rail" dashedAhead />
            </div>
          </div>

          {/* ── Next, and the action ── */}
          <div className="flex flex-col gap-3 lg:border-l lg:border-line lg:pl-6">
            {next ? (
              <div className="flex items-center gap-3">
                <span className="relative block h-[54px] w-[38px] shrink-0 overflow-hidden rounded-xs">
                  <Cover
                    src={next.posterUrl}
                    alt=""
                    ratio="2/3"
                    rounded={false}
                    edged={false}
                    sizes="38px"
                    className="h-full w-full"
                  />
                </span>
                <span className="min-w-0">
                  <span className="eyebrow block">Next</span>
                  <span className="clamp-2 mt-1 block text-small font-semibold leading-snug text-ink">
                    {next.name}
                  </span>
                  <span className="num mt-0.5 block text-[0.6875rem] text-ink-3">
                    {isUpcoming(next)
                      ? `Not aired${next.year ? ` · ${next.year}` : ''}`
                      : formatFormat(next.format)}
                  </span>
                </span>
              </div>
            ) : (
              <p className="text-small text-ink-3">Story complete — nothing queued.</p>
            )}

            <span
              className={cn(
                'inline-flex h-10 items-center justify-center gap-2 rounded-full text-small font-semibold transition-colors',
                status === 'watching'
                  ? 'bg-brand text-white group-hover/rung:bg-brand-strong'
                  : 'border border-line-strong text-ink group-hover/rung:bg-white/[0.06]',
              )}
            >
              <Play className="size-3.5 fill-current" aria-hidden />
              {status === 'watching' ? `Resume episode ${entry?.progress ?? 0}` : 'Open the story'}
            </span>
          </div>
        </div>
      </Link>
    </motion.li>
  )
}
