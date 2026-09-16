'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Cover, FormatMark } from '@/components/Cover'
import { ProgressBar, SegmentBar } from '@/components/Bars'
import { StatusChip } from '@/components/StatusMark'
import { cn } from '@/lib/utils'
import {
  accentVars,
  episodeLabel,
  formatEpisodes,
  formatFormat,
  getEntryStatus,
  getEpisodeTotal,
  getNextEntry,
  getStoryPhase,
  getStoryProgress,
  isUpcoming,
  phaseCopy,
  statusVisual,
  storyArtwork,
} from '@/lib/design'
import type { Franchise, Season } from '@/lib/franchise'

/* ==========================================================================
   The card system
   --------------------------------------------------------------------------
   Four objects, one visual language. Each answers a different question:

     MediaCard             "where am I in this story?"   — 16:9, artwork-first
     UpNextCard            "what's queued up?"           — compact, 1 line
     PosterCard            "what do I own?"              — 2:3 poster
     StoryCollectionCard   "what shape is this story?"   — banner + entry stack

   Rules that hold across all four:

   · Artwork is the card. Text sits *on* the artwork behind a scrim, or in a
     short block beneath it — never both competing for the same space.
   · Progress is drawn as a bar in the story's own accent, always next to its
     number, because "64%" alone is a statistic and a bar alone is a guess.
   · At most two lines of text under a poster. Metadata beyond that belongs on
     the story page, where there is room to read it.
   ========================================================================== */

/* -------------------------------------------------------------------------- */
/* MediaCard — Continue watching                                              */
/* -------------------------------------------------------------------------- */

export function MediaCard({
  franchise,
  index = 0,
  className,
}: {
  franchise: Franchise
  index?: number
  className?: string
}) {
  const entry = currentEntry(franchise)
  const progress = getStoryProgress(franchise)
  const art = storyArtwork(franchise)
  const phase = getStoryPhase(franchise)
  const visual = statusVisual(phase === 'watching' ? 'watching' : phase === 'complete' ? 'watched' : 'planned')

  const ratio = entry ? progressOfEntry(entry) : progress.ratio
  const percent = Math.round((entry ? ratio : progress.ratio) * 100)

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: Math.min(index * 0.05, 0.25), ease: [0.22, 1, 0.36, 1] }}
      className={cn('group/art w-[280px] shrink-0 snap-start sm:w-[330px]', className)}
      style={accentVars(franchise)}
    >
      <Link href={`/franchise/${franchise.id}`} className="block">
        <div className="relative overflow-hidden rounded-md transition-all duration-300 ease-out group-hover/art:-translate-y-1 group-hover/art:card-shadow">
          <Cover
            src={art?.src}
            alt={franchise.name}
            tint={franchise.accentColor}
            isBanner={art?.isBanner}
            ratio="16/9"
            scrim="card"
            hoverZoom
            focus={art?.isBanner ? 'center' : 'upper'}
            sizes="(max-width: 640px) 85vw, 340px"
            className="group-hover/art:ring-1 group-hover/art:ring-white/20"
          />

          {/* Where this card sits in the story, top-left; the story's state top-right. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
            <span className="rounded-full bg-black/45 px-2 py-[3px] text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-white/90 backdrop-blur-[2px]">
              {entry ? formatFormat(entry.format) : 'Story'}
            </span>
            <span
              className="rounded-full px-2 py-[3px] text-[0.625rem] font-semibold uppercase tracking-[0.08em]"
              style={{ color: visual.color, background: 'rgba(5,6,9,0.55)' }}
            >
              {phaseCopy(phase).label}
            </span>
          </div>

          {/* The content block, embedded in the artwork. */}
          <div className="absolute inset-x-0 bottom-0 p-3.5">
            <h3 className="clamp-2 text-card font-semibold leading-snug text-white">
              {franchise.name}
            </h3>
            <p className="mt-0.5 truncate text-small text-white/70">
              {entry ? entry.name : `${progress.total} entries`}
            </p>

            <div className="mt-2.5 flex items-center gap-3">
              <ProgressBar
                value={entry ? ratio : progress.ratio}
                height="sm"
                track="strong"
                label={entry ? episodeLabel(entry) : `${progress.completed} of ${progress.total} entries`}
                className="flex-1"
              />
              <span className="num shrink-0 text-small font-semibold text-white/90">{percent}%</span>
            </div>

            <p className="num mt-1.5 text-small text-white/60">
              {entry ? episodeLabel(entry) : `${progress.completed} of ${progress.total} entries`}
            </p>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

/* -------------------------------------------------------------------------- */
/* PosterCard — the library unit                                              */
/* -------------------------------------------------------------------------- */

export function PosterCard({
  franchise,
  entry,
  rank,
  index = 0,
  className,
  showStory = true,
}: {
  franchise: Franchise
  /** Render one *entry* rather than the whole story. */
  entry?: Season
  /** Trend position, drawn into the composition rather than beside it. */
  rank?: number
  index?: number
  className?: string
  showStory?: boolean
}) {
  const subject = entry ?? undefined
  const title = entry ? entry.name : franchise.name
  const status = entry ? getEntryStatus(entry) : undefined
  const ratio = entry ? progressOfEntry(entry) : getStoryProgress(franchise).ratio
  const percent = Math.round(ratio * 100)
  const poster = entry?.posterUrl || franchise.posterUrl
  const subtitle = entry
    ? showStory
      ? franchise.name
      : formatFormat(entry.format)
    : franchise.genres.slice(0, 2).join(' · ') || `${franchise.seasons.length} entries`

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: Math.min(index * 0.03, 0.24), ease: [0.22, 1, 0.36, 1] }}
      className={cn('group/art', className)}
      style={accentVars(franchise)}
    >
      <Link href={`/franchise/${franchise.id}`} className="block">
        <div className="relative">
          <Cover
            src={poster}
            alt={title}
            tint={entry?.isExpanded ? 'var(--brand)' : franchise.accentColor}
            ratio="2/3"
            scrim="none"
            hoverZoom
            focus="upper"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 24vw, 15vw"
            className="transition-all duration-300 ease-out group-hover/art:-translate-y-1 group-hover/art:ring-1 group-hover/art:ring-white/25"
          >
            {/* Status sits on the artwork, but only when it says something the
                progress bar doesn't. A finished story gets its badge; so does
                one that hasn't aired. Everything else stays clean. */}
            {status && (status === 'watched' || status === 'upcoming' || status === 'dropped') && (
              <span className="pointer-events-none absolute inset-x-2 top-2 flex justify-end">
                <StatusChip status={status} size="xs" />
              </span>
            )}
            {!entry && <StoryBadge franchise={franchise} />}

            {rank !== undefined && (
              <span
                className="pointer-events-none absolute -bottom-1 left-1 text-[3.25rem] font-bold leading-none tracking-[-0.06em] text-white/85 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
                aria-hidden
              >
                {rank}
              </span>
            )}

            {/* The progress bar lives at the foot of the poster, as part of the
                object — the same place a real case shows its spine colour. */}
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-black/40">
              <span
                className="block h-full"
                style={{ background: 'var(--accent)', width: `${percent}%` }}
              />
            </span>
          </Cover>
        </div>

        <div className="mt-2.5">
          <h3 className="clamp-2 text-card font-semibold leading-snug text-ink transition-colors duration-200 group-hover/art:text-brand-strong">
            {title}
          </h3>
          <p className="mt-0.5 truncate text-small text-ink-3">{subtitle}</p>
        </div>
      </Link>
    </motion.article>
  )
}

/** Small caption on a story poster: how much of the story is done. */
function StoryBadge({ franchise }: { franchise: Franchise }) {
  const progress = getStoryProgress(franchise)
  const phase = getStoryPhase(franchise)
  const isDone = phase === 'complete'

  return (
    <span className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2">
      <span className="num rounded-full bg-black/50 px-2 py-[3px] text-[0.625rem] font-semibold text-white/85 backdrop-blur-[2px]">
        {progress.completed}/{progress.total}
      </span>
      {isDone && <StatusChip status="watched" size="xs" />}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* StoryCollectionCard — /franchises                                          */
/* -------------------------------------------------------------------------- */

export function StoryCollectionCard({
  franchise,
  index = 0,
  className,
}: {
  franchise: Franchise
  index?: number
  className?: string
}) {
  const progress = getStoryProgress(franchise)
  const phase = getStoryPhase(franchise)
  const art = storyArtwork(franchise)
  const episodes = getEpisodeTotal(franchise)
  const percent = Math.round(progress.ratio * 100)
  const stack = franchise.seasons.slice(0, 4)

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: Math.min(index * 0.04, 0.28), ease: [0.22, 1, 0.36, 1] }}
      className={cn('group/art', className)}
      style={accentVars(franchise)}
    >
      <Link href={`/franchise/${franchise.id}`} className="block">
        <div className="overflow-hidden rounded-lg border border-line bg-surface transition-all duration-300 ease-out group-hover/art:-translate-y-1 group-hover/art:border-white/15 group-hover/art:card-shadow">
          {/* Artwork */}
          <div className="relative">
            <Cover
              src={art?.src}
              alt={franchise.name}
              tint={franchise.accentColor}
              isBanner={art?.isBanner}
              ratio="21/9"
              scrim="bottom"
              hoverZoom
              edged={false}
              rounded={false}
              focus={art?.isBanner ? 'center' : 'upper'}
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            />

            {/* The entry stack: the story's actual parts, in order, overlapping
                the artwork's bottom edge. A 6-entry franchise looks different
                from a single film before you read a word. */}
            <div className="absolute -bottom-6 left-4 flex items-end">
              {stack.map((season, position) => (
                <span
                  key={season.id}
                  className={cn(
                    'relative block h-[62px] w-[44px] overflow-hidden rounded-sm art-edge',
                    position > 0 && '-ml-3',
                  )}
                  style={{ zIndex: stack.length - position }}
                >
                  <Cover
                    src={season.posterUrl}
                    alt=""
                    ratio="2/3"
                    rounded={false}
                    edged={false}
                    sizes="44px"
                    className="h-full w-full"
                  />
                </span>
              ))}
              {franchise.seasons.length > stack.length && (
                <span className="num -ml-3 grid h-[62px] w-[44px] place-items-center rounded-sm bg-black/70 text-small font-semibold text-white/80 art-edge">
                  +{franchise.seasons.length - stack.length}
                </span>
              )}
            </div>
          </div>

          {/* Facts */}
          <div className="px-4 pb-4 pt-9">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-lead font-semibold text-ink">{franchise.name}</h3>
                <p className="mt-0.5 truncate text-small text-ink-3">
                  {franchise.genres.slice(0, 3).join(' · ') || 'Story collection'}
                </p>
              </div>
              <StatusChip status={phaseToStatus(phase)} size="xs" className="mt-0.5 shrink-0" />
            </div>

            <div className="mt-3.5 flex items-center gap-3">
              <SegmentBar entries={franchise.seasons} className="flex-1" height="xs" animate />
              <span
                className="num shrink-0 text-small font-semibold"
                style={{ color: 'var(--accent-strong)' }}
              >
                {percent}%
              </span>
            </div>

            <p className="num mt-2 text-small text-ink-3">
              {franchise.seasons.length} {franchise.seasons.length === 1 ? 'entry' : 'entries'} ·{' '}
              {episodes.toLocaleString('en-US')} eps · {progress.completed} watched
            </p>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                             */
/* -------------------------------------------------------------------------- */

/** The entry the user is inside right now, or the next one they could open. */
export function currentEntry(franchise: Franchise): Season | null {
  const watching = franchise.seasons.find((entry) => getEntryStatus(entry) === 'watching')
  return watching ?? getNextEntry(franchise)
}

export function progressOfEntry(entry: Season): number {
  const status = getEntryStatus(entry)
  if (status === 'watched') return 1
  if (!entry.episodes || entry.episodes <= 0) return status === 'watching' ? 0.35 : 0
  return Math.max(0, Math.min(1, (entry.progress ?? 0) / entry.episodes))
}

/** A story phase expressed in the entry-status vocabulary, so chips match. */
export function phaseToStatus(phase: ReturnType<typeof getStoryPhase>) {
  switch (phase) {
    case 'complete':
      return 'watched' as const
    case 'watching':
      return 'watching' as const
    case 'caught-up':
      return 'planned' as const
    case 'dropped':
      return 'dropped' as const
    case 'paused':
      return 'paused' as const
    case 'planned':
      return 'planned' as const
    default:
      return 'unwatched' as const
  }
}

export { FormatMark }
