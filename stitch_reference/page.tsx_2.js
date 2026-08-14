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
    transition: { duration: 0.35, delay: i * 0.06, ease: 'easeOut' },
  }),
}

// ─── Stat card icon map ───────────────────────────────────────────────────────
const PRIMARY_ICONS = [Library, BookOpen, Play, CheckCircle2, Film]
const SECONDARY_ICONS = [LayoutGrid, TrendingUp, Clock, Eye, BarChart3]

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
        { label: 'AniList Entries', value: totalEntries },
        { label: 'StoryDex Stories', value: franchises.length },
        { label: 'Watching', value: watching },
        { label: 'Completed', value: completed },
        { label: 'Movies', value: movies },
      ],
      secondaryStats: [
        { label: 'Completed Stories', value: completedStories },
        { label: 'In Progress', value: storiesInProgress },
        { label: 'Upcoming', value: upcomingReleases },
        { label: 'Not Watched', value: unwatchedEntries },
        { label: 'Avg Completion', value: `${avgCompletion}%` },
      ],
    }
  }, [franchises])

  return (
    <div className="min-h-screen bg-background">
      <Navbar onImportClick={() => setIsImportOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">

        {/* Demo data banner */}
        {!loading && !isImported && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between gap-4 rounded-xl border border-brand/20 bg-brand/8 px-5 py-3"
          >
            <p className="text-sm text-foreground/70">
              You&apos;re viewing example data.{' '}
              <span className="hidden sm:inline">Import your AniList list to see your own library.</span>
            </p>
            <button
              onClick={() => setIsImportOpen(true)}
              className="shrink-0 text-sm font-medium text-brand hover:text-brand-light transition-colors"
            >
              Import Now →
            </button>
          </motion.div>
        )}

        {/* ── Primary stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
          {stats.map((stat, i) => {
            const Icon = PRIMARY_ICONS[i]
            return (
              <motion.div
                key={stat.label}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="bg-card border border-border/50 rounded-xl p-5 hover:border-brand/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/8 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
                  <Icon className="w-4 h-4 text-brand/50" aria-hidden="true" />
                </div>
                <p className="text-3xl font-bold text-foreground tabular-nums">{stat.value}</p>
              </motion.div>
            )
          })}
        </div>

        {/* ── Secondary stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-12">
          {secondaryStats.map((stat, i) => {
            const Icon = SECONDARY_ICONS[i]
            return (
              <motion.div
                key={stat.label}
                custom={i + 5}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="bg-card/60 border border-border/35 rounded-xl p-4 hover:border-brand/20 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
                  <Icon className="w-3.5 h-3.5 text-muted-foreground/40" aria-hidden="true" />
                </div>
                <p className="text-2xl font-bold text-foreground/85 tabular-nums">{stat.value}</p>
              </motion.div>
            )
          })}
        </div>

        {/* ── Section header ── */}
        <motion.div
          custom={10}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Your Franchises</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {franchises.length > 0
              ? `${franchises.length} stories · track your progress across every franchise`
              : 'Import from AniList to see your collection here'}
          </p>
        </motion.div>

        {/* ── Search + Sort row ── */}
        <motion.div
          custom={11}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row gap-2.5 mb-3"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search franchises or titles…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search franchises"
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/50 rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/60 transition-all text-sm"
            />
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            aria-label="Sort franchises"
            className="px-4 py-2.5 bg-card border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/60 transition-all cursor-pointer appearance-none pr-9"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888899' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-card text-foreground">
                {opt.label}
              </option>
            ))}
          </select>
        </motion.div>

        {/* ── Filter chips ── */}
        <motion.div
          custom={12}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex gap-2 mb-8 overflow-x-auto pb-1 scrollbar-none"
          role="group"
          aria-label="Filter by status"
        >
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setActiveFilter(chip.value)}
              aria-pressed={activeFilter === chip.value}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 min-h-[32px] ${
                activeFilter === chip.value
                  ? 'bg-brand border-brand text-white shadow-md shadow-brand/25'
                  : 'bg-card border-border/50 text-muted-foreground hover:border-brand/40 hover:text-foreground'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </motion.div>

        {/* ── Franchise grid ── */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-max">
            {filtered.map((franchise, i) => (
              <FranchiseCard key={franchise.id} franchise={franchise} index={i} />
            ))}
          </div>
        )}

        {/* ── Empty: no search results ── */}
        {!loading && filtered.length === 0 && franchises.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-24 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-card border border-border/50 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-foreground/80 font-medium mb-1">No results found</p>
            <p className="text-sm text-muted-foreground mb-5">
              Try a different search term or adjust the active filter.
            </p>
            <button
              onClick={() => { setQuery(''); setActiveFilter('all') }}
              className="text-sm font-medium text-brand hover:text-brand-light transition-colors"
            >
              Clear filters
            </button>
          </motion.div>
        )}

        {/* ── Empty: nothing imported ── */}
        {!loading && franchises.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-28 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-5 shadow-xl shadow-brand/5">
              <Library className="w-7 h-7 text-brand/70" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Your library is empty</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              Connect your AniList account to group your anime into franchises and track your progress.
            </p>
            <button
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-medium transition-colors shadow-lg shadow-brand/25"
            >
              Import from AniList
            </button>
          </motion.div>
        )}
      </main>

      <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  )
}
