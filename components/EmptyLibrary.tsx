'use client'

import { motion } from 'framer-motion'
import { Cover } from '@/components/Cover'
import { useSpotlight } from '@/lib/useSpotlight'
import { DURATION, EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'

/* ==========================================================================
   EmptyLibrary
   --------------------------------------------------------------------------
   A real state, not a placeholder. There is no bundled sample library and no
   generated artwork anywhere in this product, so this screen has to be good
   enough to be the first thing anyone sees.

   It does three things and stops:
     1. says what StoryDex does, in one serif paragraph;
     2. offers the one action (import);
     3. shows real, live AniList covers — the actual catalogue this app reads
        from — clearly labelled as trending, never passed off as your library.
   ========================================================================== */

interface EmptyLibraryProps {
  onImport: () => void
  className?: string
  /** `page` fills a route; `section` sits inside one. */
  variant?: 'page' | 'section'
}

export function EmptyLibrary({ onImport, className, variant = 'page' }: EmptyLibraryProps) {
  const spotlight = useSpotlight()
  const covers = (spotlight ?? []).filter(
    (media) => media.coverImage?.extraLarge || media.coverImage?.large,
  )

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.enter, ease: EASE }}
      className={cn(variant === 'page' ? 'shell pt-16 pb-24' : '', className)}
    >
      <div className="max-w-[68ch]">
        <p className="eyebrow">Your collection is empty</p>
        <h1 className="mt-4 text-display font-semibold text-ink">
          A list tells you what you finished.
          <br />
          <span className="text-ink-2">StoryDex tells you where you are in the story.</span>
        </h1>
        <p className="reading mt-6 max-w-[58ch] text-ink-2">
          Import a public AniList list and every season, film, OVA and special you&rsquo;ve watched
          gets regrouped into the franchise it belongs to — so Re:ZERO reads as one story with four
          entries rather than four unrelated rows.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            onClick={onImport}
            className="inline-flex h-11 items-center rounded-sm bg-brand px-5 text-body font-medium text-brand-ink transition-opacity hover:opacity-90"
          >
            Import from AniList
          </button>
          <p className="text-small text-ink-3">
            Public lists only · read-only · stored in this browser
          </p>
        </div>
      </div>

      {/* ── What you get, as three statements ───────────────────────────── */}
      <ol className="mt-16 grid gap-x-10 gap-y-8 border-t border-rule pt-8 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            n: '01',
            title: 'Stories, not rows',
            body: 'AniList relations are followed to their ends, so prequels, sequels, films and OVAs land in one place.',
          },
          {
            n: '02',
            title: 'One ruler per story',
            body: 'Progress is drawn as one block per entry, so “3 of 4” is countable instead of estimated.',
          },
          {
            n: '03',
            title: 'Always a next entry',
            body: 'Not-yet-aired entries are separated from things you can actually watch, so Continue never lies.',
          },
        ].map((item) => (
          <li key={item.n}>
            <span className="num text-small text-ink-3">{item.n}</span>
            <h2 className="mt-2 text-lead font-semibold text-ink">{item.title}</h2>
            <p className="mt-2 max-w-[42ch] text-body text-ink-2">{item.body}</p>
          </li>
        ))}
      </ol>

      {/* ── Real AniList artwork, honestly labelled ─────────────────────── */}
      {covers.length > 0 && (
        <div className="mt-20 border-t border-rule pt-8">
          <div className="flex items-baseline justify-between gap-6">
            <p className="eyebrow">Trending on AniList right now</p>
            <p className="hidden text-small text-ink-3 sm:block">
              Live from the API this app reads
            </p>
          </div>

          <ul className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
            {covers.slice(0, 6).map((media, index) => {
              const title = media.title.english ?? media.title.romaji ?? media.title.native ?? ''
              return (
                <li key={media.id} className="opacity-95">
                  <Cover
                    src={media.coverImage?.extraLarge ?? media.coverImage?.large}
                    alt={title}
                    tint={media.coverImage?.color}
                    ratio="4/5"
                    sizes="(max-width: 640px) 30vw, 16vw"
                    className={cn(index > 3 && 'hidden sm:block')}
                  />
                  <p className="clamp-2 mt-2.5 text-small text-ink-2">{title}</p>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </motion.section>
  )
}
