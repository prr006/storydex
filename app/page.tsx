'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Compass, Map, Route } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { ImportDialog } from '@/components/ImportDialog'

const principles = [
  { icon: Map, index: '01', title: 'See the whole route', description: 'Seasons, films, and specials become waypoints on one continuous story.' },
  { icon: Route, index: '02', title: 'Find your position', description: 'Your next unwatched entry is always anchored in the journey.' },
  { icon: Compass, index: '03', title: 'Choose what comes next', description: 'A library that tells you where to go without flattening the story.' },
]

export default function LandingPage() {
  const [isImportOpen, setIsImportOpen] = useState(false)

  return (
    <div className="app-shell landing-page">
      <Navbar onImportClick={() => setIsImportOpen(true)} />
      <main>
        <section className="landing-hero">
          <div className="landing-hero__orbit landing-hero__orbit--one" />
          <div className="landing-hero__orbit landing-hero__orbit--two" />
          <div className="landing-hero__stars" />
          <div className="landing-hero__content">
            <p className="eyebrow"><i className="eyebrow__dot eyebrow__dot--live" /> A map for the stories you carry</p>
            <h1>Every story<br />leaves a <em>trace.</em></h1>
            <p className="landing-hero__intro">
              StoryDex turns your AniList library into a living terrain — so you can see where you are, what comes next, and how far you have traveled.
            </p>
            <div className="landing-hero__actions">
              <button className="button button--light" onClick={() => setIsImportOpen(true)}>Import from AniList <ArrowRight aria-hidden="true" /></button>
              <Link href="/dashboard" className="landing-demo-link">Walk through the demo <ArrowRight aria-hidden="true" /></Link>
            </div>
            <div className="landing-hero__note"><Check aria-hidden="true" /> Public list · stored locally · no account needed</div>
          </div>
          <div className="landing-hero__coordinates">STORYDEX / 00° 00′ / BEGIN HERE</div>
          <div className="landing-hero__route">
            <span>origin</span><i /><i /><i /><i /><strong>your library</strong><i /><i /><i /><span>horizon</span>
          </div>
        </section>

        <section className="principles-section">
          <div className="section-intro">
            <div>
              <p className="eyebrow"><i className="eyebrow__dot" /> The premise</p>
              <h2>Stories are not lists.</h2>
            </div>
            <p>They are paths through time. StoryDex keeps the path intact.</p>
          </div>
          <div className="principles-grid">
            {principles.map(({ icon: Icon, index, title, description }) => (
              <div className="principle" key={title}>
                <div className="principle__top"><span>{index}</span><Icon aria-hidden="true" /></div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <span>StoryDex / count stories, not seasons</span>
        <span>Powered by AniList</span>
      </footer>
      <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  )
}