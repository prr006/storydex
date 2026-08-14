'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Library,
  BookOpen,
  Play,
  CheckCircle2,
  Film,
  LayoutGrid,
  TrendingUp,
  Clock,
  Eye,
  BarChart3,
  PlayCircle,
  HotelClass,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { ImportDialog } from '@/components/ImportDialog'
import { FranchiseCard } from '@/components/FranchiseCard'
import { useLibrary } from '@/lib/useLibrary'
import {
  useDashboardControls,
  FILTER_CHIPS,
  SORT_OPTIONS,
  type SortOption,
} from '@/lib/useDashboardControls'

// ─── Animation variants ──────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' },
  }),
}

// ─── Stat card icon map ───────────────────────────────────────────────────────
const PRIMARY_ICONS = [Library, BookOpen, Play, CheckCircle2, Film]

export default function Dashboard() {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const { franchises, isImported, loading } = useLibrary()

  const { query, setQuery, sort, setSort, activeFilter, setActiveFilter, filtered } =
    useDashboardControls(franchises)

  const { stats, secondaryStats } = useMemo(() => {
    let totalEntries = 0
    let watching = 0
    let completed = 0
    let movies = 0
    let completedStories = 0
    let storiesInProgress = 0
    let upcomingReleases = 0
    let unwatchedEntries = 0
    let totalCompletionPercentage = 0

    const currentYear = new Date().getFullYear()

    for (const franchise of franchises) {
      totalEntries += franchise.seasons.length

      if (franchise.totalSeasons > 0) {
        totalCompletionPercentage += franchise.completedSeasons / franchise.totalSeasons
        if (franchise.completedSeasons === franchise.totalSeasons) {
          completedStories += 1
        } else if (franchise.completedSeasons > 0) {
          storiesInProgress += 1
        }
      }

      for (const season of franchise.seasons) {
        if (season.status === 'CURRENT') watching += 1
        if (season.completed) completed += 1
        if (season.format === 'MOVIE') movies += 1

        const isUpcoming =
          season.airingStatus === 'NOT_YET_RELEASED' ||
          (!season.airingStatus && season.year > currentYear)
        if (isUpcoming) {
          upcomingReleases += 1
        } else if (season.isExpanded || !season.status) {
          unwatchedEntries += 1
        }
      }
    }

    const avgCompletion =
      franchises.length > 0
        ? Math.round((totalCompletionPercentage / franchises.length) * 100)
        : 0

    return {
      stats: [
        { label: 'Total Stories', value: franchises.length || totalEntries },
        { label: 'Completion', value: `${avgCompletion}%` },
        { label: 'Active', value: watching },
        { label: 'Upcoming', value: upcomingReleases || 5 },
      ],
      secondaryStats: [
        { label: 'AniList Entries', value: totalEntries },
        { label: 'Completed', value: completed },
        { label: 'Movies', value: movies },
        { label: 'In Progress', value: storiesInProgress },
        { label: 'Not Watched', value: unwatchedEntries },
      ],
    }
  }, [franchises])

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md pb-safe">
      <Navbar onImportClick={() => setIsImportOpen(true)} />

      {/* Main Content Area */}
      <main className="pt-32 md:pt-32 pb-24 px-gutter-mobile md:px-gutter-desktop max-w-container-max mx-auto w-full">
        
        {/* Demo data banner */}
        {!loading && !isImported && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-surface/50 px-5 py-3"
          >
            <p className="text-sm text-on-surface-variant/70">
              You&apos;re viewing example data.{' '}
              <span className="hidden sm:inline">Import your AniList list to see your own library.</span>
            </p>
            <button
              onClick={() => setIsImportOpen(true)}
              className="shrink-0 text-sm font-medium text-primary hover:text-primary-fixed-dim transition-colors"
            >
              Import Now →
            </button>
          </motion.div>
        )}

        {/* Header & Stats Summary */}
        <div className="mb-12 fade-in stagger-1">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 w-full">
            <div className="flex-shrink-0">
              <h1 className="font-display-hero-mobile md:font-display-hero text-display-hero-mobile md:text-display-hero text-on-surface mb-4 uppercase tracking-tighter">
                YOUR STORIES
              </h1>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto flex-grow justify-end">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="bg-surface/50 border border-white/5 rounded-xl p-4 flex flex-col justify-center items-start md:items-center"
                >
                  <span className="font-label-caps text-label-caps text-on-surface-variant mb-1 uppercase tracking-widest">
                    {stat.label}
                  </span>
                  <span className={`font-headline-lg text-headline-lg ${
                    stat.label === 'Completion' ? 'text-primary-fixed-dim' :
                    stat.label === 'Active' ? 'text-status-watching' :
                    stat.label === 'Upcoming' ? 'text-status-planning' :
                    'text-on-surface'
                  }`}>
                    {stat.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Controls Bar */}
        <div className="glass-panel sticky top-16 z-40 rounded-xl mb-12 p-4 shadow-lg fade-in stagger-2">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-40" />
              <input
                className="w-full bg-background border border-white/10 rounded-lg pl-12 pr-4 py-3 text-body-sm focus:ring-2 focus:ring-primary-container/50 focus:border-transparent transition-all outline-none placeholder:text-on-surface-variant/40 text-on-surface"
                placeholder="Search your collection..."
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search your collection"
              />
            </div>
            
            {/* Filters & Sort */}
            <div className="flex w-full lg:w-auto items-center gap-3 overflow-x-auto scrollbar-none pb-2 lg:pb-0">
              {FILTER_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => setActiveFilter(chip.value)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-data-tabular text-data-tabular transition-all hover:scale-[1.03] active:translate-y-px ${
                    activeFilter === chip.value
                      ? 'bg-primary-container text-white shadow-[0_0_15px_rgba(124,58,237,0.25)]'
                      : 'border border-white/10 text-on-surface-variant hover:bg-white/10 hover:text-on-surface'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
              <div className="w-px h-6 bg-white/10 mx-2 shrink-0" />
              <button className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-white/10 text-on-surface-variant hover:bg-white/10 transition-all">
                <span className="text-sm">sort</span>
                <span className="font-data-tabular text-data-tabular capitalize">{sort}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Continue Watching Section */}
        {filtered.some(f => f.nextToWatch) && (
          <section className="mb-16 fade-in stagger-3">
            <h2 className="font-section-header text-section-header text-on-surface mb-6 flex items-center gap-3">
              <PlayCircle className="text-primary-container w-6 h-6" />
              Continue Watching
            </h2>
            <div className="flex overflow-x-auto gap-6 pb-6 scrollbar-none snap-x snap-mandatory">
              {filtered.filter(f => f.nextToWatch).slice(0, 5).map((franchise) => {
                const pct = franchise.totalSeasons > 0
                  ? (franchise.completedSeasons / franchise.totalSeasons) * 100
                  : 0
                return (
                  <motion.a
                    key={franchise.id}
                    href={`/franchise/${franchise.id}`}
                    className="snap-start shrink-0 w-[280px] md:w-[360px] group relative rounded-2xl overflow-hidden bg-surface border border-white/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-brand/20 cursor-pointer flex flex-col h-full"
                    whileHover={{ y: -6 }}
                  >
                    <div className="aspect-[16/9] relative overflow-hidden shrink-0">
                      <div 
                        className="bg-cover bg-center w-full h-full transform transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url(${franchise.bannerUrl || franchise.posterUrl})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                      <div className="absolute top-3 left-3 bg-surface/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded font-label-caps text-label-caps text-on-surface uppercase flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-status-watching animate-pulse" />
                        {franchise.completedSeasons}/{franchise.totalSeasons} Entries
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-grow bg-surface z-10 -mt-6 relative">
                      <h3 className="font-headline-lg text-section-header text-on-surface truncate mb-1">
                        {franchise.name}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant truncate mb-4">
                        {franchise.genres.slice(0, 3).join(' • ')}
                      </p>
                      <div className="mt-auto">
                        <div className="flex justify-between items-end mb-2">
                          <span className="font-data-tabular text-data-tabular text-primary-fixed-dim">
                            Next: {franchise.nextToWatch?.name || 'Unknown'}
                          </span>
                          <span className="font-data-tabular text-data-tabular text-on-surface-variant">
                            {Math.round(pct)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-muted-deep rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-secondary-container to-primary-container rounded-full shadow-[0_0_10px_rgba(124,58,237,0.5)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.a>
                )
              })}
            </div>
          </section>
        )}

        {/* Full Collection Grid */}
        <section className="fade-in stagger-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-section-header text-section-header text-on-surface">Full Collection</h2>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-surface border border-white/10 text-on-surface-variant hover:text-primary transition-colors">
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {filtered.map((franchise, i) => (
                <FranchiseCard key={franchise.id} franchise={franchise} index={i} />
              ))}
            </div>
          ) : !loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-24 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-surface border border-white/10 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-on-surface/80 font-medium mb-1">No results found</p>
              <p className="text-sm text-on-surface-variant mb-5">
                Try a different search term or adjust the active filter.
              </p>
              <button
                onClick={() => { setQuery(''); setActiveFilter('all') }}
                className="text-sm font-medium text-primary hover:text-primary-fixed-dim transition-colors"
              >
                Clear filters
              </button>
            </motion.div>
          ) : null}
        </section>
      </main>

      <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  )
}
