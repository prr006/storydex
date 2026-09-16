'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  accentVars,
  getStoryPhase,
  getStoryProgress,
  phaseToStatus,
  storyArtwork,
} from '@/lib/design'
import type { Franchise } from '@/lib/franchise'
import { StatusChip } from '@/components/StatusMark'
import { EASE } from '@/lib/motion'

/* ==========================================================================
   SpineShelf — finished stories, as books on a shelf
   --------------------------------------------------------------------------
   Once a story is done, its poster no longer tells you anything: you already
   know what it looks like, and there is no progress left to see. So finished
   stories stop being images and become *spines* — thin, upright, pressed
   together, pullable. The shelf gets denser as the collection grows, which is
   exactly the reward a completed story should give you.

   The spine carries the artwork as a vertical crop, the story name set
   upright, and a thin lit strip at the foot showing how much of it is walked.
   Hovering pulls a spine a few pixels out of the row, the way a real one moves
   when you hook a finger over it.

   Keyboard and screen readers get a plain list of links; only the appearance
   is a shelf.
   ========================================================================== */

export function SpineShelf({ stories }: { stories: Franchise[] }) {
  if (stories.length === 0) return null

  return (
    <ul className="flex flex-wrap items-end gap-1.5 sm:gap-2">
      {stories.map((franchise, index) => (
        <Spine key={franchise.id} franchise={franchise} index={index} />
      ))}
    </ul>
  )
}

function Spine({ franchise, index }: { franchise: Franchise; index: number }) {
  const art = storyArtwork(franchise)
  const progress = getStoryProgress(franchise)
  const phase = getStoryPhase(franchise)
  const thick = spineWidth(franchise)

  return (
    <motion.li
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.4), ease: EASE }}
      style={{ ...accentVars(franchise), width: thick }}
      className="group/spine"
    >
      <Link
        href={`/franchise/${franchise.id}`}
        className={cn(
          'relative block h-[248px] overflow-hidden rounded-xs border border-line bg-surface transition-transform duration-300 ease-out',
          'group-hover/spine:-translate-y-2 group-hover/spine:border-white/20 group-hover/spine:card-shadow',
        )}
        title={`${franchise.name} — ${progress.completed}/${progress.total} entries`}
      >
        {art ? (
          <span
            aria-hidden
            className="absolute inset-0 block bg-cover opacity-70 transition-opacity duration-300 group-hover/spine:opacity-100"
            style={{ backgroundImage: `url(${art.src})`, backgroundPosition: 'center 30%' }}
          />
        ) : null}
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.34) 45%, rgba(0,0,0,0.72) 100%)',
          }}
        />

        {/* Name, set upright like a title on a spine. */}
        <span
          className="absolute inset-x-0 top-3 bottom-8 flex justify-center overflow-hidden"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          <span className="clamp-2 text-center text-[0.6875rem] font-semibold leading-tight text-white/90 [text-orientation:mixed]">
            {franchise.name}
          </span>
        </span>

        {/* How much of it is walked: a lit strip at the foot of the spine. */}
        <span aria-hidden className="absolute inset-x-1.5 bottom-3 h-[3px] overflow-hidden rounded-full bg-white/15">
          <span
            className="block h-full rounded-full"
            style={{
              background: phase === 'complete' ? 'var(--state-done)' : 'var(--accent)',
              width: `${Math.round(progress.ratio * 100)}%`,
            }}
          />
        </span>
      </Link>

      {/* The metadata lives outside the spine so it never fights the artwork. */}
      <div className="mt-2 hidden sm:block">
        <StatusChip status={phaseToStatus(phase)} size="xs" />
      </div>
    </motion.li>
  )
}

/**
 * Shelf width is derived from the story's real size — a 12-entry saga is
 * physically thicker than a one-film story. The range is deliberately narrow
 * so the shelf stays a shelf and not a bar chart.
 */
function spineWidth(franchise: Franchise): number {
  const entries = franchise.seasons.length
  const base = 42
  const growth = Math.min(entries, 24) * 1.6
  return Math.round(base + growth)
}
