'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Play } from 'lucide-react'
import { Cover, FormatMark } from '@/components/Cover'
import { Atmosphere, Vignette } from '@/components/Atmosphere'
import { StoryPath } from '@/components/Path'
import { CurrentMark } from '@/components/StatusMark'
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
  storyArtwork,
} from '@/lib/design'
import type { Franchise, Season } from '@/lib/franchise'
import { EASE } from '@/lib/motion'

/* ==========================================================================
   StoryStage — the dashboard opening
   --------------------------------------------------------------------------
   Not a hero with a poster in it. The story *is* the page for the first
   screenful:

     the artwork is the light                       (banner, or the cover
                                                     standing in, masked so it
                                                     dissolves into the page)
     the story's air fills the room                 (Atmosphere, mixed from its
                                                     own artwork colour)
     the title is set at poster scale               (text-mega, with a giant dim
                                                     initial behind it)
     progress is a route, not a bar                 (StoryPath: one node per
                                                     entry, you standing on one)
     what's next floats over the artwork            (a panel straddling the
                                                     stage's bottom edge)

   And it is a *place you can move around in*: the strip along the bottom is
   every other story you are inside, and picking one re-lights the whole stage
   with a crossfade — no navigation, no carousel that runs on its own.
   ========================================================================== */

export function StoryStage({ stories }: { stories: Franchise[] }) {
  const [index, setIndex] = useState(0)
  const active = stories[index] ?? stories[0]

  // Keep the index valid if the library changes underneath us (re-import).
  useEffect(() => {
    if (index >= stories.length) setIndex(0)
  }, [stories.length, index])

  if (!active) return null

  const art = storyArtwork(active)
  const entry = currentEntry(active)
  const progress = getStoryProgress(active)
  const episodes = getEpisodeProgress(active)
  const phase = getStoryPhase(active)
  const years = active.seasons.map((season) => season.year).filter((year) => year > 0)
  const nextAfter = nextEntryAfter(active, entry)
  const initial = (active.name.match(/[\p{L}\p{N}]/u) ?? ['S'])[0].toUpperCase()

  return (
    <section
      className="relative isolate overflow-hidden"
      style={accentVars(active)}
      aria-label={`${active.name} — ${phaseCopy(phase).label}`}
    >
      {/* z0 — the air of this story */}
      <Atmosphere story={active} intensity="strong" />
      <Vignette />
      <span aria-hidden className="grain" />

      {/* z1 — artwork, twice layered: the wide backdrop, then the current
          entry's own plate offset against it. */}
      <div aria-hidden className="absolute inset-0">
        <AnimatePresence initial={false}>
          <motion.div
            key={active.id}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="absolute inset-0"
          >
            <ArtworkLayer src={art?.src} isBanner={art?.isBanner} />
          </motion.div>
        </AnimatePresence>

        {/* Ambient depth: a second, offset copy of the artwork at low opacity,
            which is what makes the field feel layered rather than pasted. */}
        {art?.src && (
          <div
            className="bleed-soft absolute -right-[6%] bottom-[-18%] h-[78%] w-[52%] bg-cover bg-top opacity-25"
            style={{ backgroundImage: `url(${art.src})` }}
          />
        )}
      </div>

      {/* z2 — content */}
      <div className="relative">
        <div className="shell flex min-h-[clamp(32rem,70vh,44rem)] flex-col justify-center pt-10 pb-40 lg:pb-44">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="relative max-w-[62rem]"
            >
              {/* The giant initial: a compositional anchor in the story's own
                  colour, never readable as text. */}
              <span
                aria-hidden
                className="pointer-events-none absolute -left-4 -top-24 select-none text-[13rem] font-bold leading-none tracking-[-0.06em] text-white/[0.045] lg:-top-32 lg:text-[19rem]"
              >
                {initial}
              </span>

              <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2">
                <CurrentMark label={phase === 'watching' ? 'You are here' : phaseCopy(phase).label} />
                {years.length > 0 && (
                  <span className="num text-small text-ink-3">
                    {Math.min(...years)} — {Math.max(...years)}
                  </span>
                )}
                <span className="num text-small text-ink-3">
                  {progress.completed}/{progress.total} entries
                </span>
                <span className="num text-small text-ink-3">
                  {episodes.watched.toLocaleString('en-US')} of{' '}
                  {episodes.total.toLocaleString('en-US')} episodes
                </span>
              </div>

              <h1 className="relative mt-4 text-mega font-bold text-ink drop-shadow-[0_6px_40px_rgba(0,0,0,0.75)]">
                {active.name}
              </h1>

              {entry && (
                <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-lead text-ink-2">
                  <span className="text-ink">{entry.name}</span>
                  <FormatMark format={entry.format} />
                  {entry.year > 0 && <span className="num text-ink-3">{entry.year}</span>}
                  <span className="num text-ink-3">{episodeLabel(entry)}</span>
                </p>
              )}

              {/* Progress as a route across the whole story. */}
              <div className="mt-7 max-w-[44rem]">
                <StoryPath entries={active.seasons} size="rail" animate dashedAhead />
                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-small text-ink-3">
                    {phase === 'complete'
                      ? 'Every entry watched'
                      : progress.complete
                        ? 'Story complete'
                        : `${progress.total - progress.completed} of ${progress.total} entries left`}
                  </span>
                  <span
                    className="num text-small font-semibold"
                    style={{ color: 'var(--accent-strong)' }}
                  >
                    {Math.round(progress.ratio * 100)}%
                  </span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {entry ? (
                  <a
                    href={entry.siteUrl ?? `https://anilist.co/anime/${entry.aniListId ?? ''}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center gap-2.5 rounded-full bg-brand px-6 text-body font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-brand-strong"
                  >
                    <Play className="size-4 fill-current" aria-hidden />
                    {isUpcoming(entry)
                      ? `Arrives ${entry.year || 'soon'}`
                      : `Continue episode ${entry.progress ?? 0}`}
                  </a>
                ) : (
                  <Link
                    href={`/franchise/${active.id}`}
                    className="inline-flex h-12 items-center gap-2.5 rounded-full bg-brand px-6 text-body font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <Play className="size-4 fill-current" aria-hidden />
                    Open the story
                  </Link>
                )}

                <Link
                  href={`/franchise/${active.id}`}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-line-strong bg-black/40 px-6 text-body font-medium text-ink backdrop-blur-md transition-colors duration-200 hover:bg-white/[0.09]"
                >
                  The whole story
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* z3 — what's next in this story, floating over the artwork's edge */}
      {nextAfter && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${active.id}-next`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.5, delay: 0.05, ease: EASE }}
            className="pointer-events-none absolute right-[var(--spacing-shell)] top-1/2 hidden w-[19rem] -translate-y-1/2 xl:block"
          >
            <NextInStory franchise={active} entry={nextAfter} />
          </motion.div>
        </AnimatePresence>
      )}

      {/* z4 — the switcher: every other story you are inside, one press away */}
      <StorySwitcher stories={stories} index={index} onSelect={setIndex} />
    </section>
  )
}

/* -------------------------------------------------------------------------- */

function ArtworkLayer({ src, isBanner }: { src?: string | null; isBanner?: boolean }) {
  if (!src || !/^https?:\/\//i.test(src)) return null

  return (
    <div
      className={cn('absolute inset-0 bg-cover opacity-90', isBanner ? 'bg-center' : 'bg-[center_22%]')}
      style={{
        backgroundImage: `url(${src})`,
        // The art is the light, but the copy still has to win. Two stops only.
        maskImage:
          'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.72) 34%, #000 62%, rgba(0,0,0,0.5) 100%)',
        WebkitMaskImage:
          'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.72) 34%, #000 62%, rgba(0,0,0,0.5) 100%)',
      }}
    />
  )
}

/** The floating panel: what comes after the entry you are inside. */
function NextInStory({ franchise, entry }: { franchise: Franchise; entry: Season }) {
  const status = getEntryStatus(entry)
  const art = entry.posterUrl || storyArtwork(franchise)?.src

  return (
    <div className="float-panel pointer-events-auto w-full p-4">
      <p className="eyebrow">Next in this story</p>

      <div className="mt-3 flex items-center gap-3">
        <span className="relative block h-[74px] w-[52px] shrink-0 overflow-hidden rounded-sm art-edge">
          <Cover
            src={art}
            alt=""
            ratio="2/3"
            rounded={false}
            edged={false}
            sizes="52px"
            className="h-full w-full"
          />
        </span>
        <div className="min-w-0">
          <p className="clamp-2 text-card font-semibold leading-snug text-ink">{entry.name}</p>
          <p className="num mt-1 text-small text-ink-3">
            {formatFormat(entry.format)}
            {entry.year > 0 && ` · ${entry.year}`}
          </p>
          <p
            className="mt-1 text-small font-medium"
            style={{
              color:
                status === 'upcoming'
                  ? 'var(--state-upcoming)'
                  : status === 'planned'
                    ? 'var(--state-planned)'
                    : 'var(--accent-strong)',
            }}
          >
            {isUpcoming(entry)
              ? 'Not aired yet'
              : status === 'watched'
                ? 'Watched'
                : `${entry.progress ?? 0} of ${entry.episodes || '?'} episodes`}
          </p>
        </div>
      </div>

      <Link
        href={`/franchise/${franchise.id}`}
        className="mt-3.5 inline-flex h-9 w-full items-center justify-center rounded-full border border-line-strong text-small font-semibold text-ink transition-colors hover:bg-white/[0.07]"
      >
        See the story path
      </Link>
    </div>
  )
}

/** The strip that turns the stage into a place you can move around in. */
function StorySwitcher({
  stories,
  index,
  onSelect,
}: {
  stories: Franchise[]
  index: number
  onSelect: (index: number) => void
}) {
  if (stories.length <= 1) return null

  return (
    <div className="absolute inset-x-0 bottom-0 z-10">
      <div className="shell pb-5">
        <div className="rail -mx-1 flex items-stretch gap-2 overflow-x-auto px-1 pt-2">
          {stories.map((story, position) => {
            const current = position === index
            const progress = getStoryProgress(story)
            const entry = currentEntry(story)

            return (
              <button
                key={story.id}
                type="button"
                onClick={() => onSelect(position)}
                aria-pressed={current}
                className={cn(
                  'group/tab flex w-[15rem] shrink-0 items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-all duration-300',
                  current
                    ? 'border-[var(--accent)]/50 bg-black/55 backdrop-blur-md'
                    : 'border-line bg-black/35 backdrop-blur-sm hover:border-line-strong hover:bg-black/50',
                )}
                style={accentVars(story)}
              >
                <span className="relative block h-[46px] w-8 shrink-0 overflow-hidden rounded-xs">
                  <Cover
                    src={story.posterUrl}
                    alt=""
                    ratio="2/3"
                    rounded={false}
                    edged={false}
                    sizes="32px"
                    className="h-full w-full"
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block truncate text-small font-semibold',
                      current ? 'text-ink' : 'text-ink-2',
                    )}
                  >
                    {story.name}
                  </span>
                  <span className="num mt-0.5 block truncate text-[0.6875rem] text-ink-3">
                    {entry && getEntryStatus(entry) === 'watching'
                      ? episodeLabel(entry)
                      : `${progress.completed}/${progress.total} entries`}
                  </span>
                  <span className="mt-1.5 block">
                    <StoryPath entries={story.seasons} size="spark" className="max-w-[8rem]" />
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

/** The entry that follows the one you're inside — or the first unopened one. */
export function nextEntryAfter(franchise: Franchise, current: Season | null): Season | null {
  const openable = franchise.seasons.filter((entry) => {
    const status = getEntryStatus(entry)
    return status !== 'watched' && status !== 'dropped'
  })
  if (openable.length === 0) return null
  if (!current) return openable[0]

  const after = openable.find((entry) => entry.year > current.year)
  return after ?? openable.find((entry) => entry.id !== current.id) ?? null
}
