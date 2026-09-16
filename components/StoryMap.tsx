'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowUpRight, Play } from 'lucide-react'
import { Cover, FormatMark } from '@/components/Cover'
import { Atmosphere } from '@/components/Atmosphere'
import { StatusChip } from '@/components/StatusMark'
import { cn } from '@/lib/utils'
import {
  accentVars,
  entryRatio,
  episodeLabel,
  formatEpisodes,
  formatFormat,
  getEntryStatus,
  getStoryProgress,
  isUpcoming,
} from '@/lib/design'
import { EASE } from '@/lib/motion'
import type { Franchise, Season } from '@/lib/franchise'

/* ==========================================================================
   THE JOURNEY — StoryDex's signature view
   --------------------------------------------------------------------------
   A story is a route through time, so this is drawn as one: a single spine with
   a milestone for every entry, walked left to right in watch order.

   Five devices do the work, and none of them is a card in a grid:

   1  THE SPINE      one continuous hairline. Behind you it is lit in the
                     story's own colour and glows faintly; ahead of you it is
                     dashed and dark. The light *stops where you stopped* —
                     which is a more honest picture of progress than a bar,
                     because the gaps between nodes are years, not percentages.

   2  THE ERAS       each year gets a numeral set at poster scale, dim enough to
                     read as architecture rather than text. A story that ran for
                     18 years *looks* like it ran for 18 years.

   3  THE STAGGER    milestones alternate above and below the spine, so the eye
                     travels rather than scanning a row. The one you are on
                     breaks the rhythm and sits centred — it is the only card on
                     the spine, which is how "you are here" reads instantly.

   4  THE ROUTE      a compressed index of the whole journey in one line, at the
                     top. Every node is a button; press one and the map travels
                     there. On a 20-entry franchise this is the difference
                     between a map and a scroll marathon.

   5  THE GAPS       between two eras, the spine widens and a small marker names
                     the interval — "18 years later". Time passing is part of the
                     story, so it is part of the drawing.
   ========================================================================== */

const ABOVE = -1
const BELOW = 1

export function StoryMap({ franchise }: { franchise: Franchise }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const progress = getStoryProgress(franchise)
  const currentIndex = franchise.seasons.findIndex((entry) => getEntryStatus(entry) === 'watching')
  const walkedTo = currentIndex >= 0 ? currentIndex : progress.completed - 1
  const yearGroups = useMemo(() => groupYears(franchise.seasons), [franchise.seasons])

  // The spine's light grows as the map itself is scrolled into view: you are
  // moving through the story, so the story lights up as you move.
  const { scrollXProgress } = useScroll({ container: scrollerRef })
  const fill = useSpring(scrollXProgress, { stiffness: 90, damping: 26, mass: 0.4 })
  const litWidth = useTransform(fill, [0, 1], ['0%', '100%'])

  const travelTo = useCallback((index: number) => {
    const node = scrollerRef.current?.querySelector(`[data-milestone="${index}"]`)
    node?.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', inline: 'center', block: 'nearest' })
  }, [prefersReduced])

  const entries = franchise.seasons

  return (
    <section style={accentVars(franchise)} className="relative">
      {/* ── The route: the whole journey, compressed to one line ────────── */}
      <div className="relative overflow-hidden rounded-md border border-line bg-surface/60 px-4 py-4">
        <Atmosphere story={franchise} intensity="faint" className="opacity-70" />

        <div className="relative flex flex-wrap items-center gap-x-5 gap-y-3">
          <p className="eyebrow shrink-0">The route</p>

          <div className="rail flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
            {entries.map((entry, index) => {
              const status = getEntryStatus(entry)
              const isNow = index === currentIndex
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => travelTo(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(null)}
                  aria-label={`${entry.name} — ${formatFormat(entry.format)}${
                    entry.year > 0 ? `, ${entry.year}` : ''
                  }`}
                  className="group/stop relative shrink-0 py-2"
                >
                  <span
                    className={cn('block rounded-full transition-all duration-300', isNow ? 'h-2 w-7' : 'size-2')}
                    style={{
                      background: isNow
                        ? 'var(--accent)'
                        : status === 'watched'
                          ? 'var(--state-done)'
                          : status === 'upcoming'
                            ? 'color-mix(in oklab, var(--state-upcoming) 70%, transparent)'
                            : 'var(--line-strong)',
                      boxShadow: isNow ? '0 0 0 4px color-mix(in oklab, var(--accent) 20%, transparent)' : undefined,
                    }}
                  />
                </button>
              )
            })}
          </div>

          <p className="num shrink-0 text-small text-ink-3">
            {progress.completed}/{progress.total} entries · {Math.round(progress.ratio * 100)}%
          </p>
        </div>

        {/* Hovering the route names the stop, so the compressed view is usable
            without leaving the line. */}
        <div className="relative mt-2 h-5">
          <AnimatePresence>
            {activeIndex !== null && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-x-0 truncate text-small text-ink-2"
              >
                {entries[activeIndex]?.name}
                <span className="num text-ink-3">
                  {' '}
                  · {formatFormat(entries[activeIndex]?.format)}
                  {entries[activeIndex]?.year ? ` · ${entries[activeIndex].year}` : ''}
                </span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── The map ─────────────────────────────────────────────────────── */}
      <div className="relative mt-8">
        <div
          ref={scrollerRef}
          className="rail relative overflow-x-auto pb-6"
          style={{ scrollSnapType: prefersReduced ? undefined : 'x proximity' }}
        >
          {/* The spine, running the full width of the journey. */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2">
            <div className="unwalked h-px w-full opacity-70" />
            <motion.div
              className="absolute inset-y-0 left-0 h-px"
              style={{
                width: litWidth,
                background:
                  'linear-gradient(to right, color-mix(in oklab, var(--accent) 35%, transparent) 0%, var(--accent) 76%, var(--accent-strong) 100%)',
                boxShadow: '0 0 14px color-mix(in oklab, var(--accent) 45%, transparent)',
                opacity: prefersReduced ? 1 : 1,
              }}
            />
          </div>

          <ol className="relative flex min-w-max items-center gap-0 px-4 pt-2">
            {yearGroups.map((group, groupIndex) => (
              <li key={group.year ?? `undated-${groupIndex}`} className="flex items-center">
                {/* Era marker */}
                <div className="relative flex w-[9.5rem] shrink-0 flex-col justify-center sm:w-[12rem] lg:w-[15rem]">
                  <span className="text-era font-bold leading-none text-white/[0.14]">
                    {group.year ?? '—'}
                  </span>
                  {group.gap ? (
                    <span className="mt-2 text-small text-ink-3">{group.gap}</span>
                  ) : (
                    <span className="mt-2 text-small text-ink-3">
                      {group.items.length} {group.items.length === 1 ? 'entry' : 'entries'}
                    </span>
                  )}
                </div>

                {/* Milestones */}
                {group.items.map((entry, positionInGroup) => {
                  const absoluteIndex = entries.indexOf(entry)
                  const above = absoluteIndex % 2 === 0
                  const isNow = absoluteIndex === currentIndex

                  return (
                    <Milestone
                      key={entry.id}
                      entry={entry}
                      index={absoluteIndex}
                      above={above}
                      isNow={isNow}
                      isPast={absoluteIndex <= walkedTo}
                      positionInGroup={positionInGroup}
                    />
                  )
                })}
              </li>
            ))}

            {/* The end of the route: a terminal marker, not an empty column. */}
            <li aria-hidden className="w-[6rem] shrink-0 pl-4 text-small text-ink-3">
              {progress.complete ? 'End' : '…'}
            </li>
          </ol>
        </div>

        <p className="mt-1 text-small text-ink-3">
          Drag or scroll the map sideways — {entries.length} entries{' '}
          {yearGroups.length > 1 ? `across ${yearGroups.length} eras` : ''}
          {currentIndex >= 0 && `, you are on entry ${currentIndex + 1}`}.
        </p>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */

function Milestone({
  entry,
  index,
  above,
  isNow,
  isPast,
  positionInGroup,
}: {
  entry: Season
  index: number
  above: boolean
  isNow: boolean
  isPast: boolean
  positionInGroup: number
}) {
  const status = getEntryStatus(entry)
  const ratio = entryRatio(entry)
  const nodeSize = isNow ? 26 : isPast && status === 'watched' ? 13 : 11
  const offset = isNow ? 0 : above ? ABOVE : BELOW
  const upcoming = isUpcoming(entry)

  return (
    <li
      data-milestone={index}
      className={cn('relative shrink-0 snap-center', isNow ? 'w-[22rem] sm:w-[26rem]' : 'w-[15.5rem] sm:w-[17.5rem]')}
      style={{ paddingLeft: positionInGroup === 0 ? 0 : '0.75rem' }}
    >
      <motion.div
        initial={{ opacity: 0, y: offset * 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: Math.min(index * 0.03, 0.3), ease: EASE }}
        className="relative flex h-[26rem] flex-col"
      >
        {/* The half of the map above the spine flips, so a milestone always
            grows *away* from the line it hangs from. */}
        <div
          className={cn('flex flex-1 flex-col', above ? 'flex-col-reverse' : 'flex-col')}
          style={{ transform: `translateY(${offset * 0.5}rem)` }}
        >
          {/* Node + connector */}
          <div className={cn('relative flex', above ? 'items-start' : 'items-end')}>
            <span
              className={cn(
                'absolute left-6 -translate-x-1/2',
                above ? 'bottom-0' : 'top-0',
              )}
              aria-hidden
              style={{
                height: `${Math.abs(offset) * 1.6}rem`,
                width: 1,
                background: isPast
                  ? 'color-mix(in oklab, var(--accent) 60%, transparent)'
                  : 'var(--line-strong)',
              }}
            />
          </div>

          <MilestoneCard entry={entry} index={index} isNow={isNow} ratio={ratio} />

          {/* Node, pinned to the spine */}
          <div className={cn('relative flex h-0 items-center', above ? 'justify-start' : 'justify-start')}>
            <span
              className="absolute left-6 grid -translate-x-1/2 place-items-center rounded-full"
              style={{
                width: nodeSize,
                height: nodeSize,
                background: isNow
                  ? 'var(--accent)'
                  : status === 'watched'
                    ? 'var(--state-done)'
                    : 'var(--canvas)',
                boxShadow: isNow
                  ? '0 0 0 6px color-mix(in oklab, var(--accent) 22%, transparent)'
                  : status === 'watched'
                    ? 'none'
                    : `inset 0 0 0 2px ${
                        status === 'upcoming' ? 'var(--state-upcoming)' : 'var(--line-strong)'
                      }`,
                zIndex: 5,
              }}
              aria-hidden
            >
              {isNow && <span className="size-2 rounded-full bg-white/90" />}
              {!isNow && status === 'watched' && (
                <svg viewBox="0 0 10 10" className="size-2 text-[#04120c]" aria-hidden>
                  <path
                    d="M1.5 5.4 4 7.8l4.5-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          </div>
        </div>

        {/* The current milestone gets a spoken position, under the spine. */}
        {isNow && (
          <div className="absolute inset-x-0 top-[52%] pl-12">
            <p className="flex items-center gap-2 text-small font-semibold" style={{ color: 'var(--accent-strong)' }}>
              You are here — {episodeLabel(entry)}
            </p>
          </div>
        )}
      </motion.div>
    </li>
  )
}

function MilestoneCard({
  entry,
  index,
  isNow,
  ratio,
}: {
  entry: Season
  index: number
  isNow: boolean
  ratio: number
}) {
  const status = getEntryStatus(entry)
  const upcoming = isUpcoming(entry)
  const percent = Math.round(ratio * 100)

  return (
    <motion.a
      href={entry.siteUrl ?? `https://anilist.co/anime/${entry.aniListId ?? ''}`}
      target="_blank"
      rel="noreferrer"
      initial={false}
      className={cn(
        'group/mile relative block overflow-hidden rounded-md border transition-all duration-500 ease-out',
        isNow
          ? 'border-[var(--accent)]/55 bg-surface-2 hover:-translate-y-1 hover:card-shadow'
          : 'border-line bg-surface hover:-translate-y-1 hover:border-white/15 hover:card-shadow',
      )}
      style={{ marginLeft: '1.5rem', boxShadow: isNow ? '0 0 0 1px color-mix(in oklab, var(--accent) 30%, transparent)' : undefined }}
    >
      <span className={cn('relative block overflow-hidden', isNow ? 'aspect-[16/10]' : 'aspect-[16/11]')}>
        <span
          className={cn(
            'absolute inset-0 block bg-cover transition-all duration-[900ms] ease-out group-hover/mile:scale-[1.05]',
            upcoming ? 'opacity-45 saturate-50' : 'opacity-100',
          )}
          style={{
            backgroundImage: entry.posterUrl ? `url(${entry.posterUrl})` : undefined,
            backgroundPosition: 'center 24%',
          }}
          aria-hidden
        />
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(5,6,9,0.94) 0%, rgba(5,6,9,0.55) 42%, rgba(5,6,9,0.02) 82%)',
          }}
        />

        <span className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <FormatMark format={entry.format} />
          <StatusChip status={status} size="xs" />
        </span>

        <span className="absolute inset-x-3 bottom-3 block">
          <span className="clamp-2 block text-small font-semibold leading-snug text-white">
            {entry.name}
          </span>
          <span className="num mt-1 block text-[0.6875rem] text-white/65">
            {upcoming
              ? 'Not aired'
              : entry.episodes <= 1
                ? status === 'watched'
                  ? 'Watched'
                  : 'Not watched'
                : `${episodeLabel(entry)} · ${formatEpisodes(entry)}`}
          </span>

          {/* Episode progress inside the milestone, as a filled rail. */}
          <span className="mt-2 flex items-center gap-2">
            <span className="block h-1 flex-1 overflow-hidden rounded-full bg-white/15">
              <motion.span
                className="block h-full rounded-full"
                style={{ background: 'var(--accent)' }}
                initial={{ width: 0 }}
                whileInView={{ width: `${percent}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE }}
              />
            </span>
            <span className="num shrink-0 text-[0.6875rem] font-semibold text-white/85">{percent}%</span>
          </span>
        </span>
      </span>

      {/* The current milestone is the only one that carries an action. */}
      {isNow && (
        <span className="flex items-center justify-between gap-3 border-t border-line px-3 py-2.5">
          <span className="text-small text-ink-2">
            {upcoming ? 'Nothing to resume yet' : `Episode ${entry.progress ?? 0} ready`}
          </span>
          <span className="inline-flex items-center gap-1.5 text-small font-semibold" style={{ color: 'var(--accent-strong)' }}>
            Resume
            <Play className="size-3 fill-current" aria-hidden />
          </span>
        </span>
      )}

      {!isNow && (
        <span className="pointer-events-none absolute right-2.5 top-2.5 opacity-0 transition-opacity duration-300 group-hover/mile:opacity-100">
          <ArrowUpRight className="size-3.5 text-white/70" aria-hidden />
        </span>
      )}
    </motion.a>
  )
}

/* -------------------------------------------------------------------------- */

interface YearGroup {
  year: number | null
  items: Season[]
  /** How long passed before this era, e.g. "18 years later". */
  gap?: string
}

/**
 * Groups entries into eras by year, and measures the silence between them.
 * The gap is the point: a franchise that stopped in 2004 and returned in 2022
 * is telling a different story from one that never paused.
 */
function groupYears(entries: Season[]): YearGroup[] {
  const map = new Map<number | null, Season[]>()
  for (const entry of entries) {
    const year = entry.year > 0 ? entry.year : null
    const bucket = map.get(year)
    if (bucket) bucket.push(entry)
    else map.set(year, [entry])
  }

  const groups: YearGroup[] = [...map.entries()]
    .map(([year, items]) => ({ year, items }))
    .sort((a, b) => {
      if (a.year === null) return 1
      if (b.year === null) return -1
      return a.year - b.year
    })

  return groups.map((group, index) => {
    const previous = groups[index - 1]
    if (!previous || previous.year === null || group.year === null) return group
    const years = group.year - previous.year
    if (years < 2) return group
    return { ...group, gap: `${years} years later` }
  })
}
