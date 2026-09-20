'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

/**
 * StoryPlate — a piece of story artwork mounted like a print in the archive.
 *
 * Chronology shapes the plate:
 *   past    — settled, slightly quieter, tilted like a shelved print
 *   current — luminous, gently floating
 *   future  — veiled and ghostlike, not yet reached
 *
 * The tilt (and its hover-straighten) is pure CSS so pointer interaction
 * stays smooth; framer only handles the entrance.
 */
export function StoryPlate({
  src,
  alt,
  caption,
  plate,
  size = 'md',
  state = 'past',
  tilt = false,
  eager = false,
}: {
  src: string
  alt: string
  caption?: string
  plate?: string
  size?: 'sm' | 'md' | 'lg'
  state?: 'past' | 'current' | 'future'
  tilt?: boolean
  /** Prioritize load (hero plates). */
  eager?: boolean
}) {
  return (
    <motion.figure
      className={`plate plate--${size} plate--${state}${tilt ? ' plate--tilt' : ''}`}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="plate__art">
        <Image
          src={src}
          alt={alt}
          fill
          priority={eager}
          sizes={size === 'lg' ? '340px' : size === 'md' ? '240px' : '180px'}
          className="object-cover"
        />
        {state === 'future' && (
          <span className="plate__veil" aria-hidden="true">
            not yet reached
          </span>
        )}
      </div>
      {(caption || plate) && (
        <figcaption className="plate__cap">
          <b>{plate ? `PL. ${plate}` : 'PL.'}</b>
          <span>{caption}</span>
        </figcaption>
      )}
    </motion.figure>
  )
}
