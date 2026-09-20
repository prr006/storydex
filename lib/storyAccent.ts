import type { CSSProperties } from 'react'

/**
 * Story-derived accent colors.
 *
 * Every story owns a stable hue derived from its id, so a given story wears
 * the same light across the dashboard, its detail page and its route. The
 * hue feeds a set of CSS custom properties consumed by the UI:
 *
 *   --story-h            raw hue (unitless number)
 *   --story-accent       primary accent
 *   --story-accent-strong  brighter variant (beacons, highlights)
 *   --story-accent-soft  translucent wash (tints, fills)
 *   --story-accent-line  translucent stroke
 *   --story-glow         blurred light (beacons, ink)
 *   --story-accent-ink   deep tint for text on accent
 *   --story-sky          wide atmospheric wash for full-page environments
 *   --story-haze         fainter wash for secondary layers
 *   --story-light        the brightest emission — light leaks & halos
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
    '--story-accent': `hsl(${h} 72% 62%)`,
    '--story-accent-strong': `hsl(${h} 80% 68%)`,
    '--story-accent-soft': `hsl(${h} 70% 58% / 0.14)`,
    '--story-accent-line': `hsl(${h} 70% 60% / 0.42)`,
    '--story-glow': `hsl(${h} 90% 60% / 0.4)`,
    '--story-accent-ink': `hsl(${h} 62% 10%)`,
    '--story-sky': `hsl(${h} 55% 52% / 0.22)`,
    '--story-haze': `hsl(${h} 50% 50% / 0.09)`,
    '--story-light': `hsl(${h} 85% 70% / 0.45)`,
  } as CSSProperties
}
