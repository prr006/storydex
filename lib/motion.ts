import type { Transition, Variants } from 'framer-motion'

/* ==========================================================================
   StoryDex — motion language
   --------------------------------------------------------------------------
   Four rules keep motion feeling cinematic instead of busy:

     1. ONE easing family. Everything decelerates on the same curve
        (expo-out), so the whole product feels like it was choreographed.
     2. Distance is small (8–16px). Premium motion is restraint, not travel.
     3. Stagger is ~55ms. Enough to read as a cascade, never a slideshow.
     4. Motion only ever answers a question: "where did this come from?",
        "is this interactive?", "what changed?".
   ========================================================================== */

export const EASE = [0.16, 1, 0.3, 1] as const
export const EASE_SOFT = [0.22, 1, 0.36, 1] as const

export const DUR = {
  fast: 0.18,
  base: 0.34,
  slow: 0.62,
  cinematic: 1.1,
} as const

export const spring: Transition = { type: 'spring', stiffness: 320, damping: 30, mass: 0.7 }
export const springSoft: Transition = { type: 'spring', stiffness: 180, damping: 26 }

/** Section-level entrance: used for anything that isn't in the first viewport. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } },
}

/** Container that cascades its children. */
export const cascade: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DUR.slow, ease: EASE } },
}

/** Cards: a small rise so a grid assembles itself rather than appearing. */
export const cardIn: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: EASE },
  },
}

/** Hero artwork settling in — a very slight scale-down reads as "focus pull". */
export const heroArt: Variants = {
  hidden: { opacity: 0, scale: 1.06 },
  visible: { opacity: 1, scale: 1, transition: { duration: 1.3, ease: EASE } },
}

/** Standard hover lift for interactive artwork surfaces. */
export const lift = {
  rest: { y: 0 },
  hover: { y: -6, transition: { duration: DUR.base, ease: EASE } },
}

/** Progress bars: animate the truth, once, when it enters view. */
export const growWidth = (ratio: number, delay = 0.2) => ({
  initial: { scaleX: 0 },
  whileInView: { scaleX: 1 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.9, ease: EASE, delay },
  style: { transformOrigin: 'left', width: `${ratio * 100}%` },
})
