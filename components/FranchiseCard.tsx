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

  return (
    <Link href={`/franchise/${franchise.id}`} aria-label={`View ${franchise.name}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.6), ease: 'easeOut' }}
        whileHover={{ y: -6, transition: { duration: 0.18, ease: 'easeOut' } }}
        className="group relative rounded-2xl overflow-hidden bg-surface border border-white/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-brand/20 cursor-pointer aspect-[2/3]"
      >
        {/* Poster Background */}
        <div className="absolute inset-0 bg-cover bg-center w-full h-full transform transition-transform duration-700 group-hover:scale-105">
          <Image
            src={franchise.posterUrl}
            alt={franchise.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        </div>
        
        {/* Scrim Gradient */}
        <div className="absolute inset-0 scrim-gradient opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top Overlay Info */}
        <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-start z-10 bg-gradient-to-b from-black/80 to-transparent">
          <div className="font-data-tabular text-data-tabular text-on-surface-variant text-[11px] bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm border border-white/5">
            {franchise.completedSeasons}/{franchise.totalSeasons} • {Math.round(pct)}%
          </div>
          {isComplete ? (
            <div className="bg-status-watched/20 border border-status-watched/40 w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md">
              <span className="material-symbols-outlined text-[14px] text-status-watched font-bold">check</span>
            </div>
          ) : (
            <div className="bg-status-watching/20 border border-status-watching/40 px-1.5 py-0.5 rounded font-label-caps text-[9px] text-status-watching uppercase backdrop-blur-md">
              WATCHING
            </div>
          )}
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 w-full p-4 z-10 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-section-header text-body-md text-on-surface leading-tight mb-2 drop-shadow-md line-clamp-2">
            {franchise.name}
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-data-tabular text-data-tabular text-on-surface-variant text-[11px]">
                {franchise.seasons[0]?.year || 'Unknown'}
              </span>
              {franchise.averageScore && (
                <div className="flex items-center gap-1 text-primary-fixed-dim">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="font-data-tabular text-data-tabular text-[12px]">{(franchise.averageScore / 20).toFixed(1)}</span>
                </div>
              )}
            </div>
            {/* Progress bar - shown on hover */}
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
              <div 
                className={`h-full rounded-full ${isComplete ? 'bg-status-watched' : 'bg-status-watching'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Subtle brand hover ring */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 group-hover:ring-brand/20 transition-all duration-300 pointer-events-none" />
      </motion.div>
    </Link>
  )
}
