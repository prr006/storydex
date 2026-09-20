'use client'

import { MotionConfig } from 'framer-motion'

/**
 * Global motion defaults. `reducedMotion="user"` makes every framer-motion
 * animation respect the OS "reduce motion" preference: transforms/layout
 * animations are disabled while opacity fades still play.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
