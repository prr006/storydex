'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { Poster } from '@/components/Artwork'
import { StoryBar } from '@/components/Progress'
import { cn } from '@/lib/utils'
import { EASE } from '@/lib/motion'
import {
  canContinue,
  formatEpisodes,
  formatFormat,
  formatScore,
  formatSpan,
  getEntryStatus,
  getNextEntry,
  getNextEntryIndex,
  getSoonestUpcoming,
  getStoryProgress,
  storyTint,
} from '@/lib/design'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   ContinueWatching — the cinematic hero
   --------------------------------------------------------------------------
   This is the section the whole redesign hangs on. Instead of a horizontal
   row of identical cards, the dashboard leads with ONE story, staged the way
   a streaming service stages a title:

     ┌───────────────────────────────────────────────────────────────────┐
     │  [ backdrops crossfading, tinted per story ]                      │
     │   ── YOUR PLACE IN THE STORY                                     │
     │   STEINS;GATE                          ┌─────────┐                │
     │   5 of 7 entries · 2011–2025           │ poster  │                │
     │   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░ 71%               │ (3:4)   │                │
     │   ┌── NOW PLAYING ────────────────┐    └─────────┘                │
     │   │ Steins;Gate 0                 │   Next · Entry 6 of 7         │
     │   │ TV · 24 eps · 2018            │                              │
     │   │ [ Continue ]  [ Story map ]   │                              │
     │   └───────────────────────────────┘                              │
     └───────────────────────────────────────────────────────────────────┘
     ├── 0 1 2 3 4 ────────────────────────────────────────────────────┤
        ↑ thumbnail rail controls which story is staged

   Key decisions:
   · The hero owns the full viewport width on desktop. No card container, no
     max-width box — it bleeds, which is what makes it read as *cinema*.
   · The story tint is derived from the franchise id, so every story stages
     itself in its own violet-family hue.
   · Rotation is 8s, pauses on hover/focus/tab-hidden, and never fights the
     user: clicking a thumbnail pins that story.
   · The primary CTA is the only filled white button on the dashboard. Its
     rarity is the entire point.
   ========================================================================== */

interface ContinueWatchingProps {
  franchises: Franchise[]
  /** Cap how many stories can be staged. */
  limit?: number
}

export function ContinueWatching({ franchises, limit = 6 }: ContinueWatchingProps) {
  // Only stories the user can actually put on right now. A franchise whose
  // remaining entries haven't aired is handled by <CaughtUp /> instead.
  const stories = useMemo(
    () => franchises.filter((f) => canContinue(f) && !getStoryProgress(f).complete).slice(0, limit),
    [franchises, limit],
  )

  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  // Keep the index valid if the library changes underneath us.
  useEffect(() => {
    if (active > stories.length - 1) setActive(0)
  }, [stories.length, active])

  // Auto-rotate. Stops on hover, on focus, and while the tab is hidden —
  // an unattended carousel that keeps moving is a bug, not a feature.
  useEffect(() => {
    if (paused || stories.length < 2) return
    if (typeof document !== 'undefined' && document.hidden) return
    const timer = window.setInterval(() => {
      setActive((i) => (i + 1) % stories.length)
    }, 8000)
    return () => window.clearInterval(timer)
  }, [paused, stories.length])

  if (stories.length === 0) {
    return franchises.length > 0 ? <CaughtUp franchises={franchises} /> : null
  }

  const story = stories[active]
  const progress = getStoryProgress(story)
  const next = getNextEntry(story)
  const nextIndex = getNextEntryIndex(story)
  // Tint comes from this story's real AniList cover colour, so the hero and
  // the poster inside it always agree.
  const tint = storyTint(story, 0.3)
  const tintStrong = storyTint(story, 0.55)

  return (
    <section
      className="relative"
      aria-label="Continue watching"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="grain relative isolate overflow-hidden md:rounded-[32px]">
        {/* ── Backdrops: every story is mounted, only the active one is
               opaque. Crossfading two images is cheaper and smoother than
               swapping a single src. ────────────────────────────────── */}
        <div className="absolute inset-0">
          {stories.map((s, i) => (
            <motion.div
              key={s.id}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: i === active ? 1 : 0 }}
              transition={{ duration: 1.1, ease: EASE }}
              aria-hidden={i !== active}
            >
              <Poster
                src={s.bannerUrl || s.seasons.find((e) => e.posterUrl)?.posterUrl || s.posterUrl}
                alt=""
                className="h-full w-full"
                sizes="100vw"
                priority={i === 0}
                muted={i !== active}
              />
            </motion.div>
          ))}
        </div>

        {/* ── Cinematic grading stack ─────────────────────────────────── */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/72 to-ink-950/25" />
        <div className="absolute inset-0 scrim-b" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-transparent to-ink-950/85" />
        <motion.div
          key={`${story.id}-tint`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: EASE }}
          style={{
            background: `radial-gradient(90% 70% at 16% 22%, ${tintStrong}, transparent 62%), radial-gradient(70% 60% at 92% 88%, ${tint}, transparent 60%)`,
          }}
        />

        {/* ── Content grid ────────────────────────────────────────────── */}
        <div className="shell relative grid grid-cols-1 items-end gap-10 pb-14 pt-32 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14 lg:pb-20 lg:pt-44">
          <AnimatePresence mode="wait">
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="min-w-0"
            >
              {/* Eyebrow */}
              <div className="mb-6 flex items-center gap-3">
                <span className="relative flex size-2">
                  <span className="absolute inset-0 animate-halo rounded-full bg-ember" />
                  <span className="size-2 rounded-full bg-ember" />
                </span>
                <span className="label text-ember">Your place in the story</span>
              </div>

              <h1 className="text-editorial max-w-[19ch] text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.94] text-chalk drop-shadow-[0_4px_28px_rgba(0,0,0,0.85)]">
                {story.name}
              </h1>

              {/* Metadata rail */}
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 numeric text-mist">
                <span className="text-chalk">
                  {progress.completed} of {progress.total} entries
                </span>
                <Dot />
                <span>{progress.percent}% complete</span>
                <Dot />
                <span>
                  {yearsLabel(story)}
                </span>
                {story.genres.length > 0 && (
                  <>
                    <Dot />
                    <span className="hidden sm:inline">{story.genres.slice(0, 3).join(' · ')}</span>
                  </>
                )}
              </div>

              {/* Progress rule */}
              <div className="mt-5 max-w-md">
                <StoryBar ratio={progress.ratio} ticks={progress.total} height={3} delay={0.5} />
              </div>

              {/* ── Now playing plate ─────────────────────────────────── */}
              {next && (
                <div className="mt-9 max-w-xl">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <span className="label text-[10px] text-mist">Up next</span>
                    {nextIndex >= 0 && (
                      <span className="numeric text-[10px] text-veil">
                        Entry {nextIndex + 1} of {progress.total}
                      </span>
                    )}
                  </div>

                  <div className="glass rim flex items-center gap-4 rounded-2xl p-4">
                    <Poster
                      src={next.posterUrl || story.posterUrl}
                      alt={next.name}
                      className="hidden size-[62px] shrink-0 rounded-xl sm:block"
                      sizes="62px"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[17px] font-semibold tracking-[-0.01em] text-chalk">
                        {next.name}
                      </p>
                      <p className="mt-1 numeric text-[11px] text-mist">
                        {formatFormat(next.format)} · {formatEpisodes(next)} · {next.year || 'TBA'}
                        {next.airingStatus === 'NOT_YET_RELEASED' && ' · not aired'}
                      </p>
                      {getEntryStatus(next) === 'watching' && next.progress ? (
                        <p className="mt-1.5 numeric text-[10px] text-ember">
                          Episode {next.progress} of {next.episodes || '?'}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/franchise/${story.id}`}
                      className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-chalk px-7 text-[15px] font-semibold text-ink-950 transition-all duration-300 hover:bg-white hover:shadow-[0_16px_50px_-12px_rgba(255,255,255,0.35)]"
                    >
                      <Play className="size-4 fill-current" />
                      Continue story
                    </Link>
                    <Link
                      href={`/franchise/${story.id}#map`}
                      className="inline-flex h-12 items-center gap-2 rounded-full bg-white/[0.07] px-6 text-[15px] font-medium text-chalk backdrop-blur-md transition-colors duration-300 hover:bg-white/[0.14]"
                    >
                      Open story map
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── Poster plate (desktop only) ───────────────────────────── */}
          <div className="hidden lg:block">
            <AnimatePresence mode="wait">
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 26, rotate: -1.5 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="relative"
              >
                <div
                  className="absolute -inset-6 rounded-[36px] opacity-60 blur-3xl"
                  style={{ background: `radial-gradient(60% 60% at 50% 60%, ${tint}, transparent 70%)` }}
                />
                <Poster
                  src={story.posterUrl}
                  alt={story.name}
                  className="rim relative w-[248px] rounded-[24px] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)]"
                  sizes="248px"
                />
                {/* Small editorial caption anchors the poster to the copy. */}
                <div className="mt-5 flex items-center justify-between gap-4">
                  <span className="numeric text-[10px] text-mist">
                    {formatSpan(story.seasons.map((s) => s.year))}
                  </span>
                  {(() => {
                    const score = formatScore(story.seasons.find((s) => s.score && s.score > 0)?.score)
                    return score ? <span className="numeric text-[10px] text-veil">Scored {score}</span> : null
                  })()}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Story switcher rail ─────────────────────────────────────── */}
        {stories.length > 1 && (
          <div className="relative border-t border-white/[0.07] bg-ink-950/45 backdrop-blur-xl">
            <div className="shell flex items-stretch gap-1 overflow-x-auto rail">
              {stories.map((s, i) => {
                const p = getStoryProgress(s)
                const isActive = i === active
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-current={isActive}
                    className={cn(
                      'group/tab relative flex min-w-0 shrink-0 items-center gap-3 px-4 py-4 text-left transition-colors duration-300 lg:min-w-[220px]',
                      isActive ? 'text-chalk' : 'text-mist hover:text-chalk',
                    )}
                  >
                    <Poster
                      src={s.posterUrl}
                      alt=""
                      className={cn(
                        'size-10 shrink-0 rounded-lg transition-opacity duration-300',
                        isActive ? 'opacity-100' : 'opacity-45 group-hover/tab:opacity-80',
                      )}
                      sizes="40px"
                      muted={!isActive}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{s.name}</span>
                      <span className="mt-0.5 block numeric text-[10px] text-veil">
                        {p.completed}/{p.total} · {p.percent}%
                      </span>
                    </span>
                    {/* Active marker: a 2px ember rule, not a pill. */}
                    <span
                      className={cn(
                        'absolute inset-x-3 bottom-0 h-[2px] rounded-full transition-all duration-500',
                        isActive ? 'bg-ember' : 'bg-transparent',
                      )}
                    />
                  </button>
                )
              })}

            </div>
          </div>
        )}
      </div>
    </section>
  )
}

/** "2011–2025" for the metadata rail. */
function yearsLabel(story: Franchise) {
  const years = story.seasons.map((s) => s.year).filter((y) => y > 0)
  if (years.length === 0) return 'Year unknown'
  const min = Math.min(...years)
  const max = Math.max(...years)
  return min === max ? String(min) : `${min}–${max}`
}

function Dot() {
  return <span aria-hidden className="h-1 w-1 rounded-full bg-white/25" />
}

/* ==========================================================================
   CaughtUp
   --------------------------------------------------------------------------
   What the hero becomes when there is nothing left to watch. Rather than
   collapsing (and leaving a hole at the top of the dashboard), it states the
   situation and points at the next thing that will change it. This is the
   state a heavy user is in most of the time, so it deserves real design.
   ========================================================================== */

function CaughtUp({ franchises }: { franchises: Franchise[] }) {
  const soonest = getSoonestUpcoming(franchises)
  const tint = soonest ? storyTint(soonest.franchise, 0.4) : 'rgba(139,92,246,0.35)'

  return (
    <section aria-label="All caught up" className="grain relative isolate overflow-hidden md:rounded-[32px]">
      {soonest && (
        <div className="absolute inset-0">
          <Poster
            src={soonest.franchise.bannerUrl || soonest.franchise.posterUrl}
            alt=""
            className="h-full w-full"
            sizes="100vw"
            muted
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/55" />
      <div className="absolute inset-0 scrim-b" />
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(80% 70% at 14% 24%, ${tint}, transparent 62%)` }}
      />

      <div className="shell relative flex min-h-[420px] flex-col justify-center py-20 lg:min-h-[520px]">
        <span className="flex items-center gap-3">
          <span className="size-1.5 rounded-full bg-azure" />
          <span className="label text-azure">You are caught up</span>
        </span>

        <h1 className="text-editorial mt-6 max-w-[22ch] text-[clamp(2.25rem,5.5vw,4rem)] leading-[0.98] text-chalk">
          Nothing left to watch.
        </h1>

        <p className="mt-5 max-w-[46ch] text-lead leading-relaxed text-mist">
          {soonest ? (
            <>
              Everything you&apos;ve started is either finished or waiting on episodes that
              don&apos;t exist yet. The next one up is{' '}
              <span className="text-chalk">{soonest.entry.name}</span>
              {soonest.entry.year > 0 && <> in {soonest.entry.year}</>}.
            </>
          ) : (
            <>Every story in your library is either finished or fully watched.</>
          )}
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          {soonest && (
            <Link
              href={`/franchise/${soonest.franchise.id}`}
              className="inline-flex h-12 items-center gap-2.5 rounded-full bg-chalk px-7 text-[15px] font-semibold text-ink-950 transition-colors hover:bg-white"
            >
              See what&apos;s coming
            </Link>
          )}
          <Link
            href="/dashboard#library"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-white/[0.07] px-6 text-[15px] font-medium text-chalk backdrop-blur-md transition-colors hover:bg-white/[0.14]"
          >
            Browse the library
          </Link>
        </div>

        {soonest && (
          <div className="mt-12 flex items-center gap-4 border-t border-white/[0.08] pt-6">
            <Poster
              src={soonest.entry.posterUrl || soonest.franchise.posterUrl}
              alt=""
              className="size-12 rounded-lg"
              sizes="48px"
            />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium text-chalk">{soonest.franchise.name}</p>
              <p className="mt-1 numeric text-[10px] text-veil">
                {formatFormat(soonest.entry.format)} · {soonest.entry.year > 0 ? soonest.entry.year : 'TBA'} · not aired
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
