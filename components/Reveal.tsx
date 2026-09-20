'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * WordReveal — masked, word-by-word line reveal for display type.
 *
 * Each word rises out of an overflow-hidden mask. The full text is duplicated
 * in a visually-hidden span so screen readers receive one clean string.
 * Honors reduced motion automatically via the global MotionConfig.
 */
export function WordReveal({
  text,
  className = '',
  as = 'span',
  delay = 0,
  stagger = 0.045,
  emphasizeLast = false,
  once = true,
  inView = false,
}: {
  text: string
  className?: string
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p'
  delay?: number
  stagger?: number
  /** Render the final word in italic accent — the almanac signature. */
  emphasizeLast?: boolean
  once?: boolean
  /** When true, start only when scrolled into view (otherwise on mount). */
  inView?: boolean
}) {
  const words = text.split(' ')
  const Tag = as

  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="wr__row">
        {words.map((word, index) => {
          const isLast = index === words.length - 1
          return (
            <span key={index} className="wr__mask">
              <motion.span
                className={emphasizeLast && isLast ? 'wr__word wr__word--em' : 'wr__word'}
                initial={{ y: '135%' }}
                {...(inView
                  ? { whileInView: { y: 0 }, viewport: { once, margin: '-40px' } }
                  : { animate: { y: 0 } })}
                transition={{
                  duration: 0.9,
                  delay: delay + index * stagger,
                  ease: EASE,
                }}
              >
                {word}
                {index < words.length - 1 ? '\u00A0' : ''}
              </motion.span>
            </span>
          )
        })}
      </span>
    </Tag>
  )
}

/** Simple fade-and-rise for blocks. */
export function Rise({
  children,
  className = '',
  delay = 0,
  duration = 0.7,
  y = 26,
}: {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  y?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
