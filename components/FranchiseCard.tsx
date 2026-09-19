'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowUpRight, Check, Play } from 'lucide-react'
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
  const next = franchise.nextToWatch
  const accentClass = isComplete ? 'story-card--complete' : next ? 'story-card--active' : 'story-card--quiet'

  return (
    <Link href={`/franchise/${franchise.id}`} aria-label={`View ${franchise.name}`}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.6), ease: 'easeOut' }}
        whileHover={{ y: -6, transition: { duration: 0.18, ease: 'easeOut' } }}
        className={`story-card ${accentClass}`}
      >
        <div className="story-card__image">
          <Image
            src={franchise.posterUrl}
            alt={franchise.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
          <div className="story-card__image-wash" />
        </div>

        <div className="story-card__topline">
          <span>{String(franchise.seasons[0]?.year || '—')}</span>
          <span>{franchise.completedSeasons}/{franchise.totalSeasons} entries</span>
        </div>

        <div className="story-card__body">
          <div className="story-card__status">
            {isComplete ? <Check aria-hidden="true" /> : <Play aria-hidden="true" />}
            {isComplete ? 'complete' : next ? 'in progress' : 'queued'}
          </div>
          <h3>
            {franchise.name}
          </h3>
          <div className="story-card__meta">
            <span>{franchise.genres.slice(0, 2).join(' · ') || 'Unclassified story'}</span>
            <strong>{Math.round(pct)}%</strong>
          </div>
        </div>
        <div className="story-card__arrow"><ArrowUpRight aria-hidden="true" /></div>
      </motion.div>
    </Link>
  )
}
