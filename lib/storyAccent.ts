import type { CSSProperties } from 'react'

/**
 * Story-derived accent colors.
 *
 * Every story owns a stable hue derived from its id, so a given story wears
 * the same light across the dashboard, its detail page and its route. The
 * hue feeds a set of CSS custom properties consumed by the UI.
 *
 * On the luminous atlas, the story accent behaves like LIGHT entering a
 * neutral environment: soft atmospheric washes, a colored route ink, a
 * glowing beacon, halos around artwork and hover light — never a flat tint
 * of the whole interface.
 *
 *   --story-h              raw hue (unitless number)
 *   --story-accent         primary accent (route ink, borders, icons)
 *   --story-accent-strong  brighter tip of the route, beacon rings
 *   --story-accent-deep    text-grade accent (labels, flags, folios)
 *   --story-accent-soft    translucent wash (hovers, fills)
 *   --story-accent-line    translucent stroke
 *   --story-glow           colored light (shadows, halos, ink glow)
 *   --story-accent-ink     text placed ON an accent fill
 *   --story-sky            wide atmospheric wash for full-page light
 *   --story-haze           fainter wash for secondary layers
 *   --story-light          the brightest emission — light leaks & halos
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
    '--story-accent': `hsl(${h} 74% 55%)`,
    '--story-accent-strong': `hsl(${h} 80% 58%)`,
    '--story-accent-deep': `hsl(${h} 68% 32%)`,
    '--story-accent-bright': `hsl(${h} 85% 68%)`,
    '--story-accent-soft': `hsl(${h} 75% 55% / 0.13)`,
    '--story-accent-line': `hsl(${h} 70% 50% / 0.5)`,
    '--story-glow': `hsl(${h} 95% 58% / 0.45)`,
    '--story-accent-ink': `hsl(${h} 40% 97%)`,
    '--story-sky': `hsl(${h} 70% 60% / 0.18)`,
    '--story-haze': `hsl(${h} 65% 58% / 0.09)`,
    '--story-light': `hsl(${h} 95% 72% / 0.55)`,
  } as CSSProperties
}
