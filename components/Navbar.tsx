'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface NavbarProps {
  onImportClick?: () => void
}

export function Navbar({ onImportClick }: NavbarProps) {
  return (
    <motion.nav
      className="sticky top-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/85"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="StoryDex home">
          <motion.div
            className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center font-bold text-white text-sm shadow-md shadow-brand/30"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
          >
            S
          </motion.div>
          <span className="text-[15px] font-semibold tracking-tight bg-gradient-to-r from-brand to-brand-light bg-clip-text text-transparent">
            StoryDex
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
          >
            Dashboard
          </Link>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Button
              onClick={onImportClick}
              size="sm"
              className="bg-brand hover:bg-brand-dark text-white text-sm h-8 px-4 shadow-md shadow-brand/20 transition-all duration-200"
            >
              Import
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  )
}
