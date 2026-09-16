'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Cover, FormatMark } from '@/components/Cover'
import { useSpotlight } from '@/lib/useSpotlight'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'

/* ==========================================================================
   EmptyLibrary
   --------------------------------------------------------------------------
   A real state, not a placeholder. There is no bundled sample library and no
   generated artwork anywhere in this product, so this screen has to be worth
   arriving at — it is also what every first-time user sees.

   It leans on real, live AniList covers rather than describing the product in
   the abstract: the catalogue StoryDex reads from *is* the sales pitch, and it
   is honestly labelled as trending, never passed off as your library.
   ========================================================================== */

interface EmptyLibraryProps {
  onImport: () => void
  className?: string
  variant?: 'page' | 'section'
}

export function EmptyLibrary({ onImport, className, variant = 'page' }: EmptyLibraryProps) {
  const spotlight = useSpotlight()
  const covers = (spotlight ?? []).filter(
    (media) => media.coverImage?.extraLarge || media.coverImage?.large,
  )

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={cn(variant === 'page' ? 'shell pt-16 pb-24' : '', className)}
    >
      <div className="max-w-[64ch]">
        <p className="eyebrow">Your collection is empty</p>
        <h1 className="mt-4 text-display font-bold text-ink">
          A list tells you what you finished.
          <br />
          <span className="text-ink-2">StoryDex tells you where you are in the story.</span>
        </h1>
        <p className="mt-6 max-w-[54ch] text-body text-ink-2">
          Import a public AniList list and every season, film, OVA and special you&rsquo;ve watched is
          regrouped into the franchise it belongs to — so a story reads as one story with six
          entries, not six unrelated rows.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            onClick={onImport}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-body font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-brand-strong"
          >
            <Plus className="size-4" aria-hidden />
            Import from AniList
          </button>
          <p className="text-small text-ink-3">
            Public lists only · read-only · stored in this browser
          </p>
        </div>
      </div>

      {/* What you get, as three statements. */}
      <ol className="mt-16 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            n: '01',
            title: 'Stories, not rows',
            body: 'AniList relations are followed to their ends, so prequels, sequels, films and OVAs land in one collection.',
          },
          {
            n: '02',
            title: 'One timeline per story',
            body: 'Every entry becomes a milestone with its own artwork, so a franchise reads as a journey rather than a list.',
          },
          {
            n: '03',
            title: 'Always a next episode',
            body: 'Not-yet-aired entries are kept apart from things you can watch, so Continue never lies to you.',
          },
        ].map((item, index) => (
          <motion.li
            key={item.n}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + index * 0.06, ease: EASE }}
            className="rounded-md border border-line bg-surface p-5"
          >
            <span className="num text-small font-semibold" style={{ color: 'var(--brand-strong)' }}>
              {item.n}
            </span>
            <h2 className="mt-2 text-card font-semibold text-ink">{item.title}</h2>
            <p className="mt-2 text-body text-ink-3">{item.body}</p>
          </motion.li>
        ))}
      </ol>

      {/* Real AniList artwork, honestly labelled. */}
      {covers.length > 0 && (
        <div className="mt-20">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="text-head font-bold text-ink">Trending on AniList</h2>
            <p className="text-small text-ink-3">Live from the API this app reads</p>
          </div>

          <ul className="mt-6 grid grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-5 lg:grid-cols-7">
            {covers.slice(0, 7).map((media, index) => {
              const title = media.title.english ?? media.title.romaji ?? media.title.native ?? ''
              return (
                <motion.li
                  key={media.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 + index * 0.04, ease: EASE }}
                  className={cn('group/art', index > 4 && 'hidden sm:block lg:block')}
                >
                  <Cover
                    src={media.coverImage?.extraLarge ?? media.coverImage?.large}
                    alt={title}
                    tint={media.coverImage?.color}
                    ratio="2/3"
                    hoverZoom
                    focus="upper"
                    sizes="(max-width: 640px) 30vw, 14vw"
                    className="transition-transform duration-300 ease-out group-hover/art:-translate-y-1"
                  />
                  <h3 className="clamp-2 mt-2.5 text-small font-semibold leading-snug text-ink">
                    {title}
                  </h3>
                  <div className="mt-1.5">
                    <FormatMark format={media.format ?? undefined} />
                  </div>
                </motion.li>
              )
            })}
          </ul>
        </div>
      )}
    </motion.section>
  )
}
