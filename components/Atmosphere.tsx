'use client'

import { cn } from '@/lib/utils'
import { accentVars } from '@/lib/design'

/* ==========================================================================
   Atmosphere
   --------------------------------------------------------------------------
   "This story has its own air."

   Every large surface in StoryDex is lit by the story it belongs to. The colour
   is not invented: it is mixed from the story's own AniList artwork
   (`coverImage.color`) through the `--air-*` variables that `accentVars()`
   derives, so a Bleach page is cooler and a One Piece page warmer without
   anybody hand-picking a hex value per title.

   Three rules keep it from becoming decoration:

   · It never intercepts the pointer (`pointer-events: none`).
   · It is always behind content, and always fades back into the canvas, so text
     contrast is set by the ground and not by the wash.
   · It drifts over 42 seconds. If you notice it moving, it is too strong.

   `tone="neutral"` gives the same treatment in StoryDex indigo, for pages that
   belong to the product rather than to a particular story.
   ========================================================================== */

export function Atmosphere({
  story,
  className,
  tone = 'story',
  intensity = 'default',
}: {
  /** Anything with an `accentColor` (or an id to derive one from). */
  story?: { id: string; accentColor?: string | null } | null
  className?: string
  tone?: 'story' | 'neutral'
  intensity?: 'default' | 'strong' | 'faint'
}) {
  return (
    <div
      aria-hidden
      className={cn('story-air', className)}
      style={{
        ...(tone === 'story' && story ? accentVars(story) : undefined),
        opacity: intensity === 'strong' ? 1.15 : intensity === 'faint' ? 0.55 : 0.9,
      }}
    />
  )
}

/**
 * A single artwork bleeding into the page as atmosphere.
 *
 * Used where a story's key visual should set the mood without being *the*
 * subject — the top of a library, the sidebar of a collection page. It is a
 * real AniList URL or nothing at all: never a generated image, and it is masked
 * so it always dissolves into the canvas rather than sitting in a rectangle.
 */
export function ArtworkAura({
  src,
  className,
  position = 'top-left',
  opacity = 0.3,
}: {
  src?: string | null
  className?: string
  position?: 'top-left' | 'top-right' | 'bottom-right'
  opacity?: number
}) {
  if (!src || !/^https?:\/\//i.test(src)) return null

  const placement = {
    'top-left': 'left-[-14%] top-[-24%] h-[70%] w-[62%]',
    'top-right': 'right-[-16%] top-[-22%] h-[74%] w-[58%]',
    'bottom-right': 'right-[-10%] bottom-[-30%] h-[70%] w-[56%]',
  }[position]

  return (
    <span
      aria-hidden
      className={cn('pointer-events-none absolute overflow-hidden', placement, className)}
      style={{ opacity }}
    >
      <span
        className="block h-full w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${src})`, filter: 'saturate(115%)' }}
      />
      <span className="absolute inset-0 bg-gradient-to-b from-transparent to-canvas" />
    </span>
  )
}

/**
 * The vignette that closes a page's edges.
 * Sits above artwork and below content; it is what makes a dark interface feel
 * lit from the middle rather than flat.
 */
export function Vignette({ className, strength = 'default' }: { className?: string; strength?: 'default' | 'strong' }) {
  return (
    <span
      aria-hidden
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        background:
          strength === 'strong'
            ? 'radial-gradient(120% 90% at 50% 0%, transparent 20%, rgba(3,4,7,0.86) 78%)'
            : 'radial-gradient(130% 100% at 50% 10%, transparent 35%, rgba(3,4,7,0.6) 92%)',
      }}
    />
  )
}
