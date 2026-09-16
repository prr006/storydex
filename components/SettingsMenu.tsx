'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Moon, Sun, Trash2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ==========================================================================
   SettingsMenu
   --------------------------------------------------------------------------
   A popover, not a route. Four things live here and nothing else: theme,
   re-import, storage disclosure, and destroying the local copy.

   The storage disclosure is deliberate product honesty. StoryDex keeps your
   library in this browser only; a "Clear data" button that doesn't say that
   is a trap, so the sentence sits *above* the button rather than in a footer.
   ========================================================================== */

const THEME_KEY = 'storydex:theme'
type Theme = 'light' | 'dark'

interface SettingsMenuProps {
  username: string | null
  importedAt?: string | null
  franchiseCount: number
  onReimport: () => void
}

export function SettingsMenu({ username, importedAt, franchiseCount, onReimport }: SettingsMenuProps) {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
  }, [])

  function applyTheme(next: Theme) {
    setTheme(next)
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // Private mode. The theme still applies for this session.
    }
  }

  function clearData() {
    try {
      localStorage.removeItem('storydex:library:v1')
    } catch {
      // Nothing to do — if storage is unavailable, there's nothing stored.
    }
    window.dispatchEvent(new Event('storydex:library-updated'))
    setOpen(false)
  }

  const imported = importedAt ? new Date(importedAt).toLocaleDateString() : null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Settings"
        className="grid size-9 place-items-center rounded-sm border border-transparent text-ink-2 transition-colors duration-150 hover:border-rule hover:bg-sunk hover:text-ink"
      >
        <span
          className="grid size-6 place-items-center rounded-full bg-sunk text-[0.6875rem] font-semibold uppercase text-ink-2"
          aria-hidden
        >
          {username ? username.slice(0, 1) : '·'}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
            <motion.div
              role="dialog"
              aria-label="Settings"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-md border border-rule-strong bg-surface lift"
            >
              {/* Account */}
              <div className="border-b border-rule px-4 py-3.5">
                <p className="text-micro font-semibold uppercase tracking-[0.08em] text-ink-3">
                  AniList
                </p>
                {username ? (
                  <p className="mt-1.5 text-body text-ink">
                    <span className="font-medium">@{username}</span>
                    <span className="text-ink-3"> · {franchiseCount} stories</span>
                  </p>
                ) : (
                  <p className="mt-1.5 text-body text-ink-2">No library imported yet</p>
                )}
                {imported && <p className="mt-0.5 text-small text-ink-3">Imported {imported}</p>}
              </div>

              {/* Theme */}
              <div className="border-b border-rule px-4 py-3.5">
                <p className="text-micro font-semibold uppercase tracking-[0.08em] text-ink-3">
                  Appearance
                </p>
                <div className="mt-2 flex gap-1.5">
                  <ThemeButton
                    active={theme === 'light'}
                    onClick={() => applyTheme('light')}
                    icon={<Sun className="size-3.5" aria-hidden />}
                    label="Paper"
                  />
                  <ThemeButton
                    active={theme === 'dark'}
                    onClick={() => applyTheme('dark')}
                    icon={<Moon className="size-3.5" aria-hidden />}
                    label="Night"
                  />
                </div>
              </div>

              {/* Library */}
              <div className="px-4 py-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onReimport()
                  }}
                  className="flex w-full items-center gap-2.5 text-body text-ink-2 transition-colors hover:text-ink"
                >
                  <Upload className="size-4 text-ink-3" aria-hidden />
                  {username ? 'Re-import from AniList' : 'Import from AniList'}
                </button>

                <p className="mt-3.5 text-small leading-relaxed text-ink-3">
                  Your library lives in this browser only. Nothing is sent to a StoryDex server, so
                  clearing it here cannot be undone.
                </p>

                {username && (
                  <button
                    type="button"
                    onClick={clearData}
                    className="mt-3 flex w-full items-center gap-2.5 text-body text-state-stopped transition-opacity hover:opacity-80"
                  >
                    <Trash2 className="size-4" aria-hidden />
                    Clear this library
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function ThemeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-sm border px-3 py-2 text-small font-medium transition-colors duration-150',
        active
          ? 'border-rule-strong bg-sunk text-ink'
          : 'border-rule text-ink-2 hover:border-rule-strong hover:text-ink',
      )}
    >
      {icon}
      {label}
      {active && <Check className="size-3 text-brand" aria-hidden />}
    </button>
  )
}
