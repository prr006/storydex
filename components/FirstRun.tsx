'use client'

import { ArrowDown, ArrowRight } from 'lucide-react'
import { Beacon } from '@/components/Beacon'

/**
 * The first page of an empty atlas.
 *
 * This is StoryDex at its beginning — what it does, how it works, and how to
 * start. Everything on this screen is illustrative: no story data, no fake
 * progress, no "current story". The first real content appears only after the
 * user imports their AniList library.
 */
export function FirstRun({ onImportClick }: { onImportClick: () => void }) {
  return (
    <section className="first-run" aria-labelledby="first-run-title">
      <div className="first-run__sky" aria-hidden="true" />

      {/* an obviously illustrative, undrawn route — an empty atlas,
          ready at its beginning. No progress, no fake position. */}
      <div className="first-run__route" aria-hidden="true">
        <div className="tp__route__base" />
        <span className="tp__tick tp__tick--future" style={{ left: '18%' }} />
        <span className="tp__tick tp__tick--future" style={{ left: '42%' }} />
        <span className="tp__tick tp__tick--future" style={{ left: '72%' }} />
        <span className="tp__route__beacon">
          <Beacon />
        </span>
        <span className="tp__route__flag">where you begin</span>
      </div>

      <div className="first-run__inner">
        <p className="label">
          <i className="label__dot" aria-hidden="true" /> An atlas of your stories
        </p>
        <h1 id="first-run-title" className="first-run__title">
          Every story has a map.
        </h1>
        <p className="first-run__lede">
          StoryDex reads your AniList, groups seasons and films into the stories
          they belong to, and plots your place on each route — so you always know
          where you stopped, and exactly where to pick it up. Nothing is imported
          automatically. Your atlas begins when you import it.
        </p>

        <div className="first-run__cta">
          <button className="cta" onClick={onImportClick} type="button">
            Import from AniList <ArrowRight aria-hidden="true" />
          </button>
          <a href="#how-it-works" className="cta cta--dim">
            How it works <ArrowDown aria-hidden="true" />
          </a>
        </div>

        <div className="first-run__points" id="how-it-works">
          <div>
            <b>Grouped by story</b>
            <span>
              Seasons, films and specials become a single route with an origin,
              a horizon, and your position on it.
            </span>
          </div>
          <div>
            <b>Tracked locally</b>
            <span>
              Your library lives in this browser. Nothing is uploaded, and no
              account is needed.
            </span>
          </div>
          <div>
            <b>Your progress stays yours</b>
            <span>
              Episode counts and scores come from AniList and stay with your map —
              ready whenever you are.
            </span>
          </div>
        </div>
      </div>

      <div className="first-run__folio" aria-hidden="true">
        <span>StoryDex</span>
        <span>the first page</span>
        <span>no routes recorded yet</span>
      </div>
    </section>
  )
}
