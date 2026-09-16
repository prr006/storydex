/**
 * Atmosphere — the fixed backdrop that every page floats on.
 *
 * This is the single most important layer for killing the "generic Tailwind
 * dashboard" feel. Four stacked, very cheap layers:
 *
 *   1. Ink base        — near-black with a violet bias (never pure #000).
 *   2. Aurora          — three slow-drifting radial blooms, violet/indigo/cyan.
 *   3. Horizon         — a soft light source bleeding down from above the fold.
 *   4. Grain + vignette— analog film texture and edge falloff for depth.
 *
 * Everything is `pointer-events-none`, fixed, and behind content (`-z-10`),
 * and every animation is disabled under `prefers-reduced-motion`.
 */
export function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950">
      {/* 2 — Aurora. Three blooms at different scales and speeds so the
          background never repeats visibly. */}
      <div
        className="animate-drift absolute -left-[18%] -top-[28%] h-[70vmax] w-[70vmax] rounded-full opacity-[0.42] blur-[120px]"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(113,55,234,0.55) 0%, rgba(113,55,234,0.14) 45%, transparent 72%)',
        }}
      />
      <div
        className="animate-drift absolute -right-[22%] top-[4%] h-[58vmax] w-[58vmax] rounded-full opacity-[0.34] blur-[130px]"
        style={{
          animationDuration: '46s',
          animationDirection: 'alternate-reverse',
          background:
            'radial-gradient(circle at 50% 50%, rgba(53,60,158,0.55) 0%, rgba(53,60,158,0.12) 48%, transparent 74%)',
        }}
      />
      <div
        className="animate-drift absolute bottom-[-30%] left-[28%] h-[52vmax] w-[52vmax] rounded-full opacity-[0.2] blur-[140px]"
        style={{
          animationDuration: '58s',
          background:
            'radial-gradient(circle at 50% 50%, rgba(94,200,255,0.4) 0%, rgba(94,200,255,0.08) 50%, transparent 76%)',
        }}
      />

      {/* 3 — Horizon light. A wide ellipse anchored just above the viewport. */}
      <div
        className="absolute -top-[38vh] left-1/2 h-[76vh] w-[150vw] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(196,178,255,0.16) 0%, rgba(113,55,234,0.09) 32%, transparent 66%)',
        }}
      />

      {/* 4 — Vignette: pulls the eye to the centre of the composition. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 120% 90% at 50% 30%, transparent 40%, rgba(5,4,16,0.55) 82%, rgba(5,4,16,0.9) 100%)',
        }}
      />

      {/* 4 — Film grain. Fixed, non-repeating, 4% opacity. */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  )
}
