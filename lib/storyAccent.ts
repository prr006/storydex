import type { CSSProperties } from 'react'

/**
 * Story-derived accent colors.
 *
 * Every story owns a stable hue derived from its id, so a given story wears
 * the same accent across the dashboard, its detail page and its route. The
 * hue feeds a small set of CSS custom properties consumed by the UI:
 *
 *   --story-h            raw hue (unitless number)
 *   --story-accent       primary accent
 *   --story-accent-soft  translucent wash (borders, fills)
 *   --story-glow         blurred light (waypoints, beacons)
 *   --story-accent-ink   deep tint for text on accent
 */
export function storyHue(seed: string): number {
  let hash = 5381
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 360
}

export function storyAccentVars(seed: string): CSSProperties {
  const h = storyHue(seed || 'storydex')
  return {
    '--story-h': h,
    '--story-accent': `hsl(${h} 75% 63%)`,
    '--story-accent-strong': `hsl(${h} 82% 68%)`,
    '--story-accent-soft': `hsl(${h} 70% 58% / 0.15)`,
    '--story-accent-line': `hsl(${h} 70% 58% / 0.42)`,
    '--story-glow': `hsl(${h} 90% 60% / 0.38)`,
    '--story-accent-ink': `hsl(${h} 62% 10%)`,
  } as CSSProperties
}
