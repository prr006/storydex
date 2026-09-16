'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Cover, FormatMark } from '@/components/Cover'
import { cn } from '@/lib/utils'
import {
  fetchDiscoverAnime,
  type AniListMedia,
  type DiscoverBoards,
  type DiscoverSeason,
} from '@/lib/anilist'
import type { Franchise } from '@/lib/franchise'
import { DURATION, EASE } from '@/lib/motion'

/* ==========================================================================
   DiscoverBoard — /discover
   --------------------------------------------------------------------------
   Three live AniList lists, cross-referenced against your own library.

   The cross-reference is the reason this page exists rather than a link to
   AniList: a poster whose story you already own is marked, so "should I start
   this?" is answered by "you already have it, and you're two entries in".

   Everything here is real data from the same API the import uses. Nothing is
   bundled, nothing is generated, and if the request fails the page says so
   plainly instead of showing invented covers.
   ========================================================================== */

const SEASON_LABEL: Record<DiscoverSeason, string> = {
  WINTER: 'Winter',
  SPRING: 'Spring',
  SUMMER: 'Summer',
  FALL: 'Autumn',
}

export function DiscoverBoard({ franchises }: { franchises: Franchise[] }) {
  const [boards, setBoards] = useState<DiscoverBoards | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchDiscoverAnime(12).then((result) => {
      if (cancelled) return
      setBoards(result)
      setFailed(
        result.trending.length === 0 && result.seasonal.length === 0 && result.upcoming.length === 0,
      )
    })
    return () => {
      cancelled = true
    }
  }, [])

  /** AniList media id → the story in your library that already contains it. */
  const owned = useMemo(() => {
    const map = new Map<number, Franchise>()
    for (const franchise of franchises) {
      if (franchise.aniListId) map.set(franchise.aniListId, franchise)
      for (const entry of franchise.seasons) {
        if (entry.aniListId) map.set(entry.aniListId, franchise)
      }
    }
    return map
  }, [franchises])

  if (failed) {
    return (
      <p className="reading mt-12 max-w-[52ch] text-ink-2">
        AniList didn&rsquo;t answer just now. Discover shows live data from the API, so there&rsquo;s
        nothing to display until it responds — reload in a moment.
      </p>
    )
  }

  if (!boards) {
    return (
      <div className="mt-12 space-y-16">
        {[0, 1].map((board) => (
          <div key={board}>
            <div className="h-4 w-40 animate-pulse rounded-xs bg-sunk" />
            <div className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="aspect-[4/5] animate-pulse rounded-md bg-sunk" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const seasonalTitle = `${SEASON_LABEL[boards.season]} ${boards.seasonYear}`

  return (
    <div className="mt-12 space-y-20">
      <Board
        title="Trending now"
        note="The most-watched shows on AniList this week"
        media={boards.trending}
        owned={owned}
      />
      <Board
        title={`This season — ${seasonalTitle}`}
        note="Everything airing in the current AniList season"
        media={boards.seasonal}
        owned={owned}
      />
      <Board
        title="Not aired yet"
        note="Announced and dated, but nothing to watch"
        media={boards.upcoming}
        owned={owned}
      />
    </div>
  )
}

function Board({
  title,
  note,
  media,
  owned,
}: {
  title: string
  note: string
  media: AniListMedia[]
  owned: Map<number, Franchise>
}) {
  if (media.length === 0) return null

  return (
    <section className="section-rule pt-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <h2 className="text-head font-semibold text-ink">{title}</h2>
        <p className="text-small text-ink-3">{note}</p>
      </header>

      <ul className="mt-8 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
        {media.map((item, index) => (
          <DiscoverTile key={item.id} media={item} franchise={owned.get(item.id)} index={index} />
        ))}
      </ul>
    </section>
  )
}

function DiscoverTile({
  media,
  franchise,
  index,
}: {
  media: AniListMedia
  franchise?: Franchise
  index: number
}) {
  const title = media.title.english ?? media.title.romaji ?? media.title.native ?? 'Untitled'
  const year = media.seasonYear ?? media.startDate?.year ?? null

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.enter, delay: Math.min(index * 0.02, 0.2), ease: EASE }}
    >
      <a
        href={media.siteUrl ?? `https://anilist.co/anime/${media.id}`}
        target="_blank"
        rel="noreferrer"
        className="group/discover block"
      >
        <div className="relative overflow-hidden rounded-md">
          <Cover
            src={media.coverImage?.extraLarge ?? media.coverImage?.large}
            alt={title}
            tint={media.coverImage?.color}
            ratio="4/5"
            sizes="(max-width: 640px) 30vw, 16vw"
            className="transition-transform duration-300 ease-out group-hover/discover:scale-[1.015]"
          />
          {franchise && (
            <span className="absolute inset-x-2 bottom-2 rounded-xs bg-canvas/92 px-2 py-1 text-micro font-semibold uppercase tracking-[0.06em] text-brand-text">
              In your library
            </span>
          )}
        </div>

        <h3
          className={cn(
            'clamp-2 mt-2.5 text-body font-medium leading-snug text-ink',
            'transition-colors duration-150 group-hover/discover:text-brand-text',
          )}
        >
          {title}
        </h3>

        <p className="mt-1 flex items-center gap-2 text-small text-ink-3">
          <FormatMark format={media.format ?? undefined} />
          {year && <span className="num">{year}</span>}
        </p>

        {franchise && (
          <p className="mt-1 truncate text-small text-ink-3">Part of {franchise.name}</p>
        )}
      </a>
    </motion.li>
  )
}
