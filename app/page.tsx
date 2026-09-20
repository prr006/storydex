'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { ImportDialog } from '@/components/ImportDialog'
import { WordReveal } from '@/components/Reveal'

const principles = [
  {
    index: '01',
    title: 'See the whole route',
    description: 'Seasons, films, and specials become waypoints on one continuous story — never a flat list again.',
  },
  {
    index: '02',
    title: 'Find your position',
    description: 'Your next unwatched entry is anchored on the route, so you always know where you stand in the story.',
  },
  {
    index: '03',
    title: 'Choose what comes next',
    description: 'An atlas that tells you where to go — while keeping the terrain, the era, and the distance honest.',
  },
]

export default function LandingPage() {
  const [isImportOpen, setIsImportOpen] = useState(false)

  return (
    <div className="app-shell">
      <Navbar onImportClick={() => setIsImportOpen(true)} />
      <main>
        {/* ═══ TITLE PAGE ═══════════════════════════════════════════ */}
        <section className="title-page">
          <div className="tp__contours" aria-hidden="true">
            <div className="tp__ring" />
            <div className="tp__ring tp__ring--2" />
            <div className="tp__ring tp__ring--3" />
            <div className="tp__cross-h" />
            <div className="tp__cross-v" />
            <span className="tp__beacon"><span className="beacon"><i /></span></span>
          </div>
          <div className="tp__route" aria-hidden="true"><i /></div>

          <div className="tp__inner">
            <p className="tp__kicker">
              <i className="eyebrow__dot eyebrow__dot--live" aria-hidden="true" />
              StoryDex — a map for the stories you carry
            </p>

            <h1 className="tp__title">
              <WordReveal text="Every story is a path through time." as="span" delay={0.2} />
            </h1>

            <p className="tp__intro">
              StoryDex turns your AniList library into a living atlas — so you can see where
              you are on each story, what comes next, and how far you have traveled.
            </p>

            <div className="tp__cta">
              <button className="cta" onClick={() => setIsImportOpen(true)} type="button">
                Import from AniList <ArrowRight aria-hidden="true" />
              </button>
              <Link href="/dashboard" className="cta cta--dim">
                Walk through the demo <ArrowRight aria-hidden="true" />
              </Link>
            </div>

            <div className="tp__folio">
              <span>public list</span>
              <span>stored locally</span>
              <span>no account needed</span>
            </div>
          </div>

          <div className="tp__coords">STORYDEX / N° 001 / BEGIN HERE</div>
        </section>

        {/* ═══ TABLE OF CONTENTS ════════════════════════════════════ */}
        <section className="contents">
          <div>
            <p className="eyebrow">
              <i className="eyebrow__dot" aria-hidden="true" /> The premise
            </p>
            <h2 className="h-section">
              Stories are not lists.
            </h2>
            <p className="contents__lead">
              They are paths through time, and you are somewhere on them. StoryDex keeps the
              path intact — from origin to horizon.
            </p>
          </div>

          <div className="contents__list">
            {principles.map(({ index, title, description }) => (
              <div className="content-row" key={title}>
                <span className="content-row__folio">{index}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="colophon">
        <span>StoryDex — count stories, not seasons</span>
        <span>
          <Check aria-hidden="true" style={{ width: 11, height: 11, verticalAlign: -2, marginRight: 6 }} />
          Powered by AniList
        </span>
      </footer>

      <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  )
}
