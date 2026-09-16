'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Search, X } from 'lucide-react'
import { SettingsMenu } from '@/components/SettingsMenu'
import { DURATION, EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   Masthead
   --------------------------------------------------------------------------
   Identity · Library · Discover · Franchises · search · settings.

   Two decisions worth naming:

   · **The library sentence lives in the header.** "312 entries · 58 stories ·
     12 in progress" is set in one small line beside the wordmark, so the app
     states its own scale on arrival without a single statistic card. When
     there's no library, the line becomes the invitation instead of vanishing.

   · **Search is a field, not a mode.** It's visible at all sizes (icon-only on
     narrow screens), opens inline, and navigates to `/library?q=` rather than
     keeping its own results panel. One search surface in the product, not two.
   ========================================================================== */

interface MastheadProps {
  franchises: Franchise[]
  username: string | null
  importedAt?: string | null
  onReimport: () => void
}

const NAV = [
  { href: '/library', label: 'Library' },
  { href: '/discover', label: 'Discover' },
  { href: '/franchises', label: 'Franchises' },
] as const

export function Masthead({ franchises, username, importedAt, onReimport }: MastheadProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  // ⌘K / Ctrl-K focuses search. A small thing that makes it feel like software.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
        requestAnimationFrame(() => inputRef.current?.focus())
      }
      if (event.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // A route change is the signal that the sheet has done its job.
  useEffect(() => setMenuOpen(false), [pathname])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/library?q=${encodeURIComponent(trimmed)}`)
    setSearchOpen(false)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-canvas">
      <div className="shell flex h-16 items-center gap-6">
        {/* Identity */}
        <Link href="/dashboard" className="flex shrink-0 items-baseline gap-2">
          <span className="text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
            StoryDex
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative rounded-sm px-3 py-2 text-body transition-colors duration-150',
                  active ? 'font-medium text-ink' : 'text-ink-2 hover:text-ink',
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[9px] h-[1.5px] bg-ink" aria-hidden />
                )}
              </Link>
            )
          })}
        </nav>

        {/* The one-line library statement — the only "statistics" in the product. */}
        <p className="ml-1 hidden truncate text-small text-ink-3 lg:block">
          <LibrarySentence franchises={franchises} username={username} />
        </p>

        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <form onSubmit={submit} className="relative">
            <div
              className={cn(
                'flex items-center overflow-hidden rounded-sm border border-rule transition-all duration-200 ease-out',
                searchOpen || query
                  ? 'w-40 bg-field pl-2.5 sm:w-52'
                  : 'w-9 justify-center border-transparent bg-transparent hover:border-rule hover:bg-sunk',
              )}
            >
              <button
                type={searchOpen || query ? 'submit' : 'button'}
                onClick={() => {
                  if (!searchOpen && !query) {
                    setSearchOpen(true)
                    requestAnimationFrame(() => inputRef.current?.focus())
                  }
                }}
                aria-label="Search your library"
                className="grid size-4 shrink-0 place-items-center text-ink-3 hover:text-ink"
              >
                <Search className="size-4" aria-hidden />
              </button>

              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => {
                  if (!query) setSearchOpen(false)
                }}
                placeholder="Search"
                aria-label="Search your library"
                className={cn(
                  'h-9 min-w-0 flex-1 bg-transparent px-2 text-body text-ink placeholder:text-ink-3 focus:outline-none',
                  searchOpen || query ? 'block' : 'hidden',
                )}
              />

              {query && searchOpen && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="mr-1 grid size-5 place-items-center rounded-xs text-ink-3 hover:text-ink"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              )}
            </div>
          </form>

          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label="Sections"
            className="grid size-9 place-items-center rounded-sm border border-transparent text-ink-2 transition-colors duration-150 hover:border-rule hover:bg-sunk hover:text-ink md:hidden"
          >
            {menuOpen ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
          </button>

          <SettingsMenu
            username={username}
            importedAt={importedAt}
            franchiseCount={franchises.length}
            onReimport={onReimport}
          />
        </div>
      </div>

      {/* Below md the three destinations move into a sheet rather than
          disappearing: Library, Discover and Franchises have to be reachable
          on a phone. */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            id="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: DURATION.overlay, ease: EASE }}
            className="overflow-hidden border-t border-rule md:hidden"
          >
            <ul className="shell flex flex-col py-2">
              {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.href} className="border-b border-rule last:border-b-0">
                    <Link
                      href={item.href}
                      className={
                        active
                          ? 'flex items-baseline justify-between py-3 text-lead font-medium text-ink'
                          : 'flex items-baseline justify-between py-3 text-lead text-ink-2'
                      }
                    >
                      {item.label}
                      {active && <span className="text-small text-ink-3">Here</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}

/**
 * The header's single sentence. Three numbers, joined by middots, in prose
 * order — the way you'd say it out loud.
 */
function LibrarySentence({
  franchises,
  username,
}: {
  franchises: Franchise[]
  username: string | null
}) {
  if (franchises.length === 0) {
    return <>Nothing imported yet</>
  }

  const entries = franchises.reduce((sum, franchise) => sum + franchise.seasons.length, 0)
  const active = franchises.filter((franchise) =>
    franchise.seasons.some((entry) => entry.status === 'CURRENT'),
  ).length

  return (
    <>
      <span className="num text-ink-2">{entries.toLocaleString('en-US')}</span> entries ·{' '}
      <span className="num text-ink-2">{franchises.length}</span>{' '}
      {franchises.length === 1 ? 'story' : 'stories'}
      {active > 0 && (
        <>
          {' · '}
          <span className="num text-ink-2">{active}</span> in progress
        </>
      )}
      {username && <span className="sr-only"> imported from AniList as {username}</span>}
    </>
  )
}
