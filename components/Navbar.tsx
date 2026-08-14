'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Bell, User } from 'lucide-react'

interface NavbarProps {
  onImportClick?: () => void
}

export function Navbar({ onImportClick }: NavbarProps) {
  return (
    <motion.nav
      className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl shadow-2xl shadow-brand/20 transition-all duration-300"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-4 group" aria-label="StoryDex home">
          <span className="font-display-hero-mobile text-headline-lg tracking-tighter text-primary-fixed-dim">
            StoryDex
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/dashboard"
            className="text-on-surface-variant hover:text-primary font-label-caps text-label-caps transition-all duration-300 hover:scale-105"
          >
            LIBRARY
          </Link>
          <Link
            href="#"
            className="text-on-surface-variant hover:text-primary font-label-caps text-label-caps transition-all duration-300 hover:scale-105"
          >
            DISCOVER
          </Link>
          <Link
            href="#"
            className="text-on-surface-variant hover:text-primary font-label-caps text-label-caps transition-all duration-300 hover:scale-105"
          >
            STATS
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <button 
            className="text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button 
            className="text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Account"
          >
            <User className="w-5 h-5" />
          </button>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Button
              onClick={onImportClick}
              size="sm"
              className="bg-primary-container hover:bg-primary text-white text-sm h-9 px-4 shadow-[0_0_15px_rgba(124,58,237,0.25)] transition-all duration-200 font-label-caps text-[11px] uppercase tracking-wider"
            >
              Import
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  )
}
