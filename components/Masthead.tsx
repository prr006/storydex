'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutGrid, Menu, Search, X } from 'lucide-react'
import { SettingsMenu } from '@/components/SettingsMenu'
import { cn } from '@/lib/utils'
import { DURATION, EASE } from '@/lib/motion'
import type { Franchise } from '@/lib/franchise'

/* ==========================================================================
   Masthead
   --------------------------------------------------------------------------
   Compact and quiet on purpose: the artwork below it is the loudest thing on
   the page, and a heavy navbar would compete with it.

   · A monogram tile plus the wordmark, then four destinations.
   · Search is a real field that opens in place and hands off to `/library?q=`.
   · The active route is marked with a soft indigo wash, not a border or a
     shadow — it should be findable, not loud.
   · Below `md` the destinations collapse into a sheet; nothing disappears.
   ========================================================================== */

interface MastheadProps {
  franchises: Franchise[]
  username: string | null
  importedAt?: string | null
  onReimport: () => void
}

const NAV = [
  { href: '/dashboard', label: 'Home' },
  { href: '/library', label: 'Library' },
  { href: '/discover', label: 'Discover' },
  { href: '/franchises', label: 'Franchises' },
] as const

export function Masthead({ franchises, username, importedAt, onReimport }: MastheadProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ⌘K / Ctrl-K focuses search from anywhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
        requestAnimationFrame(() => inputRef.current?.focus())
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => setMenuOpen(false), [pathname])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/library?q=${encodeURIComponent(trimmed)}`)
    setSearchOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="shell flex h-[60px] items-center gap-6">
        {/* Identity */}
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
          <span
            className="grid size-7 place-items-center rounded-[9px] bg-gradient-to-br from-brand to-[#4b3ce0] art-edge"
            aria-hidden
          >
            <LayoutGrid className="size-3.5 text-white" />
          </span>
          <span className="text-[0.9375rem] font-bold uppercase tracking-[0.14em] text-ink">
            StoryDex
          </span>
        </Link>

        {/* Destinations */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative rounded-sm px-3 py-1.5 text-body transition-colors duration-200',
                  active
                    ? 'bg-brand-soft font-medium text-ink'
                    : 'text-ink-2 hover:bg-white/[0.05] hover:text-ink',
                )}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 -bottom-[9px] h-[2px] rounded-full bg-brand"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <p className="ml-1 hidden truncate text-small text-ink-3 xl:block">
          <LibrarySentence franchises={franchises} />
        </p>

        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <form onSubmit={submit} className="relative">
            <div
              className={cn(
                'flex items-center overflow-hidden rounded-full border transition-all duration-300 ease-out',
                searchOpen || query
                  ? 'w-44 border-line-strong bg-surface-2 pl-3 sm:w-72'
                  : 'w-9 justify-center border-transparent bg-white/[0.04] hover:bg-white/[0.08]',
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
                placeholder="Search titles, arcs, entries"
                aria-label="Search your library"
                className={cn(
                  'h-9 min-w-0 flex-1 bg-transparent px-2.5 text-body text-ink placeholder:text-ink-3 focus:outline-none',
                  searchOpen || query ? 'block' : 'hidden',
                )}
              />

              {(searchOpen || query) && (
                <span className="mr-2.5 hidden shrink-0 rounded-xs border border-line px-1.5 py-0.5 text-[0.625rem] font-medium text-ink-3 sm:block">
                  ⌘K
                </span>
              )}

              {query && searchOpen && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="mr-1 grid size-6 place-items-center rounded-full text-ink-3 hover:text-ink"
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
            className="grid size-9 place-items-center rounded-full border border-transparent text-ink-2 transition-colors duration-200 hover:bg-white/[0.06] hover:text-ink md:hidden"
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

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            id="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: DURATION.overlay, ease: EASE }}
            className="overflow-hidden border-t border-line bg-surface md:hidden"
          >
            <ul className="shell flex flex-col py-2">
              {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.href} className="border-b border-line last:border-b-0">
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-baseline justify-between py-3 text-lead',
                        active ? 'font-semibold text-ink' : 'text-ink-2',
                      )}
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
 * The header's one line of statistics. Three numbers, in prose order — the way
 * you'd say it out loud, not the way a dashboard would print it.
 */
function LibrarySentence({ franchises }: { franchises: Franchise[] }) {
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
    </>
  )
}
