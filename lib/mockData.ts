// Example/demo data shown when nothing has been imported from AniList yet
// (e.g. via the landing page's "Browse Examples" link). Real imports are
// produced by groupFranchises() in lib/franchise.ts and use the same shape.
export type { Franchise, Season } from './franchise'
import type { Franchise } from './franchise'

export const mockFranchises: Franchise[] = [
  {
    id: 'rezero',
    name: 'Re:ZERO',
    posterUrl: '/images/rezero.png',
    totalSeasons: 4,
    completedSeasons: 4,
    genres: ['Fantasy', 'Psychological', 'Thriller'],
    description: 'Follow Subaru on his journey through time and alternate timelines.',
    seasons: [
      { id: 's1', name: 'Season 1', episodes: 25, year: 2016, completed: true },
      { id: 's2', name: 'Season 2', episodes: 25, year: 2020, completed: true },
      { id: 's2p2', name: 'Season 2 Part 2', episodes: 12, year: 2021, completed: true },
      { id: 's3', name: 'Season 3', episodes: 16, year: 2024, completed: true },
    ],
  },
  {
    id: 'naruto',
    name: 'Naruto',
    posterUrl: '/images/naruto.png',
    totalSeasons: 2,
    completedSeasons: 2,
    genres: ['Action', 'Adventure', 'Ninja'],
    description: 'The journey of Naruto Uzumaki to become the Hokage.',
    seasons: [
      { id: 's1', name: 'Naruto', episodes: 220, year: 2002, completed: true },
      { id: 's2', name: 'Naruto Shippuden', episodes: 500, year: 2007, completed: true },
    ],
  },
  {
    id: 'dragonball',
    name: 'Dragon Ball',
    posterUrl: '/images/dragonball.png',
    totalSeasons: 3,
    completedSeasons: 2,
    genres: ['Action', 'Adventure', 'Comedy'],
    description: 'The iconic battle series featuring Saiyan warriors.',
    seasons: [
      { id: 's1', name: 'Dragon Ball', episodes: 153, year: 1986, completed: true },
      { id: 's2', name: 'Dragon Ball Z', episodes: 291, year: 1989, completed: true },
      { id: 's3', name: 'Dragon Ball Super', episodes: 131, year: 2015, completed: false },
    ],
  },
  {
    id: 'haikyuu',
    name: 'Haikyuu!!',
    posterUrl: '/images/haikyuu.png',
    totalSeasons: 4,
    completedSeasons: 3,
    genres: ['Sports', 'School', 'Volleyball'],
    description: 'A high school volleyball team&apos;s journey to nationals.',
    seasons: [
      { id: 's1', name: 'Season 1', episodes: 25, year: 2014, completed: true },
      { id: 's2', name: 'Season 2', episodes: 25, year: 2015, completed: true },
      { id: 's3', name: 'Season 3', episodes: 10, year: 2016, completed: true },
      { id: 's4', name: 'Haikyu!! TO THE TOP', episodes: 25, year: 2020, completed: false },
    ],
  },
  {
    id: 'onepiece',
    name: 'One Piece',
    posterUrl: '/images/onepiece.png',
    totalSeasons: 1,
    completedSeasons: 0,
    genres: ['Action', 'Adventure', 'Pirate'],
    description: 'Luffy&apos;s quest to become the Pirate King.',
    seasons: [
      { id: 's1', name: 'One Piece', episodes: 1000, year: 1999, completed: false },
    ],
  },
]
