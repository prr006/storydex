'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { Command, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLibrary } from '@/lib/useLibrary'
import { EASE, spring } from '@/lib/motion'

/* ==========================================================================
   Navbar — the projectionist's booth
   --------------------------------------------------------------------------
   · Absolutely transparent at the top of a page so heroes bleed to the edge.
   · Condenses into a glass bar after 24px of scroll.
   · A thin scroll-progress rule sits under it — the ONLY global progress
     indicator in the app, which is why it can be this quiet.
   ========================================================================== */

const LINKS = [{ href: '/dashboard', label: 'Library' }] as const

export function Navbar({ onImportClick }: { onImportClick?: () => void }) {
  const pathname = usePathname()
  const { scrollY } = useScroll()
  const { franchises, isImported, username } = useLibrary()
  const [condensed, setCondensed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setCondensed(latest > 24)
  })

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div
          className={cn(
            'relative transition-all duration-500',
            condensed ? 'glass hairline-b' : 'bg-transparent',
          )}
          style={{ transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)' }}
        >
          <nav
            className={cn('shell flex items-center justify-between transition-all duration-500', condensed ? 'h-16' : 'h-[88px]')}
          >
            {/* ── Wordmark ───────────────────────────────────────────── */}
            <Link href="/" className="group flex items-baseline gap-2.5" aria-label="StoryDex home">
              <span className="text-editorial text-[26px] leading-none text-chalk">Story</span>
              <span className="relative text-editorial text-[26px] leading-none text-brand-300">
                Dex
                <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-brand-300/60 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
              </span>
            </Link>

            {/* ── Desktop links ──────────────────────────────────────── */}
            <div className="hidden items-center gap-1 md:flex">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative px-3.5 py-2 text-body-sm transition-colors duration-300',
                    isActive(link.href) ? 'text-chalk' : 'text-mist hover:text-chalk',
                  )}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-2.5 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent"
                      transition={spring}
                    />
                  )}
                </Link>
              ))}
              <LibraryCount count={franchises.length} />
            </div>

            {/* ── Right rail ─────────────────────────────────────────── */}
            <div className="flex items-center gap-2">
              {/* Only shown where the shortcut is actually wired up. */}
              {pathname === '/dashboard' && (
                <kbd className="label hidden items-center gap-1.5 rounded-md bg-white/[0.04] px-2 py-1.5 text-[10px] text-veil lg:inline-flex">
                  <Command className="size-3" aria-hidden />
                  K
                  <span className="sr-only">to search your library</span>
                </kbd>
              )}

              <button
                type="button"
                onClick={onImportClick}
                className="hidden h-9 items-center rounded-full bg-chalk px-4 text-[13px] font-semibold text-ink-950 transition-all duration-300 hover:bg-white md:inline-flex"
              >
                {isImported ? 'Re-import' : 'Import list'}
              </button>

              {username && (
                <span className="hidden max-w-[110px] truncate text-body-sm text-veil lg:inline">@{username}</span>
              )}

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="grid size-9 place-items-center rounded-full text-mist transition-colors hover:bg-white/[0.06] hover:text-chalk md:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>
            </div>
          </nav>

          {/* Scroll progress hairline */}
          <ScrollRule />
        </div>
      </motion.header>

      {/* ── Mobile sheet ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[60] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-xl" onClick={() => setMenuOpen(false)} />
            <motion.div
              className="absolute inset-x-0 top-0 glass hairline-b px-5 pb-8 pt-5"
              initial={{ y: -24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="text-editorial text-[24px] text-chalk">
                  Story<span className="text-brand-300">Dex</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="grid size-9 place-items-center rounded-full text-mist hover:bg-white/[0.06] hover:text-chalk"
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex flex-col">
                <Link href="/dashboard" className="hairline-b py-4 text-title-sm font-semibold text-chalk">
                  Library
                </Link>
                <span className="hairline-b py-4 text-title-sm font-semibold text-veil">Discover</span>
                <span className="py-4 text-title-sm font-semibold text-veil">Stats</span>
              </div>

              <p className="mt-6 numeric text-mist">
                {franchises.length > 0
                  ? `${franchises.length} ${franchises.length === 1 ? 'story' : 'stories'} tracked`
                  : 'No library imported yet'}
                {username ? ` · @${username}` : ''}
              </p>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onImportClick?.()
                }}
                className="mt-6 h-11 w-full rounded-full bg-chalk text-[15px] font-semibold text-ink-950"
              >
                {isImported ? 'Re-import AniList' : 'Import from AniList'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function LibraryCount({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="ml-2 hidden items-center gap-2 pl-3 lg:inline-flex">
      <span className="h-3 w-px bg-white/10" />
      <span className="numeric text-veil">
        {count} {count === 1 ? 'story' : 'stories'}
      </span>
    </span>
  )
}

/** 1px violet rule that tracks page scroll. Reads as a film-strip position. */
function ScrollRule() {
  const { scrollYProgress } = useScroll()
  return (
    <motion.div
      aria-hidden
      className="absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-brand-600 via-brand-400 to-indigo-400"
      style={{ scaleX: scrollYProgress }}
    />
  )
}
