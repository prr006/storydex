'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { Franchise } from '@/lib/franchise'

interface FranchiseCardProps {
  franchise: Franchise
  index?: number
}

export function FranchiseCard({ franchise, index = 0 }: FranchiseCardProps) {
  const pct = franchise.totalSeasons > 0
    ? (franchise.completedSeasons / franchise.totalSeasons) * 100
    : 0
  const isComplete = franchise.completedSeasons === franchise.totalSeasons && franchise.totalSeasons > 0

  // Contextual progress bar colour
  const progressColor = isComplete
    ? 'from-green-500 to-emerald-400'
    : pct >= 50
      ? 'from-brand to-brand-light'
      : 'from-brand-dark to-brand'

  return (
    <Link href={`/franchise/${franchise.id}`} aria-label={`View ${franchise.name}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.6), ease: 'easeOut' }}
        whileHover={{ y: -6, transition: { duration: 0.18, ease: 'easeOut' } }}
        className="group relative h-full cursor-pointer"
      >
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border/60 h-full transition-all duration-300 group-hover:border-brand/25 group-hover:shadow-2xl group-hover:shadow-brand/15">

          {/* Poster */}
          <div className="relative w-full aspect-[3/4] overflow-hidden bg-muted">
            <Image
              src={franchise.posterUrl}
              alt={franchise.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Multi-layer gradient for strong text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Complete badge */}
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(index * 0.04, 0.6) + 0.15 }}
                className="absolute top-2.5 right-2.5 bg-green-500/90 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-lg"
              >
                <span>✓</span>
                <span>Complete</span>
              </motion.div>
            )}
          </div>

          {/* Footer content overlaid on gradient */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-[15px] font-semibold text-white mb-3 line-clamp-2 leading-snug">
              {franchise.name}
            </h3>

            {/* Progress section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-medium">
                <span className="text-white/60">Story Progress</span>
                <span className="text-white/80 tabular-nums">
                  {franchise.completedSeasons}/{franchise.totalSeasons}
                  <span className="ml-1.5 text-white/50">({Math.round(pct)}%)</span>
                </span>
              </div>

              {/* Track */}
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${progressColor} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut', delay: Math.min(index * 0.04, 0.6) + 0.1 }}
                />
              </div>

              {/* Next / Complete label */}
              <div className="h-4 flex items-center">
                {isComplete ? (
                  <span className="text-[11px] font-medium text-green-400 flex items-center gap-1">
                    <span>✓</span> All caught up
                  </span>
                ) : franchise.nextToWatch ? (
                  <span className="text-[11px] text-white/55 truncate">
                    Next: <span className="text-white/80 font-medium">{franchise.nextToWatch.name}</span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Subtle brand hover shimmer */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 group-hover:ring-brand/20 transition-all duration-300 pointer-events-none" />
        </div>
      </motion.div>
    </Link>
  )
}
