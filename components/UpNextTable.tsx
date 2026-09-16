'use client'

import Link from 'next/link'
import { Cover } from '@/components/Cover'
import { StatusMark } from '@/components/StatusMark'
import { formatFormat, getEntryStatus, isUpcoming } from '@/lib/design'
import type { Franchise, Season } from '@/lib/franchise'

/* ==========================================================================
   UpNextTable
   --------------------------------------------------------------------------
   The half of "what's next" that Continue cannot answer: entries that exist in
   your collection but that you cannot watch yet. A tracker that hides these
   makes you feel finished when you aren't; a tracker that mixes them into
   Continue makes "resume" a lie.

   So they get their own small, quiet, ruled table — announced, dated, and
   clearly marked as not aired.
   ========================================================================== */

export function UpNextTable({ franchises }: { franchises: Franchise[] }) {
  const rows = upcomingRows(franchises)
  if (rows.length === 0) return null

  return (
    <div className="mt-8">
      <p className="reading mb-5 max-w-[58ch] text-ink-2">
        {rows.length === 1
          ? 'One entry in your collection hasn’t aired yet.'
          : `${rows.length} entries in your collection haven’t aired yet.`}{' '}
        They stay out of Continue on purpose — there’s nothing to resume.
      </p>

      <ul className="border-t border-rule">
        {rows.map(({ franchise, entry }) => (
          <li key={`${franchise.id}-${entry.id}`} className="border-b border-rule">
            <Link
              href={`/franchise/${franchise.id}`}
              className="group/up flex items-center gap-4 py-3.5 transition-colors duration-150 hover:bg-sunk/40"
            >
              <Cover
                src={franchise.posterUrl}
                alt=""
                tint={franchise.accentColor}
                ratio="2/3"
                rounded={false}
                sizes="32px"
                className="w-8 shrink-0"
              />

              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-medium text-ink group-hover/up:text-brand-text">
                  {entry.name}
                </span>
                <span className="mt-0.5 block truncate text-small text-ink-3">{franchise.name}</span>
              </span>

              <span className="hidden w-24 shrink-0 text-small text-ink-2 sm:block">
                {formatFormat(entry.format)}
              </span>

              <span className="num w-12 shrink-0 text-small text-ink-2">{entry.year || '—'}</span>

              <span className="w-24 shrink-0">
                <StatusMark status={statusTokenForEntry(entry)} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function statusTokenForEntry(entry: Season) {
  return getEntryStatus(entry)
}

/** Every not-yet-aired entry, soonest announced year first, then by story. */
export function upcomingRows(franchises: Franchise[]): { franchise: Franchise; entry: Season }[] {
  const rows: { franchise: Franchise; entry: Season }[] = []
  for (const franchise of franchises) {
    for (const entry of franchise.seasons) {
      if (entry.status === 'COMPLETED' || entry.status === 'DROPPED') continue
      if (isUpcoming(entry)) rows.push({ franchise, entry })
    }
  }
  return rows.sort(
    (a, b) =>
      (a.entry.year || 9999) - (b.entry.year || 9999) ||
      a.franchise.name.localeCompare(b.franchise.name),
  )
}
