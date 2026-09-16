'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { entryRatio, getEntryStatus, type EntryStatus } from '@/lib/design'
import type { Season } from '@/lib/franchise'

/* ==========================================================================
   THE PATH — StoryDex's signature
   --------------------------------------------------------------------------
   A story is not a list of episodes and it is not a percentage. It is a route:
   one node per entry, walked in order, with you standing somewhere on it.

   Every progress indicator in the product is this one object at a different
   scale — the same visual grammar from a 6px spark in a library row to the
   full journey on a story page:

     walk    nodes          the farthest node you have reached is lit
     current node           a *ring* that fills with that entry's own episode
                            progress, so "9 of 14 episodes" is visible as a
                            circle rather than written as a number
     ahead   nodes          hollow, dim, optionally dashed between
     stopped node           a red bar, breaking the route on purpose

   Because the nodes are entries and not episodes, the path is honest at any
   scale: a 366-episode season is one node, and so is a 1-episode special.
   ========================================================================== */

type Size = 'spark' | 'rail' | 'journey'

const SIZES: Record<
  Size,
  { node: number; stroke: number; gap: string; line: number; ring: number }
> = {
  spark: { node: 6, stroke: 2, gap: 'gap-1.5', line: 1, ring: 14 },
  rail: { node: 11, stroke: 2.5, gap: 'gap-2.5', line: 2, ring: 20 },
  journey: { node: 22, stroke: 3, gap: 'gap-4', line: 2, ring: 38 },
}

interface PathProps {
  entries: Season[]
  size?: Size
  className?: string
  /** Animate the walk-in. Off for repeated renders inside long lists. */
  animate?: boolean
  /** Dashed connectors after the current position, so the future reads unwalked. */
  dashedAhead?: boolean
  /** Accessible description. */
  label?: string
  onSelect?: (entry: Season, index: number) => void
}

export function StoryPath({
  entries,
  size = 'rail',
  className,
  animate = false,
  dashedAhead = true,
  label,
  onSelect,
}: PathProps) {
  if (entries.length === 0) return null

  const dims = SIZES[size]
  const statuses = entries.map((entry) => getEntryStatus(entry))
  const currentIndex = statuses.indexOf('watching')
  const lastWalked = statuses.reduce(
    (last, status, index) => (status === 'watched' ? index : last),
    -1,
  )
  const frontier = currentIndex >= 0 ? currentIndex : lastWalked
  const watched = statuses.filter((status) => status === 'watched').length

  return (
    <div
      className={cn('flex w-full items-center', dims.gap, className)}
      role="img"
      aria-label={label ?? `${watched} of ${entries.length} entries completed`}
    >
      {entries.map((entry, index) => {
        const status = statuses[index]
        const isCurrent = index === currentIndex
        const isFuture = frontier >= 0 && index > frontier
        const ratio = entryRatio(entry)

        const node = (
          <PathNode
            status={status}
            size={dims}
            ratio={ratio}
            isCurrent={isCurrent}
            isFuture={isFuture}
            animate={animate}
            index={index}
            title={entry.name}
            onSelect={onSelect ? () => onSelect(entry, index) : undefined}
          />
        )

        // The connector after this node: lit when the walk reaches past it.
        const connector =
          index < entries.length - 1 ? (
            <PathSegment
              lit={index < frontier || (isCurrent && ratio >= 1)}
              dashed={dashedAhead && (index >= frontier || (isCurrent && ratio < 1))}
              height={dims.line}
              animate={animate}
              index={index}
            />
          ) : null

        return (
          <span key={entry.id ?? index} className="contents">
            {node}
            {connector}
          </span>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function PathNode({
  status,
  size,
  ratio,
  isCurrent,
  isFuture,
  animate,
  index,
  title,
  onSelect,
}: {
  status: EntryStatus
  size: { node: number; stroke: number; ring: number }
  ratio: number
  isCurrent: boolean
  isFuture: boolean
  animate: boolean
  index: number
  title: string
  onSelect?: () => void
}) {
  const done = status === 'watched'
  const stopped = status === 'dropped'
  const planned = status === 'planned'
  const upcoming = status === 'upcoming'

  const fill = done
    ? 'var(--state-done)'
    : isCurrent
      ? 'var(--accent)'
      : 'transparent'

  const edge = done
    ? 'var(--state-done)'
    : isCurrent
      ? 'var(--accent)'
      : stopped
        ? 'var(--state-stopped)'
        : planned
          ? 'var(--state-planned)'
          : upcoming
            ? 'var(--state-upcoming)'
            : 'var(--line-strong)'

  const wrapper = (
    <span
      className="relative grid shrink-0 place-items-center"
      style={{ width: size.ring, height: size.ring }}
      title={title}
    >
      {/* The halo on the node you are standing on — the only "live" mark. */}
      {isCurrent && (
        <span
          aria-hidden
          className={cn('absolute rounded-full', animate && 'node-halo')}
          style={{
            width: size.node + 8,
            height: size.node + 8,
            background: 'color-mix(in oklab, var(--accent) 26%, transparent)',
          }}
        />
      )}

      {/* An entry with episode progress inside the current node: the node IS
          the progress ring. */}
      {isCurrent && size.node >= 11 ? (
        <NodeRing size={size} ratio={ratio} animate={animate} />
      ) : stopped ? (
        <span
          className="rounded-full"
          style={{ width: size.node + 6, height: Math.max(3, size.stroke), background: 'var(--state-stopped)' }}
        />
      ) : (
        <span
          className="rounded-full transition-colors"
          style={{
            width: size.node,
            height: size.node,
            background: fill,
            boxShadow: done ? 'none' : `inset 0 0 0 ${size.stroke}px ${edge}`,
            opacity: isFuture ? 0.75 : 1,
          }}
        />
      )}
    </span>
  )

  if (!onSelect) {
    return animate ? (
      <motion.span
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.05 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="contents"
      >
        {wrapper}
      </motion.span>
    ) : (
      wrapper
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={title}
      className="shrink-0 rounded-full transition-transform duration-200 hover:scale-110"
    >
      {wrapper}
    </button>
  )
}

/** The ring that fills with the current entry's episode progress. */
function NodeRing({
  size,
  ratio,
  animate,
}: {
  size: { node: number; stroke: number; ring: number }
  ratio: number
  animate: boolean
}) {
  const r = (size.node - size.stroke) / 2
  const c = 2 * Math.PI * r
  const dimension = size.node

  return (
    <span className="relative grid place-items-center" style={{ width: dimension, height: dimension }}>
      <svg width={dimension} height={dimension} className="-rotate-90" aria-hidden>
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={r}
          fill="var(--surface-3)"
          stroke="var(--accent)"
          strokeWidth={size.stroke}
          opacity={0.35}
        />
        <motion.circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={size.stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          {...(animate
            ? { initial: { strokeDashoffset: c }, animate: { strokeDashoffset: c * (1 - ratio) } }
            : { strokeDashoffset: c * (1 - ratio) })}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span
        className="absolute rounded-full"
        style={{ width: size.stroke + 2, height: size.stroke + 2, background: 'var(--accent)' }}
      />
    </span>
  )
}

function PathSegment({
  lit,
  dashed,
  height,
  animate,
  index,
}: {
  lit: boolean
  dashed: boolean
  height: number
  animate: boolean
  index: number
}) {
  const base = (
    <span
      className={cn('min-w-2 flex-1 rounded-full', dashed && !lit && 'unwalked')}
      style={{
        height: lit ? height : Math.max(1, height - 0.5),
        background: lit ? 'var(--accent)' : undefined,
        boxShadow: lit ? '0 0 8px color-mix(in oklab, var(--accent) 45%, transparent)' : undefined,
      }}
    />
  )

  if (!animate) return base

  return (
    <motion.span
      className={cn('min-w-2 flex-1 rounded-full', dashed && !lit && 'unwalked')}
      style={{
        height: lit ? height : Math.max(1, height - 0.5),
        background: lit ? 'var(--accent)' : undefined,
        boxShadow: lit ? '0 0 8px color-mix(in oklab, var(--accent) 45%, transparent)' : undefined,
        transformOrigin: 'left',
      }}
      initial={{ opacity: 0, scaleX: 0.2 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.4, delay: 0.05 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* A single "you are here" marker, for panels that name the current entry.     */
/* -------------------------------------------------------------------------- */

export function HereMarker({ className, label = 'You are here' }: { className?: string; label?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-small font-semibold', className)} style={{ color: 'var(--accent-strong)' }}>
      <span className="relative grid size-3 place-items-center">
        <span
          className="absolute inset-0 rounded-full"
          style={{ background: 'color-mix(in oklab, var(--accent) 30%, transparent)' }}
          aria-hidden
        />
        <span className="size-1.5 rounded-full" style={{ background: 'var(--accent)' }} aria-hidden />
      </span>
      {label}
    </span>
  )
}
