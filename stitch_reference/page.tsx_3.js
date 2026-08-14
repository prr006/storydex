'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { ImportDialog } from '@/components/ImportDialog'
import { Button } from '@/components/ui/button'
import { ArrowRight, Layers, BarChart3, ListChecks } from 'lucide-react'

const features = [
  {
    icon: Layers,
    title: 'Group by Franchise',
    description: 'See every season of a franchise together instead of scattered list entries.',
  },
  {
    icon: BarChart3,
    title: 'Track Progress',
    description: 'Monitor your completion across each franchise with story-level stats.',
  },
  {
    icon: ListChecks,
    title: "Know What's Next",
    description: 'Always know which entry to watch next with smart sequencing.',
  },
]

export default function LandingPage() {
  const [isImportOpen, setIsImportOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Navbar onImportClick={() => setIsImportOpen(true)} />

      <main>
        <section className="relative min-h-[calc(100vh-56px)] flex items-center justify-center overflow-hidden px-4">
          {/* Subtle background glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand/6 blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            {/* Eyebrow label */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand/25 bg-brand/8 text-brand text-xs font-medium mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              Powered by AniList
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-5"
            >
              <span className="bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                Count stories,
              </span>
              <br />
              <span className="bg-gradient-to-r from-brand via-brand-light to-brand bg-clip-text text-transparent">
                not seasons.
              </span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
            >
              StoryDex groups your anime list into franchises so you see the whole story —
              not hundreds of individual seasons.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-3 justify-center mb-20"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  onClick={() => setIsImportOpen(true)}
                  className="bg-brand hover:bg-brand-dark text-white h-11 px-7 text-sm font-medium shadow-xl shadow-brand/20 flex items-center gap-2"
                >
                  Import from AniList
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>

              <Link href="/dashboard">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-11 px-7 text-sm font-medium border-border/60 hover:bg-muted/60 hover:border-brand/30"
                  >
                    Browse Demo
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Feature cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.32 }}
              className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto"
            >
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="p-5 rounded-xl bg-card border border-border/50 hover:border-brand/25 transition-all duration-200 text-left"
                >
                  <feature.icon className="w-5 h-5 text-brand mb-3" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>

      <ImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  )
}
