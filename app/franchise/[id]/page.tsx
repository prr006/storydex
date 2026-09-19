'use client'

import { use, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, ExternalLink, Film, Play, Radio, Route, Tv } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { ImportDialog } from '@/components/ImportDialog'
import { StoryPath, StoryWaypoint, getWaypointStates } from '@/components/StoryPath'
import { useLibrary } from '@/lib/useLibrary'
import type { Season } from '@/lib/franchise'

interface PageProps {
  params: Promise<{ id: string }>
}

function formatIcon(format?: string) {
  return format === 'MOVIE' ? <Film aria-hidden="true" /> : <Tv aria-hidden="true" />
}

function currentSeason(franchise: { seasons: Season[]; nextToWatch?: Season | null }) {
  return franchise.nextToWatch || franchise.seasons.find((season) => season.status === 'CURRENT') || null
}

export default function FranchiseDetail({ params }: PageProps) {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const { id } = use(params)
  const { franchises, loading } = useLibrary()
  const franchise = franchises.find((item) => item.id === id)

  const data = useMemo(() => {
    if (!franchise) return null
    const years = franchise.seasons.map((season) => season.year).filter(Boolean)
    const totalEpisodes = franchise.seasons.reduce((sum, season) => sum + (season.episodes || 0), 0)
    const completedEpisodes = franchise.seasons.reduce((sum, season) => {
      if (season.completed) return sum + (season.episodes || 0)
      return sum + Math.min(season.progress || 0, season.episodes || 0)
    }, 0)
    const formats = Array.from(new Set(franchise.seasons.map((season) => season.format || 'TV')))
    return {
      progress: franchise.totalSeasons ? Math.round((franchise.completedSeasons / franchise.totalSeasons) * 100) : 0,
      years: years.length ? `${Math.min(...years)} — ${Math.max(...years)}` : 'undated',
      totalEpisodes,
      completedEpisodes,
      formats,
      next: currentSeason(franchise),
      waypoints: getWaypointStates(franchise),
    }
  }, [franchise])

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onImportClick={() => setIsImportOpen(true)} />
        <div className="dashboard-skeleton franchise-skeleton"><div className="skeleton-hero" /><div className="skeleton-block" /></div>
      </div>
    )
  }

  if (!franchise || !data) {
    return (
      <div className="app-shell">
        <Navbar onImportClick={() => setIsImportOpen(true)} />
        <section className="not-found">
          <p className="eyebrow"><i className="eyebrow__dot" /> Unmapped territory</p>
          <h1>That story is not<br />in your library.</h1>
          <Link href="/dashboard" className="button button--light"><ArrowLeft aria-hidden="true" /> Back to the map</Link>
        </section>
        <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      </div>
    )
  }

  return (
    <div className="app-shell franchise-page">
      <Navbar onImportClick={() => setIsImportOpen(true)} />
      <main>
        <section className="franchise-hero">
          <div className="franchise-hero__backdrop">
            <Image src={franchise.bannerUrl || franchise.posterUrl} alt="" fill priority sizes="100vw" className="object-cover" />
          </div>
          <div className="franchise-hero__wash" />
          <div className="franchise-hero__content">
            <Link href="/dashboard" className="back-link"><ArrowLeft aria-hidden="true" /> all stories</Link>
            <div className="franchise-hero__body">
              <div className="franchise-hero__poster">
                <Image src={franchise.posterUrl} alt={franchise.name} fill sizes="220px" className="object-cover" />
              </div>
              <div className="franchise-hero__copy">
                <div className="tag-line">{franchise.genres.slice(0, 4).map((genre) => <span key={genre}>{genre}</span>)}</div>
                <p className="franchise-hero__kicker">A story in {franchise.seasons.length} movements</p>
                <h1>{franchise.name}</h1>
                <p className="franchise-hero__description">{franchise.description}</p>
                <div className="franchise-hero__metrics">
                  <span><strong>{data.progress}%</strong> complete</span>
                  <span><strong>{franchise.completedSeasons}</strong> of {franchise.totalSeasons} entries</span>
                  {data.next && <span className="metric-live"><i /> currently at {data.next.name}</span>}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="franchise-layout">
          <div className="franchise-layout__main">
            {data.next && (
              <section className="next-destination">
                <div className="next-destination__label"><i className="eyebrow__dot eyebrow__dot--orange" /> Next destination</div>
                <div className="next-destination__body">
                  <div className="next-destination__art">
                    <Image src={data.next.posterUrl || franchise.posterUrl} alt="" fill sizes="190px" className="object-cover" />
                    <span><Play aria-hidden="true" /></span>
                  </div>
                  <div className="next-destination__copy">
                    <p>{franchise.name} · waypoint {franchise.seasons.findIndex((season) => season.id === data.next?.id) + 1}</p>
                    <h2>{data.next.name}</h2>
                    <div className="destination-meta">
                      <span>{formatIcon(data.next.format)} {data.next.format || 'TV'}</span>
                      <span>{data.next.year || 'undated'}</span>
                      <span>{data.next.episodes || '?'} episodes</span>
                    </div>
                    <Link href={data.next.siteUrl || '#'} target={data.next.siteUrl ? '_blank' : undefined} rel={data.next.siteUrl ? 'noreferrer' : undefined} className="button button--light">
                      Open destination <ExternalLink aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </section>
            )}

            <StoryPath franchise />

            <section className="story-ledger" aria-labelledby="record-title">
              <div className="section-intro section-intro--tight">
                <div>
                  <p className="eyebrow"><i className="eyebrow__dot" /> The record</p>
                  <h2 id="record-title">Every place you&apos;ve been.</h2>
                </div>
                <span className="section-count">{franchise.seasons.length} waypoints</span>
              </div>
              <div className="story-ledger__list">
                {data.waypoints.map(({ season, state }, index) => (
                  <StoryWaypoint key={season.id} season={season} state={state} index={index} />
                ))}
              </div>
            </section>
          </div>

          <aside className="franchise-rail">
            <div className="rail-sticky">
              <div className="rail-note">
                <Route aria-hidden="true" />
                <p>Route note</p>
                <strong>{franchise.name} is a continuous story told across {franchise.seasons.length} entries.</strong>
              </div>

              <div className="rail-data">
                <p className="eyebrow"><i className="eyebrow__dot" /> Field notes</p>
                <dl>
                  <div><dt><CalendarDays /> Timeline</dt><dd>{data.years}</dd></div>
                  <div><dt><Clock3 /> Episodes logged</dt><dd>{data.completedEpisodes} / {data.totalEpisodes || '—'}</dd></div>
                  <div><dt><Radio /> Formats</dt><dd>{data.formats.join(' · ')}</dd></div>
                </dl>
              </div>

              <div className="rail-progress">
                <div className="rail-progress__top"><span>Distance traveled</span><strong>{data.progress}%</strong></div>
                <div className="readout-line"><span style={{ width: `${data.progress}%` }} /></div>
                <div className="rail-progress__bottom"><span>{franchise.completedSeasons} recorded</span><span>{franchise.totalSeasons - franchise.completedSeasons} remain</span></div>
                <div className="rail-progress__stamp"><Check aria-hidden="true" /> updated from your library</div>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  )
}