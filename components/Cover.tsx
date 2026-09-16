import Image from 'next/image'
import { cn } from '@/lib/utils'
import { formatFormat } from '@/lib/design'

/* ==========================================================================
   Artwork
   --------------------------------------------------------------------------
   StoryDex ships no artwork. Every image is an AniList CDN URL that arrived
   through the API, and `isRemoteArtwork()` is the only gate: anything that
   isn't an absolute http(s) URL counts as *no artwork*, so a missing image can
   never become a broken request or a stale bundled file.

   Artwork is the light source of this interface, so it is treated as a surface
   rather than a thumbnail:

     Cover            a plate with a fixed aspect — posters, cards, rows.
     ArtworkBackdrop  a full-bleed scene — heroes, banners, timeline cards.
     FormatMark       the one piece of text allowed to sit on top of it.

   Two treatments matter everywhere. The **tint bed** uses the artwork's own
   `coverImage.color`, so a slow CDN shows the right colour rather than grey.
   The **scrim** is a gradient that exists only so type can be read on the art;
   it is never decoration.
   ========================================================================== */

export function isRemoteArtwork(src?: string | null): src is string {
  return Boolean(src && /^https?:\/\//i.test(src.trim()))
}

const ANILIST_HOSTS = ['anilist.co']

function isAniListHost(src: string): boolean {
  try {
    const host = new URL(src).hostname
    return ANILIST_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))
  } catch {
    return false
  }
}

type Ratio = '2/3' | '3/4' | '4/5' | '16/9' | '21/9' | '1/1'

const RATIO: Record<Ratio, string> = {
  '2/3': 'aspect-[2/3]',
  '3/4': 'aspect-[3/4]',
  '4/5': 'aspect-[4/5]',
  '16/9': 'aspect-[16/9]',
  '21/9': 'aspect-[21/9]',
  '1/1': 'aspect-square',
}

/* -------------------------------------------------------------------------- */
/* Cover — the plate                                                          */
/* -------------------------------------------------------------------------- */

interface CoverProps {
  src?: string | null
  alt: string
  /** Fixed aspect so a slow CDN response still lays out correctly. */
  ratio?: Ratio
  /** AniList `coverImage.color` — tints the bed behind the artwork. */
  tint?: string | null
  className?: string
  sizes?: string
  priority?: boolean
  /** Lit rim. On by default so a black cover still separates from the page. */
  edged?: boolean
  /** Round the corners. Off for tight table thumbnails. */
  rounded?: boolean
  /** Gradient overlays that make text readable on top of the artwork. */
  scrim?: 'none' | 'card' | 'bottom' | 'left'
  /** Where the crop should focus. Posters default to the upper third (faces). */
  focus?: 'center' | 'top' | 'upper'
  /** Scale the artwork on hover of a parent marked `group/art`. */
  hoverZoom?: boolean
  /** True when `src` is a wide banner rather than a poster. */
  isBanner?: boolean
  children?: React.ReactNode
}

const FOCUS = {
  center: 'object-center',
  top: 'object-top',
  upper: 'object-[center_22%]',
} as const

export function Cover({
  src,
  alt,
  ratio = '2/3',
  tint,
  className,
  sizes = '(max-width: 640px) 45vw, (max-width: 1024px) 24vw, 16vw',
  priority = false,
  edged = true,
  rounded = true,
  scrim = 'none',
  focus = 'center',
  hoverZoom = false,
  isBanner = false,
  children,
}: CoverProps) {
  const hasArt = isRemoteArtwork(src)

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-surface-3',
        RATIO[ratio],
        rounded && 'rounded-md',
        edged && 'art-edge',
        className,
      )}
      style={
        tint && !hasArt
          ? { background: `color-mix(in oklab, ${tint} 22%, var(--surface-3))` }
          : undefined
      }
    >
      {hasArt ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          unoptimized={!isAniListHost(src)}
          className={cn(
            'h-full w-full object-cover',
            isBanner ? 'object-center' : FOCUS[focus],
            hoverZoom &&
              'transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/art:scale-[1.06]',
          )}
        />
      ) : (
        <Monogram title={alt} tint={tint} />
      )}

      {scrim !== 'none' && (
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0',
            scrim === 'card' && 'scrim-card',
            scrim === 'bottom' && 'scrim-bottom',
            scrim === 'left' && 'scrim-hero',
          )}
        />
      )}

      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* ArtworkBackdrop — the scene                                                */
/* -------------------------------------------------------------------------- */

/**
 * Full-bleed artwork for a hero.
 *
 * When AniList gives the story a real banner, it is used as-is: that is exactly
 * the shape it was made for. When it doesn't, the cover stands in the same
 * slot — cropped wide and focused on the upper third, where a poster's subject
 * almost always sits, with a slightly deeper scrim to carry the wider frame.
 * Nothing is generated, blended or invented in either case.
 */
export function ArtworkBackdrop({
  src,
  alt,
  tint,
  isBanner,
  className,
  priority = false,
  sizes = '100vw',
  overlay = 'scrim-hero',
  children,
}: {
  src?: string | null
  alt: string
  tint?: string | null
  /** True when `src` is a real banner; false when a poster is standing in. */
  isBanner?: boolean
  className?: string
  priority?: boolean
  sizes?: string
  overlay?: 'scrim-hero' | 'scrim-card' | 'scrim-bottom' | 'none'
  children?: React.ReactNode
}) {
  const hasArt = isRemoteArtwork(src)

  return (
    <div className={cn('relative overflow-hidden bg-surface', className)}>
      {hasArt ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          unoptimized={!isAniListHost(src)}
          className={cn(
            'h-full w-full object-cover',
            isBanner ? 'object-center' : 'scale-[1.12] object-[center_26%]',
          )}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: tint
              ? `radial-gradient(120% 100% at 22% 30%, color-mix(in oklab, ${tint} 55%, #05060a) 0%, #05060a 68%)`
              : 'radial-gradient(120% 100% at 22% 30%, #171a24 0%, #05060a 70%)',
          }}
        />
      )}

      {overlay !== 'none' && (
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0',
            overlay === 'scrim-hero' && 'scrim-hero',
            overlay === 'scrim-card' && 'scrim-card',
            overlay === 'scrim-bottom' && 'scrim-bottom',
          )}
        />
      )}

      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

/** A typeset monogram, so a story with no artwork still looks designed. */
function Monogram({ title, tint }: { title: string; tint?: string | null }) {
  return (
    <div
      className="absolute inset-0 grid place-items-center"
      style={
        tint
          ? { background: `radial-gradient(90% 90% at 30% 25%, color-mix(in oklab, ${tint} 40%, #0b0d12) 0%, #0b0d12 75%)` }
          : undefined
      }
    >
      <span
        className="text-[clamp(1rem,1.8vw,1.75rem)] font-semibold tracking-[0.04em] text-ink-3/80"
        aria-hidden
      >
        {initials(title)}
      </span>
    </div>
  )
}

/** Two-character monogram for a missing cover, e.g. "Steins;Gate" → "SG". */
export function initials(title: string): string {
  const words = title
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return '—'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

/* ==========================================================================
   FormatMark — the small typographic tag for an entry's kind.
   Seasons, films, OVAs and specials must be distinguishable at a glance, so
   the format is always spelled out rather than encoded as an icon.
   ========================================================================== */

export function FormatMark({ format, className }: { format?: string; className?: string }) {
  const label = formatFormat(format)
  const isFilm = format === 'MOVIE'
  const isSide = format === 'OVA' || format === 'ONA' || format === 'SPECIAL'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xs px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em]',
        isFilm
          ? 'bg-white/10 text-ink'
          : isSide
            ? 'bg-transparent text-ink-2 ring-1 ring-inset ring-white/15'
            : 'bg-brand-soft text-brand-strong',
        className,
      )}
    >
      {label}
    </span>
  )
}
