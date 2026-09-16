'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Cover } from '@/components/Cover'
import { CompositionStrip } from '@/components/EntryRuler'
import { StatusMark } from '@/components/StatusMark'
import { statusTokenFor } from '@/components/StoryCard'
import { getEpisodeTotal, getStoryPhase, getStoryProgress, phaseCopy, type StoryPhase } from '@/lib/design'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   CollectionSection — /franchises
   --------------------------------------------------------------------------
   The compliment to Library. Library answers "find it"; this answers
   "what shape is this story?".

   So the emphasis is inverted: the CompositionStrip leads, and the cover is
   small. A single TV season and a fourteen-entry saga with films and OVAs
   should be distinguishable at a glance without reading a word — that one
   line of marks is the whole point of the page.
   ========================================================================== */

const GROUP_ORDER: { phase: StoryPhase; title: string; lead: string }[] = [
  {
    phase: 'watching',
    title: 'In progress',
    lead: 'Stories you are somewhere inside right now.',
  },
  {
    phase: 'caught-up',
    title: 'Caught up',
    lead: 'You have watched everything that exists. More is coming — you are not behind.',
  },
  { phase: 'complete', title: 'Finished', lead: 'Every entry, start to end.' },
  {
    phase: 'backlog',
    title: 'Not started',
    lead: 'On your list, nothing watched yet.',
  },
  { phase: 'planned', title: 'Planned', lead: 'Marked as planned on AniList.' },
  { phase: 'paused', title: 'Paused', lead: 'Started, then set down.' },
  { phase: 'dropped', title: 'Stopped', lead: 'Walked away from. Kept, not suggested.' },
]

export function CollectionSection({ franchises }: { franchises: Franchise[] }) {
  const groups = GROUP_ORDER.map((group) => ({
    ...group,
    items: franchises.filter((franchise) => getStoryPhase(franchise) === group.phase),
  })).filter((group) => group.items.length > 0)

  if (groups.length === 0) return null

  return (
    <div className="mt-10 space-y-20">
      {groups.map((group) => (
        <section key={group.phase} className="section-rule pt-10">
          <header className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
            <div className="flex items-baseline gap-4">
              <h2 className="text-head font-semibold text-ink">{group.title}</h2>
              <span className="num text-small text-ink-3">{group.items.length}</span>
            </div>
            <p className="reading max-w-[52ch] text-ink-2">{group.lead}</p>
          </header>

          <ul className="mt-8 border-t border-rule">
            {group.items.map((franchise, index) => (
              <CollectionRow
                key={franchise.id}
                franchise={franchise}
                index={index}
                showStatus={false}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/** One story, as a shape. Used by the collections page and the home summary. */
export function CollectionRow({
  franchise,
  index = 0,
  showStatus = true,
}: {
  franchise: Franchise
  index?: number
  showStatus?: boolean
}) {
  const progress = getStoryProgress(franchise)
  const phase = getStoryPhase(franchise)
  const meta = phaseCopy(phase)
  const episodes = getEpisodeTotal(franchise)

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.02, 0.2), ease: [0.22, 1, 0.36, 1] }}
      className="border-b border-rule"
    >
      <Link
        href={`/franchise/${franchise.id}`}
        className="group/col flex items-center gap-4 py-4 transition-colors duration-150 hover:bg-sunk/40 sm:gap-6"
      >
        <Cover
          src={franchise.posterUrl}
          alt=""
          tint={franchise.accentColor}
          ratio="2/3"
          rounded={false}
          sizes="44px"
          className="w-11 shrink-0"
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[1.0625rem] font-semibold tracking-[-0.012em] text-ink">
            {franchise.name}
          </h3>
          <p className="mt-1 truncate text-small text-ink-3">
            {franchise.genres.slice(0, 3).join(' · ') || 'No genres listed'}
          </p>
        </div>

        {/* The shape of the story — the reason this page exists. */}
        <div className="hidden w-[180px] shrink-0 md:block">
          <CompositionStrip entries={franchise.seasons} />
        </div>

        <span className="num hidden w-32 shrink-0 text-small text-ink-2 lg:block">
          {franchise.seasons.length} {franchise.seasons.length === 1 ? 'entry' : 'entries'} ·{' '}
          {episodes.toLocaleString('en-US')} ep
        </span>

        <span className="num w-14 shrink-0 text-right text-body text-ink">
          {progress.completed}
          <span className="text-ink-3">/{progress.total}</span>
        </span>

        {showStatus && (
          <span className="hidden w-28 shrink-0 sm:block">
            <StatusMark status={statusTokenFor(phase)} label={meta.label} />
          </span>
        )}
      </Link>
    </motion.li>
  )
}
