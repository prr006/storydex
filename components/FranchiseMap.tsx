'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, X } from 'lucide-react'
import { Poster } from '@/components/Artwork'
import { StatusDot } from '@/components/Status'
import { StoryBar } from '@/components/Progress'
import { cn } from '@/lib/utils'
import { EASE } from '@/lib/motion'
import {
  CURRENT_YEAR,
  formatEpisodes,
  formatFormat,
  formatScore,
  getEntryStatus,
  getNextEntry,
  seasonVisual,
} from '@/lib/design'
import type { Franchise, Season } from '@/lib/franchise'

/* ==========================================================================
   FranchiseMap — the story as a journey, not a list
   --------------------------------------------------------------------------
   THE PROBLEM WITH TIMELINES
   Every anime tracker draws the same vertical list: thumbnail on the left,
   metadata on the right, dots connected by a line. It communicates order and
   nothing else. It has no point of view.

   THE IDEA HERE
   Draw the story as a *road you have already walked*. Concretely:

     · A single continuous violet spine runs down the left. It is drawn
       progressively as you scroll (`scaleY` on a spring driven by scroll
       progress), so the map literally extends as you look further along.

     · Behind the spine, the road is divided into GATES — one per unwatched
       entry boundary. A completed entry's gate is filled with the ember-lit
       gradient of the road travelled. Unwatched gates sit empty and dim.

     · The single most important pixel on the page is the NODE between the
       last watched entry and the next one: a large ember-haloed disc that
       breathes. Everything above it is past; everything below is future.

     · Entries are split into two registers, both text-first (posters on the
       map would just be a list again):

         LEFT  — mono index rule, year, format glyph, episode count.
         RIGHT — the title in editorial type. Watched entries are de-emphasised
                 to 60% opacity and lose their hover lift, so the eye falls
                 naturally onto the frontier and the unwatched run.

     · Clicking a node opens a detail sheet with the poster, synopsis, score
       and a link to AniList. The map informs; the sheet is where you act.

   MOBILE
   The text register collapses: the index rule stays (it's the map's
   backbone), metadata wraps under the title, and the sheet becomes a
   bottom sheet. Nothing is hidden — it just gets narrower.
   ========================================================================== */

interface FranchiseMapProps {
  franchise: Franchise
}

export function FranchiseMap({ franchise }: FranchiseMapProps) {
  const [selected, setSelected] = useState<Season | null>(null)
  const next = getNextEntry(franchise)
  const nextId = next?.id ?? null

  // How far along the road the user has actually travelled, as a node index.
  const watchedUpTo = useMemo(() => {
    const idx = franchise.seasons.findIndex((s) => s.id === nextId)
    return idx === -1 ? franchise.seasons.length : idx
  }, [franchise.seasons, nextId])

  const totalEps = franchise.seasons.reduce((sum, s) => sum + (s.episodes || 0), 0)

  return (
    <section id="map" aria-label="Franchise map" className="relative">
      {/* ── Section header ────────────────────────────────────────────── */}
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="label text-brand-300">The story so far</span>
          <h2 className="text-editorial mt-2.5 text-[clamp(1.9rem,4vw,2.75rem)] leading-none text-chalk">
            Franchise map
          </h2>
          <p className="mt-3 max-w-md text-body-sm leading-relaxed text-mist">
            {franchise.seasons.length} entries in release order
            {totalEps > 0 && <> · {totalEps.toLocaleString('en-US')} episodes</>}. The lit road is
            what you&apos;ve watched; the empty gates are what&apos;s left.
          </p>
        </div>

        {/* Legend — three states, because those are the three decisions. */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <LegendItem colour="var(--color-jade)" label="Watched" />
          <LegendItem colour="var(--color-ember)" label="Your place" live />
          <LegendItem colour="var(--color-lilac)" label="Planned" hollow />
          <LegendItem colour="var(--color-veil)" label="Ahead" hollow />
        </div>
      </div>

      {/* ── The map ───────────────────────────────────────────────────────
          The road is assembled from one segment per node rather than a single
          long rule. That's what makes it both *pixel-accurate* (each segment
          spans exactly one row, so the lit/unlit boundary always lands on a
          node) and animateable: every segment draws itself downward, in order,
          as it enters the viewport. The road is laid as you read it. */}
      <div className="relative pl-[52px] sm:pl-[68px]">
        <ol className="relative">
          {franchise.seasons.map((season, index) => (
            <MapNode
              key={season.id}
              season={season}
              index={index}
              total={franchise.seasons.length}
              isNext={season.id === nextId}
              isTravelled={index < watchedUpTo}
              onOpen={() => setSelected(season)}
            />
          ))}
        </ol>

        {/* Completion capstone — closes the road when the story is finished */}
        <div className="relative flex items-center gap-4 pt-8">
          <span
            className="absolute left-[-52px] top-[38px] grid size-8 place-items-center sm:left-[-68px]"
            aria-hidden
          >
            <span className="size-2 rounded-full bg-jade/60" />
          </span>
          <p className="numeric text-[11px] text-veil">
            {watchedUpTo === franchise.seasons.length
              ? 'End of the road — story complete'
              : `${franchise.seasons.length - watchedUpTo} entries still ahead`}
          </p>
        </div>
      </div>

      {/* ── Entry sheet ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <EntrySheet
            season={selected}
            tint={franchise.accentColor}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

/* -------------------------------------------------------------------------- */

interface MapNodeProps {
  season: Season
  index: number
  total: number
  isNext: boolean
  /** True when the user has already passed this node on the road. */
  isTravelled: boolean
  onOpen: () => void
}

function MapNode({ season, index, isNext, isTravelled, onOpen }: MapNodeProps) {
  const visual = seasonVisual(season)
  const status = getEntryStatus(season, CURRENT_YEAR)
  const isWatched = status === 'watched'
  const score = formatScore(season.score)
  const nextEntryStatus = status

  return (
    <li className="group relative">
      {/* Road segment. Sits behind the node marker and spans the full row, so
          consecutive segments butt up against each other with no seam. */}
      <span aria-hidden className="pointer-events-none absolute left-[-37.5px] top-0 h-full w-[3px] sm:left-[-53.5px]">
        {/* Unwalked track */}
        <span className="absolute inset-0 rounded-full bg-white/[0.07]" />
        {/* Travelled road — drawn downward, once, when the row enters view. */}
        {isTravelled && (
          <motion.span
            className="absolute inset-x-0 top-0 origin-top rounded-full"
            style={{
              bottom: 0,
              background: 'linear-gradient(to bottom, var(--color-jade-dim), var(--color-brand-400))',
            }}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
            transition={{ duration: 0.55, ease: EASE, delay: Math.min(index * 0.09, 0.9) }}
          />
        )}
      </span>

      {/* Node marker — the only place on this page where shape carries meaning. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${season.name} — ${visual.label}. Open details.`}
        className="absolute left-[-52px] top-0 grid size-8 place-items-center rounded-full transition-transform duration-300 hover:scale-110 sm:left-[-68px] sm:size-8"
      >
        <NodeMarker isNext={isNext} isWatched={isWatched} status={status} />
      </button>

      {/* Row */}
      <div
        className={cn(
          'grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2 border-b py-5 transition-colors duration-400 sm:grid-cols-[76px_minmax(0,1fr)_auto]',
          isNext ? 'border-ember/25' : 'border-white/[0.06]',
          isWatched ? 'opacity-55 hover:opacity-90' : 'opacity-100',
        )}
      >
        {/* Meta register */}
        <div className="col-span-2 flex items-baseline gap-3 sm:col-span-1 sm:flex-col sm:items-start sm:gap-1.5">
          <span className="numeric text-[10px] tracking-[0.14em] text-veil">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="numeric text-[11px] text-mist">{season.year > 0 ? season.year : '—'}</span>
        </div>

        {/* Title register */}
        <div className="col-span-2 min-w-0 sm:col-span-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <button
              type="button"
              onClick={onOpen}
              className={cn(
                'text-left text-[17px] font-medium tracking-[-0.01em] transition-colors sm:text-[19px]',
                isNext ? 'text-chalk' : isWatched ? 'text-chalk/85' : 'text-chalk/95 hover:text-brand-100',
              )}
            >
              {season.name}
            </button>
            {isNext && (
              <span className="label rounded-full bg-ember/12 px-2.5 py-1 text-[9px] text-ember">
                Watch next
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 numeric text-[11px] text-veil">
            <span className="text-mist">{formatFormat(season.format)}</span>
            <Sep />
            <span>{formatEpisodes(season)}</span>
            {status === 'watching' && season.progress ? (
              <>
                <Sep />
                <span className="text-ember">
                  ep {season.progress}
                  {season.episodes ? ` / ${season.episodes}` : ''}
                </span>
              </>
            ) : null}
            {score && (
              <>
                <Sep />
                <span>scored {score}</span>
              </>
            )}
            {nextEntryStatus === 'upcoming' && (
              <>
                <Sep />
                <span className="text-lilac">not aired</span>
              </>
            )}
          </div>

          {/* In-progress entries get a bar on the map; finished ones don't. */}
          {status === 'watching' && season.episodes ? (
            <div className="mt-3 max-w-xs">
              <StoryBar
                ratio={(season.progress || 0) / season.episodes}
                height={2}
                delay={0.1}
                label={`${season.name} progress`}
              />
            </div>
          ) : null}
        </div>

        {/* Status register */}
        <div className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:flex-col sm:items-end sm:justify-start sm:gap-2">
          <span className="flex items-center gap-2">
            <StatusDot status={status} live={isNext} />
            <span className="label text-[9px]" style={{ color: visual.dim ? 'var(--color-mist)' : visual.color }}>
              {visual.tag}
            </span>
          </span>
          <span
            className={cn(
              'text-[11px] text-veil opacity-0 transition-opacity duration-300 group-hover:opacity-100',
              'hidden sm:block',
            )}
          >
            View
          </span>
        </div>
      </div>
    </li>
  )
}

/** The map's node vocabulary: filled disc, hollow gate, or living frontier. */
function NodeMarker({
  isNext,
  isWatched,
  status,
}: {
  isNext: boolean
  isWatched: boolean
  status: ReturnType<typeof getEntryStatus>
}) {
  if (isNext) {
    return (
      <span className="relative grid size-8 place-items-center">
        <span className="absolute inset-0 animate-halo rounded-full bg-ember/25" />
        <span className="absolute size-5 rounded-full bg-ember/25 blur-[6px]" />
        <span className="relative size-3.5 rounded-full bg-ember shadow-[0_0_16px_2px_rgba(255,180,87,0.65)]" />
      </span>
    )
  }

  if (isWatched) {
    return (
      <span className="grid size-8 place-items-center">
        <span className="grid size-4 place-items-center rounded-full bg-jade/15 ring-1 ring-jade/60">
          <svg viewBox="0 0 12 12" className="size-2.5 text-jade" aria-hidden>
            <path
              d="M2.2 6.4 4.7 8.9 9.8 3.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
    )
  }

  // Not yet reached: an empty gate in the road.
  const colour = status === 'planned' ? 'var(--color-lilac)' : status === 'dropped' ? 'var(--color-coral)' : 'var(--color-veil)'
  return (
    <span className="grid size-8 place-items-center">
      <span
        className="size-3 rounded-full transition-all duration-300 group-hover:scale-125"
        style={{
          border: `1.5px ${status === 'planned' ? 'dashed' : 'solid'} ${colour}`,
          opacity: 0.65,
        }}
      />
    </span>
  )
}

function LegendItem({ colour, label, hollow, live }: { colour: string; label: string; hollow?: boolean; live?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn('size-2.5 rounded-full', live && 'animate-breathe')}
        style={
          hollow
            ? { border: `1.5px solid ${colour}`, opacity: 0.7 }
            : { background: colour, boxShadow: live ? `0 0 10px 1px ${colour}` : undefined }
        }
      />
      <span className="label text-[9px] text-veil">{label}</span>
    </span>
  )
}

function Sep() {
  return <span aria-hidden className="h-2.5 w-px bg-white/12" />
}

/* --------------------------------------------------------------------------
   Entry sheet — poster, synopsis, score, external link.
   -------------------------------------------------------------------------- */

function EntrySheet({
  season,
  tint,
  onClose,
}: {
  season: Season
  tint?: string | null
  onClose: () => void
}) {
  const visual = seasonVisual(season)
  const status = getEntryStatus(season)
  const score = formatScore(season.score)

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[70] bg-ink-950/70 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-label={season.name}
        className="glass rim fixed inset-x-0 bottom-0 z-[71] max-h-[86vh] overflow-y-auto rounded-t-[28px] p-6 sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[440px] sm:rounded-l-[28px] sm:rounded-tr-none sm:p-8"
        initial={{ y: '100%', opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.4 }}
        transition={{ duration: 0.48, ease: EASE }}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <span className="label" style={{ color: visual.color }}>
            {visual.tag}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-full text-mist transition-colors hover:bg-white/[0.06] hover:text-chalk"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex gap-5">
          <Poster
            src={season.posterUrl}
            alt={season.name}
            tint={tint}
            className="rim w-[104px] shrink-0 rounded-2xl sm:w-[124px]"
            sizes="124px"
          />
          <div className="min-w-0">
            <h3 className="text-editorial text-[26px] leading-[1.05] text-chalk">{season.name}</h3>
            <dl className="mt-4 flex flex-col gap-2 numeric text-[11px]">
              <Row label="Released" value={season.year > 0 ? String(season.year) : 'Unknown'} />
              <Row label="Format" value={formatFormat(season.format)} />
              <Row label="Episodes" value={season.episodes > 0 ? String(season.episodes) : 'Unknown'} />
              {score && <Row label="Your score" value={score} />}
              {status === 'watching' && season.progress ? (
                <Row label="Progress" value={`episode ${season.progress}`} />
              ) : null}
            </dl>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3">
          {season.siteUrl && (
            <a
              href={season.siteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-chalk text-[14px] font-semibold text-ink-950 transition-colors hover:bg-white"
            >
              View on AniList
              <ExternalLink className="size-3.5" />
            </a>
          )}
          <Link
            href="#directory"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-full bg-white/[0.06] text-[14px] font-medium text-chalk transition-colors hover:bg-white/[0.12]"
          >
            Jump to entry list
          </Link>
        </div>
      </motion.div>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.06] pb-2">
      <dt className="text-veil">{label}</dt>
      <dd className="text-mist">{value}</dd>
    </div>
  )
}
