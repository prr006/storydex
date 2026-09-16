/* ==========================================================================
   StoryDex — motion
   --------------------------------------------------------------------------
   The whole vocabulary is four lines. The previous system had cinematic
   entrance variants, parallax scroll transforms and an auto-rotating rail;
   all of that is gone, because a collection should be still.

   Rules:
     · Nothing animates on its own. Ever.
     · Entrances are 8–12px and opacity, 240ms, with a 30ms stagger.
     · Hover is colour and a 1.5% scale. No lift, no glow, no border dance.
     · Progress fills once, at 500ms, and then never moves again.
     · `prefers-reduced-motion` is honoured globally in globals.css, and every
       consumer here reads from these constants so there is one place to tune.
   ========================================================================== */

/** The single easing curve. Decelerating, no overshoot. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

/** Durations, in seconds, keyed by intent. */
export const DURATION = {
  /** Colour and border changes. */
  hover: 0.15,
  /** List and card entrances. */
  enter: 0.24,
  /** Overlays, popovers, the sticky bar. */
  overlay: 0.28,
  /** A progress fill, once. */
  progress: 0.5,
} as const

/** Stagger step for lists. Capped at 0.28s so long lists never crawl. */
export const STAGGER = 0.03
export const MAX_STAGGER_DELAY = 0.28

/** Shared entrance: 8px rise and a fade. Used by rows, cards and chapters. */
export const ENTER = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
} as const

export function staggerDelay(index: number, step = STAGGER): number {
  return Math.min(index * step, MAX_STAGGER_DELAY)
}
