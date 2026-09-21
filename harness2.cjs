/* StoryDex full-suite harness — jsdom + real compiled app code.
 *
 * Sections:
 *   A  landing page
 *   S  mock schema guards (real AniList fields requested)
 *   L  native-unit label ground truth (pure)
 *   G  grouping + media-scope ground truth (pure)
 *   M  fetch-level import/search/chunking (mocked AniList, real schema)
 *   P  persistence across refreshes (FIX 1)
 *   F  anime/manga media filter derived view (FIX 2)
 *   B  find-a-story merge flow
 *   D  franchise detail pages
 *   H  served production CSS audit
 *
 * Run:  cd <repo root> && NODE_PATH=$PWD/node_modules node harness2.cjs
 */
'use strict'
const path = require('path')
const fs = require('fs')

const SDX = '/tmp/sdx'
const REPO = '/home/user/storydex'

/* ── module alias @/ → /tmp/sdx/ ─────────────────────────────────────── */
const Module = require('module')
const origResolve = Module._resolveFilename
Module._resolveFilename = function (request, ...args) {
  if (request.startsWith('@/')) request = path.join(SDX, request.slice(2))
  return origResolve.call(this, request, ...args)
}

/* ── jsdom ───────────────────────────────────────────────────────────── */
const { JSDOM } = require('jsdom')
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:3000/',
  pretendToBeVisual: true,
})
const w = dom.window

class IOShim {
  constructor(cb) { this.cb = cb }
  observe(t) { setTimeout(() => this.cb([{ target: t, isIntersecting: true }], this), 0) }
  unobserve() {}
  disconnect() {}
}
class ROShim {
  observe() {}
  unobserve() {}
  disconnect() {}
}
const matchMediaShim = () => ({
  matches: false,
  media: '',
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() { return false },
})

w.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0)
w.cancelAnimationFrame = (id) => clearTimeout(id)
w.IntersectionObserver = IOShim
w.ResizeObserver = ROShim
w.matchMedia = matchMediaShim
w.scrollTo = () => {}
if (!w.Event) w.Event = function () {}

const globalsToCopy = [
  'document', 'localStorage', 'location', 'HTMLElement', 'HTMLInputElement',
  'HTMLTextAreaElement', 'HTMLSelectElement', 'HTMLAnchorElement', 'Element', 'Node',
  'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'InputEvent', 'FocusEvent',
  'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame',
  'IntersectionObserver', 'ResizeObserver', 'matchMedia', 'Image', 'DOMException',
  'history', 'navigator',
]
for (const key of globalsToCopy) {
  try {
    if (key === 'navigator') {
      Object.defineProperty(globalThis, 'navigator', { value: w.navigator, configurable: true })
    } else {
      globalThis[key] = w[key]
    }
  } catch {}
}
globalThis.window = w

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function waitFor(cond, what, timeout = 10000) {
  const t0 = Date.now()
  let last
  while (Date.now() - t0 < timeout) {
    try { if (cond()) return } catch (e) { last = e }
    await sleep(15)
  }
  throw new Error(`TIMEOUT waiting for: ${what}${last ? ` (last: ${last.message})` : ''}`)
}

/* ── AniList mock — REAL schema, guarded ─────────────────────────────── */
class SchemaGuardError extends Error {}

function media(id, o) {
  const english = o.english
  return {
    id,
    idMal: id,
    type: o.type,
    format: o.format,
    title: { romaji: o.romaji ?? english, english, native: english },
    episodes: o.episodes ?? null,
    chapters: o.chapters ?? null,
    volumes: o.volumes ?? null,
    duration: null,
    seasonYear: o.year ?? null,
    season: null,
    startDate: o.year ? { year: o.year, month: 1, day: 1 } : null,
    genres: o.genres ?? [],
    description: o.description ?? null,
    coverImage: { large: `https://img.example/${id}-l.jpg`, extraLarge: `https://img.example/${id}-xl.jpg`, color: '#d5491f' },
    bannerImage: `https://img.example/${id}-banner.jpg`,
    siteUrl: `https://anilist.example/media/${id}`,
    status: { status: 'FINISHED' },
    relations: (o.relations ?? []).length ? { edges: o.relations } : null,
  }
}
function edge(relationType, id, type, format, title) {
  return { relationType, node: { id, type, format, title: { romaji: title, english: title, native: title } } }
}

/* Manga media carry `chapters` with `episodes: null` — the real schema. */
const MEDIA = {
  1001: media(1001, { type: 'ANIME', format: 'TV', english: 'Re:Zero Starting Life in Another World', year: 2016, episodes: 24, genres: ['Adventure', 'Drama'], description: 'A boy is dragged into another world.', relations: [edge('SEQUEL', 1002, 'ANIME', 'TV', 'Re:Zero 2nd Season'), edge('ALTERNATIVE', 2001, 'MANGA', 'MANGA', 'Re:Zero (Manga)')] }),
  1002: media(1002, { type: 'ANIME', format: 'TV', english: 'Re:Zero 2nd Season', year: 2020, episodes: 25, genres: ['Adventure'], relations: [edge('SEQUEL', 1004, 'ANIME', 'TV', 'Re:Zero 3rd Season')] }),
  1004: media(1004, { type: 'ANIME', format: 'TV', english: 'Re:Zero 3rd Season', year: 2023, episodes: 16, genres: ['Adventure'], relations: [edge('PREQUEL', 1002, 'ANIME', 'TV', 'Re:Zero 2nd Season')] }),
  8001: media(8001, { type: 'ANIME', format: 'TV', english: 'Filter Test Season 1', year: 2020, episodes: 12, relations: [edge('SEQUEL', 8002, 'ANIME', 'TV', 'Filter Test Season 2')] }),
  8002: media(8002, { type: 'ANIME', format: 'TV', english: 'Filter Test Season 2', year: 2021, episodes: 12, relations: [edge('PREQUEL', 8001, 'ANIME', 'TV', 'Filter Test Season 1')] }),
  8003: media(8003, { type: 'MANGA', format: 'MANGA', english: 'Filter Test Manga', year: 2020, chapters: 50, relations: [edge('ALTERNATIVE', 8001, 'ANIME', 'TV', 'Filter Test Season 1'), edge('SEQUEL', 8004, 'MANGA', 'MANGA', 'Filter Test Manga 2')] }),
  8004: media(8004, { type: 'MANGA', format: 'MANGA', english: 'Filter Test Manga 2', year: 2021, chapters: 45, relations: [edge('PREQUEL', 8003, 'MANGA', 'MANGA', 'Filter Test Manga')] }),
  1003: media(1003, { type: 'ANIME', format: 'TV', english: "Frieren: Beyond Journey's End", year: 2023, episodes: 28, genres: ['Adventure', 'Fantasy'], description: 'An elf mage after the quest.' }),
  2001: media(2001, { type: 'MANGA', format: 'MANGA', english: 'Re:Zero (Manga)', year: 2016, chapters: 369, genres: ['Adventure'], relations: [edge('ALTERNATIVE', 1001, 'ANIME', 'TV', 'Re:Zero Starting Life in Another World')] }),
  2002: media(2002, { type: 'MANGA', format: 'MANGA', english: 'Kaiji', year: 2004, chapters: 120, genres: ['Drama'], description: 'A gambler without money.' }),
  2003: media(2003, { type: 'MANGA', format: 'NOVEL', english: 'The Trap Novel', year: 2019, volumes: 12, genres: ['Mystery'] }),
  3001: media(3001, { type: 'ANIME', format: 'TV', english: 'Solo Leveling', year: 2024, episodes: 12, genres: ['Action'] }),
  4001: media(4001, { type: 'MANGA', format: 'MANGA', english: 'Berserk', year: 1989, chapters: 370, genres: ['Action', 'Drama'], description: 'The black sword.' }),
  5001: media(5001, { type: 'ANIME', format: 'TV', english: 'Null Progress Anime', year: 2021, episodes: 10 }),
  7001: media(7001, { type: 'ANIME', format: 'TV', english: 'Dragon Ball', year: 1986, episodes: 153, genres: ['Action', 'Adventure'], description: 'A boy with a dragon tail searches for a magic orb.', relations: [edge('SEQUEL', 7002, 'ANIME', 'TV', 'Dragon Ball Z')] }),
  7002: media(7002, { type: 'ANIME', format: 'TV', english: 'Dragon Ball Z', year: 1989, episodes: 291, genres: ['Action'], relations: [edge('PREQUEL', 7001, 'ANIME', 'TV', 'Dragon Ball'), edge('SEQUEL', 7003, 'ANIME', 'TV', 'Dragon Ball GT')] }),
  7003: media(7003, { type: 'ANIME', format: 'TV', english: 'Dragon Ball GT', year: 1996, episodes: 64, genres: ['Action'], relations: [edge('PREQUEL', 7002, 'ANIME', 'TV', 'Dragon Ball Z'), edge('SEQUEL', 7004, 'ANIME', 'TV', 'Dragon Ball Super')] }),
  7004: media(7004, { type: 'ANIME', format: 'TV', english: 'Dragon Ball Super', year: 2015, episodes: 131, genres: ['Action'], relations: [edge('PREQUEL', 7003, 'ANIME', 'TV', 'Dragon Ball GT')] }),
  7101: media(7101, { type: 'ANIME', format: 'TV', english: 'Gintama', year: 2006, episodes: 367, genres: ['Comedy'] }),
  7201: media(7201, { type: 'ANIME', format: 'TV', english: 'One Piece', year: 1999, episodes: 1100, genres: ['Adventure'] }),
  4002: media(4002, { type: 'MANGA', format: 'MANGA', english: 'Berserk 2', year: 2025, chapters: 100, genres: ['Action'], relations: [edge('PREQUEL', 4001, 'MANGA', 'MANGA', 'Berserk')] }),
  1101: media(1101, { type: 'ANIME', format: 'TV', english: 'Merge Test A', year: 2010, episodes: 12, relations: [edge('SEQUEL', 1102, 'ANIME', 'TV', 'Merge Test B')] }),
  1102: media(1102, { type: 'ANIME', format: 'TV', english: 'Merge Test B', year: 2012, episodes: 12 }),
  1201: media(1201, { type: 'ANIME', format: 'TV', english: 'Adapt Test Anime', year: 2015, episodes: 12, relations: [edge('ADAPTATION', 1202, 'MANGA', 'MANGA', 'Adapt Test Manga')] }),
  1202: media(1202, { type: 'MANGA', format: 'MANGA', english: 'Adapt Test Manga', year: 2010, chapters: 30 }),
}
for (let i = 1; i <= 560; i++) {
  MEDIA[9000 + i] = media(9000 + i, { type: 'MANGA', format: 'MANGA', english: `Bulk Manga ${i}`, year: 2000 + (i % 10), chapters: 10 })
}

function wireEntry(id, status, score, progress, progressVolumes) {
  return { id: id * 10, status, score, progress, progressVolumes, media: MEDIA[id] }
}

const PROFILES = {
  mixedfan: {
    ANIME: [wireEntry(1001, 'CURRENT', 85, 12, null), wireEntry(1002, 'PLANNING', 0, 0, null), wireEntry(1003, 'COMPLETED', 90, 24, null)],
    MANGA: [wireEntry(2001, 'CURRENT', 88, 42, 0), wireEntry(2002, 'COMPLETED', 95, 120, 0), wireEntry(2003, 'CURRENT', 80, 80, 3)],
  },
  animefan: {
    ANIME: [wireEntry(1003, 'COMPLETED', 90, 24, null), wireEntry(5001, 'CURRENT', 70, null, null)],
    MANGA: [],
  },
  mangafan: { ANIME: [], MANGA: [wireEntry(2002, 'COMPLETED', 95, 120, 0)] },
  dbfan: { ANIME: [wireEntry(7001, 'COMPLETED', 95, 153, null), wireEntry(7101, 'CURRENT', 88, 12, null), wireEntry(7201, 'CURRENT', 92, 42, null)], MANGA: [] },
  singlefan: { ANIME: [wireEntry(7001, 'CURRENT', 0, 10, null)], MANGA: [] },
  reversefan: { ANIME: [wireEntry(7001, 'COMPLETED', 95, 153, null)], MANGA: [] },
  zfan: { ANIME: [wireEntry(7002, 'CURRENT', 90, 100, null)], MANGA: [] },
  filterfan: { ANIME: [wireEntry(8001, 'CURRENT', 80, 5, null)], MANGA: [wireEntry(8003, 'CURRENT', 85, 10, 0)] },
  chunkfan: { ANIME: [], MANGA: Array.from({ length: 560 }, (_, i) => wireEntry(9000 + i + 1, 'COMPLETED', 60, 10, 0)) },
  emptyuser: { ANIME: [], MANGA: [] },
  privateuser: { ANIME: [wireEntry(1003, 'COMPLETED', 90, 24, null)], MANGA: 'PRIVATE' },
}
/* ghostuser is intentionally absent. */

const SEARCHABLE = new Set([1001, 1002, 1003, 2001, 2002, 2003, 3001, 4001, 4002, 7001, 7002, 7003, 7004, 7101, 7201])

const mock = {
  calls: 0,
  libCalls: [],
  forbidNetwork: false,
}

function duckResponse(status, json) {
  return { ok: status >= 200 && status < 300, status, json: async () => json }
}

function guardLibraryQuery(q) {
  for (const field of ['episodes', 'chapters', 'volumes', 'progress', 'progressVolumes']) {
    if (!q.includes(field)) throw new SchemaGuardError(`SCHEMA GUARD: MediaListCollection query must request "${field}"`)
  }
}
function guardMediaQuery(q) {
  for (const field of ['episodes', 'chapters', 'volumes']) {
    if (!q.includes(field)) throw new SchemaGuardError(`SCHEMA GUARD: media query must request "${field}"`)
  }
}
function guardSearchQuery(q) {
  for (const field of ['episodes', 'chapters', 'volumes']) {
    if (!q.includes(field)) throw new SchemaGuardError(`SCHEMA GUARD: search query must request "${field}"`)
  }
}

async function mockFetch(url, opts) {
  if (mock.forbidNetwork) {
    throw new AniListNetworkError('NETWORK FORBIDDEN during refresh test — app must not re-fetch AniList')
  }
  if (!String(url).includes('anilist')) return duckResponse(200, { data: {} })
  mock.calls++
  const body = JSON.parse(opts.body)
  const q = body.query
  const v = body.variables
  if (q.includes('MediaListCollection')) {
    guardLibraryQuery(q)
    mock.libCalls.push({ user: v.userName, type: v.type, chunk: v.chunk })
    const profile = PROFILES[v.userName]
    if (!profile) return duckResponse(404, { errors: [{ message: 'MediaListCollection: user not found' }] })
    if (profile[v.type] === 'PRIVATE') {
      return duckResponse(400, { errors: [{ message: `This user's ${v.type === 'ANIME' ? 'anime' : 'manga'} list is private or not public` }] })
    }
    const all = profile[v.type]
    const per = v.perChunk || 500
    const start = ((v.chunk || 1) - 1) * per
    const page = all.slice(start, start + per)
    return duckResponse(200, { data: { MediaListCollection: { hasNextChunk: start + per < all.length, lists: [{ name: 'Main', status: 'CURRENT', entries: page }] } } })
  }
  if (q.includes('id_in')) {
    guardMediaQuery(q)
    const found = (v.ids || []).filter((id) => MEDIA[id] && MEDIA[id].type === v.type)
    return duckResponse(200, { data: { Page: { media: found.map((id) => MEDIA[id]) } } })
  }
  if (q.includes('media(search')) {
    guardSearchQuery(q)
    const norm = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, ' ')
    const needle = norm(String(v.search))
    const found = Object.values(MEDIA).filter((m) => SEARCHABLE.has(m.id) && m.type === v.type && norm(m.title.english).includes(needle))
    const results = found.map((m) => ({
      id: m.id, type: m.type, title: m.title, format: m.format, seasonYear: m.seasonYear,
      episodes: m.episodes, chapters: m.chapters, volumes: m.volumes,
      coverImage: m.coverImage, bannerImage: m.bannerImage, description: m.description,
    }))
    return duckResponse(200, { data: { Page: { media: results } } })
  }
  throw new Error('MOCK: unrecognized AniList query: ' + q.slice(0, 80))
}
class AniListNetworkError extends Error {
  constructor(msg) { super(msg); this.name = 'AniListNetworkError' }
}
w.fetch = mockFetch
globalThis.fetch = mockFetch

/* ── compiled app ────────────────────────────────────────────────────── */
// In a real Next client build, the resolved image config from next.config.mjs
// (images.unoptimized: true) is provided to next/image. Emulate the same for
// the bare CJS render via the framework's ImageConfigContext.
const React = require('react')
const { createRoot } = require('react-dom/client')
const e = React.createElement

const storageKey = 'storydex:library:v2'
const legacyKey = 'storydex:library:v1'
const storedJSON = () => w.localStorage.getItem(storageKey)

/* ── check bookkeeping ───────────────────────────────────────────────── */
let passed = 0
let failed = 0
const failures = []
function check(name, cond, extra) {
  if (cond) { passed++; console.log(`PASS  ${name}`) }
  else { failed++; failures.push(name); console.log(`FAIL  ${name}${extra ? ' — ' + extra : ''}`) }
}

/* ═════════════════════════════════════════════════════════════════════ */
console.log('── S: mock schema guards ─────────────────────────────────')
const { searchAniList, searchAniListAll, fetchMediaByIds, fetchAniListLibrary } = require(path.join(SDX, 'lib/anilist.js'))
const libLib = require(path.join(SDX, 'lib/franchise.js'))

async function sectionS() {
  await check('S1 library query missing progressVolumes is refused', (async () => {
    try {
      await mockFetch('https://graphql.anilist.co', { body: JSON.stringify({ query: 'query { MediaListCollection { lists { entries { id } } } }', variables: { userName: 'x', type: 'ANIME', chunk: 1, perChunk: 500 } }) })
      return false
    } catch (err) { return err instanceof SchemaGuardError }
  })(), 'guard should throw')
  await check('S2 search query missing chapters is refused', (async () => {
    try {
      await mockFetch('https://graphql.anilist.co', { body: JSON.stringify({ query: 'query { Page { media(search: $s, type: $t) { id } } }', variables: { search: 'x', type: 'ANIME' } }) })
      return false
    } catch (err) { return err instanceof SchemaGuardError }
  })(), 'guard should throw')
  await check('S3 manga ids through type:ANIME return nothing', (async () => (await fetchMediaByIds([2002], 'ANIME')).length === 0)())
  await check('S4 manga ids through type:MANGA return the manga', (async () => (await fetchMediaByIds([2002], 'MANGA')).length === 1)())
}

/* ═════════════════════════════════════════════════════════════════════ */
console.log('── L: native-unit label ground truth ─────────────────────')
function sectionL() {
  const anime = { mediaType: 'ANIME', format: 'TV', episodes: 24, progress: 12 }
  const manga = { mediaType: 'MANGA', format: 'MANGA', chapters: 120, progress: 42 }
  const novel = { mediaType: 'MANGA', format: 'NOVEL', volumes: 12, progress: 3 }
  const oneshot = { mediaType: 'MANGA', format: 'ONE_SHOT' }
  const movie = { mediaType: 'ANIME', format: 'MOVIE' }
  check('L1 anime totalLabel', libLib.totalLabel(anime) === '24 episodes', libLib.totalLabel(anime))
  check('L2 anime progressLabel EP 12 / 24', libLib.progressLabel(anime) === 'EP 12 / 24', libLib.progressLabel(anime))
  check('L3 anime resume EP 13', libLib.resumeLabel(anime) === 'Resume EP 13' && libLib.resumePosition(anime) === 13)
  check('L4 manga totalLabel', libLib.totalLabel(manga) === '120 chapters', libLib.totalLabel(manga))
  check('L5 manga progressLabel CH 42 / 120', libLib.progressLabel(manga) === 'CH 42 / 120', libLib.progressLabel(manga))
  check('L6 manga resume CH 43', libLib.resumeLabel(manga) === 'Resume CH 43')
  check('L7 novel totalLabel', libLib.totalLabel(novel) === '12 volumes')
  check('L8 novel progressLabel VOL 3 / 12', libLib.progressLabel(novel) === 'VOL 3 / 12', libLib.progressLabel(novel))
  check('L9 novel resume VOL 4', libLib.resumeLabel(novel) === 'Resume VOL 4')
  check('L10 one-shot label + no numbered progress', libLib.totalLabel(oneshot) === 'one shot' && libLib.progressLabel(oneshot) === '—' && libLib.resumePosition(oneshot) === null)
  check('L11 movie label', libLib.totalLabel(movie) === 'film' && libLib.resumePosition(movie) === null)
  check('L12 empty anime total → bare unit word (never "0 / 0")', libLib.progressLabel({ ...anime, episodes: 0 }) === '—' && libLib.totalLabel({ ...anime, episodes: 0 }) === 'episodes')
}

/* ═════════════════════════════════════════════════════════════════════ */
console.log('── G: grouping + media-scope ground truth ────────────────')
function sectionG() {
  const mixedEntries = [
    ...PROFILES.mixedfan.ANIME,
    ...PROFILES.mixedfan.MANGA,
  ]
  const groups = libLib.groupFranchises(mixedEntries)
  check('G1 mixedfan → 4 franchises', groups.length === 4, `got ${groups.length}`)
  const rezero = groups.find((g) => g.name === 'Re:Zero Starting Life in Another World')
  check('G2 Re:Zero merged anime S1 + anime S2 + manga via relations', !!rezero && rezero.seasons.length === 3, rezero ? rezero.seasons.length : 'missing')
  if (rezero) {
    check('G3 Re:Zero season order (year, then id)', rezero.seasons.map((s) => s.aniListId).join(',') === '1001,2001,1002', rezero.seasons.map((s) => s.aniListId).join(','))
    const s1 = rezero.seasons[0]
    check('G4 anime S1 native fields (episodes=24, progress=12, no chapters)', s1.mediaType === 'ANIME' && s1.episodes === 24 && s1.progress === 12 && s1.chapters === undefined, JSON.stringify({ ep: s1.episodes, ch: s1.chapters, p: s1.progress }))
    const mz = rezero.seasons[1]
    check('G5 manga native fields (chapters=369, progress=42, episodes undefined)', mz.mediaType === 'MANGA' && mz.chapters === 369 && mz.progress === 42 && mz.episodes === undefined, JSON.stringify({ ch: mz.chapters, ep: mz.episodes, p: mz.progress }))
    check('G6 Re:Zero nextToWatch is anime S1', rezero.nextToWatch?.aniListId === 1001)
  }
  const novel = groups.find((g) => g.name === 'The Trap Novel')
  check('G7 novel progress from progressVolumes=3 (trap progress=80 ignored)', !!novel && novel.seasons[0].progress === 3 && novel.seasons[0].volumes === 12, novel ? String(novel.seasons[0].progress) : 'missing')
  check('G8 Frieren completed + no next', !!groups.find((g) => g.name === "Frieren: Beyond Journey's End" && g.completedSeasons === 1 && g.nextToWatch === null))

  // conservative relations
  const merged = libLib.groupFranchises([wireEntry(1101, 'CURRENT', 0, 0, null), wireEntry(1102, 'CURRENT', 0, 0, null)])
  check('G9 SEQUEL edge merges two anime', merged.length === 1, `got ${merged.length}`)
  const notMerged = libLib.groupFranchises([wireEntry(1201, 'CURRENT', 0, 0, null), wireEntry(1202, 'CURRENT', 0, 0, null)])
  check('G10 ADAPTATION edge does NOT merge (conservative set)', notMerged.length === 2, `got ${notMerged.length}`)

  // dedup by status priority
  const dupes = libLib.groupFranchises([wireEntry(1003, 'PLANNING', 0, 0, null), wireEntry(1003, 'COMPLETED', 90, 24, null)])
  check('G11 duplicate media id keeps higher-priority status', dupes.length === 1 && dupes[0].seasons[0].completed === true, JSON.stringify(dupes.map((d) => d.seasons.map((s) => s.status))))

  // normalizeTitle
  check('G12 normalizeTitle keeps Re:Zero vs Re:Creators distinct', libLib.normalizeTitle('Re:Zero Starting Life in Another World') !== libLib.normalizeTitle('Re:Creators'))

  // ── applyMediaScope (FIX 2) ──
  const ALL = libLib.applyMediaScope(groups, 'ALL')
  check('G13 scope ALL returns the stored view (same reference, unmutated)', ALL === groups)
  const ANIME = libLib.applyMediaScope(groups, 'ANIME')
  check('G14 scope ANIME keeps only franchises with anime', ANIME.map((g) => g.name).sort().join('|') === 'Frieren: Beyond Journey\'s End|Re:Zero Starting Life in Another World', ANIME.map((g) => g.name).join('|'))
  const az = ANIME.find((g) => g.name.startsWith('Re:Zero'))
  check('G15 scoped Re:Zero has exactly its 2 anime seasons', !!az && az.seasons.length === 2 && az.seasons.every((s) => s.mediaType === 'ANIME'), az ? az.seasons.map((s) => s.mediaType).join(',') : 'missing')
  check('G16 scoped Re:Zero recomputed totals (2/0, next = S1)', !!az && az.totalSeasons === 2 && az.completedSeasons === 0 && az.nextToWatch?.aniListId === 1001)
  check('G17 input NOT mutated by scoping', rezero.seasons.length === 3 && rezero.totalSeasons === 3 && rezero.nextToWatch?.aniListId === 1001)
  const MANGA = libLib.applyMediaScope(groups, 'MANGA')
  check('G18 scope MANGA keeps only MANGA-type franchises (incl. novels)', MANGA.map((g) => g.name).sort().join('|') === 'Kaiji|Re:Zero Starting Life in Another World|The Trap Novel', MANGA.map((g) => g.name).join('|'))
  const mz = MANGA.find((g) => g.name.startsWith('Re:Zero'))
  check('G19 scoped Re:Zero (manga) next = the manga, resume CH 43', !!mz && mz.seasons.length === 1 && mz.nextToWatch?.aniListId === 2001 && libLib.resumePosition(mz.nextToWatch) === 43)
  check('G20 scope excludes franchises with no matching medium', libLib.applyMediaScope([groups.find((g) => g.name === 'Kaiji')], 'ANIME').length === 0 && libLib.applyMediaScope([groups.find((g) => g.name === 'Frieren: Beyond Journey\'s End')], 'MANGA').length === 0)
}

/* ═════════════════════════════════════════════════════════════════════ */
console.log('── M: fetch-level import / search ────────────────────────')
async function sectionM() {
  const mixed = await fetchAniListLibrary('mixedfan')
  check('M1 mixedfan: 3 anime + 3 manga, no warnings', mixed.anime.length === 3 && mixed.manga.length === 3 && mixed.warnings.length === 0, JSON.stringify(mixed.warnings))
  check('M2 username round-trips', mixed.username === 'mixedfan')
  const animefan = await fetchAniListLibrary('animefan')
  check('M3 animefan: one-side-empty warning', animefan.anime.length === 2 && animefan.manga.length === 0 && animefan.warnings.length === 1 && /manga list is empty/.test(animefan.warnings[0]), JSON.stringify(animefan.warnings))
  const nullEntry = animefan.anime.find((a) => a.media.id === 5001)
  check('M4 null progress/progressVolumes normalized to 0', nullEntry && nullEntry.progress === 0 && nullEntry.progressVolumes === 0)
  const mangafan = await fetchAniListLibrary('mangafan')
  check('M5 mangafan: anime-side warning', mangafan.manga.length === 1 && /anime list is empty/.test(mangafan.warnings[0]))
  let bothEmpty = null
  try { await fetchAniListLibrary('emptyuser') } catch (err) { bothEmpty = err.message }
  check('M6 both-empty → truthful error', /no anime or manga entries/.test(bothEmpty || ''), bothEmpty)
  let ghost = null
  try { await fetchAniListLibrary('ghostuser') } catch (err) { ghost = err.message }
  check('M7 unknown user → "user not found" error', /user not found/i.test(ghost || ''), ghost)
  const priv = await fetchAniListLibrary('privateuser')
  check('M8 private manga list → anime imported + private warning + empty-side warning', priv.anime.length === 1 && priv.manga.length === 0 && priv.warnings.length === 2 && /private|public/i.test(priv.warnings[0]) && /manga list is empty/.test(priv.warnings[1]), JSON.stringify(priv.warnings))
  const chunk = await fetchAniListLibrary('chunkfan')
  const chunkCalls = mock.libCalls.filter((c) => c.user === 'chunkfan' && c.type === 'MANGA')
  check('M9 560 manga entries fetched over 2 chunks', chunk.manga.length === 560 && chunkCalls.length === 2 && chunkCalls.map((c) => c.chunk).join(',') === '1,2', `entries=${chunk.manga.length} calls=${chunkCalls.map((c) => c.chunk)}`)
  const kaiji = await searchAniList('kaiji', 'MANGA')
  check('M10 search manga exposes chapters (120)', kaiji.length === 1 && kaiji[0].chapters === 120 && kaiji[0].episodes === null, JSON.stringify(kaiji[0] && { ch: kaiji[0].chapters, ep: kaiji[0].episodes }))
  const all = await searchAniListAll('re zero')
  check('M11 all-scope search = two real queries merged (anime + manga)', all.length === 3 && all.some((r) => r.type === 'ANIME') && all.some((r) => r.type === 'MANGA'), `got ${all.length}`)
  const berserk = await searchAniListAll('berserk')
  const berserkRow = berserk.find((r) => r.id === 4001)
  check('M12 berserk search row: 370 chapters, type MANGA', !!berserkRow && berserkRow.chapters === 370 && berserkRow.type === 'MANGA')
}

/* ═════════════════════════════════════════════════════════════════════ */
console.log('── DOM helpers ─────────────────────────────────────────────')
const Dashboard = require(path.join(SDX, 'app/dashboard/page.js')).default
const Home = require(path.join(SDX, 'app/page.js')).default
const FranchiseDetail = require(path.join(SDX, 'app/franchise/[id]/page.js')).default

let root = null
const { AppRouterContext } = require('next/dist/shared/lib/app-router-context.shared-runtime.js')
const { ImageConfigContext } = require('next/dist/shared/lib/image-config-context.shared-runtime.js')
const { imageConfigDefault } = require('next/dist/shared/lib/image-config')
const imageConfig = {
  ...imageConfigDefault,
  unoptimized: true,
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  qualities: [75],
}
const fakeRouter = { push() {}, replace() {}, back() {}, forward() {}, prefetch() {}, refresh() {}, setParams() {} }
function mount(Component, props = {}) {
  // A page refresh / new visit replaces the previous tree — unmount first
  // so stale DOM from an earlier render can't leak into assertions.
  if (root) {
    root.unmount()
    root = null
  }
  w.document.body.innerHTML = ''
  const host = w.document.createElement('div')
  w.document.body.appendChild(host)
  root = createRoot(host)
  root.render(
    e(ImageConfigContext.Provider, { value: imageConfig },
      e(AppRouterContext.Provider, { value: fakeRouter }, e(Component, props))),
  )
  return host
}
async function unmount() {
  if (root) { await sleep(30); root.unmount(); await sleep(30); root = null }
  w.document.body.innerHTML = '<div id="root"></div>'
}
function $(sel, el) { return (el || w.document).querySelector(sel) }
function $all(sel, el) { return Array.from((el || w.document).querySelectorAll(sel)) }
const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '')
function click(el) {
  el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }))
}
function setInput(el, value) {
  const proto = Object.getPrototypeOf(el)
  const desc = Object.getOwnPropertyDescriptor(proto, 'value') || Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value')
  desc.set.call(el, value)
  el.dispatchEvent(new w.Event('input', { bubbles: true }))
}
function setSelect(el, value) {
  const desc = Object.getOwnPropertyDescriptor(w.HTMLSelectElement.prototype, 'value')
  desc.set.call(el, value)
  el.dispatchEvent(new w.Event('change', { bubbles: true }))
}
function buttonByText(sel, label) {
  return $all(sel).find((b) => text(b) === label)
}
async function waitLoadingDone() {
  await waitFor(() => !$('.atlas-loading'), 'loading to clear')
  await waitFor(() => !$('.dashboard-skeleton'), 'detail loading to clear')
  await sleep(40)
}
/** Simulates a full page refresh: same window/localStorage, fresh React
 *  tree. When freezeNetwork, ANY AniList call rejects (and is counted). */
async function refreshPage(Comp, props = {}, freezeNetwork = false) {
  const before = storedJSON()
  await unmount()
  const callsBefore = mock.calls
  if (freezeNetwork) mock.forbidNetwork = true
  mount(Comp, props)
  await waitLoadingDone()
  if (freezeNetwork) mock.forbidNetwork = false
  const after = storedJSON()
  return { before, after, networkDelta: mock.calls - callsBefore }
}

/* ═════════════════════════════════════════════════════════════════════ */
console.log('── A: landing page ───────────────────────────────────────')
async function sectionA() {
  mount(Home)
  await sleep(60)
  check('A1 landing title present', text($('.tp__title')).includes('Every story has a map.'), text($('.tp__title')))
  const cta = $('a.cta', $('.title-page'))
  check('A2 CTA links to /dashboard', !!cta && cta.getAttribute('href') === '/dashboard' && text(cta).includes('Open your atlas'))
  check('A3 no library content leaks on landing', !$('.idx') && !$('.cover--reel'))
  await unmount()
}

/* ═════════════════════════════════════════════════════════════════════ */
console.log('── X: franchise graph + user provenance ───────────────────')
async function sectionX() {
  const { expandFranchises, groupFranchises, applyMediaScope } = libLib

  w.localStorage.removeItem(storageKey)
  w.localStorage.removeItem(legacyKey)

  /* TEST 1 — single anime → full franchise graph with provenance */
  const single = await fetchAniListLibrary('singlefan')
  const singleDisc = await expandFranchises([...single.anime, ...single.manga])
  const singleGroups = groupFranchises([...single.anime, ...single.manga], singleDisc)
  check('X1 TEST 1: 1 franchise, 4 graph entries (1 user + 3 discovered)', singleGroups.length === 1 && singleGroups[0].seasons.length === 4, `f=${singleGroups.length} s=${singleGroups[0] && singleGroups[0].seasons.length}`)
  const db1 = singleGroups[0]
  const s7001 = db1.seasons.find((x) => x.aniListId === 7001)
  check('X1b user entry keeps its own state (inUserList, CURRENT, progress 10)', s7001.inUserList === true && s7001.status === 'CURRENT' && s7001.progress === 10)
  check('X1c discovered entries: NOT_IN_LIST, zero progress, inUserList=false', [7002, 7003, 7004].every((id) => { const x = db1.seasons.find((z) => z.aniListId === id); return x && x.inUserList === false && x.status === 'NOT_IN_LIST' && x.progress === 0 && x.completed === false }), JSON.stringify(db1.seasons.map((x) => [x.aniListId, x.inUserList, x.status, x.progress])))
  check('X1d progress fields count user entries only (1 user entry, 0 completed, next=7001)', db1.totalSeasons === 1 && db1.completedSeasons === 0 && db1.nextToWatch?.aniListId === 7001)
  check('X1e a discovered entry is never a resume item', db1.nextToWatch?.inUserList === true)

  /* Title determinism — a discovered prequel must not rename the franchise */
  const zfan = await fetchAniListLibrary('zfan')
  const zfanDisc = await expandFranchises([...zfan.anime, ...zfan.manga])
  const zfanGroups = groupFranchises([...zfan.anime, ...zfan.manga], zfanDisc)
  check('X2 title pinned to the user entry: "Dragon Ball Z" (not the discovered 1986 prequel)', zfanGroups.length === 1 && zfanGroups[0].name === 'Dragon Ball Z' && zfanGroups[0].aniListId === 7002, zfanGroups[0] && `${zfanGroups[0].name} (id ${zfanGroups[0].id})`)
  check('X2b discovered prequel sits on the route (4 seasons, first dot is the discovered 7001)', zfanGroups[0].seasons.length === 4 && zfanGroups[0].seasons[0].aniListId === 7001 && zfanGroups[0].seasons[0].inUserList === false)

  /* TEST 2 + TEST 4 — mixed list: discovered graph + user-only progress */
  const db = await fetchAniListLibrary('dbfan')
  const dbDisc = await expandFranchises([...db.anime, ...db.manga])
  const dbGroups = groupFranchises([...db.anime, ...db.manga], dbDisc)
  check('X3 TEST 2: 3 franchises; Dragon Ball graph = 4 (1 user + 3 discovered)', dbGroups.length === 3 && dbGroups.find((g) => g.name === 'Dragon Ball').seasons.length === 4, `f=${dbGroups.length}`)
  const dbFr = dbGroups.find((g) => g.name === 'Dragon Ball')
  check('X3b Dragon Ball: user 7001 (COMPLETED) + discovered Z/GT/Super', dbFr.seasons.filter((x) => x.inUserList).length === 1 && dbFr.seasons.find((x) => x.aniListId === 7001).completed === true)
  check('X4 TEST 4: completed user entries = 1 of 1 (NOT 1 of 4)', dbFr.totalSeasons === 1 && dbFr.completedSeasons === 1)
  check('X4b library-wide user totals: 3 user entries, 1 completed', dbGroups.reduce((c, g) => c + g.totalSeasons, 0) === 3 && dbGroups.reduce((c, g) => c + g.completedSeasons, 0) === 1)

  /* TEST 3 — media filter over the COMPLETE graph */
  const ff = await fetchAniListLibrary('filterfan')
  const ffDisc = await expandFranchises([...ff.anime, ...ff.manga])
  const ffGroups = groupFranchises([...ff.anime, ...ff.manga], ffDisc)
  const ffAll = applyMediaScope(ffGroups, 'ALL')
  const ffAnime = applyMediaScope(ffGroups, 'ANIME')
  const ffManga = applyMediaScope(ffGroups, 'MANGA')
  check('X5 TEST 3: ALL = 4 graph entries (2 user + 2 discovered)', ffAll.length === 1 && ffAll[0].seasons.length === 4 && ffAll[0].totalSeasons === 2)
  check('X5b ANIME = 2 (S1 user + S2 discovered), user count 1', ffAnime.length === 1 && ffAnime[0].seasons.length === 2 && ffAnime[0].totalSeasons === 1)
  check('X5c MANGA = 2 (Manga user + Manga 2 discovered), user count 1', ffManga.length === 1 && ffManga[0].seasons.length === 2 && ffManga[0].totalSeasons === 1)
  check('X5d scoped next-to-watch is user-owned (anime: S1; manga: Manga)', ffAnime[0].nextToWatch?.aniListId === 8001 && ffManga[0].nextToWatch?.aniListId === 8003)

  /* DOM — fresh dbfan import: exact titles + provenance in UI & storage */
  mount(Dashboard)
  await waitLoadingDone()
  click($('button.cta', $('.first-run')))
  await waitFor(() => $('.dlg'), 'dialog to open')
  click(buttonByText('.dlg__tab', 'Whole list'))
  await sleep(20)
  setInput($('#anilist-username'), 'dbfan')
  click($('.dlg__submit'))
  await waitFor(() => !$('.dlg') && $all('.idx').length > 0, 'dbfan import to complete')
  const names = $all('.idx').map((r) => text($('.idx__name', r))).sort()
  check('X6 DOM: exactly 3 routes from the user list', names.length === 3 && names.join('|') === 'Dragon Ball|Gintama|One Piece', names.join('|'))
  check('X6b title integrity: "Dragon Ball" displayed exactly as AniList returned it', names.includes('Dragon Ball'))
  check('X6c title integrity: NO "Dragon Boy" anywhere in the rendered document', !w.document.body.textContent.includes('Dragon Boy'))
  const dbRow = $all('.idx').find((r) => text($('.idx__name', r)) === 'Dragon Ball')
  check('X6d Dragon Ball route shows the full graph: 4 dots, user count 1/1, state complete', $all('.glyph__dot', dbRow).length === 4 && text($('.idx__count', dbRow)) === '1/1' && text($('.idx__state', dbRow)).includes('complete'), `dots=${$all('.glyph__dot', dbRow).length} count=${text($('.idx__count', dbRow))} state=${text($('.idx__state', dbRow))}`)
  const dbSaved = JSON.parse(storedJSON())
  const dbF2 = dbSaved.franchises.find((f) => f.name === 'Dragon Ball')
  check('X6e storage: provenance intact (7001 user; 7002/3/4 discovered NOT_IN_LIST)', dbF2.seasons.length === 4 && dbF2.seasons.find((x) => x.aniListId === 7001).inUserList === true && [7002, 7003, 7004].every((id) => dbF2.seasons.find((x) => x.aniListId === id).inUserList === false && dbF2.seasons.find((x) => x.aniListId === id).progress === 0))

  /* TEST 3 DOM — filterfan: filters over the complete graph */
  click($('.atlas-nav button.cta'))
  await waitFor(() => $('.dlg'), 'dialog to reopen')
  click(buttonByText('.dlg__tab', 'Whole list'))
  await sleep(20)
  setInput($('#anilist-username'), 'filterfan')
  click($('.dlg__submit'))
  await waitFor(() => !$('.dlg') && $all('.idx').length > 0, 'filterfan import to complete')
  check('X7 TEST 3 DOM: 1 route, ALL = 4 dots, user entries 0/2', $all('.idx').length === 1 && $all('.glyph__dot', $all('.idx')[0]).length === 4 && text($('.idx__count', $all('.idx')[0])) === '0/2')
  click(buttonByText('.index__filter', 'Anime'))
  await sleep(60)
  const animeRow = $all('.idx')[0]
  check('X7b ANIME view: 2 dots (S1 user + S2 discovered), 0/1', $all('.idx').length === 1 && $all('.glyph__dot', animeRow).length === 2 && text($('.idx__count', animeRow)) === '0/1', `dots=${animeRow ? $all('.glyph__dot', animeRow).length : -1}`)
  const ffScene = $all('.cover__scene').find((sc) => text(sc).includes('Resume EP 6'))
  check('X7c ANIME reel: discovered S2 on the route, resume is the user\'s S1 (EP 6)', !!ffScene && $all('.route__tick', ffScene).length === 2)
  click(buttonByText('.index__filter', 'Manga'))
  await sleep(60)
  const mangaRow = $all('.idx')[0]
  check('X7d MANGA view: 2 dots (Manga user + Manga 2 discovered), 0/1', $all('.idx').length === 1 && $all('.glyph__dot', mangaRow).length === 2 && text($('.idx__count', mangaRow)) === '0/1')
  const ffMScene = $all('.cover__scene').find((sc) => text(sc).includes('Resume CH 11'))
  check('X7e MANGA reel: next-to-read is the user\'s manga (CH 11), 2 route ticks', !!ffMScene && $all('.route__tick', ffMScene).length === 2)
  click(buttonByText('.index__filter', 'All'))
  await sleep(60)

  /* Find a story: selection adds the work AND its discovered graph */
  w.localStorage.removeItem(storageKey)
  await refreshPage(Dashboard)
  click($('button.cta', $('.first-run')))
  await waitFor(() => $('.dlg'), 'dialog for find-a-story')
  setInput($('.dlg__input'), 'dragon ball')
  click($('.dlg__search-btn'))
  await waitFor(() => $all('.dlg__result').some((x) => !x.classList.contains('is-loading')), 'search results')
  const plainRow = $all('.dlg__result').filter((x) => !x.classList.contains('is-loading')).find((x) => text($('.dlg__result-title', x)) === 'Dragon Ball')
  click(plainRow)
  await sleep(30)
  click($('.dlg__submit'))
  await waitFor(() => !$('.dlg') && $all('.idx').length > 0, 'selected story import')
  let fSaved = JSON.parse(storedJSON())
  check('X8 find-a-story: selected entry + discovered graph (4 seasons, 1 user-owned)', fSaved.franchises.length === 1 && fSaved.franchises[0].seasons.length === 4 && fSaved.franchises[0].seasons.filter((x) => x.inUserList).length === 1 && fSaved.franchises[0].totalSeasons === 1, JSON.stringify(fSaved.franchises.map((f) => f.seasons.map((x) => [x.aniListId, x.inUserList]))))
  /* an explicit second selection promotes a discovered entry to user-owned */
  click($('.atlas-nav button.cta'))
  await waitFor(() => $('.dlg'), 'dialog to reopen')
  setInput($('.dlg__input'), 'dragon ball z')
  click($('.dlg__search-btn'))
  await waitFor(() => $all('.dlg__result').some((x) => !x.classList.contains('is-loading')), 'Z search results')
  const zRow = $all('.dlg__result').filter((x) => !x.classList.contains('is-loading')).find((x) => text($('.dlg__result-title', x)) === 'Dragon Ball Z')
  click(zRow)
  await sleep(30)
  click($('.dlg__submit'))
  await waitFor(() => !$('.dlg') && $all('.idx').length === 1, 'Z import merge')
  fSaved = JSON.parse(storedJSON())
  const zf = fSaved.franchises[0]
  check('X9 explicit import promotes Dragon Ball Z to inUserList=true', zf.seasons.find((x) => x.aniListId === 7002).inUserList === true && zf.seasons.find((x) => x.aniListId === 7002).status === 'CURRENT')
  check('X9b still-unselected entries stay discovered; user totals now 2', zf.seasons.find((x) => x.aniListId === 7003).inUserList === false && zf.seasons.find((x) => x.aniListId === 7004).inUserList === false && zf.totalSeasons === 2)
  check('X9c DOM: one Dragon Ball route, 4 dots, user entries 0/2', $all('.idx').length === 1 && $all('.glyph__dot', $all('.idx')[0]).length === 4 && text($('.idx__count', $all('.idx')[0])) === '0/2')

  /* X11 — REGRESSION: duplicate Dragon Ball routes (same graph stored twice).
   * Both import orders must produce ONE franchise; a promoted entry never
   * spawns a second franchise; legacy duplicate storage is canonicalized on
   * hydration and persisted — never hidden in the UI. */
  const seasonFor = (f, id) => f.seasons.find((x) => x.aniListId === id || x.id === String(id))
  const findSaved = () => JSON.parse(storedJSON()).franchises

  /* X11a reverse order — whole-list Z first, then whole-list original DB */
  w.localStorage.removeItem(storageKey)
  await refreshPage(Dashboard)
  click($('button.cta', $('.first-run')))
  await waitFor(() => $('.dlg'), 'dialog for zfan whole-list')
  click(buttonByText('.dlg__tab', 'Whole list'))
  await sleep(20)
  setInput($('#anilist-username'), 'zfan')
  click($('.dlg__submit'))
  await waitFor(() => !$('.dlg') && $all('.idx').length > 0, 'zfan whole-list import')
  check('X11a reverse order step 1: whole-list Z → ONE route named "Dragon Ball Z"', $all('.idx').length === 1 && text($('.idx__name', $all('.idx')[0])) === 'Dragon Ball Z', $all('.idx').map((r) => text($('.idx__name', r))).join('|'))
  click($('.atlas-nav button.cta'))
  await waitFor(() => $('.dlg'), 'dialog to reopen for reversefan')
  click(buttonByText('.dlg__tab', 'Whole list'))
  await sleep(20)
  setInput($('#anilist-username'), 'reversefan')
  click($('.dlg__submit'))
  await waitFor(() => !$('.dlg') && $all('.idx').length > 0, 'reversefan whole-list import (replaces)')
  await sleep(60)
  check('X11b reverse order step 2: whole-list DB (own profile) → ONE route "Dragon Ball", complete 1/1, 4 dots', $all('.idx').length === 1 && text($('.idx__name', $all('.idx')[0])) === 'Dragon Ball' && text($('.idx__state', $all('.idx')[0])).includes('complete') && text($('.idx__count', $all('.idx')[0])) === '1/1' && $all('.glyph__dot', $all('.idx')[0]).length === 4, `${$all('.idx').length} rows: ${$all('.idx').map((r) => text($('.idx__name', r)) + ' ' + text($('.idx__state', r))).join(' | ')}`)
  check('X11c storage after reverse order: ONE franchise, canonical identity (id 7001, 4 seasons, 1 user)', findSaved().length === 1 && findSaved()[0].id === '7001' && findSaved()[0].name === 'Dragon Ball' && findSaved()[0].seasons.length === 4 && findSaved()[0].totalSeasons === 1)

  /* X11d find-a-story on the stored season is a no-op merge (never duplicates) */
  click($('.atlas-nav button.cta'))
  await waitFor(() => $('.dlg'), 'dialog for find-a-story DB')
  setInput($('.dlg__input'), 'dragon ball')
  click($('.dlg__search-btn'))
  await waitFor(() => $all('.dlg__result').some((x) => !x.classList.contains('is-loading')), 'DB search results')
  const dbPickRow = $all('.dlg__result').filter((x) => !x.classList.contains('is-loading')).find((x) => text($('.dlg__result-title', x)) === 'Dragon Ball')
  click(dbPickRow)
  await sleep(30)
  click($('.dlg__submit'))
  await waitFor(() => !$('.dlg') && $all('.idx').length > 0, 'DB pick import')
  await sleep(60)
  check('X11d explicit DB pick on an already-user season: no-op merge, ONE route, complete 1/1, 4 dots', $all('.idx').length === 1 && text($('.idx__name', $all('.idx')[0])) === 'Dragon Ball' && text($('.idx__count', $all('.idx')[0])) === '1/1' && $all('.glyph__dot', $all('.idx')[0]).length === 4, `${$all('.idx').length} rows: ${$all('.idx').map((r) => text($('.idx__name', r)) + ' ' + text($('.idx__count', r))).join(' | ')}`)
  check('X11d2 storage after no-op pick: still ONE canonical franchise (id 7001, 4 seasons, 1 user)', findSaved().length === 1 && findSaved()[0].id === '7001' && findSaved()[0].seasons.length === 4 && findSaved()[0].totalSeasons === 1)

  /* X11e forward order — select Z first, then explicitly select DB */
  w.localStorage.removeItem(storageKey)
  await refreshPage(Dashboard)
  click($('button.cta', $('.first-run')))
  await waitFor(() => $('.dlg'), 'dialog for Z pick')
  setInput($('.dlg__input'), 'dragon ball z')
  click($('.dlg__search-btn'))
  await waitFor(() => $all('.dlg__result').some((x) => !x.classList.contains('is-loading')), 'Z search results (forward)')
  const zPickRow = $all('.dlg__result').filter((x) => !x.classList.contains('is-loading')).find((x) => text($('.dlg__result-title', x)) === 'Dragon Ball Z')
  click(zPickRow)
  await sleep(30)
  click($('.dlg__submit'))
  await waitFor(() => !$('.dlg') && $all('.idx').length > 0, 'Z pick import')
  check('X11e forward order step 1: ONE route "Dragon Ball Z", 0/1 user, 4 dots', $all('.idx').length === 1 && text($('.idx__name', $all('.idx')[0])) === 'Dragon Ball Z' && text($('.idx__count', $all('.idx')[0])) === '0/1' && $all('.glyph__dot', $all('.idx')[0]).length === 4)
  click($('.atlas-nav button.cta'))
  await waitFor(() => $('.dlg'), 'dialog for DB pick (forward)')
  setInput($('.dlg__input'), 'dragon ball')
  click($('.dlg__search-btn'))
  await waitFor(() => $all('.dlg__result').some((x) => !x.classList.contains('is-loading')), 'DB search results (forward)')
  const dbPickRow2 = $all('.dlg__result').filter((x) => !x.classList.contains('is-loading')).find((x) => text($('.dlg__result-title', x)) === 'Dragon Ball')
  click(dbPickRow2)
  await sleep(30)
  click($('.dlg__submit'))
  await waitFor(() => !$('.dlg') && $all('.idx').length > 0, 'DB pick import (forward)')
  await sleep(60)
  check('X11f forward order step 2: DB promotion merges — ONE route renamed "Dragon Ball", 0/2 user, 4 dots', $all('.idx').length === 1 && text($('.idx__name', $all('.idx')[0])) === 'Dragon Ball' && text($('.idx__count', $all('.idx')[0])) === '0/2' && $all('.glyph__dot', $all('.idx')[0]).length === 4, `${$all('.idx').length} rows: ${$all('.idx').map((r) => text($('.idx__name', r)) + ' ' + text($('.idx__count', r))).join(' | ')}`)
  const fwd = findSaved()[0]
  check('X11g forward order provenance: Z + DB user; GT + Super discovered; canonical id/name', findSaved().length === 1 && fwd.id === '7001' && fwd.name === 'Dragon Ball' && seasonFor(fwd, 7001).inUserList === true && seasonFor(fwd, 7002).inUserList === true && seasonFor(fwd, 7003).inUserList === false && seasonFor(fwd, 7004).inUserList === false && seasonFor(fwd, 7003).status === 'NOT_IN_LIST' && seasonFor(fwd, 7003).progress === 0, JSON.stringify([fwd.id, fwd.name, fwd.seasons.map((x) => [x.aniListId, x.inUserList])]))

  /* X11h pure unit: mergeFranchises is root-order independent */
  const mkSeason = (id, year, inUserList, extra = {}) => ({ id: String(id), name: `S${id}`, mediaType: 'ANIME', year, completed: false, status: inUserList ? 'CURRENT' : 'NOT_IN_LIST', progress: 0, inUserList, aniListId: id, posterUrl: '/placeholder.svg', ...extra })
  const mkF = (rootId, name, seasons) => ({ id: String(rootId), name, posterUrl: '/placeholder.svg', bannerUrl: null, totalSeasons: seasons.filter((s) => s.inUserList).length, completedSeasons: 0, genres: [], description: name + ' desc', seasons, aniListId: rootId, nextToWatch: null })
  const fRootZ = mkF(7002, 'Dragon Ball Z', [mkSeason(7001, 1986, false), mkSeason(7002, 1989, true, { progress: 100 }), mkSeason(7003, 1996, false), mkSeason(7004, 2015, false)])
  const fRootDB = mkF(7001, 'Dragon Ball', [mkSeason(7001, 1986, true, { progress: 10 }), mkSeason(7002, 1989, false), mkSeason(7003, 1996, false), mkSeason(7004, 2015, false)])
  const mFwd = libLib.mergeFranchises([fRootZ], [fRootDB])
  const mRev = libLib.mergeFranchises([fRootDB], [fRootZ])
  const mBoth = [mFwd, mRev].map((m) => ({ id: m[0].id, name: m[0].name, seasons: m[0].seasons.map((s) => [s.aniListId, s.inUserList, s.progress]).sort((a, b) => a[0] - b[0]) }))
  check('X11h mergeFranchises: one franchise regardless of root; identical canonical identity', mFwd.length === 1 && mRev.length === 1 && mFwd[0].id === '7001' && mRev[0].id === '7001' && mFwd[0].name === 'Dragon Ball' && mRev[0].name === 'Dragon Ball' && JSON.stringify(mBoth[0].seasons) === JSON.stringify(mBoth[1].seasons), JSON.stringify(mBoth))
  check('X11h2 provenance preserved + promoted: 7001 user p10, 7002 user p100, GT/Super discovered', mFwd[0].seasons.filter((s) => s.inUserList).length === 2 && seasonFor(mFwd[0], 7001).progress === 10 && seasonFor(mFwd[0], 7002).progress === 100 && seasonFor(mFwd[0], 7002).status === 'CURRENT' && [7003, 7004].every((id) => { const s = seasonFor(mFwd[0], id); return s.inUserList === false && s.progress === 0 && s.status === 'NOT_IN_LIST' }) && mFwd[0].totalSeasons === 2, JSON.stringify(mFwd[0].seasons.map((s) => [s.aniListId, s.inUserList, s.status, s.progress])))

  /* X11i legacy duplicate storage canonicalized during hydration + persisted */
  const legacyDup = {
    username: 'legacyfan',
    importedAt: '2026-01-01T00:00:00.000Z',
    franchises: [
      mkF(7002, 'Dragon Ball Z', [mkSeason(7001, 1986, true, { name: 'Dragon Ball', status: 'COMPLETED', completed: true, progress: 153 }), mkSeason(7002, 1989, true, { name: 'Dragon Ball Z', status: 'COMPLETED', completed: true, progress: 291 }), mkSeason(7003, 1996, true, { name: 'Dragon Ball GT', status: 'COMPLETED', completed: true, progress: 64 }), mkSeason(7004, 2015, true, { name: 'Dragon Ball Super', status: 'COMPLETED', completed: true, progress: 131 })]),
      mkF(7001, 'Dragon Ball', [mkSeason(7001, 1983, true, { name: 'Dragon Ball', status: 'PLANNING' })]),
    ],
  }
  legacyDup.franchises[0].totalSeasons = 4
  legacyDup.franchises[0].completedSeasons = 4
  w.localStorage.setItem(storageKey, JSON.stringify(legacyDup))
  await refreshPage(Dashboard)
  const canon = findSaved()
  check('X11i legacy duplicate franchises canonicalized during hydration (stored library rewritten)', canon.length === 1 && canon[0].id === '7001' && canon[0].name === 'Dragon Ball' && canon[0].seasons.length === 4 && canon[0].totalSeasons === 4 && canon[0].completedSeasons === 4, JSON.stringify(canon.map((f) => [f.id, f.name, f.seasons.length, f.totalSeasons, f.completedSeasons])))
  check('X11j DOM after hydration: ONE route "Dragon Ball", complete 4/4, 4 dots', $all('.idx').length === 1 && text($('.idx__name', $all('.idx')[0])) === 'Dragon Ball' && text($('.idx__count', $all('.idx')[0])) === '4/4' && $all('.glyph__dot', $all('.idx')[0]).length === 4, `${$all('.idx').length} rows: ${$all('.idx').map((r) => text($('.idx__name', r)) + ' ' + text($('.idx__count', r))).join(' | ')}`)

  /* TEST 5 — refresh with network dead: graph + provenance survive */
  const rf = await refreshPage(Dashboard, {}, true)
  check('X10 TEST 5: refresh (network forbidden) keeps graph + provenance byte-identical', rf.before === rf.after && rf.networkDelta === 0 && $all('.idx').length === 1 && text($('.idx__name', $all('.idx')[0])) === 'Dragon Ball' && text($('.idx__count', $all('.idx')[0])) === '4/4' && $all('.glyph__dot', $all('.idx')[0]).length === 4)
}

/* ═════════════════════════════════════════════════════════════════════ */
console.log('── P: persistence across refreshes (FIX 1) ───────────────')
let afterImportJSON = null
async function sectionP() {
  w.localStorage.removeItem(storageKey)
  w.localStorage.removeItem(legacyKey)

  /* P1 — fresh browser → FirstRun */
  mount(Dashboard)
  await waitLoadingDone()
  check('P1 fresh browser shows FirstRun', !!$('.first-run') && text($('.first-run__title')).includes('Every story has a map.'), 'first-run missing')
  check('P1b no fake library content before import', !$('.idx') && !$('.cover--reel'))
  check('P1c colophon honest (no username yet)', text($('.colophon')).includes('powered by AniList'), text($('.colophon')))

  /* P2 — import a whole profile */
  click($('button.cta', $('.first-run')))
  await waitFor(() => $('.dlg'), 'import dialog to open')
  click(buttonByText('.dlg__tab', 'Whole list'))
  await sleep(20)
  setInput($('#anilist-username'), 'mixedfan')
  click($('.dlg__submit'))
  await waitFor(() => !$('.dlg') && $all('.idx').length > 0, 'import to complete')
  check('P2 import renders 4 routes', $all('.idx').length === 4, `got ${$all('.idx').length}`)
  check('P2b colophon shows imported username', text($('.colophon')).includes('mapped from mixedfan'), text($('.colophon')))
  const saved = JSON.parse(storedJSON())
  check('P2c storydex:library:v2 saved with username + 4 franchises', saved.username === 'mixedfan' && saved.franchises.length === 4, JSON.stringify({ u: saved.username, n: saved.franchises && saved.franchises.length }))
  check('P2d storage keeps native fields (chapters on manga)', JSON.stringify(saved).includes('"chapters":369'))
  check('P2e import dialog closed, not auto-reopened', !$('.dlg'))
  const rzStored = saved.franchises.find((f) => f.name.startsWith('Re:Zero'))
  check('P2f storage provenance: Re:Zero = 3 user seasons + discovered 1004', rzStored.seasons.length === 4 && rzStored.seasons.filter((s) => s.inUserList).length === 3 && rzStored.seasons.find((s) => s.aniListId === 1004).inUserList === false && rzStored.seasons.find((s) => s.aniListId === 1004).status === 'NOT_IN_LIST' && rzStored.seasons.find((s) => s.aniListId === 1004).progress === 0, JSON.stringify(rzStored.seasons.map((s) => [s.aniListId, s.inUserList, s.status])))
  afterImportJSON = storedJSON()

  /* P3 — refresh #1: restore without re-fetching AniList */
  const r1 = await refreshPage(Dashboard, {}, true)
  check('P3a refresh #1 restores 4 routes (no re-import)', $all('.idx').length === 4, `got ${$all('.idx').length}`)
  check('P3b refresh #1 restores username (no re-entry)', text($('.colophon')).includes('mapped from mixedfan'))
  check('P3c refresh #1 does NOT open the import dialog', !$('.dlg'))
  check('P3d refresh #1 does NOT show FirstRun', !$('.first-run'))
  check('P3e refresh #1 makes ZERO AniList calls', r1.networkDelta === 0, `calls=${r1.networkDelta}`)
  check('P3f refresh #1 leaves storage byte-identical', r1.before === r1.after)

  /* P4 — refresh #2: still there */
  const r2 = await refreshPage(Dashboard, {}, true)
  check('P4 refresh #2 restores library again', $all('.idx').length === 4 && text($('.colophon')).includes('mapped from mixedfan') && r2.networkDelta === 0 && r2.before === r2.after)
}

/* ═════════════════════════════════════════════════════════════════════ */
console.log('── F: anime/manga media filter (FIX 2) ───────────────────')
async function sectionF() {
  // The dashboard is still mounted with the imported mixedfan library.
  const reelSection = () => $('.cover--reel')
  const pauseReel = () => { const s = reelSection(); if (s) s.dispatchEvent(new w.MouseEvent('mouseenter', { bubbles: true })) }

  /* F1 — ALL (default) */
  pauseReel()
  check('F1 ALL: 4 routes, 2 of 6 entries, 33%', text($('.index__count')) === '4 routes · 2 of 6 entries · 33% complete', text($('.index__count')))
  const rowsAll = $all('.idx')
  check('F1b ALL row order (most seasons first)', rowsAll.map((r) => text($('.idx__name', r))).join('|') === "Re:Zero Starting Life in Another World|Frieren: Beyond Journey's End|Kaiji|The Trap Novel", rowsAll.map((r) => text($('.idx__name', r))).join('|'))
  const rezeroAll = rowsAll[0]
  check('F1c Re:Zero (ALL) shows the full graph: 4 dots (incl. discovered S3) + user count 0/3', $all('.glyph__dot', rezeroAll).length === 4 && text($('.idx__count', rezeroAll)) === '0/3', `dots=${$all('.glyph__dot', rezeroAll).length} count=${text($('.idx__count', rezeroAll))}`)
  check('F1d Re:Zero (ALL) state → now at anime S1', text($('.idx__state', rezeroAll)).includes('now — Re:Zero Starting Life in Another World'), text($('.idx__state', rezeroAll)))

  /* F2 — ANIME */
  click(buttonByText('.index__filter', 'Anime'))
  await sleep(60)
  const rowsAnime = $all('.idx')
  const animeNames = rowsAnime.map((r) => text($('.idx__name', r))).sort()
  check('F2 ANIME: exactly 2 routes (manga-only franchises excluded)', animeNames.length === 2 && animeNames[0].startsWith('Frieren') && animeNames[1].startsWith('Re:Zero'), animeNames.join('|'))
  check('F2b ANIME stats scoped (1 of 3 entries, 33%)', text($('.index__count')) === '2 routes · 1 of 3 entries · 33% complete', text($('.index__count')))
  const rezeroAnime = rowsAnime.find((r) => text($('.idx__name', r)).startsWith('Re:Zero'))
  check('F2c Re:Zero (ANIME) shows 3 anime dots (S1, S2, discovered S3) + 0/2 — manga hidden', $all('.glyph__dot', rezeroAnime).length === 3 && text($('.idx__count', rezeroAnime)) === '0/2', `dots=${$all('.glyph__dot', rezeroAnime).length}`)
  check('F2d no manga-only row in ANIME view', !rowsAnime.some((r) => text($('.idx__name', r)) === 'Kaiji' || text($('.idx__name', r)) === 'The Trap Novel'))

  /* F3 — reel follows the scoped view (ANIME) */
  const sceneTexts = () => $all('.cover__scene').map(text).join(' || ')
  await waitFor(() => $all('.reel__item').length === 2, 'reel to have 2 stories (anime view)')
  check('F3 ANIME reel: 2 featured stories (not 4)', $all('.reel__item').length === 2, `got ${$all('.reel__item').length}`)
  const azScene = $all('.cover__scene').find((s) => text(s).includes('Re:Zero'))
  check('F3b Re:Zero anime scene: Resume EP 13, 3 entries (incl. discovered S3), 3 ticks', azScene && text(azScene).includes('Resume EP 13') && text(azScene).includes('3 entries') && $all('.route__tick', azScene).length === 3, azScene ? text(azScene).slice(0, 140) : 'scene missing')
  check('F3c Re:Zero anime scene: no manga chapter resume (CH 43 absent)', !!azScene && !text(azScene).includes('CH 43'))

  /* F4 — MANGA */
  click(buttonByText('.index__filter', 'Manga'))
  await sleep(60)
  const rowsManga = $all('.idx')
  const mangaNames = rowsManga.map((r) => text($('.idx__name', r))).sort()
  check('F4 MANGA: exactly 3 routes (anime-only franchises excluded)', mangaNames.length === 3 && mangaNames.some((n) => n.startsWith('Re:Zero')) && mangaNames.includes('Kaiji') && mangaNames.includes('The Trap Novel'), mangaNames.join('|'))
  check('F4b MANGA stats scoped (1 of 3 entries, 33%)', text($('.index__count')) === '3 routes · 1 of 3 entries · 33% complete', text($('.index__count')))
  const rezeroManga = rowsManga.find((r) => text($('.idx__name', r)).startsWith('Re:Zero'))
  check('F4c Re:Zero (MANGA) shows 1 dot + 0/1 — anime seasons hidden', $all('.glyph__dot', rezeroManga).length === 1 && text($('.idx__count', rezeroManga)) === '0/1', `dots=${$all('.glyph__dot', rezeroManga).length}`)
  const kaijiRow = rowsManga.find((r) => text($('.idx__name', r)) === 'Kaiji')
  check('F4d Kaiji (MANGA) completed 1/1', text($('.idx__count', kaijiRow)) === '1/1' && text($('.idx__state', kaijiRow)).includes('complete'))

  /* F5 — reel follows the scoped view (MANGA): next-to-READ is the manga */
  await waitFor(() => $all('.reel__item').length === 3, 'reel to have 3 stories (manga view)')
  check('F5 MANGA reel: 3 featured stories', $all('.reel__item').length === 3)
  // jump the reel to the Re:Zero scene (rail item 2)
  const railRezero = $all('.reel__item').find((b) => text($('.reel__name', b)).startsWith('Re:Zero'))
  click(railRezero)
  await waitFor(() => $all('.cover__scene').some((s) => text(s).includes('Resume CH 43')), 'manga scene with CH resume')
  const mzScene = $all('.cover__scene').find((s) => text(s).includes('CH 43'))
  check('F5b Re:Zero manga scene: Resume CH 43 (next-to-READ = the manga)', !!mzScene && $all('.route__tick', mzScene).length === 1, mzScene ? $all('.route__tick', mzScene).length : 'missing')
  check('F5c Re:Zero manga scene: no anime episode resume (EP 13 absent)', !!mzScene && !text(mzScene).includes('EP 13'))
  check('F5d manga scene route: 1 entry', !!mzScene && text(mzScene).includes('1 entries'))

  /* F6 — search operates on the visible (scoped) seasons */
  setInput($('.index__search input'), 'frieren')
  await sleep(80)
  check('F6 searching a hidden (anime) title in MANGA view matches nothing', $all('.idx').length === 0 && !!$('.empty-state'), `rows=${$all('.idx').length}`)
  setInput($('.index__search input'), 'kaiji')
  await sleep(80)
  check('F6b searching a visible (manga) title in MANGA view matches', $all('.idx').length === 1 && text($('.idx__name', $all('.idx')[0])) === 'Kaiji')
  setInput($('.index__search input'), '')
  await sleep(60)

  /* F7 — sorting uses scoped totals (back to ANIME) */
  click(buttonByText('.index__filter', 'Anime'))
  await sleep(60)
  setSelect($('.index__sort select'), 'az')
  await sleep(60)
  const azSorted = $all('.idx').map((r) => text($('.idx__name', r)))
  check('F7 ANIME + A–Z sort: Frieren before Re:Zero', azSorted.length === 2 && azSorted[0].startsWith('Frieren'), azSorted.join('|'))
  setSelect($('.index__sort select'), 'most-seasons')
  await sleep(60)
  click(buttonByText('.index__filter', 'All'))
  await sleep(60)

  /* F8 — stored library untouched by every filter operation */
  check('F8 storage byte-identical after all filter operations', storedJSON() === afterImportJSON)

  /* F9 — franchise detail page still shows the COMPLETE franchise */
  const r1 = await refreshPage(FranchiseDetail, { params: Promise.resolve({ id: '1001' }) })
  check('F9 detail page shows the complete franchise graph (4 chapters)', text($('.chapters__head h2')).includes('traveled in 4 chapters'), text($('.chapters__head h2')))
  check('F9b ledger lists all 4 entries (anime + manga + discovered S3)', $all('.ledger__row').length === 4, `got ${$all('.ledger__row').length}`)
  const metas = $all('.chapter__meta').map(text)
  check('F9c detail mixes mediums faithfully (tv + manga meta)', metas.some((m) => m.includes('tv · 24 ep')) && metas.some((m) => m.includes('manga · 369 ch')), metas.join(' | '))
}

/* ═════════════════════════════════════════════════════════════════════ */
console.log('── B: find-a-story merge ─────────────────────────────────')
async function sectionB() {
  await refreshPage(Dashboard)
  pauseReelIfNeeded()
  function pauseReelIfNeeded() { const s = $('.cover--reel'); if (s) s.dispatchEvent(new w.MouseEvent('mouseenter', { bubbles: true })) }
  // open dialog from the navbar
  click($('.atlas-nav button.cta'))
  await waitFor(() => $('.dlg'), 'dialog to open from navbar')
  check('B1 dialog opens on "Find a story" by default', buttonByText('.dlg__tab', 'Find a story')?.classList.contains('is-active'))
  setInput($('.dlg__input'), 'berserk')
  click($('.dlg__search-btn'))
  await waitFor(() => $all('.dlg__result').some((r) => !r.classList.contains('is-loading')), 'search results')
  const row = $all('.dlg__result').find((r) => text($('.dlg__result-title', r)) === 'Berserk')
  check('B2 search row meta uses chapters ("manga · 370 ch")', !!row && text($('.dlg__result-meta', row)).includes('manga · 370 ch'), row ? text($('.dlg__result-meta', row)) : 'row missing')
  const row2 = $all('.dlg__result').find((r) => text($('.dlg__result-title', r)) === 'Berserk 2')
  check('B3a Berserk 2 is searchable and selectable', !!row2)
  click(row2)
  await sleep(30)
  check('B3 submit button shows selection count', text($('.dlg__submit')).includes('Import 1 selected'), text($('.dlg__submit')))
  click($('.dlg__submit'))
  await waitFor(() => !$('.dlg') && $all('.idx').length === 5, 'story import to merge')
  check('B4 merged library now has 5 routes', $all('.idx').length === 5, `got ${$all('.idx').length}`)
  const saved = JSON.parse(storedJSON())
  check('B5 whole-profile identity preserved (username still mixedfan)', saved.username === 'mixedfan')
  const rz = saved.franchises.find((f) => f.name.startsWith('Re:Zero'))
  const s1 = rz.seasons.find((s) => s.aniListId === 1001)
  check('B6 existing progress preserved across merge (EP 12/24 intact)', s1.progress === 12 && s1.episodes === 24, JSON.stringify({ p: s1 && s1.progress }))
  const berserkF = saved.franchises.find((f) => f.id === '4002')
  const b1 = berserkF && berserkF.seasons.find((x) => x.aniListId === 4001)
  const b2 = berserkF && berserkF.seasons.find((x) => x.aniListId === 4002)
  check('B7 find-a-story: picked Berserk 2 is USER; its prequel Berserk joins DISCOVERED (zero progress)', !!berserkF && berserkF.seasons.length === 2 && b1.inUserList === false && b1.progress === 0 && b2.inUserList === true && b2.progress === 0 && berserkF.totalSeasons === 1, berserkF ? JSON.stringify(berserkF.seasons.map((x) => [x.aniListId, x.inUserList])) : 'franchise missing')
}

/* ═════════════════════════════════════════════════════════════════════ */
console.log('── D: franchise detail pages ─────────────────────────────')
async function sectionD() {
  await refreshPage(FranchiseDetail, { params: Promise.resolve({ id: '1001' }) })
  check('D1 Re:Zero detail: 4 chapters (incl. discovered S3)', $all('.chapter').length === 4, `got ${$all('.chapter').length}`)
  check('D2 current entry is anime S1 → "Continue watching" gate', text($('.gate__cta a.cta')) === 'Continue watching', text($('.gate__cta a.cta')))
  check('D3 resume EP 13 on the gate CTA line', text($('.here__ep-meta')).includes('EP 13') && text($('.here__ep-meta')).includes('24 ep total'), text($('.here__ep-meta')))
  check('D4 manga chapter meta "manga · 369 ch"', $all('.chapter__meta').some((m) => text(m).includes('manga · 369 ch')))
  check('D5 ledger has 4 rows', $all('.ledger__row').length === 4)

  await refreshPage(FranchiseDetail, { params: Promise.resolve({ id: '2003' }) })
  check('D6 novel detail: VOL progress (not the trap)', text($('.here__ep-meta')).includes('VOL 4') && text($('.here__ep-meta')).includes('12 vol total'), text($('.here__ep-meta')))
  check('D7 novel gate says "Continue reading"', text($('.gate__cta a.cta')) === 'Continue reading')

  await refreshPage(FranchiseDetail, { params: Promise.resolve({ id: '999999' }) })
  // note: <br> yields no text node, so "not<br/>in" reads as "notin" via textContent
  check('D8 unknown id → honest not-found (no crash, no fake data)', !!$('.not-found') && text($('.not-found h1')).includes('story is not') && text($('.not-found h1')).includes('in your') && text($('.not-found h1')).includes('library.'))
}

/* ═════════════════════════════════════════════════════════════════════ */
console.log('── P (cont): corrupted + legacy storage ───────────────────')
async function sectionP2() {
  await unmount()
  w.localStorage.setItem(storageKey, '{this is not json')
  mount(Dashboard)
  await waitLoadingDone()
  check('P5 corrupted v2 JSON → honest FirstRun, no crash', !!$('.first-run') && !$('.idx'), 'should be first-run')

  w.localStorage.setItem(storageKey, JSON.stringify({ username: 42, franchises: 'nope' }))
  await refreshPage(Dashboard)
  check('P5b wrong-shaped v2 value → honest FirstRun', !!$('.first-run') && !$('.idx'))

  // v1 legacy migration
  w.localStorage.removeItem(storageKey)
  w.localStorage.setItem(legacyKey, JSON.stringify({
    username: 'legacyreader',
    importedAt: '2024-01-01T00:00:00.000Z',
    franchises: [{
      id: '77', name: 'Legacy Show', posterUrl: '/p.svg', totalSeasons: 1, completedSeasons: 1,
      genres: [], description: 'Old library entry.',
      seasons: [{ id: '77', name: 'Legacy Show', year: 2000, completed: true, episodes: 12, progress: 12, status: 'COMPLETED', format: 'TV' }],
    }],
  }))
  await refreshPage(Dashboard)
  check('P6 v1 legacy library restored after migration', $all('.idx').length === 1 && text($('.colophon')).includes('mapped from legacyreader'), `rows=${$all('.idx').length}`)
  const v2 = JSON.parse(storedJSON() || 'null')
  check('P6b migrated to v2 key with mediaType ANIME default', !!v2 && v2.username === 'legacyreader' && v2.franchises[0].seasons[0].mediaType === 'ANIME' && w.localStorage.getItem(legacyKey) === null)
}

/* ═════════════════════════════════════════════════════════════════════ */
console.log('── H: served production CSS audit ────────────────────────')
function sectionH() {
  const staticDir = path.join(REPO, '.next/static')
  let css = ''
  try {
    const walk = (dir) => {
      for (const name of fs.readdirSync(dir)) {
        const p = path.join(dir, name)
        const st = fs.statSync(p)
        if (st.isDirectory()) walk(p)
        else if (name.endsWith('.css')) css += fs.readFileSync(p, 'utf8')
      }
    }
    walk(staticDir)
  } catch (err) {
    check('H0 production CSS found', false, String(err))
    return
  }
  check('H0 production CSS found', css.length > 10000, `${css.length} chars`)
  for (const sel of ['.atlas-loading', '.first-run__title', '.cover__scene', '.idx', '.glyph__dot', '.dlg__panel', '.route__track', '.ledger__row', '.reel__rail', '.index__filter', '.chapters__stage']) {
    check(`H CSS has ${sel}`, css.includes(sel), 'selector missing')
  }
  for (const hex of ['#eef1f4', '#18202a', '#d5491f']) {
    check(`H CSS palette ${hex}`, css.toLowerCase().includes(hex))
  }
  for (const font of ['DM Serif Display', 'Manrope', 'IBM Plex Mono']) {
    check(`H CSS font ${font}`, css.includes(font))
  }
}

/* ═════════════════════════════════════════════════════════════════════ */
;(async () => {
  try {
    await sectionS()
    sectionL()
    sectionG()
    await sectionM()
    await sectionA()
    await sectionX()
    await sectionP()
    await sectionF()
    await sectionB()
    await sectionD()
    await sectionP2()
    sectionH()
  } catch (err) {
    console.error('HARNESS CRASH:', err && err.stack ? err.stack : err)
    process.exitCode = 1
  } finally {
    const total = passed + failed
    console.log(`\n${passed}/${total} checks passed${failed ? ` — FAILED: ${failures.join(' | ')}` : ''}`)
    // One-shot runner: exit explicitly (motion/jsdom can leave idle handles).
    process.exit(failed > 0 ? 1 : 0)
  }
})()
