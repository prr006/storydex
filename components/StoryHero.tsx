'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowUpRight, Play } from 'lucide-react'
import { Atmosphere, Vignette } from '@/components/Atmosphere'
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
  getEpisodeTotal,
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
   StoryHero — entering a story
   --------------------------------------------------------------------------
   Not a detail header with a backdrop. The artwork takes the whole first
   screen, the story's own air fills it, and the type sits on top:

     the widest artwork it has, twice     (a full-bleed layer, plus an offset
                                           copy for depth — never a panorama
                                           sitting politely inside a box)
     the title at poster scale            (text-mega, with the giant initial
                                           behind it as architecture)
     the path across the whole story      (every entry as a node, you on one)
     what you are inside, floating        (a panel that straddles the hero's
                                           bottom edge and leads into the page)

   Scroll past the hero and you find the deck, then the journey — hero, facts,
   story. The page descends rather than tabulating.
   ========================================================================== */

export function StoryHero({ franchise }: { franchise: Franchise }) {
  const art = storyArtwork(franchise)
  const progress = getStoryProgress(franchise)
  const phase = getStoryPhase(franchise)
  const entry = currentEntry(franchise)
  const episodes = getEpisodeProgress(franchise)
  const total = getEpisodeTotal(franchise)
  const years = franchise.seasons.map((season) => season.year).filter((year) => year > 0)
  const initial = (franchise.name.match(/[\p{L}\p{N}]/u) ?? ['S'])[0].toUpperCase()
  const next = nextEntryAfter(franchise, entry)
  const watched = progress.completed

  return (
    <section
      className="relative isolate overflow-hidden"
      style={accentVars(franchise)}
      aria-label={`${franchise.name} — ${phaseCopy(phase).label}`}
    >
      <Atmosphere story={franchise} intensity="strong" />
      <Vignette strength="strong" />
      <span aria-hidden className="grain" />

      {/* ── Artwork, layered ───────────────────────────────────────────── */}
      <div aria-hidden className="absolute inset-0">
        {art ? (
          <>
            <div
              className="absolute inset-0 bg-cover opacity-80"
              style={{
                backgroundImage: `url(${art.src})`,
                backgroundPosition: art.isBanner ? 'center' : 'center 20%',
                maskImage: 'linear-gradient(to bottom, #000 40%, rgba(0,0,0,0.5) 74%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, #000 40%, rgba(0,0,0,0.5) 74%, transparent 100%)',
              }}
            />
            <div
              className="bleed-soft absolute -right-[8%] top-[6%] h-[86%] w-[46%] bg-cover bg-top opacity-30"
              style={{ backgroundImage: `url(${art.src})` }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(120% 100% at 20% 20%, color-mix(in oklab, var(--accent) 50%, #05060a) 0%, #05060a 72%)`,
            }}
          />
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="shell flex min-h-[clamp(30rem,74vh,47rem)] flex-col justify-end pb-40 pt-16 lg:pb-44">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: EASE }}
            className="relative max-w-[66rem]"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -left-4 -top-28 select-none text-[13rem] font-bold leading-none tracking-[-0.06em] text-white/[0.05] lg:-top-40 lg:text-[21rem]"
            >
              {initial}
            </span>

            <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="eyebrow" style={{ color: 'var(--accent-strong)' }}>
                Story collection
              </span>
              <StatusChip status={phaseToStatus(phase)} size="xs" />
              {years.length > 0 && (
                <span className="num text-small text-ink-3">
                  {Math.min(...years)} — {Math.max(...years)}
                </span>
              )}
            </div>

            <h1 className="relative mt-4 text-mega font-bold text-ink drop-shadow-[0_8px_50px_rgba(0,0,0,0.8)]">
              {franchise.name}
            </h1>

            {/* The facts, floating on the artwork rather than in a table. */}
            <div className="relative mt-5 flex flex-wrap items-center gap-2">
              {[
                `${progress.total} ${progress.total === 1 ? 'entry' : 'entries'}`,
                `${total.toLocaleString('en-US')} episodes`,
                `${watched} watched`,
                `${Math.round(progress.ratio * 100)}% complete`,
              ].map((fact) => (
                <span
                  key={fact}
                  className="num rounded-full border border-white/12 bg-black/35 px-3 py-1.5 text-small text-ink-2 backdrop-blur-md"
                >
                  {fact}
                </span>
              ))}
              {franchise.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-white/12 bg-black/35 px-3 py-1.5 text-small text-ink-2 backdrop-blur-md"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* The route across the story, at full width. */}
            <div className="relative mt-7 max-w-[52rem]">
              <StoryPath entries={franchise.seasons} size="rail" animate dashedAhead />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-small text-ink-3">
                <span>
                  {phase === 'complete'
                    ? 'Every entry watched'
                    : `${progress.total - progress.completed} entries left in this story`}
                </span>
                <span className="num">
                  {episodes.watched.toLocaleString('en-US')} of {episodes.total.toLocaleString('en-US')} episodes
                </span>
              </div>
            </div>

            {/* Actions: one loud, two quiet. */}
            <div className="relative mt-8 flex flex-wrap items-center gap-3">
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
                  href="/library"
                  className="inline-flex h-12 items-center gap-2.5 rounded-full bg-brand px-6 text-body font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <Play className="size-4 fill-current" aria-hidden />
                  Browse the library
                </Link>
              )}

              <a
                href="#journey"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-line-strong bg-black/40 px-6 text-body font-medium text-ink backdrop-blur-md transition-colors duration-200 hover:bg-white/[0.09]"
              >
                The journey
                <ArrowDown className="size-4" aria-hidden />
              </a>

              {franchise.aniListId && (
                <a
                  href={`https://anilist.co/anime/${franchise.aniListId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-full px-4 text-body text-ink-2 transition-colors hover:text-ink"
                >
                  AniList
                  <ArrowUpRight className="size-4" aria-hidden />
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Where you are, straddling the hero's edge ──────────────────── */}
      {entry && (
        <motion.aside
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18, ease: EASE }}
          className="shell relative z-20 -mt-24 pb-2 lg:-mt-28"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-end">
            {/* The next stop on the route, hanging off the path's end. */}
            {next && next.id !== entry.id && (
              <div className="float-panel flex items-center gap-3.5 p-4 lg:max-w-[22rem]">
                <span className="relative block h-[70px] w-[50px] shrink-0 overflow-hidden rounded-sm art-edge">
                  <Cover
                    src={next.posterUrl}
                    alt=""
                    ratio="2/3"
                    rounded={false}
                    edged={false}
                    sizes="50px"
                    className="h-full w-full"
                  />
                </span>
                <span className="min-w-0">
                  <span className="eyebrow block">After this</span>
                  <span className="clamp-2 mt-1 block text-card font-semibold leading-snug text-ink">
                    {next.name}
                  </span>
                  <span className="num mt-1 block text-small text-ink-3">
                    {formatFormat(next.format)}
                    {next.year > 0 && ` · ${next.year}`}
                    {isUpcoming(next) ? ' · not aired' : ''}
                  </span>
                </span>
              </div>
            )}

            {/* The entry you are inside. */}
            <div className="float-panel flex items-center gap-4 p-4 lg:w-[26rem]">
              <span className="relative block h-[104px] w-[74px] shrink-0 overflow-hidden rounded-sm art-edge">
                <Cover
                  src={entry.posterUrl}
                  alt=""
                  ratio="2/3"
                  rounded={false}
                  edged={false}
                  sizes="74px"
                  className="h-full w-full"
                />
              </span>

              <div className="min-w-0 flex-1">
                <p className="eyebrow" style={{ color: 'var(--accent-strong)' }}>
                  You are here
                </p>
                <p className="clamp-2 mt-1.5 text-card font-bold leading-snug text-ink">{entry.name}</p>
                <p className="num mt-1 text-small text-ink-3">
                  {formatFormat(entry.format)}
                  {entry.year > 0 && ` · ${entry.year}`}
                </p>

                <p className="num mt-2 text-small text-ink-2">
                  {isUpcoming(entry) ? 'Not aired yet' : episodeLabel(entry)}
                </p>
                <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/12">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      background: 'var(--accent)',
                      width: `${Math.round((getEntryStatus(entry) === 'watched' ? 1 : (entry.progress ?? 0) / (entry.episodes || 1)) * 100)}%`,
                    }}
                  />
                </span>

                <a
                  href={entry.siteUrl ?? `https://anilist.co/anime/${entry.aniListId ?? ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    'mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-full text-small font-semibold transition-colors',
                    'bg-brand text-white hover:bg-brand-strong',
                  )}
                >
                  <Play className="size-3.5 fill-current" aria-hidden />
                  {isUpcoming(entry) ? 'Not aired yet' : `Resume episode ${entry.progress ?? 0}`}
                </a>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </section>
  )
}
