'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Cover } from '@/components/Cover'
import { StatusMark } from '@/components/StatusMark'
import { formatFormat, getEntryStatus, isUpcoming } from '@/lib/design'
import type { Franchise, Season } from '@/lib/franchise'

/* ==========================================================================
   NextActionBar  (chapter 5)
   --------------------------------------------------------------------------
   On a long story page the one useful action scrolls away. This bar brings it
   back — but only after it has actually left the viewport, so it never sits
   there duplicating something already on screen.

   Mechanism: a sentinel IntersectionObserver on the inline call to action.
   When the sentinel is out of view *and* the page has scrolled past it, the bar
   appears. When you scroll back up, it leaves. No scroll listeners.
   ========================================================================== */

interface NextActionBarProps {
  franchise: Franchise
  next: Season | null
}

export function NextActionBar({ franchise, next }: NextActionBarProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    let passed = false
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Track whether the sentinel is below or above the viewport.
        const rect = entry.boundingClientRect
        passed = rect.top < (entry.rootBounds?.top ?? 0)
        setVisible(!entry.isIntersecting && passed)
      },
      { rootMargin: '-80px 0px 0px 0px', threshold: 0 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const status = next ? getEntryStatus(next) : null
  const watchable = next && !isUpcoming(next)

  return (
    <>
      {/* Sentinel sits on the inline CTA rendered by the page. */}
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            exit={{ y: '110%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-rule-strong bg-surface"
          >
            <div className="shell flex items-center gap-4 py-3">
              <Cover
                src={franchise.posterUrl}
                alt=""
                tint={franchise.accentColor}
                ratio="2/3"
                rounded={false}
                sizes="36px"
                className="hidden w-9 shrink-0 sm:block"
              />

              <div className="min-w-0 flex-1">
                <p className="text-small text-ink-3">{franchise.name}</p>
                <p className="truncate text-body font-medium text-ink">
                  {next
                    ? `${watchable ? 'Next' : 'Waiting on'} — ${next.name}`
                    : 'Story complete'}
                </p>
              </div>

              {!next && (
                <span className="hidden shrink-0 sm:block">
                  <StatusMark status="watched" label="Everything watched" />
                </span>
              )}

              {next && (
                <span className="hidden shrink-0 text-small text-ink-3 sm:block">
                  {formatFormat(next.format)}
                  {next.year > 0 && ` · ${next.year}`}
                </span>
              )}

              <div className="flex shrink-0 items-center gap-4">
                {next?.siteUrl && (
                  <a
                    href={next.siteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center rounded-sm bg-brand px-4 text-body font-medium text-brand-ink transition-opacity hover:opacity-90"
                  >
                    {status === 'watching' ? 'Continue on AniList' : 'Open on AniList'}
                  </a>
                )}
                <Link
                  href="/library"
                  className="hidden text-body text-ink-2 underline decoration-rule-strong underline-offset-4 transition-colors hover:text-ink sm:block"
                >
                  Library
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
