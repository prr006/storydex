'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

/**
 * StoryPlate — a piece of story artwork mounted like a print in an almanac:
 * a matted frame, a hairline inner keyline, and a mono caption with a plate
 * number. Artwork is treated as an object in the collection, not a card.
 */
export function StoryPlate({
  src,
  alt,
  caption,
  plate,
  size = 'md',
  tilt = false,
  eager = false,
}: {
  src: string
  alt: string
  caption?: string
  plate?: string
  size?: 'sm' | 'md' | 'lg'
  tilt?: boolean
  /** Prioritize load (hero plates). */
  eager?: boolean
}) {
  return (
    <motion.figure
      className={`plate plate--${size}${tilt ? ' plate--tilt' : ''}`}
      initial={tilt ? { opacity: 0, y: 24, rotate: tilt ? -2.4 : 0 } : { opacity: 0, y: 20 }}
      whileInView={tilt ? { opacity: 1, y: 0, rotate: -1.2 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="plate__art">
        <Image
          src={src}
          alt={alt}
          fill
          priority={eager}
          sizes={size === 'lg' ? '320px' : size === 'md' ? '240px' : '180px'}
          className="object-cover"
        />
      </div>
      {(caption || plate) && (
        <figcaption className="plate__cap">
          <span className="plate__num">{plate ? `PL. ${plate}` : 'PL.'}</span>
          <span>{caption}</span>
        </figcaption>
      )}
    </motion.figure>
  )
}
