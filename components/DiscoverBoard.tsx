'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Play, Sparkles } from 'lucide-react'
import { ArtworkBackdrop, Cover, FormatMark } from '@/components/Cover'
import { Rail, RailSection } from '@/components/Rail'
import {
  accentVars,
  getStoryPhase,
  getStoryProgress,
} from '@/lib/design'
import {
  fetchDiscoverAnime,
  type AniListMedia,
  type DiscoverBoards,
  type DiscoverSeason,
} from '@/lib/anilist'
import type { Franchise } from '@/lib/franchise'
import { EASE } from '@/lib/motion'

/* ==========================================================================
   DiscoverBoard — /discover
   --------------------------------------------------------------------------
   Exploring anime rather than searching a database. Four boards, one request:

     featured     one title given the whole screen, artwork-led
     trending     ranked — the number is drawn into the composition
     season       what's airing now
     upcoming     more compact, because nothing is watchable yet
     recommended  drawn from *your* library, and it says why

   Everything comes from the same public AniList API the import reads. If the
   request fails the page says so plainly instead of inventing covers.
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
    fetchDiscoverAnime(14).then((result) => {
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

  const recommendations = useMemo(() => recommend(franchises, boards), [franchises, boards])

  if (failed) {
    return (
      <p className="mt-12 max-w-[52ch] text-body text-ink-2">
        AniList didn&rsquo;t answer just now. Discover shows live data from the API, so there&rsquo;s
        nothing to display until it responds — reload in a moment.
      </p>
    )
  }

  if (!boards) {
    return (
      <div className="mt-8 space-y-16">
        <div className="h-[clamp(20rem,46vh,32rem)] animate-pulse rounded-lg bg-surface-2" />
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="aspect-[2/3] animate-pulse rounded-md bg-surface-2" />
          ))}
        </div>
      </div>
    )
  }

  const featured = boards.trending[0] ?? boards.seasonal[0] ?? null

  return (
    <div className="pb-24">
      {featured && <Featured media={featured} franchise={owned.get(featured.id)} />}

      <div className="shell mt-14 space-y-16">
        <RailSection
          title="Trending now"
          meta="What the community is watching"
          className="-mt-2"
        >
          <Rail itemWidth={200}>
            {boards.trending.map((media, index) => (
              <RankedCard
                key={media.id}
                media={media}
                rank={index + 1}
                franchise={owned.get(media.id)}
                index={index}
              />
            ))}
          </Rail>
        </RailSection>

        {boards.seasonal.length > 0 && (
          <RailSection
            title="This season"
            meta={`${SEASON_LABEL[boards.season]} ${boards.seasonYear} simulcasts`}
          >
            <div className="grid grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
              {boards.seasonal.map((media, index) => (
                <DiscoverTile
                  key={media.id}
                  media={media}
                  franchise={owned.get(media.id)}
                  index={index}
                />
              ))}
            </div>
          </RailSection>
        )}

        {boards.upcoming.length > 0 && (
          <RailSection title="Upcoming" meta="Announced, nothing to watch yet">
            <Rail itemWidth={300}>
              {boards.upcoming.map((media, index) => (
                <UpcomingCard key={media.id} media={media} index={index} />
              ))}
            </Rail>
          </RailSection>
        )}

        {recommendations.length > 0 && (
          <RailSection
            title="Recommended from your library"
            meta={`Based on ${franchises.length} tracked ${franchises.length === 1 ? 'story' : 'stories'}`}
            action={{ href: '/library', label: 'Browse yours' }}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {recommendations.map((item, index) => (
                <RecommendationRow key={item.key} item={item} index={index} />
              ))}
            </div>
          </RailSection>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Featured                                                                   */
/* -------------------------------------------------------------------------- */

function Featured({ media, franchise }: { media: AniListMedia; franchise?: Franchise }) {
  const title = media.title.english ?? media.title.romaji ?? media.title.native ?? 'Untitled'
  const year = media.seasonYear ?? media.startDate?.year ?? null
  const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : null
  const popularity = media.popularity ?? null

  return (
    <section
      className="relative"
      style={accentVars({ id: String(media.id), accentColor: media.coverImage?.color })}
    >
      <ArtworkBackdrop
        src={media.bannerImage ?? media.coverImage?.extraLarge ?? media.coverImage?.large}
        alt=""
        tint={media.coverImage?.color}
        isBanner={Boolean(media.bannerImage)}
        priority
        className="h-[clamp(20rem,50vh,34rem)] w-full"
        overlay="scrim-hero"
        sizes="100vw"
      />

      <div className="absolute inset-0">
        <div className="shell flex h-full flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="max-w-[42rem]"
          >
            <p className="eyebrow flex items-center gap-2" style={{ color: 'var(--accent-strong)' }}>
              <Sparkles className="size-3.5" aria-hidden />
              {media.status === 'RELEASING' ? 'Airing this season' : 'Highest rated this week'}
            </p>

            <h1 className="mt-3 text-hero font-bold text-ink">{title}</h1>

            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-body text-ink-2">
              {media.format && <FormatMark format={media.format} />}
              {year && <span className="num">{year}</span>}
              {media.episodes ? <span className="num">{media.episodes} episodes</span> : null}
              {score ? <span className="num">★ {score}</span> : null}
              {popularity ? (
                <span className="num">
                  {popularity >= 1000
                    ? `${Math.round(popularity / 1000)},000 tracking`
                    : `${popularity.toLocaleString('en-US')} tracking`}
                </span>
              ) : null}
              {media.genres.slice(0, 3).map((genre) => (
                <span key={genre} className="text-ink-3">
                  {genre}
                </span>
              ))}
            </p>

            {media.description && (
              <p className="clamp-3 mt-4 max-w-[52ch] text-body text-ink-2">
                {stripHtml(media.description)}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={media.siteUrl ?? `https://anilist.co/anime/${media.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-body font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-brand-strong"
              >
                <Play className="size-4 fill-current" aria-hidden />
                {franchise ? 'Continue in your library' : 'Start watching'}
              </a>

              {franchise ? (
                <Link
                  href={`/franchise/${franchise.id}`}
                  className="inline-flex h-11 items-center rounded-full border border-line-strong bg-black/30 px-5 text-body font-medium text-ink backdrop-blur-sm transition-colors hover:bg-white/[0.08]"
                >
                  Open {franchise.name}
                </Link>
              ) : (
                <a
                  href={media.siteUrl ?? `https://anilist.co/anime/${media.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-black/30 px-5 text-body font-medium text-ink backdrop-blur-sm transition-colors hover:bg-white/[0.08]"
                >
                  <Plus className="size-4" aria-hidden />
                  Add to AniList
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Trending                                                                   */
/* -------------------------------------------------------------------------- */

function RankedCard({
  media,
  rank,
  franchise,
  index,
}: {
  media: AniListMedia
  rank: number
  franchise?: Franchise
  index: number
}) {
  const title = media.title.english ?? media.title.romaji ?? media.title.native ?? 'Untitled'
  const year = media.seasonYear ?? media.startDate?.year ?? null

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: Math.min(index * 0.03, 0.24), ease: EASE }}
      className="group/art w-[172px] shrink-0 snap-start sm:w-[188px]"
      style={accentVars({ id: String(media.id), accentColor: media.coverImage?.color })}
    >
      <a
        href={media.siteUrl ?? `https://anilist.co/anime/${media.id}`}
        target="_blank"
        rel="noreferrer"
        className="block"
      >
        <div className="relative">
          <Cover
            src={media.coverImage?.extraLarge ?? media.coverImage?.large}
            alt={title}
            tint={media.coverImage?.color}
            ratio="2/3"
            hoverZoom
            focus="upper"
            sizes="190px"
            className="transition-all duration-300 ease-out group-hover/art:-translate-y-1 group-hover/art:ring-1 group-hover/art:ring-white/25"
          />

          {/* The rank is part of the composition, not a label beside it. */}
          <span
            className="pointer-events-none absolute -bottom-1 left-1 text-[3rem] font-bold leading-none tracking-[-0.06em] text-white/85 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
            aria-hidden
          >
            {rank}
          </span>

          {franchise && (
            <span
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]"
              style={{ background: 'var(--brand)' }}
              aria-hidden
            />
          )}
        </div>

        <h3 className="clamp-2 mt-2.5 text-small font-semibold leading-snug text-ink">{title}</h3>
        <p className="num mt-0.5 truncate text-[0.6875rem] text-ink-3">
          {franchise ? `In your library` : year ? `${year}` : 'AniList'}
        </p>
      </a>
    </motion.article>
  )
}

/* -------------------------------------------------------------------------- */
/* Season + upcoming                                                          */
/* -------------------------------------------------------------------------- */

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
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: Math.min(index * 0.03, 0.24), ease: EASE }}
      className="group/art"
      style={accentVars({ id: String(media.id), accentColor: media.coverImage?.color })}
    >
      <a
        href={media.siteUrl ?? `https://anilist.co/anime/${media.id}`}
        target="_blank"
        rel="noreferrer"
        className="block"
      >
        <Cover
          src={media.coverImage?.extraLarge ?? media.coverImage?.large}
          alt={title}
          tint={media.coverImage?.color}
          ratio="2/3"
          hoverZoom
          focus="upper"
          sizes="(max-width: 640px) 30vw, 15vw"
          className="transition-all duration-300 ease-out group-hover/art:-translate-y-1 group-hover/art:ring-1 group-hover/art:ring-white/25"
        >
          {franchise && (
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-brand" aria-hidden />
          )}
        </Cover>

        <h3 className="clamp-2 mt-2.5 text-small font-semibold leading-snug text-ink">{title}</h3>
        <p className="num mt-0.5 truncate text-[0.6875rem] text-ink-3">
          {franchise ? 'In your library' : year ? `${year} · Season` : 'Season'}
        </p>
      </a>
    </motion.article>
  )
}

function UpcomingCard({ media, index }: { media: AniListMedia; index: number }) {
  const title = media.title.english ?? media.title.romaji ?? media.title.native ?? 'Untitled'
  const year = media.seasonYear ?? media.startDate?.year ?? null
  const art = media.bannerImage ?? media.coverImage?.extraLarge ?? media.coverImage?.large

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: Math.min(index * 0.04, 0.2), ease: EASE }}
      className="group/art w-[288px] shrink-0 snap-start"
      style={accentVars({ id: String(media.id), accentColor: media.coverImage?.color })}
    >
      <a
        href={media.siteUrl ?? `https://anilist.co/anime/${media.id}`}
        target="_blank"
        rel="noreferrer"
        className="block"
      >
        <div className="relative h-[104px] overflow-hidden rounded-md transition-all duration-300 ease-out group-hover/art:-translate-y-0.5 group-hover/art:ring-1 group-hover/art:ring-white/20">
          <Cover
            src={art}
            alt=""
            tint={media.coverImage?.color}
            isBanner={Boolean(media.bannerImage)}
            ratio="16/9"
            scrim="card"
            hoverZoom
            edged={false}
            rounded={false}
            focus={media.bannerImage ? 'center' : 'upper'}
            sizes="290px"
            className="absolute inset-0 h-full w-full"
          />

          <div className="relative flex h-full flex-col justify-between p-3">
            <span
              className="self-start rounded-full px-2 py-[3px] text-[0.625rem] font-semibold uppercase tracking-[0.08em]"
              style={{ color: 'var(--state-upcoming)', background: 'rgba(5,6,9,0.55)' }}
            >
              Upcoming{year ? ` · ${year}` : ''}
            </span>
            <div>
              <p className="clamp-2 text-small font-semibold leading-snug text-white">{title}</p>
              <p className="num mt-0.5 text-[0.6875rem] text-white/60">
                {media.format?.replace('_', ' ') ?? 'Anime'}
                {media.episodes ? ` · ${media.episodes} eps` : ''}
              </p>
            </div>
          </div>
        </div>
      </a>
    </motion.article>
  )
}

/* -------------------------------------------------------------------------- */
/* Recommendations                                                            */
/* -------------------------------------------------------------------------- */

interface Recommendation {
  key: string
  franchise: Franchise
  why: string
}

/**
 * Recommendations are drawn from the library itself, not from AniList: a story
 * with unstarted entries, or one that shares a genre with something finished.
 * Each one says why, because a recommendation you can't interrogate is noise.
 */
function recommend(franchises: Franchise[], boards: DiscoverBoards | null): Recommendation[] {
  const out: Recommendation[] = []
  const seen = new Set<string>()

  const finishedGenres = new Map<string, string>()
  for (const franchise of franchises) {
    if (getStoryPhase(franchise) === 'complete') {
      for (const genre of franchise.genres) {
        if (!finishedGenres.has(genre)) finishedGenres.set(genre, franchise.name)
      }
    }
  }

  for (const franchise of franchises) {
    if (out.length >= 6) break
    if (seen.has(franchise.id)) continue

    const phase = getStoryPhase(franchise)
    const progress = getStoryProgress(franchise)

    if (phase === 'caught-up') {
      const upcoming = franchise.seasons.find((entry) => entry.status !== 'COMPLETED' && entry.year > 0)
      out.push({
        key: franchise.id,
        franchise,
        why: upcoming
          ? `Everything that exists is watched — ${upcoming.name} arrives ${upcoming.year}`
          : 'Everything that exists is watched',
      })
      seen.add(franchise.id)
      continue
    }

    if (phase === 'backlog' || phase === 'planned') {
      out.push({
        key: franchise.id,
        franchise,
        why: `Complete the ${franchise.name} story — ${progress.total} ${progress.total === 1 ? 'entry' : 'entries'}, nothing started`,
      })
      seen.add(franchise.id)
      continue
    }

    const shared = franchise.genres.find((genre) => finishedGenres.has(genre))
    if (shared && finishedGenres.get(shared) !== franchise.name) {
      out.push({
        key: franchise.id,
        franchise,
        why: `Because you completed ${finishedGenres.get(shared)} — both are ${shared}`,
      })
      seen.add(franchise.id)
    }
  }

  // If the library is small, fall back to honest breadth statements rather than
  // inventing relationships the data doesn't support.
  if (out.length === 0 && franchises.length > 0 && boards) {
    const biggest = [...franchises].sort((a, b) => b.seasons.length - a.seasons.length)[0]
    if (biggest) {
      out.push({
        key: biggest.id,
        franchise: biggest,
        why: `Your longest story — ${biggest.seasons.length} entries`,
      })
    }
  }

  return out
}

function RecommendationRow({ item, index }: { item: Recommendation; index: number }) {
  const { franchise } = item

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: Math.min(index * 0.04, 0.24), ease: EASE }}
      className="group/art"
      style={accentVars(franchise)}
    >
      <Link
        href={`/franchise/${franchise.id}`}
        className="flex items-center gap-4 rounded-md border border-line bg-surface p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/15 hover:bg-surface-2"
      >
        <span className="relative block h-[76px] w-[54px] shrink-0 overflow-hidden rounded-sm">
          <Cover
            src={franchise.posterUrl}
            alt=""
            tint={franchise.accentColor}
            ratio="2/3"
            rounded={false}
            edged={false}
            hoverZoom
            sizes="54px"
            className="h-full w-full"
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-card font-semibold text-ink">{franchise.name}</span>
          <span className="mt-1 block text-small text-ink-2">{item.why}</span>
          <span className="num mt-2 block text-[0.6875rem] text-ink-3">
            {franchise.seasons.length} {franchise.seasons.length === 1 ? 'entry' : 'entries'} ·{' '}
            {getStoryProgress(franchise).completed} watched
          </span>
        </span>

        <span
          className="hidden shrink-0 text-small font-semibold transition-transform duration-200 group-hover/art:translate-x-0.5 sm:block"
          style={{ color: 'var(--accent-strong)' }}
          aria-hidden
        >
          →
        </span>
      </Link>
    </motion.article>
  )
}

/* -------------------------------------------------------------------------- */

/** AniList synopses arrive as HTML; strip it rather than injecting a remote string. */
function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, '’')
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/\s+/g, ' ')
    .trim()
}
