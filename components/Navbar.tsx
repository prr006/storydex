'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'

interface NavbarProps {
  onImportClick?: () => void
}

/**
 * Atlas nav — a slim, transparent almanac header.
 * It floats over the story world and only gains an ink wash once you scroll.
 */
export function Navbar({ onImportClick }: NavbarProps) {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 28)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`atlas-nav${solid ? ' atlas-nav--solid' : ''}`}>
      <div className="atlas-nav__inner">
        <Link href="/" className="brand" aria-label="StoryDex home">
          <span className="brand__mark">
            Story<em>Dex</em>
          </span>
          <span className="brand__sub">story cartography</span>
        </Link>

        <div className="atlas-nav__links">
          <Link href="/dashboard" className="atlas-nav__link">
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
