'use client'

import type { CSSProperties, ReactNode } from 'react'

/**
 * The beacon — StoryDex's living point: a breathing core wrapped in a soft
 * glow and two staggered pulse rings, with an optional flag marking the
 * current position on a route.
 */
export function Beacon({
  style,
  flag,
  className = '',
}: {
  style?: CSSProperties
  flag?: ReactNode
  className?: string
}) {
  return (
    <span className={`beacon${className ? ` ${className}` : ''}`} style={style} aria-hidden="true">
      <span className="beacon__glow" />
      <span className="beacon__ring beacon__ring--1" />
      <span className="beacon__ring beacon__ring--2" />
      <span className="beacon__core" />
      {flag}
    </span>
  )
}
