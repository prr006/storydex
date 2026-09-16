/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // StoryDex renders artwork straight from AniList's CDN and never
    // re-hosts it, so optimisation is bypassed and the CDN is requested
    // directly by the browser. If you ever enable optimisation, the
    // remotePatterns below are the allow-list it will need.
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 's4.anilist.co' },
      { protocol: 'https', hostname: '*.anilist.co' },
    ],
  },
}

export default nextConfig
