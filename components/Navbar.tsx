'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'

interface NavbarProps {
  onImportClick?: () => void
}

/**
 * Atlas nav — a slim bar embedded in the world.
 * Transparent over the story, ink-wash once you scroll; no glass, no boxes.
 * Active links are underlined in ember.
 */
export function Navbar({ onImportClick }: NavbarProps) {
  const pathname = usePathname()
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 28)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const onDashboard = pathname === '/dashboard'

  return (
    <nav className={`atlas-nav${solid ? ' atlas-nav--solid' : ''}`} aria-label="Primary">
      <div className="atlas-nav__inner">
        <Link href="/" className="brand" aria-label="StoryDex home">
          <span className="brand__mark">
            Story<em>Dex</em>
          </span>
          <span className="brand__sub">story cartography</span>
        </Link>

        <div className="atlas-nav__links">
          <Link
            href="/dashboard"
            className={onDashboard ? 'atlas-nav__link is-active' : 'atlas-nav__link'}
            aria-current={onDashboard ? 'page' : undefined}
          >
            Library
          </Link>
          <Link href="/dashboard#stories" className="atlas-nav__link">
            Index
          </Link>
        </div>

        <div className="atlas-nav__right">
          <span className="atlas-nav__signal">
            <i aria-hidden="true" /> local library
          </span>
          <button onClick={onImportClick} className="cta cta--dim" type="button">
            Import list <ArrowUpRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  )
}
