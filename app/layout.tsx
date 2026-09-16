import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { AppShell } from '@/components/AppShell'
import './globals.css'

/* --------------------------------------------------------------------------
   Type system — two families, two jobs.

   Instrument Sans  →  interface AND titles. Confidence comes from weight and
                       scale, not from swapping typefaces.
   Newsreader      →  prose. Synopses, statements, editorial asides. The serif
                       is used for *reading*, not for headlines.

   Linked from the document rather than `next/font/google` so the build has no
   network dependency; the browser fetches and caches them directly.
   -------------------------------------------------------------------------- */
const FONT_HREF =
  'https://fonts.googleapis.com/css2' +
  '?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400' +
  '&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400' +
  '&display=swap'

/**
 * Applies the stored theme before first paint.
 *
 * Runs inline, ahead of the body, so a user who chose the dark theme never sees
 * a paper flash. Kept deliberately tiny and dependency-free.
 */
const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem('storydex:theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}})()`

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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f1eb' },
    { media: '(prefers-color-scheme: dark)', color: '#131210' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONT_HREF} />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
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
