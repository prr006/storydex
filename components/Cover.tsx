import Image from 'next/image'
import { cn } from '@/lib/utils'
import { formatFormat } from '@/lib/design'

/* ==========================================================================
   Cover — the only artwork primitive
   --------------------------------------------------------------------------
   StoryDex ships no artwork. Every cover is an AniList CDN URL that arrived
   through the API, and `isRemoteArtwork()` is the single gate: anything that
   isn't an absolute http(s) URL is treated as *no artwork*, so a missing image
   can never degrade into a broken request or a stale bundled file.

   In this design a cover is an **object on paper** — a plate in a catalogue.
   It sits in a fixed aspect box with a hairline edge and a bed tinted with the
   artwork's own `coverImage.color`, so it reads as placed rather than floating.
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

type Ratio = '2/3' | '4/5' | '16/9' | '1/1'

const RATIO: Record<Ratio, string> = {
  '2/3': 'aspect-[2/3]',
  '4/5': 'aspect-[4/5]',
  '16/9': 'aspect-[16/9]',
  '1/1': 'aspect-square',
}

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
  /** Hairline edge. On by default; the plate should read as an object. */
  edged?: boolean
  /** Round the corners. Off for the rectilinear table/list thumbnails. */
  rounded?: boolean
}

export function Cover({
  src,
  alt,
  ratio = '2/3',
  tint,
  className,
  sizes = '(max-width: 640px) 40vw, (max-width: 1024px) 22vw, 15vw',
  priority = false,
  edged = true,
  rounded = true,
}: CoverProps) {
  const hasArt = isRemoteArtwork(src)

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-sunk',
        RATIO[ratio],
        rounded && 'rounded-md',
        edged && 'ring-1 ring-inset ring-rule-strong/60',
        className,
      )}
      style={
        tint && !hasArt
          ? { background: `color-mix(in oklab, ${tint} 14%, var(--sunk))` }
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
          className="h-full w-full object-cover"
        />
      ) : (
        // No artwork from AniList. A typeset monogram, not an empty box.
        <div className="absolute inset-0 grid place-items-center">
          <span
            className="font-sans text-[clamp(0.9rem,1.6vw,1.5rem)] font-semibold tracking-[0.04em] text-ink-3/70"
            aria-hidden
          >
            {initials(alt)}
          </span>
        </div>
      )}
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
        'inline-flex items-center rounded-xs px-1.5 py-0.5 text-micro font-semibold tracking-[0.06em] uppercase',
        isFilm
          ? 'bg-sunk text-ink-2'
          : isSide
            ? 'bg-transparent text-ink-3 ring-1 ring-inset ring-rule-strong/70'
            : 'bg-brand-tint text-brand-text',
        className,
      )}
    >
      {label}
    </span>
  )
}
