import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { AppShell } from '@/components/AppShell'
import './globals.css'

/* --------------------------------------------------------------------------
   Type system — one family, used with conviction.

   Instrument Sans at 600/700 with tight tracking carries every title; the same
   face at 400/500 carries the interface. Hierarchy comes from scale, weight and
   letter-spacing rather than from mixing typefaces, which is what makes the
   artwork the loudest thing on the page.

   Linked from the document rather than `next/font/google` so the build has no
   network dependency; the browser fetches and caches it directly.
   -------------------------------------------------------------------------- */
const FONT_HREF =
  'https://fonts.googleapis.com/css2' +
  '?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400' +
  '&display=swap'

export const metadata: Metadata = {
  title: {
    default: 'StoryDex — Count stories, not seasons',
    template: '%s · StoryDex',
  },
  description:
    'StoryDex regroups your AniList entries into whole franchises, so you can see the story you are actually in — and what to watch next.',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#08090c',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONT_HREF} />
      </head>
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        {/* The shell owns the masthead, the library context and the import
            dialogue, so every route shares one import and one source of truth
            for the header's counts. */}
        <AppShell>{children}</AppShell>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
