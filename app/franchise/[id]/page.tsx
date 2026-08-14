'use client'

import { useState, useMemo, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { ImportDialog } from '@/components/ImportDialog'
import { useLibrary } from '@/lib/useLibrary'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  CheckCircle2,
  Tv,
  Film,
  Disc,
  Zap,
  PlayCircle,
  CheckCircle,
  Activity,
  Calendar,
  Library,
  Tag,
  Star,
  Play,
  Bookmark,
} from 'lucide-react'
import type { Season } from '@/lib/franchise'

interface PageProps {
  params: Promise<{ id: string }>
}

// ─── Badge helpers ─────────────────────────────────────────────────────────────
type BadgeKey = 'WATCHED' | 'WATCHING' | 'PLANNING' | 'PAUSED' | 'DROPPED' | 'NOT_WATCHED' | 'UPCOMING'

interface Badge {
  type: BadgeKey
  label: string
  icon: string
  classes: string
}

function getBadge(season: Season, currentYear: number): Badge {
  const isUpcoming =
    season.airingStatus === 'NOT_YET_RELEASED' ||
    (!season.airingStatus && season.year > currentYear)

  if (isUpcoming && (!season.status || season.status === 'PLANNING')) {
    return {
      type: 'UPCOMING',
      label: 'Planned',
      icon: 'bookmark',
      classes: 'bg-status-planning/5 text-status-planning border border-status-planning/20',
    }
  }
  switch (season.status) {
    case 'COMPLETED':
    case 'REPEATING':
      return { type: 'WATCHED', label: 'Watched', icon: 'check', classes: 'bg-status-watched/10 text-status-watched border border-status-watched/30' }
    case 'CURRENT':
      return { type: 'WATCHING', label: 'Watching', icon: 'play_arrow', classes: 'bg-status-watching/20 text-status-watching border border-status-watching/50' }
    case 'PLANNING':
      return { type: 'PLANNING', label: 'Planning', icon: 'bookmark', classes: 'bg-status-planning/5 text-status-planning border border-status-planning/20' }
    case 'PAUSED':
      return { type: 'PAUSED', label: 'Paused', icon: 'pause', classes: 'bg-white/5 text-on-surface-variant border border-white/10' }
    case 'DROPPED':
      return { type: 'DROPPED', label: 'Dropped', icon: 'close', classes: 'bg-red-500/10 text-red-400 border border-red-500/20' }
    default:
      return { type: 'NOT_WATCHED', label: 'Not Watched', icon: 'circle', classes: 'border-border text-muted-foreground bg-transparent' }
  }
}

// ─── Format icon ──────────────────────────────────────────────────────────────
function FormatIcon({ format }: { format?: string }) {
  if (format === 'MOVIE') return <Film className="w-[14px] h-[14px]" />
  if (format === 'OVA' || format === 'ONA') return <Disc className="w-[14px] h-[14px]" />
  if (format === 'SPECIAL') return <Zap className="w-[14px] h-[14px]" />
  return <Tv className="w-[14px] h-[14px]" />
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FranchiseDetail({ params }: PageProps) {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const { id } = use(params)
  const { franchises, loading } = useLibrary()

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onImportClick={() => setIsImportOpen(true)} />
        <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-20 mt-16">
          <div className="animate-pulse flex flex-col gap-8">
            <div className="h-10 w-32 bg-surface rounded-md" />
            <div className="grid lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-4">
                <div className="h-[400px] bg-surface rounded-2xl" />
              </div>
              <div className="lg:col-span-4 space-y-4">
                <div className="h-40 bg-surface rounded-2xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const franchise = franchises.find((f) => f.id === id)

  if (!franchise) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onImportClick={() => setIsImportOpen(true)} />
        <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-20 text-center">
          <h1 className="text-2xl font-bold text-on-surface mb-3">Franchise not found</h1>
          <p className="text-on-surface-variant mb-6">This franchise doesn&apos;t exist or has been removed.</p>
          <Link href="/dashboard">
            <Button className="bg-primary-container hover:bg-primary text-white">Back to Dashboard</Button>
          </Link>
        </main>
        <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      </div>
    )
  }

  const progress = franchise.totalSeasons > 0
    ? (franchise.completedSeasons / franchise.totalSeasons) * 100
    : 0
  const isComplete = franchise.completedSeasons === franchise.totalSeasons && franchise.totalSeasons > 0
  const years = franchise.seasons.map((s) => s.year).filter((y) => y > 0)
  const yearRange = years.length ? `${Math.min(...years)} - Present` : 'Unknown'
  const totalEpisodes = franchise.seasons.reduce((sum, s) => sum + (s.episodes || 0), 0)
  const currentYear = new Date().getFullYear()

  const counts = useMemo(() => {
    const c: Record<BadgeKey, number> = {
      WATCHED: 0, WATCHING: 0, PLANNING: 0, PAUSED: 0, DROPPED: 0, NOT_WATCHED: 0, UPCOMING: 0,
    }
    franchise.seasons.forEach((s) => {
      const b = getBadge(s, currentYear)
      c[b.type]++
    })
    return c
  }, [franchise, currentYear])

  // Calculate circular progress
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md pb-24 md:pb-0">
      <Navbar onImportClick={() => setIsImportOpen(true)} />

      {/* ── Hero Section ── */}
      <section className="relative w-full h-[500px] md:h-[600px] min-h-[400px]">
        {/* Background Image */}
        {franchise.bannerUrl ? (
          <>
            <div className="absolute inset-0 z-0">
              <Image
                src={franchise.bannerUrl}
                alt=""
                fill
                priority
                className="object-cover opacity-60"
                style={{ filter: 'blur(1px)' }}
              />
              {/* Gradient Scrim for Better Readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-surface-container to-background" />
        )}

        {/* Hero Content */}
        <div className="relative z-20 container mx-auto px-gutter-mobile md:px-gutter-desktop h-full flex items-end pb-16 max-w-container-max">
          <div className="flex flex-col md:flex-row gap-8 items-end w-full">
            {/* Poster - overlaps hero */}
            <div className="w-1/3 md:w-[180px] shrink-0 -mb-16 md:-mb-24 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5),_0_0_30px_rgba(124,58,237,0.3)] border border-white/10 aspect-[3/4] hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5),_0_0_50px_rgba(124,58,237,0.5)] transition-all duration-500 z-30">
              <Image
                src={franchise.posterUrl}
                alt={franchise.name}
                width={180}
                height={240}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Meta Data */}
            <div className="flex-1 text-left pb-4 relative z-30">
              {/* Genre chips */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {franchise.genres.slice(0, 4).map((genre) => (
                  <span
                    key={genre}
                    className="bg-primary-container/20 border border-primary/30 text-primary-fixed-dim px-2.5 py-1 rounded font-label-caps text-[10px] uppercase tracking-widest backdrop-blur-md shadow-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <h1 className="font-display-hero-mobile md:font-display-hero text-display-hero-mobile md:text-display-hero text-on-surface mb-3 text-shadow tracking-tighter">
                {franchise.name}
              </h1>

              {/* Stats row */}
              <div className="flex items-center gap-4 mb-5 font-data-tabular text-sm text-on-surface-variant text-shadow-sm flex-wrap">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-[18px] h-[18px] text-primary" />
                  <span className="text-on-surface font-semibold">{franchise.completedSeasons} / {franchise.totalSeasons} Entries</span>
                </div>
                <span className="text-white/30">•</span>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-[18px] h-[18px] text-primary" />
                  <span className="text-on-surface font-semibold">{Math.round(progress)}% Complete</span>
                </div>
                {!isComplete && (
                  <>
                    <span className="text-white/30">•</span>
                    <div className="flex items-center gap-1.5 text-status-watching">
                      <span className="w-2 h-2 rounded-full bg-status-watching animate-pulse" />
                      <span>Watching</span>
                    </div>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl text-shadow-sm leading-relaxed drop-shadow-md line-clamp-3">
                {franchise.description || 'No description available.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Grid ── */}
      <div className="container mx-auto px-gutter-mobile md:px-gutter-desktop max-w-container-max relative z-20 mt-16 md:mt-24 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content (Timeline & Next to Watch) */}
          <div className="lg:col-span-8 flex flex-col gap-12">
            
            {/* Next To Watch Card - Elevated CTA */}
            {franchise.nextToWatch && (
              <section className="relative fade-in stagger-1">
                <div className="absolute -inset-1 bg-gradient-to-r from-brand/20 via-primary-container/20 to-transparent blur-xl rounded-3xl opacity-50" />
                <div className="bg-surface-container-high border border-primary/20 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 mix-blend-overlay pointer-events-none">
                    <PlayCircle className="w-24 h-24" />
                  </div>
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
                    {/* Thumbnail */}
                    <div className="w-full md:w-48 aspect-video rounded-xl overflow-hidden shrink-0 bg-muted relative shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/10 group-hover:border-primary/50 transition-colors duration-500">
                      <Image
                        src={franchise.nextToWatch.posterUrl || franchise.posterUrl}
                        alt={franchise.nextToWatch.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors duration-500 flex items-center justify-center backdrop-blur-[2px] group-hover:backdrop-blur-0">
                        <Play className="w-12 h-12 text-white group-hover:scale-110 transition-transform duration-500 shadow-xl drop-shadow-[0_0_15px_rgba(124,58,237,0.8)]" />
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 w-full">
                      <div className="font-label-caps text-label-caps text-status-watching uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-status-watching shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse" />
                        Up Next • {franchise.nextToWatch.name}
                      </div>
                      <div className="flex items-center gap-4 font-data-tabular text-[12px] md:text-data-tabular text-on-surface-variant mb-6 bg-black/20 w-fit px-3 py-1.5 rounded-md border border-white/5">
                        <span className="flex items-center gap-1.5">
                          <FormatIcon format={franchise.nextToWatch.format} />
                          {franchise.nextToWatch.format || 'TV'}
                        </span>
                        <span className="text-white/20">•</span>
                        <span>{franchise.nextToWatch.year || 'Unknown'}</span>
                        {franchise.nextToWatch.episodes > 0 && (
                          <>
                            <span className="text-white/20">•</span>
                            <span>{franchise.nextToWatch.episodes} eps</span>
                          </>
                        )}
                      </div>
                      <button className="w-full md:w-auto bg-primary text-on-primary hover:bg-primary-fixed transition-colors duration-300 font-label-caps text-[13px] uppercase tracking-wider font-bold py-3 px-8 rounded-lg shadow-[0_0_20px_rgba(124,58,237,0.3)] flex items-center justify-center gap-2">
                        <Play className="w-[18px] h-[18px]" />
                        Resume Watching
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Story Map Section (Timeline) */}
            <section className="fade-in stagger-2">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-section-header text-section-header text-on-surface flex items-center gap-3">
                  <Tag className="text-primary w-6 h-6" />
                  Franchise Map
                </h2>
                <div className="hidden md:flex gap-4 font-data-tabular text-[11px] text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-status-watched" /> Watched
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-status-watching" /> Watching
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-status-planning" /> Planned
                  </div>
                </div>
              </div>

              <div className="relative flex flex-col gap-2">
                {franchise.seasons.map((season, i) => {
                  const badge = getBadge(season, currentYear)
                  const isDimmed = badge.type === 'UPCOMING' || badge.type === 'NOT_WATCHED'
                  
                  return (
                    <div key={season.id} className={`relative story-map-node group ${isDimmed ? 'opacity-70 hover:opacity-100' : ''}`}>
                      {/* Vertical line */}
                      {i < franchise.seasons.length - 1 && (
                        <div className="story-map-line absolute left-[15px] md:left-[31px] top-6 bottom-[-8px] w-px bg-white/10" />
                      )}
                      
                      <div className="relative z-10 flex items-start gap-4 md:gap-6 py-2">
                        {/* Map Node Marker */}
                        <div className="w-8 h-8 md:w-16 md:h-16 shrink-0 flex items-center justify-center mt-2 md:mt-0">
                          <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center relative z-10 ${
                            badge.type === 'WATCHED' ? 'bg-status-watched/20 border-2 border-status-watched shadow-[0_0_15px_rgba(74,222,128,0.3)]' :
                            badge.type === 'WATCHING' ? 'bg-status-watching/20 border-2 border-status-watching shadow-[0_0_20px_rgba(96,165,250,0.5)]' :
                            badge.type === 'PLANNING' || badge.type === 'UPCOMING' ? 'bg-status-planning/10 border-2 border-status-planning/50 border-dashed' :
                            'bg-white/5 border-2 border-white/10'
                          }`}>
                            {badge.type === 'WATCHED' && <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-status-watched" />}
                            {badge.type === 'WATCHING' && <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-status-watching animate-pulse" />}
                            {badge.type === 'PLANNING' && <Bookmark className="w-2 h-2 md:w-3 md:h-3 text-status-planning" />}
                          </div>
                        </div>

                        {/* Card */}
                        <div className={`flex-1 rounded-xl p-3 md:p-4 flex gap-4 transition-all duration-300 ${
                          badge.type === 'WATCHING' 
                            ? 'bg-surface-container border-l-4 border-l-status-watching border-y border-r border-white/10 shadow-xl relative overflow-hidden' 
                            : 'bg-surface-container-low/50 hover:bg-surface-container border border-white/5 hover:border-white/10 shadow-lg'
                        }`}>
                          {badge.type === 'WATCHING' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-status-watching/5 to-transparent pointer-events-none" />
                          )}
                          
                          {/* Thumbnail */}
                          <div className="w-16 h-24 shrink-0 rounded-md bg-muted overflow-hidden border border-white/10 relative">
                            <Image
                              src={season.posterUrl || franchise.posterUrl}
                              alt={season.name}
                              fill
                              className="object-cover"
                            />
                            {badge.type === 'WATCHED' && (
                              <div className="absolute inset-0 bg-status-watched/10 mix-blend-overlay" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 flex flex-col justify-center">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
                              <h4 className="font-section-header text-[16px] md:text-[18px] text-on-surface font-bold leading-tight">
                                {season.name}
                              </h4>
                              <span className={`${badge.classes} px-2 py-0.5 rounded-sm font-data-tabular text-[10px] uppercase tracking-widest flex items-center gap-1 w-fit`}>
                                {badge.icon === 'check' && <CheckCircle2 className="w-3 h-3" />}
                                {badge.icon === 'play_arrow' && <PlayCircle className="w-3 h-3" />}
                                {badge.icon === 'bookmark' && <Bookmark className="w-3 h-3" />}
                                {badge.label}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 font-data-tabular text-[11px] md:text-[12px] text-on-surface-variant">
                              <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded text-white/80">
                                <FormatIcon format={season.format} />
                                {season.format || 'TV'}
                              </span>
                              <span className="text-white/20 hidden md:inline">•</span>
                              {season.year > 0 && <span>{season.year}</span>}
                              <span className="text-white/20 hidden md:inline">•</span>
                              <span>{season.episodes || '?'} Eps</span>
                            </div>
                            {/* Progress bar for watching */}
                            {badge.type === 'WATCHING' && season.progress && (
                              <div className="w-full md:w-2/3 h-1.5 bg-black/50 rounded-full overflow-hidden mt-2">
                                <div 
                                  className="h-full bg-status-watching rounded-full shadow-[0_0_8px_rgba(96,165,250,0.8)]"
                                  style={{ width: `${season.progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          {/* Side Rail (Stats & Meta) */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-6">
              
              {/* Franchise Data Card */}
              <div className="bg-surface-container-high/50 border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-sm fade-in stagger-3">
                <h3 className="font-label-caps text-label-caps text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Library className="w-4 h-4" />
                  Franchise Data
                </h3>
                <div className="flex flex-col gap-5">
                  <div className="flex justify-between items-center group">
                    <span className="font-data-tabular text-[12px] text-on-surface-variant flex items-center gap-2">
                      <Calendar className="w-4 h-4 opacity-70 group-hover:text-primary transition-colors" />
                      Timeline
                    </span>
                    <span className="font-data-tabular text-[13px] text-on-surface bg-white/5 px-2 py-1 rounded">{yearRange}</span>
                  </div>
                  <hr className="border-white/5" />
                  <div className="flex justify-between items-center group">
                    <span className="font-data-tabular text-[12px] text-on-surface-variant flex items-center gap-2">
                      <Library className="w-4 h-4 opacity-70 group-hover:text-primary transition-colors" />
                      Total Entries
                    </span>
                    <span className="font-data-tabular text-[13px] text-on-surface bg-white/5 px-2 py-1 rounded">{franchise.seasons.length} Items</span>
                  </div>
                  <hr className="border-white/5" />
                  <div className="flex justify-between items-center group">
                    <span className="font-data-tabular text-[12px] text-on-surface-variant flex items-center gap-2">
                      <Tag className="w-4 h-4 opacity-70 group-hover:text-primary transition-colors" />
                      Formats
                    </span>
                    <div className="flex gap-2">
                      {Array.from(new Set(franchise.seasons.map(s => s.format))).slice(0, 3).map((fmt) => (
                        <span key={fmt} className="bg-white/5 px-2 py-1 rounded font-data-tabular text-[11px] text-on-surface flex items-center gap-1">
                          <FormatIcon format={fmt} />
                          {fmt || 'TV'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Visualization Card */}
              <div className="bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden fade-in stagger-4">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary-container/20 rounded-full blur-2xl" />
                <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-6 relative z-10">
                  Story Completion
                </h3>
                <div className="relative z-10 flex flex-col items-center justify-center py-4">
                  {/* Circular Progress */}
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle 
                        className="text-white/5 stroke-current" 
                        cx="50" cy="50" 
                        fill="transparent" 
                        r="45" 
                        strokeWidth="8" 
                      />
                      <circle 
                        className="text-primary stroke-current" 
                        cx="50" cy="50" 
                        fill="transparent" 
                        r="45" 
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        strokeWidth="8"
                        style={{ filter: 'drop-shadow(0 0 4px rgba(124,58,237,0.5))' }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="font-display-hero-mobile text-[32px] font-bold text-on-surface leading-none">
                        {Math.round(progress)}<span className="text-[16px] text-primary">%</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 relative z-10">
                  <div className="bg-surface-container-high rounded-lg p-3 text-center border border-white/5">
                    <div className="font-data-tabular text-[18px] text-on-surface font-bold mb-1">
                      {franchise.completedSeasons} / {franchise.totalSeasons}
                    </div>
                    <div className="font-label-caps text-[9px] text-on-surface-variant uppercase">Entries</div>
                  </div>
                  <div className="bg-surface-container-high rounded-lg p-3 text-center border border-white/5">
                    <div className="font-data-tabular text-[18px] text-on-surface font-bold mb-1">
                      {totalEpisodes}
                    </div>
                    <div className="font-label-caps text-[9px] text-on-surface-variant uppercase">Episodes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  )
}
