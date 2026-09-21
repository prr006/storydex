'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { WordReveal } from '@/components/Reveal'
import { Beacon } from '@/components/Beacon'
import { ImportDialog } from '@/components/ImportDialog'

/* A hand-plotted sample route for the title sequence:
   six waypoints, the beacon at 63% — the story is mid-route. */
const SAMPLE_TICKS = [0, 17, 34, 50, 63, 88]

export default function Home() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const skyY = useTransform(scrollYProgress, [0, 1], ['0%', '-10%'])
  const contoursY = useTransform(scrollYProgress, [0, 1], ['0%', '7%'])

  return (
    <main className="app-shell">
      <Navbar onImportClick={() => setIsImportOpen(true)} />

      <section ref={sectionRef} className="title-page" aria-labelledby="tp-title">
        <motion.div className="title-page__sky" style={{ y: skyY }} aria-hidden="true" />

        {/* the plotting rose — slowly turning survey rings */}
        <motion.div className="tp__contours" style={{ y: contoursY }} aria-hidden="true">
          <div className="tp__ring" />
          <div className="tp__ring tp__ring--2" />
          <div className="tp__ring tp__ring--3" />
          <div className="tp__cross-h" />
          <div className="tp__cross-v" />
          <span className="tp__beacon"><Beacon /></span>
        </motion.div>

        {/* the faint route crossing the sky, drawn on load */}
        <div className="tp__route" aria-hidden="true">
          <div className="tp__route__base" />
          <div className="tp__route__ink" />
          {SAMPLE_TICKS.map((left, index) => (
            <span
              key={left}
              className={index <= 3 ? 'tp__tick tp__tick--past' : 'tp__tick tp__tick--future'}
              style={{ left: `${left}%` }}
            />
          ))}
          <span className="tp__route__beacon"><Beacon /></span>
          <span className="tp__route__flag">you — entry 04</span>
        </div>

        <div className="tp__inner">
          <p className="tp__kicker">
            <i className="label__dot" aria-hidden="true" />
            field maps for people who finish things
          </p>

          <h1 id="tp-title" className="tp__title">
            <WordReveal text="Every story has a map." as="span" delay={0.7} emphasizeLast />
          </h1>

          <p className="tp__intro">
            StoryDex reads your AniList, finds where one story becomes another, and
            plots your place on each route — so you always know where you stopped,
            and exactly where to pick it up.
          </p>

          <div className="tp__cta">
            <Link href="/dashboard" className="cta">
              Open your atlas <ArrowRight aria-hidden="true" />
            </Link>
            <a href="#contents" className="cta cta--dim">
              How it works <ArrowDown aria-hidden="true" />
            </a>
          </div>
        </div>

        <span className="tp__coords" aria-hidden="true">
          24.9° N · 90.2° E — drawn to scale
        </span>

        <div className="tp__folio" aria-hidden="true">
          <span>StoryDex</span>
          <span>field atlas</span>
          <span>rev. 2026.09</span>
        </div>
      </section>

      {/* ── contents — the principles, set as a table of contents ───── */}
      <section className="contents" id="contents" aria-labelledby="contents-title">
        <p className="label" id="contents-title">
          <i className="label__dot" aria-hidden="true" /> Contents
        </p>
        <h2 className="h-section" style={{ fontSize: 'clamp(36px, 4.6vw, 58px)' }}>
          The atlas, in <em>three movements.</em>
        </h2>
        <p className="contents__lead">
          StoryDex is a local field instrument: it imports from AniList, groups what
          AniList calls a &ldquo;season&rdquo; into the stories it belongs to, and keeps
          everything in your browser.
        </p>

        <div className="contents__list">
          <motion.div
            className="content-row"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-70px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="content-row__folio">01</span>
            <h3>Import</h3>
            <p>
              Search AniList, select the stories you follow, and import them into
              your atlas — progress, scores, and formats come along. Nothing leaves
              your browser.
            </p>
          </motion.div>

          <motion.div
            className="content-row"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-70px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.07 }}
          >
            <span className="content-row__folio">02</span>
            <h3>Chart</h3>
            <p>
              Seasons, films, and specials are grouped into their story and ordered
              into a single route with an origin and a horizon.
            </p>
          </motion.div>

          <motion.div
            className="content-row"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-70px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.14 }}
          >
            <span className="content-row__folio">03</span>
            <h3>Travel</h3>
            <p>
              Every story shows where you stand: what is behind you, where you are
              now, and what the horizon still holds.
            </p>
          </motion.div>
        </div>
      </section>

      <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </main>
  )
}
