'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, Loader2 } from 'lucide-react'
import { Poster, isRemoteArtwork } from '@/components/Artwork'
import { useSpotlight } from '@/lib/useSpotlight'
import { type AniListMedia } from '@/lib/anilist'
import { formatFormat } from '@/lib/design'
import { EASE } from '@/lib/motion'

/* ==========================================================================
   SpotlightRail
   --------------------------------------------------------------------------
   Live trending anime from AniList, rendered with the same poster treatment as
   the user's own library.

   Why this exists: StoryDex ships no artwork and bundles no sample library, so
   before an import the product has nothing of its own to show. Rather than
   fabricate a demo (which would mean shipping artwork that isn't AniList's) or
   show an empty grey grid, pre-import screens show *real* AniList data.

   The rail is decorative by contract: it never throws, renders nothing on
   failure, and can disappear at any moment without the page noticing.
   ========================================================================== */

interface SpotlightRailProps {
  /** Section eyebrow. */
  label?: string
  title: string
  /** Supporting line under the title. */
  note?: string
  className?: string
  /**
   * Optional call to action under the rail. Each page supplies its own so the
   * rail never hard-codes a destination that only makes sense in one place.
   */
  action?: { label: string; onClick: () => void }
}

export function SpotlightRail({
  label = 'Live from AniList',
  title,
  note,
  className,
  action,
}: SpotlightRailProps) {
  const media = useSpotlight()

  const items = (media ?? []).filter((m) =>
    isRemoteArtwork(m.coverImage?.extraLarge || m.coverImage?.large),
  )

  // Nothing to show: the surrounding page is designed to stand without this.
  if (media !== null && items.length === 0) return null

  return (
    <section className={className} aria-label={title}>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="label text-brand-300">{label}</span>
          <h2 className="text-editorial mt-2 text-[clamp(1.75rem,3vw,2.5rem)] leading-none text-chalk">
            {title}
          </h2>
          {note && <p className="mt-3 max-w-[46ch] text-body-sm text-mist">{note}</p>}
        </div>

        {media === null && (
          <span className="flex items-center gap-2 numeric text-[11px] text-veil">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Loading
          </span>
        )}
      </div>

      <div className="rail -mx-[var(--shell-x)] overflow-x-auto">
        <div className="flex w-max gap-5 px-[var(--shell-x)] pb-2">
          {media === null
            ? // Reserve the exact footprint so the section never jumps when the
              // response lands.
              Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="w-[152px] shrink-0 sm:w-[172px]">
                  <div className="aspect-[2/3] animate-pulse rounded-2xl bg-white/[0.03]" />
                  <div className="mt-3.5 h-3.5 w-4/5 animate-pulse rounded bg-white/[0.03]" />
                  <div className="mt-2 h-2.5 w-1/2 animate-pulse rounded bg-white/[0.03]" />
                </div>
              ))
            : items.map((item, i) => (
                <motion.a
                  key={item.id}
                  href={item.siteUrl ?? `https://anilist.co/anime/${item.id}`}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: Math.min(i * 0.05, 0.5) }}
                  className="group w-[152px] shrink-0 sm:w-[172px]"
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-ink-800 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5 group-hover:rim-hover">
                    <Poster
                      src={item.coverImage?.extraLarge || item.coverImage?.large}
                      alt={spotlightTitle(item)}
                      tint={item.coverImage?.color}
                      className="h-full w-full"
                      sizes="172px"
                    />
                    <div className="scrim-soft absolute inset-0" />

                    <span className="absolute right-3 top-3 grid size-7 translate-y-1 place-items-center rounded-full bg-ink-950/55 text-chalk opacity-0 backdrop-blur-md transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100">
                      <ArrowUpRight className="size-3.5" aria-hidden />
                    </span>

                    {item.seasonYear && (
                      <span className="absolute bottom-3 left-3 numeric text-[10px] text-chalk/90">
                        {item.seasonYear}
                      </span>
                    )}
                  </div>

                  <div className="mt-3.5">
                    <p className="line-clamp-2 text-[13px] font-medium leading-snug text-chalk">
                      {spotlightTitle(item)}
                    </p>
                    <p className="mt-1.5 numeric text-[10px] text-veil">
                      {formatFormat(item.format ?? undefined)}
                      {item.episodes ? ` · ${item.episodes} eps` : ''}
                    </p>
                  </div>
                </motion.a>
              ))}
        </div>
      </div>

      <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-veil">
        Trending on AniList right now — these aren&apos;t your stories.
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="text-brand-300 underline decoration-brand-300/30 underline-offset-4 transition-colors hover:text-brand-100"
          >
            {action.label}
          </button>
        )}
      </p>
    </section>
  )
}

/** AniList titles are frequently long; prefer English, fall back to romaji. */
function spotlightTitle(media: AniListMedia): string {
  return media.title.english || media.title.romaji || media.title.native || 'Untitled'
}
