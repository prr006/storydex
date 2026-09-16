import Image from 'next/image'
import { cn } from '@/lib/utils'

/* ==========================================================================
   Artwork primitives
   --------------------------------------------------------------------------
   StoryDex ships no artwork of its own. Every pixel of art in this app is an
   AniList CDN URL that arrived through the API — a cover from
   `coverImage.extraLarge | large`, or a hero from `bannerImage`.

   These components enforce that with three guarantees:

     1. **Only real remote artwork renders.** `isRemoteArtwork()` rejects empty
        strings, relative paths and anything that isn't http(s), so a missing
        image degrades into a designed placeholder instead of a broken request
        or a stale bundled file.

     2. **Nothing shifts.** Artwork always sits inside a fixed aspect ratio with
        a tinted bed behind it, so a slow CDN response still lays out correctly.

     3. **Every story looks intentional, even without a banner.** AniList has no
        `bannerImage` for a large share of entries. Rather than fake one, we
        derive the hero from the entry's own cover: enlarged, softened, and
        washed with that cover's dominant colour (see `<Banner />`).
   ========================================================================== */

/**
 * True only for absolute http(s) URLs.
 *
 * This is the guard that keeps locally generated artwork out of the product:
 * anything that isn't a real remote asset is treated as "no artwork", and the
 * designed placeholder takes over.
 */
export function isRemoteArtwork(src?: string | null): src is string {
  if (!src) return false
  return /^https?:\/\//i.test(src.trim())
}

/** AniList's CDN. Used to decide whether next/image may optimise a source. */
const ANILIST_HOSTS = ['anilist.co']

function isAniListHost(src: string): boolean {
  try {
    const host = new URL(src).hostname
    return ANILIST_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))
  } catch {
    return false
  }
}

type Fit = 'cover' | 'contain'

interface PosterProps {
  src?: string | null
  alt: string
  className?: string
  /**
   * AniList `coverImage.color` (or a story's accent). Used to tint the bed
   * behind the artwork and to seed the placeholder, so a loading or missing
   * cover still carries that title's colour.
   */
  tint?: string | null
  priority?: boolean
  sizes?: string
  fit?: Fit
  /** Slight desaturation for background/secondary usage. */
  muted?: boolean
}

export function Poster({
  src,
  alt,
  className,
  tint,
  priority = false,
  sizes = '(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw',
  fit = 'cover',
  muted = false,
}: PosterProps) {
  const hasArt = isRemoteArtwork(src)

  return (
    <div
      className={cn('relative overflow-hidden bg-ink-700', className)}
      style={
        tint
          ? {
              // color-mix rather than string-concatenating an alpha suffix:
              // `tint` may be a hex from AniList OR a CSS variable, and only
              // the former tolerates `${tint}2e`.
              background: `linear-gradient(150deg, color-mix(in oklab, ${tint} 18%, transparent) 0%, var(--color-ink-800) 62%)`,
            }
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
            'h-full w-full',
            fit === 'cover' ? 'object-cover' : 'object-contain',
            muted ? 'contrast-[0.95] saturate-[0.85]' : 'contrast-[1.02] saturate-[1.05]',
          )}
        />
      ) : (
        // No artwork from AniList. Show a composed placeholder rather than an
        // empty box, so a franchise with no cover still reads as a title.
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-editorial select-none text-[clamp(1.25rem,2.25vw,2.5rem)] leading-none text-chalk/[0.12]">
            {initials(alt)}
          </span>
        </div>
      )}
    </div>
  )
}

interface BannerProps {
  /** AniList `bannerImage`. When present, this IS the hero. */
  src?: string | null
  /** AniList cover URL — the raw material for the derived hero. */
  fallbackSrc?: string | null
  /** `coverImage.color`, used to wash the derived hero in the story's colour. */
  tint?: string | null
  alt: string
  className?: string
  priority?: boolean
}

/**
 * Fills its (relatively positioned) parent with the most cinematic version of a
 * story's artwork that AniList can give us.
 *
 * Two genuinely different treatments, not one stretched treatment:
 *
 *  · **Real banner** (`bannerImage`, ~1900×400): object-cover at its natural
 *    scale. Nothing else is needed; it's already skyline-shaped.
 *
 *  · **No banner**: the cover is portrait art at roughly a quarter of the
 *    needed width, so scaling it to fill would produce mush. Instead we lean
 *    into the mismatch — enlarge it well past the frame and soften it heavily,
 *    then lay a gradient built from the cover's own dominant colour over the
 *    top. The result reads as a deliberate defocused backdrop belonging to that
 *    story, which is a far better outcome than a stretched thumbnail or a flat
 *    coloured panel.
 */
export function Banner({
  src,
  alt,
  tint,
  fallbackSrc,
  className,
  priority = false,
}: BannerProps) {
  const hasBanner = isRemoteArtwork(src)
  const hasCover = isRemoteArtwork(fallbackSrc)
  const source = hasBanner ? src : hasCover ? fallbackSrc : null

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      {/* Colour bed — always present, so the hero is never a black void while
          artwork loads or when AniList has nothing at all. */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(158deg, color-mix(in oklab, ${tint ?? 'var(--color-brand-600)'} 20%, transparent) 0%, var(--color-ink-950) 68%)`,
        }}
      />

      {source && (
        <Image
          src={source}
          alt={alt}
          fill
          priority={priority}
          sizes="100vw"
          unoptimized={!isAniListHost(source)}
          className={cn(
            'object-cover contrast-[1.04] saturate-[1.06]',
            hasBanner
              ? 'scale-[1.02]'
              : // Derived hero: over-scaled and softened, then graded by the
                // scrims above it into a recognisable, story-coloured wash.
                'scale-[1.75] opacity-60 blur-[28px]',
          )}
        />
      )}

      {/* Derived heroes need extra ink to keep hero typography legible over a
          blurred, high-key cover. Real banners are already dark enough. */}
      {!hasBanner && source && (
        <div className="absolute inset-0 bg-ink-950/45" />
      )}

      {/* Colour wash in the story's own hue, on top of the artwork. */}
      {tint && (
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background: `radial-gradient(70% 65% at 18% 30%, color-mix(in oklab, ${tint} 26%, transparent), transparent 62%)`,
          }}
        />
      )}
    </div>
  )
}

/** Two-character monogram for a missing cover, e.g. "Steins;Gate" → "SG". */
function initials(title: string): string {
  const words = title
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return '—'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}
