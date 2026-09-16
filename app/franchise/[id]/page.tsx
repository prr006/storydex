'use client'

import { use, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowLeft, ArrowUpRight, Check, ExternalLink, Play } from 'lucide-react'

import { Navbar } from '@/components/Navbar'
import { ImportDialog } from '@/components/ImportDialog'
import { Banner, Poster } from '@/components/Artwork'
import { StatusDot } from '@/components/Status'
import { ProgressRing, StoryBar } from '@/components/Progress'
import { FranchiseMap } from '@/components/FranchiseMap'
import { useLibrary } from '@/lib/useLibrary'
import { cn } from '@/lib/utils'
import { EASE } from '@/lib/motion'
import {
  CURRENT_YEAR,
  formatCount,
  getStoryPhase,
  phaseCopy,
  formatEpisodes,
  formatFormat,
  formatScore,
  formatSpan,
  getEntryStatus,
  getEpisodeTotal,
  getNextEntry,
  getNextEntryIndex,
  getStoryProgress,
  seasonVisual,
  statusVisual,
  storyTint,
  type EntryStatus,
} from '@/lib/design'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   Franchise detail — the story page
   --------------------------------------------------------------------------
   Layout, top to bottom:

     1. CINEMATIC HERO      Full-bleed banner, graded and tinted to the story's
                            own hue. Poster plate overlaps the fold. Metadata
                            sits under the title in mono; the synopsis is
                            measured to 62ch so it reads like a film synopsis.
     2. NEXT TO WATCH       A single wide plate that spans the fold. Warm
                            ember eyebrow, backdrop crop of the entry's own
                            art, one white CTA. This is the only place on the
                            page with a warm accent.
     3. BODY GRID           Left: the Franchise Map. Right: a sticky sidebar
                            carrying the ledger (episodes, formats, years,
                            score), genre list, and the episode directory.
     4. MAP                 See FranchiseMap.tsx — the journey visualisation.
     5. DIRECTORY           Every entry with its own artwork, progress and
                            status. Rows are editorial, not cards: 16:9
                            backdrops, mono metadata rails, hairline dividers.

   The hero is the only element that bleeds; everything below is inside the
   shell, which creates the "title card → contents page" rhythm.
   ========================================================================== */

interface PageProps {
  params: Promise<{ id: string }>
}

export default function FranchiseDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const { franchises, loading } = useLibrary()

  const franchise = franchises.find((f) => f.id === id)

  if (loading) return <DetailSkeleton onImportClick={() => setIsImportOpen(true)} />

  if (!franchise) {
    return (
      <div className="relative min-h-screen">
        <Navbar onImportClick={() => setIsImportOpen(true)} />
        <main className="shell grid min-h-[70vh] place-items-center pt-32 text-center">
          <div>
            <span className="label text-veil">404</span>
            <h1 className="text-editorial mt-4 text-[clamp(2rem,5vw,3rem)] text-chalk">
              This story isn&apos;t in your library
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-lead text-mist">
              The franchise you&apos;re looking for doesn&apos;t exist, or it hasn&apos;t been
              imported yet.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-chalk px-6 text-[15px] font-semibold text-ink-950 transition-colors hover:bg-white"
            >
              <ArrowLeft className="size-4" />
              Back to library
            </Link>
          </div>
        </main>
        <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      </div>
    )
  }

  return <StoryPage franchise={franchise} onImportClick={() => setIsImportOpen(true)} isImportOpen={isImportOpen} closeImport={() => setIsImportOpen(false)} />
}

/* -------------------------------------------------------------------------- */

function StoryPage({
  franchise,
  onImportClick,
  isImportOpen,
  closeImport,
}: {
  franchise: Franchise
  onImportClick: () => void
  isImportOpen: boolean
  closeImport: () => void
}) {
  const progress = getStoryProgress(franchise)
  const phase = getStoryPhase(franchise)
  const phaseMeta = phaseCopy(phase)
  const next = getNextEntry(franchise)
  const nextIndex = getNextEntryIndex(franchise)
  const nextStatus = next ? getEntryStatus(next) : null
  // Hero tint is derived from this story's own AniList cover colour.
  const tint = storyTint(franchise, 0.42)
  const totalEpisodes = getEpisodeTotal(franchise)
  const score = formatScore(
    franchise.seasons.reduce<number>((best, s) => (s.score && s.score > best ? s.score : best), 0),
  )

  const { scrollY } = useScroll()
  // Hero copy drifts up and fades as you leave the title card — the only
  // parallax in the product, and it's 40px of it.
  const heroY = useTransform(scrollY, [0, 520], [0, 78])
  const heroOpacity = useTransform(scrollY, [0, 420], [1, 0.15])

  const countsByStatus = useMemo(() => {
    const counts: Partial<Record<EntryStatus, number>> = {}
    for (const season of franchise.seasons) {
      const status = getEntryStatus(season, CURRENT_YEAR)
      counts[status] = (counts[status] ?? 0) + 1
    }
    return counts
  }, [franchise.seasons])

  return (
    <div className="relative min-h-screen">
      <Navbar onImportClick={onImportClick} />

      {/* ══ 1. HERO ══════════════════════════════════════════════════════ */}
      <section className="grain relative isolate min-h-[86svh] overflow-hidden lg:min-h-[92svh]">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: EASE }}
        >
          <Banner
            src={franchise.bannerUrl}
            fallbackSrc={franchise.posterUrl}
            alt=""
            priority
            tint={franchise.accentColor ?? 'var(--color-brand-600)'}
          />
        </motion.div>

        {/* Grading stack: horizontal fade for text side, vertical for the fold. */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/78 to-ink-950/20" />
        <div className="absolute inset-0 scrim-b" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/25 to-ink-950" />
        <div
          className="absolute inset-0 opacity-70"
          style={{ background: `radial-gradient(80% 60% at 14% 30%, ${tint}, transparent 60%)` }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="shell relative flex h-full min-h-[86svh] lg:min-h-[92svh] flex-col justify-end pb-14 pt-32 lg:pb-20"
        >
          {/* Back link */}
          <Link
            href="/dashboard"
            className="group mb-auto inline-flex w-fit items-center gap-2 text-body-sm text-mist transition-colors hover:text-chalk"
          >
            <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            Library
          </Link>

          <div className="flex flex-col gap-9 lg:flex-row lg:items-end lg:gap-12">
            {/* Poster plate — the anchor object of the page. */}
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
              className="relative w-[148px] shrink-0 sm:w-[196px] lg:w-[236px]"
            >
              <div
                className="absolute -inset-5 rounded-[36px] blur-[40px]"
                style={{ background: `radial-gradient(60% 60% at 50% 55%, ${tint}, transparent 72%)` }}
              />
              <Poster
                src={franchise.posterUrl}
                alt={franchise.name}
                priority
                className="rim relative w-full rounded-[22px] shadow-[0_48px_100px_-32px_rgba(0,0,0,0.95)]"
                sizes="(max-width: 640px) 148px, 236px"
              />
            </motion.div>

            {/* Title + metadata */}
            <div className="min-w-0 flex-1">
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
              >
                {/* Eyebrow: status + span, mono, quiet */}
                <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="flex items-center gap-2">
                    <StatusDot status={progress.complete ? 'watched' : nextStatus ?? 'unwatched'} live={phase === 'watching'} />
                    <span className="label text-[10px]" style={{ color: phaseMeta.color }}>
                      {phaseMeta.label}
                    </span>
                  </span>
                  <span className="h-3 w-px bg-white/15" />
                  <span className="numeric text-[11px] text-mist">
                    {formatSpan(franchise.seasons.map((s) => s.year))}
                  </span>
                  <span className="h-3 w-px bg-white/15" />
                  <span className="numeric text-[11px] text-mist">
                    {franchise.seasons.length} {franchise.seasons.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                <h1 className="text-editorial max-w-[18ch] text-[clamp(2.6rem,7vw,5.25rem)] leading-[0.94] text-chalk drop-shadow-[0_6px_36px_rgba(0,0,0,0.9)]">
                  {franchise.name}
                </h1>

                {franchise.description && (
                  <p className="mt-6 max-w-[62ch] text-lead leading-[1.65] text-mist/95 drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
                    {franchise.description}
                  </p>
                )}

                {/* Genre rail — plain text with separators, not a chip cloud. */}
                {franchise.genres.length > 0 && (
                  <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
                    {franchise.genres.slice(0, 5).map((genre, i) => (
                      <span key={genre} className="flex items-center gap-3">
                        {i > 0 && <span aria-hidden className="size-1 rounded-full bg-white/20" />}
                        <span className="label text-[10px] text-mist/80">{genre}</span>
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Progress ring — sits in the hero, right-aligned on desktop. */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.4 }}
              className="hidden shrink-0 lg:block"
            >
              <ProgressRing ratio={progress.ratio} size={148} thickness={3} complete={progress.complete} delay={0.8}>
                <div className="text-center">
                  <div className="text-editorial text-[46px] leading-none text-chalk">
                    {progress.percent}
                    <span className="text-[24px] text-brand-300">%</span>
                  </div>
                  <div className="label mt-2 text-[9px] text-veil">watched</div>
                </div>
              </ProgressRing>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ══ 2. NEXT TO WATCH ═════════════════════════════════════════════ */}
      {next ? (
        <NextPlate
          franchise={franchise}
          entryIndex={nextIndex}
          status={nextStatus ?? 'unwatched'}
          tint={tint}
        />
      ) : (
        <CompletionPlate franchise={franchise} totalEpisodes={totalEpisodes} tint={tint} />
      )}

      {/* ══ 3. BODY ══════════════════════════════════════════════════════ */}
      <main className="shell pb-32 pt-24 md:pt-32">
        {/* Three blocks, deliberately ordered differently per breakpoint.
            On mobile the reading order is map → ledger → full record, because
            a reader on a phone wants the summary before a 6-row table. On
            desktop the ledger becomes a sticky sidebar beside both. */}
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-20">
          {/* ── Map ─────────────────────────────────────────────────── */}
          <div className="order-1 min-w-0">
            <FranchiseMap franchise={franchise} />

          </div>

          {/* ── Sticky sidebar ──────────────────────────────────────── */}
          <aside className="order-2 lg:order-2 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24 lg:h-fit">
            <Sidebar
              franchise={franchise}
              totalEpisodes={totalEpisodes}
              score={score}
              counts={countsByStatus}
            />
          </aside>

          {/* ── Directory ───────────────────────────────────────────── */}
          <div className="order-3 min-w-0 lg:col-start-1 lg:row-start-2">
            <section id="directory" className="scroll-mt-24" aria-label="All entries">
              <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
                <div>
                  <span className="label text-veil">Every entry</span>
                  <h2 className="text-editorial mt-2.5 text-[clamp(1.9rem,4vw,2.75rem)] leading-none text-chalk">
                    The full record
                  </h2>
                </div>
                <span className="numeric text-veil">
                  {progress.completed} of {progress.total} watched
                </span>
              </div>

              <ul className="flex flex-col">
                {franchise.seasons.map((season, i) => (
                  <EntryRow
                    key={season.id}
                    franchise={franchise}
                    index={i}
                    total={franchise.seasons.length}
                  />
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>

      <ImportDialog isOpen={isImportOpen} onClose={closeImport} />
    </div>
  )
}

/* ==========================================================================
   Next to Watch — the action plate
   ========================================================================== */

function NextPlate({
  franchise,
  entryIndex,
  status,
  tint,
}: {
  franchise: Franchise
  entryIndex: number
  status: EntryStatus
  tint: string
}) {
  const next = getNextEntry(franchise)!
  const visual = statusVisual(status)
  const art = next.posterUrl || franchise.bannerUrl || franchise.posterUrl
  // An entry that hasn't aired can't be started, so it gets a different
  // headline and a different action rather than a play button that goes
  // nowhere. This is the difference between a tracker and a calendar.
  const isFuture = status === 'upcoming'

  return (
    <motion.section
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, ease: EASE }}
      className="shell relative z-20 -mt-10 md:-mt-16"
      aria-label="Next to watch"
    >
      <div className="group relative isolate overflow-hidden rounded-[28px] border border-white/[0.09] bg-ink-850">
        {/* Backdrop crop of the entry's own art, very dark and blurred, so the
            plate belongs to the specific entry rather than the franchise. */}
        <div className="absolute inset-0">
          <Image
            src={art}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 1200px"
            className="scale-110 object-cover opacity-25 blur-lg"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/92 to-ink-950/75" />
          <div
            className="absolute inset-0 opacity-60"
            style={{ background: `radial-gradient(60% 90% at 8% 50%, ${tint}, transparent 62%)` }}
          />
        </div>

        <div className="relative grid grid-cols-1 gap-8 p-6 sm:p-8 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-10 md:p-10">
          {/* Entry artwork */}
          <div className="hidden md:block">
            <Poster
              src={next.posterUrl || franchise.posterUrl}
              alt={next.name}
              className="rim w-[132px] rounded-2xl shadow-[0_30px_70px_-24px_rgba(0,0,0,0.95)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              sizes="132px"
            />
          </div>

          {/* Copy */}
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-halo rounded-full bg-ember" />
                <span className="size-2 rounded-full bg-ember" />
              </span>
              <span className="label text-ember">
                {isFuture ? 'Coming soon' : status === 'watching' ? 'Continue watching' : 'Watch next'}
              </span>
              {entryIndex >= 0 && (
                <>
                  <span className="h-3 w-px bg-white/15" />
                  <span className="numeric text-[10px] text-mist">
                    Entry {entryIndex + 1} of {franchise.seasons.length}
                  </span>
                </>
              )}
            </div>

            <h2 className="text-editorial text-[clamp(1.6rem,3.4vw,2.5rem)] leading-[1.02] text-chalk">
              {next.name}
            </h2>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 numeric text-[11px] text-mist">
              <span>{formatFormat(next.format)}</span>
              <PlateSep />
              <span>{formatEpisodes(next)}</span>
              <PlateSep />
              <span>{next.year > 0 ? next.year : 'TBA'}</span>
              {status === 'watching' && next.progress ? (
                <>
                  <PlateSep />
                  <span className="text-ember">
                    episode {next.progress}
                    {next.episodes ? ` of ${next.episodes}` : ''}
                  </span>
                </>
              ) : null}
              {visual.dim && (
                <>
                  <PlateSep />
                  <span className="text-lilac">{visual.label}</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-col gap-3 md:w-[190px]">
            {isFuture ? (
              <a
                href={next.siteUrl ?? '#'}
                target={next.siteUrl ? '_blank' : undefined}
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-chalk px-6 text-[15px] font-semibold text-ink-950 transition-all duration-300 hover:bg-white hover:shadow-[0_18px_50px_-14px_rgba(255,255,255,0.4)]"
              >
                View on AniList
                <ArrowUpRight className="size-4" />
              </a>
            ) : (
              <>
                <a
                  href={next.siteUrl ?? '#'}
                  target={next.siteUrl ? '_blank' : undefined}
                  rel="noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-chalk px-6 text-[15px] font-semibold text-ink-950 transition-all duration-300 hover:bg-white hover:shadow-[0_18px_50px_-14px_rgba(255,255,255,0.4)]"
                >
                  <Play className="size-4 fill-current" />
                  {status === 'watching' ? 'Resume' : 'Start watching'}
                </a>
                <a
                  href={next.siteUrl ?? '#'}
                  target={next.siteUrl ? '_blank' : undefined}
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white/[0.06] text-[14px] font-medium text-chalk transition-colors duration-300 hover:bg-white/[0.13]"
                >
                  View on AniList
                  <ArrowUpRight className="size-3.5" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function PlateSep() {
  return <span aria-hidden className="h-2.5 w-px bg-white/15" />
}

/** Shown instead of the plate when there is genuinely nothing left to watch. */
function CompletionPlate({
  franchise,
  totalEpisodes,
  tint,
}: {
  franchise: Franchise
  totalEpisodes: number
  tint: string
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, ease: EASE }}
      className="shell relative z-20 -mt-10 md:-mt-16"
    >
      <div className="relative isolate overflow-hidden rounded-[28px] border border-jade/20 bg-ink-850 p-8 md:p-10">
        <div
          className="absolute inset-0 opacity-50"
          style={{ background: `radial-gradient(50% 100% at 6% 50%, ${tint}, transparent 60%)` }}
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="label flex items-center gap-2.5 text-jade">
              <Check className="size-3.5" />
              Story complete
            </span>
            <h2 className="text-editorial mt-4 text-[clamp(1.6rem,3.4vw,2.5rem)] leading-[1.02] text-chalk">
              You finished {franchise.name}
            </h2>
            <p className="mt-3 numeric text-[11px] text-mist">
              {franchise.seasons.length} entries
              {totalEpisodes > 0 && ` · ${formatCount(totalEpisodes)} episodes`} · every one watched
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-white/[0.07] px-6 text-[15px] font-medium text-chalk transition-colors hover:bg-white/[0.13]"
          >
            Find another story
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </motion.section>
  )
}

/* ==========================================================================
   Directory row
   ========================================================================== */

function EntryRow({ franchise, index, total }: { franchise: Franchise; index: number; total: number }) {
  const season = franchise.seasons[index]
  const status = getEntryStatus(season, CURRENT_YEAR)
  const visual = seasonVisual(season)
  const score = formatScore(season.score)
  const watched = status === 'watched'

  return (
    <motion.li
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: EASE, delay: Math.min(index * 0.03, 0.25) }}
      className={cn(
        'group border-b border-white/[0.07] transition-colors duration-400 hover:border-white/20',
        status === 'watching' && 'border-l-2 border-l-ember/60',
      )}
    >
      <div className="flex items-center gap-5 py-5 md:gap-7">
        {/* Index */}
        <span className="hidden w-7 shrink-0 numeric text-[10px] text-veil sm:block">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Artwork — 16:9 backdrop treatment, not a poster. Keeps rows short. */}
        <div
          className={cn(
            'relative h-[62px] w-[110px] shrink-0 overflow-hidden rounded-xl md:h-[72px] md:w-[128px]',
            watched && 'opacity-70 transition-opacity duration-500 group-hover:opacity-100',
          )}
        >
          <Poster
            src={season.posterUrl || franchise.posterUrl}
            alt={season.name}
            className="h-full w-full"
            sizes="128px"
            muted={watched}
          />
          {watched && (
            <span className="absolute inset-0 grid place-items-center bg-ink-950/45">
              <span className="grid size-6 place-items-center rounded-full bg-jade/90">
                <Check className="size-3.5 text-ink-950" strokeWidth={3} />
              </span>
            </span>
          )}
        </div>

        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h3
              className={cn(
                'text-[16px] font-medium tracking-[-0.01em] md:text-[17px]',
                watched ? 'text-chalk/70' : 'text-chalk',
              )}
            >
              {season.name}
            </h3>
            {index === 0 && (
              <span className="label rounded-full bg-white/[0.06] px-2 py-1 text-[9px] text-veil">
                First entry
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 numeric text-[11px] text-veil">
            <span className="text-mist">{formatFormat(season.format)}</span>
            <RowSep />
            <span>{season.year > 0 ? season.year : 'TBA'}</span>
            <RowSep />
            <span>{formatEpisodes(season)}</span>
            {score && (
              <>
                <RowSep />
                <span>scored {score}</span>
              </>
            )}
          </div>

          {/* In-flight progress */}
          {status === 'watching' && season.episodes ? (
            <div className="mt-3 flex max-w-sm items-center gap-3">
              <StoryBar
                ratio={(season.progress || 0) / season.episodes}
                height={2}
                delay={0.1}
                label={`${season.name} progress`}
              />
              <span className="shrink-0 numeric text-[10px] text-ember">
                {season.progress || 0}/{season.episodes}
              </span>
            </div>
          ) : null}
        </div>

        {/* Status + link */}
        <div className="flex shrink-0 items-center gap-4">
          <span className="hidden items-center gap-2 md:flex">
            <StatusDot status={status} live={status === 'watching'} />
            <span
              className="label text-[9px]"
              style={{ color: visual.dim ? 'var(--color-mist)' : visual.color }}
            >
              {visual.tag}
            </span>
          </span>
          {season.siteUrl && (
            <a
              href={season.siteUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`${season.name} on AniList`}
              className="grid size-8 place-items-center rounded-full text-veil opacity-0 transition-all duration-300 hover:bg-white/[0.07] hover:text-chalk group-hover:opacity-100"
            >
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>
    </motion.li>
  )
}

function RowSep() {
  return <span aria-hidden className="h-2.5 w-px bg-white/12" />
}

/* ==========================================================================
   Sidebar — the ledger
   ========================================================================== */

function Sidebar({
  franchise,
  totalEpisodes,
  score,
  counts,
}: {
  franchise: Franchise
  totalEpisodes: number
  score: string | null
  counts: Partial<Record<EntryStatus, number>>
}) {
  const formats = useMemo(() => {
    const map = new Map<string, number>()
    for (const season of franchise.seasons) {
      const key = formatFormat(season.format)
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [franchise.seasons])

  const progress = getStoryProgress(franchise)

  return (
    <div className="flex flex-col gap-10">
      {/* ── Ledger ─────────────────────────────────────────────────── */}
      <div className="rounded-[24px] border border-white/[0.07] bg-ink-900/60 p-6">
        <span className="label text-veil">The ledger</span>

        <dl className="mt-6 flex flex-col gap-4">
          <Stat label="Entries" value={String(franchise.seasons.length)} />
          <Stat label="Watched" value={`${progress.completed}`} accent="var(--color-jade)" />
          <Stat label="Episodes" value={totalEpisodes > 0 ? formatCount(totalEpisodes) : '—'} />
          <Stat
            label="Span"
            value={formatSpan(franchise.seasons.map((s) => s.year))}
          />
          {score && <Stat label="Your score" value={score} accent="var(--color-brand-300)" />}
        </dl>

        {/* Format mix as a thin proportional rule — no pie chart, no legend. */}
        {formats.length > 0 && (
          <div className="mt-7">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="label text-veil">Formats</span>
            </div>
            <div className="flex h-1.5 gap-[2px] overflow-hidden rounded-full">
              {formats.map(([format, count], i) => (
                <span
                  key={format}
                  className="h-full rounded-[2px]"
                  style={{
                    flexGrow: count,
                    flexBasis: 0,
                    background: ['var(--color-brand-400)', 'var(--color-indigo-400)', 'var(--color-lilac)', 'var(--color-veil)'][i % 4],
                    opacity: 0.85 - i * 0.12,
                  }}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {formats.map(([format, count], i) => (
                <span key={format} className="flex items-center gap-2">
                  <span
                    className="size-1.5 rounded-full"
                    style={{
                      background: ['var(--color-brand-400)', 'var(--color-indigo-400)', 'var(--color-lilac)', 'var(--color-veil)'][i % 4],
                      opacity: 0.85 - i * 0.12,
                    }}
                  />
                  <span className="numeric text-[10px] text-mist">{format}</span>
                  <span className="numeric text-[10px] text-veil">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Status breakdown ──────────────────────────────────────── */}
      <div className="rounded-[24px] border border-white/[0.07] bg-ink-900/60 p-6">
        <span className="label text-veil">Where you stand</span>
        <ul className="mt-6 flex flex-col gap-3.5">
          {STATUS_ORDER.filter((s) => counts[s]).map((status) => {
            const visual = statusVisual(status)
            const count = counts[status] ?? 0
            const ratio = franchise.seasons.length > 0 ? count / franchise.seasons.length : 0
            return (
              <li key={status} className="flex items-center gap-3">
                <StatusDot status={status} />
                <span className="w-24 shrink-0 text-body-sm text-mist">{visual.label}</span>
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${ratio * 100}%`,
                      background: visual.dim ? 'var(--color-veil)' : visual.color,
                      opacity: 0.9,
                    }}
                  />
                </span>
                <span className="w-5 shrink-0 text-right numeric text-[11px] text-chalk">{count}</span>
              </li>
            )
          })}
        </ul>
      </div>

      {/* ── Genres ────────────────────────────────────────────────── */}
      {franchise.genres.length > 0 && (
        <div>
          <span className="label text-veil">Genres</span>
          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
            {franchise.genres.map((genre) => (
              <span key={genre} className="text-body-sm text-mist">
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const STATUS_ORDER: EntryStatus[] = ['watched', 'watching', 'unwatched', 'planned', 'upcoming', 'paused', 'dropped']

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.05] pb-3 last:border-0">
      <dt className="label text-veil">{label}</dt>
      <dd className="numeric text-[15px]" style={{ color: accent ?? 'var(--color-chalk)' }}>
        {value}
      </dd>
    </div>
  )
}

/* ==========================================================================
   Skeleton
   ========================================================================== */

function DetailSkeleton({ onImportClick }: { onImportClick: () => void }) {
  return (
    <div className="relative min-h-screen">
      <Navbar onImportClick={onImportClick} />
      <div className="shell pt-32">
        <div className="h-[60svh] animate-pulse rounded-[28px] bg-white/[0.03]" />
        <div className="mt-16 grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.03]" />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-[24px] bg-white/[0.03]" />
        </div>
      </div>
    </div>
  )
}
