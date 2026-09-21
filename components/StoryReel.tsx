'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { ArrowRight, Check, ChevronLeft, ChevronRight, MapPin, Play } from 'lucide-react'
import type { CSSProperties } from 'react'
import { StoryPlate } from '@/components/StoryPlate'
import { WordReveal } from '@/components/Reveal'
import { Beacon } from '@/components/Beacon'
import { storyPosition } from '@/components/StoryPath'
import { storyAccentVars } from '@/lib/storyAccent'
import { heroSummary } from '@/lib/franchise'
import type { Franchise } from '@/lib/franchise'

const ROTATE_MS = 6500
const RESUME_MS = 20000
const EASE = [0.22, 1, 0.36, 1] as const

export interface ReelStory {
  franchise: Franchise
  pos: { total: number; pos: number; fill: number; complete: boolean }
  /** 1-based position of this story in the current index view. */
  number: number
  /** Total stories in the current index view. */
  of: number
  originYear: string
  epNow: number | null
}

/* -------------------------------------------------------------------------- */
/* One featured story, composed as a whole scene                              */
/* -------------------------------------------------------------------------- */

function ReelScene({
  story,
  isInitial,
  reduced,
  artY,
  hazeY,
}: {
  story: ReelStory
  isInitial: boolean
  reduced: boolean
  artY: ReturnType<typeof useTransform<string, string>>
  hazeY: ReturnType<typeof useTransform<string, string>>
}) {
  const { franchise, pos } = story
  const next = franchise.nextToWatch
  const artSrc = franchise.bannerUrl || franchise.posterUrl
  const sceneDur = reduced ? 0.12 : 0.9

  return (
    <motion.div
      className="cover__scene"
      style={storyAccentVars(franchise.id)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.12 : 0.85, ease: EASE }}
    >
      {/* L1 — the stage: story-derived atmosphere (deep ink base, story
          light, film grain). Never another copy of the artwork — the viewer
          should perceive exactly ONE piece of art in the space. */}
      <motion.div
        className="cover__stage"
        aria-hidden="true"
        initial={{ opacity: reduced ? 1 : 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: sceneDur }}
      />

      {/* L2 — the artwork, faithful: fitted to the stage, never cropped */}
      <motion.div
        className="cover__art"
        aria-hidden="true"
        style={{ y: artY }}
        initial={{ opacity: reduced ? 1 : 0, scale: reduced ? 1 : 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.03 }}
        transition={{ duration: sceneDur, ease: EASE, delay: reduced ? 0 : 0.08 }}
      >
        <Image
          src={artSrc}
          alt=""
          fill
          sizes="100vw"
          priority={isInitial}
          loading={isInitial ? 'eager' : 'lazy'}
        />
      </motion.div>

      {/* L3 — cinematic light + atmosphere + the title's own territory */}
      <motion.div
        className="cover__light"
        aria-hidden="true"
        style={{ y: hazeY }}
        initial={{ opacity: reduced ? 1 : 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: sceneDur }}
      />
      <div className="cover__atmos" aria-hidden="true" />
      <div className="cover__veil" aria-hidden="true" />

      {/* L4 + L5 + L6 — information, artifact, route */}
      <div className="cover__inner">
        <div className="cover__body">
          <div className="cover__toplink">
            <span className="label">
              <i className="label__dot label__dot--live" aria-hidden="true" /> Current story
            </span>
          </div>

          <div className="cover__meta">
            <span className="cover__meta--genres">
              {franchise.genres.slice(0, 2).join(' · ') || 'unclassified'}
            </span>
            <span className="cover__meta--facts">
              {String(story.number).padStart(2, '0')} / {String(story.of).padStart(2, '0')} in your atlas
              {story.originYear ? ` · ${story.originYear}` : ''} · {String(franchise.completedSeasons).padStart(2, '0')} / {String(franchise.totalSeasons).padStart(2, '0')} recorded
            </span>
          </div>

          <h1 id={`story-title-${franchise.id}`} className="cover__title">
            <WordReveal text={franchise.name} as="span" delay={0.45} emphasizeLast />
          </h1>

          <p className="cover__desc">{heroSummary(franchise)}</p>

          <div className="cover__cta">
            <Link href={`/franchise/${franchise.id}`} className="cta">
              Enter the story <ArrowRight aria-hidden="true" />
            </Link>
            {next?.siteUrl && story.epNow && (
              <a
                href={next.siteUrl}
                target="_blank"
                rel="noreferrer"
                className="cta cta--accent"
              >
                Resume EP {story.epNow} <Play aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        <div className="cover__plate">
          <StoryPlate
            src={franchise.posterUrl}
            alt={franchise.name}
            plate="01"
            caption={`origin — ${story.originYear || '—'}`}
            size="md"
            state="current"
            tilt
            eager={isInitial}
          />
        </div>

        {/* Your position on the story — the route crosses the world */}
        <div className="cover__route">
          <div className="route">
            <div className="route__ends">
              <span>Origin{story.originYear ? ` — ${story.originYear}` : ''}</span>
              <span>{franchise.seasons.length} entries</span>
              <span>Horizon</span>
            </div>
            <div
              className="route__track"
              style={{ '--route-fill': `${pos.fill * 100}%` } as CSSProperties}
            >
              <div className="route__baseline" />
              <div className="route__ink" />
              {franchise.seasons.map((season, index) => {
                const state = pos.complete
                  ? 'past'
                  : index < pos.pos
                    ? 'past'
                    : index === pos.pos && !pos.complete
                      ? 'current'
                      : 'future'
                return (
                  <Link
                    key={season.id}
                    href={`/franchise/${franchise.id}`}
                    className={`route__tick route__tick--${state}`}
                    style={{ left: `${pos.total > 1 ? (index / (pos.total - 1)) * 100 : 0}%` }}
                    aria-label={season.name}
                  >
                    <i />
                  </Link>
                )
              })}
              {!pos.complete && (
                <Beacon
                  style={{ left: `${pos.fill * 100}%` }}
                  flag={
                    <span className={`beacon__flag${pos.fill > 0.82 ? ' beacon__flag--end' : ''}`}>
                      <MapPin aria-hidden="true" />
                      <b>You</b>
                      {next ? (
                        <em>
                          {next.name}
                          {story.epNow ? ` · EP ${story.epNow}/${next.episodes || '?'}` : ''}
                        </em>
                      ) : null}
                    </span>
                  }
                />
              )}
              {pos.complete && (
                <Beacon
                  style={{ left: '100%' }}
                  flag={
                    <span className="beacon__flag beacon__flag--end">
                      <Check aria-hidden="true" />
                      <b>Complete</b>
                    </span>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/* The reel — the dashboard hero as a rotating sequence of featured scenes    */
/* -------------------------------------------------------------------------- */

export function StoryReel({ stories }: { stories: ReelStory[] }) {
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [autoOff, setAutoOff] = useState(false)
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reduced = useReducedMotion() ?? false
  const safeIndex = stories.length > 0 ? Math.min(index, stories.length - 1) : 0
  const story = stories[safeIndex]

  /* Motion's useScroll is called HERE — inside the component that owns the
     ref'd <section> — so the ref is always attached before Motion measures it.
     (A ref whose element mounts later, or never, makes useScroll throw
     "Target ref is defined but not hydrated".) */
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const artY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])
  const hazeY = useTransform(scrollYProgress, [0, 1], ['0%', '-7%'])

  const many = stories.length > 1

  /* Auto-rotation: 6.5s per scene. Paused while hovered, focused, while a
     selection/interaction is active, or when the user prefers reduced motion. */
  useEffect(() => {
    if (!many || reduced || autoOff || hovered || focused) return
    const t = setTimeout(() => setIndex((i) => (i + 1) % stories.length), ROTATE_MS)
    return () => clearTimeout(t)
  }, [many, reduced, autoOff, hovered, focused, index, stories.length])

  /* When the user takes over (selection or prev/next), stop rotating;
     resume after 20s of no interaction. */
  const takeControl = useCallback(() => {
    setAutoOff(true)
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => setAutoOff(false), RESUME_MS)
  }, [])

  useEffect(() => () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
  }, [])

  /* Keep the active index valid if the library shrinks (e.g. re-import). */
  useEffect(() => {
    if (index >= stories.length) setIndex(0)
  }, [index, stories.length])

  /* Preload only the next likely scene. */
  useEffect(() => {
    if (!many) return
    const upcoming = stories[(safeIndex + 1) % stories.length]
    const url = upcoming.franchise.bannerUrl || upcoming.franchise.posterUrl
    if (!url) return
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    document.head.appendChild(link)
    return () => link.remove()
  }, [many, safeIndex, stories])

  const go = (target: number) => {
    if (!many) return
    setIndex(((target % stories.length) + stories.length) % stories.length)
    takeControl()
  }

  if (!story) return null

  return (
    <section
      ref={sectionRef}
      className="cover cover--reel"
      aria-label={
        many
          ? `Featured stories — ${stories.length} in your atlas. Story ${safeIndex + 1} of ${stories.length} shown.`
          : 'Featured story'
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false)
      }}
    >
      <AnimatePresence mode="sync" initial={false}>
        <ReelScene
          key={story.franchise.id}
          story={story}
          isInitial={safeIndex === 0}
          reduced={reduced}
          artY={artY}
          hazeY={hazeY}
        />
      </AnimatePresence>

      {many && (
        <div
          className="reel__nav"
          role="group"
          aria-label="Choose the featured story"
          data-paused={hovered || focused || autoOff || undefined}
        >
          <button
            type="button"
            className="reel__step"
            onClick={() => go(safeIndex - 1)}
            aria-label="Previous story"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <div className="reel__rail">
            {stories.map((s, i) => (
              <button
                key={s.franchise.id}
                type="button"
                className={i === safeIndex ? 'reel__item is-active' : 'reel__item'}
                style={storyAccentVars(s.franchise.id)}
                aria-current={i === safeIndex ? 'true' : undefined}
                onClick={() => go(i)}
              >
                <span className="reel__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="reel__name">{s.franchise.name}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="reel__step"
            onClick={() => go(safeIndex + 1)}
            aria-label="Next story"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      )}

    </section>
  )
}

/** Build the reel sequence from the current index view (sorted/filtered). */
export function buildReelStories(view: Franchise[]): ReelStory[] {
  return view.map((franchise, i) => {
    const firstYear = franchise.seasons[0]?.year
    const next = franchise.nextToWatch
    const epNow = next && next.episodes > 0 ? Math.min((next.progress ?? 0) + 1, next.episodes) : null
    return {
      franchise,
      pos: storyPosition(franchise),
      number: i + 1,
      of: view.length,
      originYear: firstYear ? String(firstYear) : '',
      epNow,
    }
  })
}
