import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { MotionProvider } from '@/components/MotionProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'StoryDex',
  description:
    'A map for the stories you carry. Track anime, manga, novels and one-shots as routes through time — powered by AniList.',
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
    themeColor: '#eef1f4',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="antialiased bg-background">
        <MotionProvider>{children}</MotionProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
