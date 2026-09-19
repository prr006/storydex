'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, Compass, LibraryBig } from 'lucide-react'

interface NavbarProps {
  onImportClick?: () => void
}

export function Navbar({ onImportClick }: NavbarProps) {
  return (
    <motion.nav
      className="site-nav"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="site-nav__inner">
        <Link href="/" className="brand-mark" aria-label="StoryDex home">
          <span className="brand-mark__glyph" aria-hidden="true">S</span>
          <span>
            <strong>StoryDex</strong>
            <small>story cartography</small>
          </span>
        </Link>

        <div className="site-nav__links">
          <Link
            href="/dashboard"
            className="site-nav__link"
          >
            <LibraryBig aria-hidden="true" />
            Library
          </Link>
          <Link
            href="/dashboard#stories"
            className="site-nav__link"
          >
            <Compass aria-hidden="true" />
            Explore
          </Link>
        </div>

        <div className="site-nav__actions">
          <span className="site-nav__signal"><i /> local library</span>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Button
              onClick={onImportClick}
              size="sm"
              className="nav-import"
            >
              Import list <ArrowUpRight aria-hidden="true" />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  )
}
