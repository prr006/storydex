'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Layers, Route, Sparkles } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { ImportDialog } from '@/components/ImportDialog'
import { SpotlightRail } from '@/components/SpotlightRail'
import { Poster, isRemoteArtwork } from '@/components/Artwork'
import { useSpotlight } from '@/lib/useSpotlight'
import { EASE, cascade, riseIn } from '@/lib/motion'

/* ==========================================================================
   Landing — the title card
   --------------------------------------------------------------------------
   One idea, stated once, surrounded by the product's own subject matter.

     · An eyebrow, a two-line editorial headline, a single paragraph.
     · ONE call to action (import) and one quiet escape hatch (the dashboard).
     · Then a live strip of trending AniList artwork, because StoryDex has no
       artwork of its own: the poster wall is fetched from the API at runtime
       and disappears cleanly if the request fails.

   Notably absent: bundled sample posters, feature cards, and a gradient blob
   behind the headline. A premium product states its idea and shows real work.
   ========================================================================== */

const STEPS = [
  {
    icon: Layers,
    step: '01',
    title: 'Grouped into stories',
    body: 'Prequels, sequels and films collapse into one franchise — the way you actually remember them.',
  },
  {
    icon: Route,
    step: '02',
    title: 'Mapped end to end',
    body: 'Every entry in release order on one road, with your position marked. You can see the whole journey.',
  },
  {
    icon: Sparkles,
    step: '03',
    title: 'Always know what’s next',
    body: 'One answer to the only question that matters when you sit down: what do I watch tonight?',
  },
]

export default function LandingPage() {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const { scrollY } = useScroll()
  const artY = useTransform(scrollY, [0, 600], [0, 110])
  const artRotate = useTransform(scrollY, [0, 600], [0, 4])

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar onImportClick={() => setIsImportOpen(true)} />

      <main>
        {/* ══ Hero ═══════════════════════════════════════════════════════ */}
        <section className="grain relative isolate flex min-h-[100svh] items-center overflow-hidden">
          {/* Artwork wall — live AniList covers receding into the light.
              Positioned as decoration; the real rail lives below the fold. */}
          <motion.div
            aria-hidden
            style={{ y: artY, rotate: artRotate }}
            className="pointer-events-none absolute -right-[6%] top-1/2 hidden w-[54%] -translate-y-1/2 lg:block"
          >
            <HeroArtWall />
          </motion.div>

          {/* Mask that dissolves the artwork wall into the ink on the left. */}
          <div
            aria-hidden
            className="absolute inset-0 hidden lg:block"
            style={{
              background:
                'linear-gradient(to right, var(--color-ink-950) 34%, rgba(5,4,16,0.72) 55%, transparent 88%)',
            }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-ink-950 to-transparent"
          />

          {/* ── Copy ──────────────────────────────────────────────────── */}
          <div className="shell relative w-full pb-20 pt-24 lg:pt-20">
            <motion.div variants={cascade} initial="hidden" animate="visible" className="max-w-[46rem]">
              <motion.span variants={riseIn} className="flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-brand-400" />
                <span className="label text-brand-300">Your library, regrouped</span>
              </motion.span>

              <motion.h1
                variants={riseIn}
                className="text-editorial mt-7 text-[clamp(3rem,9vw,7rem)] leading-[0.92] text-chalk"
              >
                Count stories,
                <br />
                <span className="text-brand-gradient">not seasons.</span>
              </motion.h1>

              <motion.p variants={riseIn} className="mt-8 max-w-[52ch] text-lead leading-[1.7] text-mist">
                Your AniList is hundreds of disconnected entries. StoryDex folds them back into the
                franchises they belong to — then shows you exactly where you are inside each one.
              </motion.p>

              <motion.div variants={riseIn} className="mt-11 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(true)}
                  className="group inline-flex items-center gap-2.5 rounded-full bg-chalk px-7 py-3.5 text-[15px] font-semibold text-ink-950 transition-all duration-300 hover:bg-white hover:shadow-[0_20px_60px_-16px_rgba(255,255,255,0.4)]"
                >
                  Import from AniList
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>

                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-2 rounded-full px-3 py-3.5 text-[15px] font-medium text-mist transition-colors hover:text-chalk"
                >
                  Open my library
                  <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </motion.div>

              <motion.p variants={riseIn} className="mt-8 numeric text-[11px] text-veil">
                No account · no server · your list stays in this browser
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* ══ Real AniList artwork, live ════════════════════════════════ */}
        <SpotlightRail
          className="shell relative pb-4 pt-20 md:pt-28"
          label="Live from AniList"
          title="Trending right now"
          note="StoryDex bundles no artwork and no sample library — every poster in this product is an AniList cover fetched from the API."
          action={{ label: 'Import your list', onClick: () => setIsImportOpen(true) }}
        />

        {/* ══ The idea, in three beats ══════════════════════════════════ */}
        <section className="shell relative py-24 md:py-32">
          <div className="flex flex-col gap-4 border-t border-white/[0.07] pt-14 md:flex-row md:items-end md:justify-between">
            <h2 className="text-editorial max-w-[22ch] text-[clamp(1.9rem,4vw,3rem)] leading-[1.02] text-chalk">
              Three moves, and the list finally makes sense
            </h2>
            <p className="max-w-[34ch] text-body-sm leading-relaxed text-mist">
              Built on AniList&apos;s relation graph, so a spin-off never gets mistaken for the next
              chapter.
            </p>
          </div>

          <motion.ol
            variants={cascade}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10"
          >
            {STEPS.map((step) => (
              <motion.li key={step.step} variants={riseIn} className="group relative">
                <div className="flex items-center gap-3">
                  <span className="numeric text-[11px] text-brand-300">{step.step}</span>
                  <span className="h-px flex-1 bg-white/[0.09]" />
                </div>
                <step.icon className="mt-7 size-5 text-mist" aria-hidden />
                <h3 className="mt-5 text-[19px] font-semibold tracking-[-0.01em] text-chalk">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-[36ch] text-body leading-relaxed text-mist">{step.body}</p>
              </motion.li>
            ))}
          </motion.ol>
        </section>

        {/* ══ Closing plate ═════════════════════════════════════════════ */}
        <section className="shell pb-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: EASE }}
            className="grain relative isolate overflow-hidden rounded-[32px] border border-white/[0.07] px-7 py-16 text-center md:px-16 md:py-24"
          >
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(70% 120% at 50% 0%, rgba(113,55,234,0.34) 0%, rgba(53,60,158,0.12) 45%, transparent 72%)',
              }}
            />
            <div className="relative">
              <span className="label text-brand-300">Ready when you are</span>
              <h2 className="text-editorial mx-auto mt-5 max-w-[24ch] text-[clamp(1.9rem,5vw,3.5rem)] leading-[1] text-chalk">
                See your whole library as stories
              </h2>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(true)}
                  className="group inline-flex items-center gap-2.5 rounded-full bg-chalk px-7 py-3.5 text-[15px] font-semibold text-ink-950 transition-all duration-300 hover:bg-white hover:shadow-[0_20px_60px_-16px_rgba(255,255,255,0.4)]"
                >
                  Import from AniList
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-6 py-3.5 text-[15px] font-medium text-chalk transition-colors hover:bg-white/[0.12]"
                >
                  View my dashboard
                </Link>
              </div>
            </div>
          </motion.div>

          <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/[0.07] pt-8 sm:flex-row">
            <span className="text-editorial text-[19px] text-chalk">
              Story<span className="text-brand-300">Dex</span>
            </span>
            <p className="numeric text-[11px] text-veil">
              Data and artwork from AniList · not affiliated with AniList
            </p>
          </footer>
        </section>
      </main>

      <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  )
}

/* ==========================================================================
   HeroArtWall — the poster wall behind the headline.
   --------------------------------------------------------------------------
   Three columns of real AniList covers at receding opacity, so the hero carries
   genuine artwork without bundling any. It shares the spotlight request with
   the trending rail below (one API call for both) and renders nothing at all if
   AniList is unreachable — the hero is composed to hold on typography alone.
   ========================================================================== */

function HeroArtWall() {
  const media = useSpotlight()

  const covers = (media ?? [])
    .filter((m) => isRemoteArtwork(m.coverImage?.extraLarge || m.coverImage?.large))
    .slice(0, 6)

  // Nothing to decorate with: contribute no layout at all.
  if (covers.length < 2) return null

  // Three columns, two covers each, fading further right.
  const columns = [
    { covers: covers.slice(0, 2), opacity: 0.2, offset: 'translate-y-16' },
    { covers: covers.slice(2, 4), opacity: 0.34, offset: 'translate-y-6' },
    { covers: covers.slice(4, 6), opacity: 0.5, offset: '-translate-y-4' },
  ].filter((column) => column.covers.length > 0)

  return (
    <div className="grid grid-cols-3 gap-5">
      {columns.map((column, columnIndex) => (
        <div
          key={columnIndex}
          className={`flex flex-col gap-5 ${column.offset}`}
          style={{ opacity: column.opacity }}
        >
          {column.covers.map((item) => (
            <Poster
              key={item.id}
              src={item.coverImage?.extraLarge || item.coverImage?.large}
              alt=""
              tint={item.coverImage?.color}
              className="aspect-[2/3] w-full rounded-3xl"
              sizes="18vw"
              muted
            />
          ))}
        </div>
      ))}
    </div>
  )
}
