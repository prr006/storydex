import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Atmosphere } from '@/components/Atmosphere'
import './globals.css'

/* --------------------------------------------------------------------------
   Type system — three families, three jobs.

   Instrument Serif  →  editorial voice: story titles, hero copy, ledgers.
   Plus Jakarta Sans →  interface voice: buttons, section headers, nav.
   JetBrains Mono    →  instrument voice: counts, formats, years, percentages.
   Inter             →  reading voice: synopses, descriptions.

   Loaded with a plain <link> rather than `next/font/google` on purpose:
   next/font downloads the families at BUILD time, which makes the whole build
   depend on network access to Google. Linking them from the document means the
   browser fetches them directly, the build stays hermetic, and the variable
   font files are cached across the whole site. Swap to `next/font/local` with
   self-hosted files if you ever need zero third-party requests.
   -------------------------------------------------------------------------- */
const FONT_HREF =
  'https://fonts.googleapis.com/css2' +
  '?family=Instrument+Serif:ital@0;1' +
  '&family=Plus+Jakarta+Sans:wght@400;500;600;700;800' +
  '&family=JetBrains+Mono:wght@400;500;600' +
  '&family=Inter:wght@400;500;600' +
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
  colorScheme: 'dark',
  themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#050410' }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONT_HREF} />
      </head>
      <body className="relative antialiased">
        <Atmosphere />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
