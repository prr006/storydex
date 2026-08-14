'use client'

import { useState, useMemo, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { ImportDialog } from '@/components/ImportDialog'
import { useLibrary } from '@/lib/useLibrary'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Tv,
  Film,
  Disc,
  Zap,
  PlayCircle,
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
  /** Tailwind classes for text + border + bg */
  classes: string
}

function getBadge(season: Season, currentYear: number): Badge {
  const isUpcoming =
    season.airingStatus === 'NOT_YET_RELEASED' ||
    (!season.airingStatus && season.year > currentYear)

  if (isUpcoming && (!season.status || season.status === 'PLANNING')) {
    return {
      type: 'UPCOMING',
      label: 'Upcoming',
      icon: '◆',
      classes: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    }
  }
  switch (season.status) {
    case 'COMPLETED':
    case 'REPEATING':
      return { type: 'WATCHED', label: 'Watched', icon: '✓', classes: 'border-green-500/40 bg-green-500/10 text-green-400' }
    case 'CURRENT':
      return { type: 'WATCHING', label: 'Watching', icon: '▶', classes: 'border-blue-500/40 bg-blue-500/10 text-blue-400' }
    case 'PLANNING':
      return { type: 'PLANNING', label: 'Planning', icon: '◎', classes: 'border-purple-500/40 bg-purple-500/10 text-purple-400' }
    case 'PAUSED':
      return { type: 'PAUSED', label: 'Paused', icon: '⏸', classes: 'border-gray-500/40 bg-gray-500/10 text-gray-400' }
    case 'DROPPED':
      return { type: 'DROPPED', label: 'Dropped', icon: '✕', classes: 'border-red-500/40 bg-red-500/10 text-red-400' }
    default:
      return { type: 'NOT_WATCHED', label: 'Not Watched', icon: '○', classes: 'border-border text-muted-foreground bg-transparent' }
  }
}

// ─── Format icon ──────────────────────────────────────────────────────────────
function FormatIcon({ format }: { format?: string }) {
  if (format === 'MOVIE') return <Film className="w-3.5 h-3.5 shrink-0" aria-label="Movie" />
  if (format === 'OVA' || format === 'ONA') return <Disc className="w-3.5 h-3.5 shrink-0" aria-label="OVA/ONA" />
  if (format === 'SPECIAL') return <Zap className="w-3.5 h-3.5 shrink-0" aria-label="Special" />
  return <Tv className="w-3.5 h-3.5 shrink-0" aria-label="TV" />
}

// ─── Collapsible description ──────────────────────────────────────────────────
function Description({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.length > 280
  const display = !isLong || expanded ? text : text.slice(0, 280).trimEnd() + '…'

  return (
    <div>
      <p className="text-sm text-muted-foreground leading-relaxed">{display}</p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center justify-center gap-1 text-xs font-medium text-brand hover:text-brand-light transition-colors min-h-[44px] px-2 -ml-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-expanded={expanded}
        >
          {expanded ? 'Show less' : 'Read more'}
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
          </motion.span>
        </button>
      )}
    </div>
  )
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
        <main className="max-w-7xl mx-auto px-4 py-20 mt-16">
          <div className="animate-pulse flex flex-col gap-8">
            <div className="h-10 w-32 bg-muted rounded-md" />
            <div className="grid md:grid-cols-[260px_1fr] gap-8">
              <div className="w-full aspect-[3/4] bg-muted rounded-2xl" />
              <div className="space-y-4 pt-4">
                <div className="h-10 w-3/4 bg-muted rounded-lg" />
                <div className="h-4 w-1/4 bg-muted rounded-md" />
                <div className="space-y-2 mt-8">
                  <div className="h-4 w-full bg-muted rounded-md" />
                  <div className="h-4 w-5/6 bg-muted rounded-md" />
                  <div className="h-4 w-4/6 bg-muted rounded-md" />
                </div>
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
        <main className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-3">Franchise not found</h1>
          <p className="text-muted-foreground mb-6">This franchise doesn&apos;t exist or has been removed.</p>
          <Link href="/dashboard">
            <Button className="bg-brand hover:bg-brand-dark text-white">Back to Dashboard</Button>
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
  const yearRange = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : 'Unknown'
  const totalEpisodes = franchise.seasons.reduce((sum, s) => sum + s.episodes, 0)
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

  const progressColor = isComplete ? 'from-green-500 to-emerald-400' : 'from-brand to-brand-light'

  return (
    <div className="min-h-screen bg-background">
      <Navbar onImportClick={() => setIsImportOpen(true)} />

      {/* ── Cinematic hero banner ── */}
      {franchise.bannerUrl ? (
        <div className="relative w-full h-56 md:h-72 overflow-hidden">
          <Image
            src={franchise.bannerUrl}
            alt=""
            fill
            priority
            className="object-cover scale-105"
            style={{ filter: 'blur(1px) brightness(0.6)' }}
          />
          {/* Gradient fades: heavy bottom, light top */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 to-transparent" />
        </div>
      ) : (
        <div className="h-16" />
      )}

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 ${franchise.bannerUrl ? '-mt-32 md:-mt-40 relative z-10' : ''}`}>

        {/* ── Back ── */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-6 pt-4"
        >
          <Link href="/dashboard">
            <button
              className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md min-h-[44px] px-2 -ml-2"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Dashboard
            </button>
          </Link>
        </motion.div>

        {/* ── Header: poster + info ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid md:grid-cols-[260px_1fr] gap-8 mb-14"
        >
          {/* Floating poster */}
          <div className="relative w-full md:w-[260px] shrink-0">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border/50 shadow-2xl shadow-black/50">
              <Image
                src={franchise.posterUrl}
                alt={franchise.name}
                fill
                priority
                className="object-cover"
              />
            </div>
            {isComplete && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Complete
              </div>
            )}
          </div>

          {/* Info column */}
          <div className="flex flex-col gap-5">
            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight mb-3">
                {franchise.name}
              </h1>

              {/* Genre chips */}
              {franchise.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {franchise.genres.slice(0, 6).map((genre) => (
                    <span
                      key={genre}
                      className="px-2.5 py-0.5 rounded-full bg-brand/10 text-brand text-[11px] font-medium border border-brand/20"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <Description text={franchise.description} />

            {/* Status legend pills */}
            <div className="flex flex-wrap gap-1.5" aria-label="Status counts">
              {([
                { key: 'WATCHED' as BadgeKey, label: 'Watched', color: 'border-green-500/30 bg-green-500/8 text-green-400' },
                { key: 'WATCHING' as BadgeKey, label: 'Watching', color: 'border-blue-500/30 bg-blue-500/8 text-blue-400' },
                { key: 'PLANNING' as BadgeKey, label: 'Planning', color: 'border-purple-500/30 bg-purple-500/8 text-purple-400' },
                { key: 'NOT_WATCHED' as BadgeKey, label: 'Not Watched', color: 'border-border text-muted-foreground' },
                { key: 'UPCOMING' as BadgeKey, label: 'Upcoming', color: 'border-amber-500/30 bg-amber-500/8 text-amber-400' },
              ] as { key: BadgeKey; label: string; color: string }[])
                .filter(({ key }) => counts[key] > 0)
                .map(({ key, label, color }) => (
                  <span key={key} className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${color}`}>
                    {counts[key]} {label}
                  </span>
                ))}
            </div>

            {/* Story progress */}
            <div className="pt-4 border-t border-border/40">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Story Progress</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {franchise.completedSeasons}/{franchise.totalSeasons}
                  </span>
                  <span className="text-2xl font-bold text-foreground tabular-nums">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>

              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-4">
                <motion.div
                  className={`h-full bg-gradient-to-r ${progressColor} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                />
              </div>

              {/* Stat grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Completed', value: `${franchise.completedSeasons} entries` },
                  { label: 'Total', value: `${franchise.totalSeasons} entries` },
                  { label: 'Episodes', value: totalEpisodes.toLocaleString() },
                  { label: 'Years', value: yearRange },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/50 rounded-lg px-3 py-2.5">
                    <p className="text-[11px] text-muted-foreground mb-0.5 uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-semibold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Timeline ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          aria-labelledby="timeline-heading"
        >
          <h2 id="timeline-heading" className="text-xl font-bold text-foreground mb-6">Timeline</h2>

          <div className="relative">
            {/* Vertical connector line */}
            <div
              className="absolute left-[11px] top-4 bottom-4 w-px bg-border/60"
              aria-hidden="true"
            />

            <div className="space-y-1">
              {franchise.seasons.map((season, i) => {
                const badge = getBadge(season, currentYear)
                const isDimmed = badge.type === 'UPCOMING'
                const prevYear = i > 0 ? franchise.seasons[i - 1].year : null
                const showYearSeparator = season.year > 0 && season.year !== prevYear && i > 0

                return (
                  <div key={season.id}>
                    {/* Year separator */}
                    {showYearSeparator && (
                      <div className="pl-8 py-2 flex items-center gap-2" aria-hidden="true">
                        <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest">
                          {season.year}
                        </span>
                        <div className="flex-1 h-px bg-border/40" />
                      </div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.03, duration: 0.25 }}
                      className={`relative flex items-center gap-3 pl-7 pr-4 py-3 rounded-xl transition-all duration-200 group hover:bg-card/80 hover:shadow-sm ${isDimmed ? 'opacity-60' : ''}`}
                    >
                      {/* Timeline dot */}
                      <div
                        className={`absolute left-0 w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 z-10 shrink-0
                          ${badge.type === 'WATCHED' ? 'bg-green-500/20 border-green-500/60 text-green-400'
                            : badge.type === 'WATCHING' ? 'bg-blue-500/20 border-blue-500/60 text-blue-400'
                            : badge.type === 'UPCOMING' ? 'bg-amber-500/20 border-amber-500/40 text-amber-500'
                            : badge.type === 'PLANNING' ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                            : badge.type === 'DROPPED' ? 'bg-red-500/20 border-red-500/40 text-red-400'
                            : 'bg-muted border-border'
                          }`}
                        aria-hidden="true"
                      >
                        <span className="text-[9px] font-bold">{badge.icon}</span>
                      </div>

                      {/* Title + meta */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-foreground transition-colors">
                          {season.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                          <FormatIcon format={season.format} />
                          <span>{season.format ?? 'TV'}</span>
                          {season.year > 0 && (
                            <>
                              <span className="text-border">·</span>
                              <span>{season.year}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Badge + episodes */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${badge.classes}`}>
                          {badge.label}
                        </span>
                        {season.episodes > 0 && (
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground tabular-nums">{season.episodes}</p>
                            <p className="text-[10px] text-muted-foreground leading-none">ep</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.section>

        {/* ── Next To Watch ── */}
        {franchise.nextToWatch && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-12"
            aria-labelledby="next-heading"
          >
            <h2 id="next-heading" className="text-xl font-bold text-foreground mb-4">Next To Watch</h2>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-brand/20 shadow-lg shadow-brand/5 max-w-xl">
              {/* Poster thumbnail */}
              {franchise.nextToWatch.posterUrl && (
                <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0 border border-border/50">
                  <Image
                    src={franchise.nextToWatch.posterUrl}
                    alt={franchise.nextToWatch.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{franchise.nextToWatch.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                  <FormatIcon format={franchise.nextToWatch.format} />
                  <span>{franchise.nextToWatch.format ?? 'TV'}</span>
                  {franchise.nextToWatch.year > 0 && (
                    <>
                      <span className="text-border">·</span>
                      <span>{franchise.nextToWatch.year}</span>
                    </>
                  )}
                </div>
              </div>

              {(() => {
                const b = getBadge(franchise.nextToWatch, currentYear)
                return (
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${b.classes}`}>
                    <PlayCircle className="w-3 h-3" aria-hidden="true" />
                    {b.label}
                  </span>
                )
              })()}
            </div>
          </motion.section>
        )}
      </main>

      <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  )
}
