import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ensurePoolSize } from './poolPadding.ts'
import type { PartnerPreferences, Title } from '../types.ts'

const POOL_SIZE = 30

const loosePrefs: PartnerPreferences = {
  moods: ['Light & fun'],
  moodNote: '',
  languages: ['Any'],
  contentType: 'movies',
  minRating: 6,
  eras: ['Any'],
}

const strictPrefs: PartnerPreferences = {
  moods: ['Scary'],
  moodNote: '',
  languages: ['Kannada'],
  contentType: 'movies',
  minRating: 9,
  eras: ['Classic (pre-2000)'],
}

test('dev/demo: a normal round always has POOL_SIZE distinct titles even when the live TMDB pool comes back short', () => {
  // Reproduces the production defect: live TMDB returned only 3 titles for a
  // narrow preference combination — this must never reach the UI as-is.
  const { pool, paddedCount, shortOfTarget } = ensurePoolSize([], strictPrefs, strictPrefs, [], POOL_SIZE, true)

  assert.equal(pool.length, POOL_SIZE, 'pool must be padded up to POOL_SIZE')
  assert.equal(paddedCount, POOL_SIZE, 'every title in this case came from padding')
  assert.equal(shortOfTarget, false)
  const ids = new Set(pool.map((t) => t.id))
  assert.equal(ids.size, POOL_SIZE, 'every title in the round must be distinct')
})

test('dev/demo: does not pad (or truncate) when the live pool already has enough titles', () => {
  const { pool: fullMock } = ensurePoolSize([], loosePrefs, loosePrefs, [], POOL_SIZE, true)
  const { pool, paddedCount } = ensurePoolSize(fullMock, loosePrefs, loosePrefs, [], POOL_SIZE, true)

  assert.equal(pool.length, POOL_SIZE)
  assert.equal(paddedCount, 0, 'a full live pool should not be padded further')
  assert.deepEqual(
    pool.map((t) => t.id),
    fullMock.map((t) => t.id),
  )
})

test('dev/demo: padding never reintroduces a title already excluded (seen this round/session)', () => {
  const { pool: firstRound } = ensurePoolSize([], loosePrefs, loosePrefs, [], POOL_SIZE, true)
  const excludeIds = firstRound.map((t) => t.id)

  const { pool: secondRound } = ensurePoolSize([], loosePrefs, loosePrefs, excludeIds, POOL_SIZE, true)

  const overlap = secondRound.filter((t) => excludeIds.includes(t.id))
  assert.equal(overlap.length, 0, 'no title from round one should reappear in round two')
})

test('dev/demo: padding never duplicates a title already present in the live pool', () => {
  const { pool: someLive } = ensurePoolSize([], loosePrefs, loosePrefs, [], 5, true)
  const { pool, paddedCount } = ensurePoolSize(someLive, loosePrefs, loosePrefs, [], POOL_SIZE, true)

  assert.equal(pool.length, POOL_SIZE)
  assert.equal(paddedCount, POOL_SIZE - someLive.length)
  const ids = pool.map((t) => t.id)
  assert.equal(new Set(ids).size, ids.length, 'no duplicate ids between the live pool and the padding')
})

function fakeTitle(overrides: Partial<Title> & Pick<Title, 'id' | 'name' | 'year'>): Title {
  return {
    type: 'movie',
    imdbRating: 8,
    runtimeMinutes: 120,
    genres: ['Drama'],
    languages: ['Hindi'],
    era: 'Recent (2021–2026)',
    moodTags: ['Other'],
    synopsis: '',
    posterSeed: overrides.id,
    ottAvailability: [],
    ...overrides,
  }
}

test('dev/demo: collapses live-pool duplicates that TMDB catalogued under two different ids (same name+year)', () => {
  // Reproduces a second production defect found live: "Animal" (2023) came back
  // from the edge function three times under three different tmdb ids, and
  // "Pathaan" (2023) twice — id-based dedup alone let them through.
  const livePool: Title[] = [
    fakeTitle({ id: 'tmdb-movie-1', name: 'Animal', year: 2023 }),
    fakeTitle({ id: 'tmdb-movie-2', name: 'Animal', year: 2023 }),
    fakeTitle({ id: 'tmdb-movie-3', name: 'Animal', year: 2023 }),
    fakeTitle({ id: 'tmdb-movie-4', name: 'Pathaan', year: 2023 }),
    fakeTitle({ id: 'tmdb-movie-5', name: 'Pathaan', year: 2023 }),
  ]

  const { pool } = ensurePoolSize(livePool, loosePrefs, loosePrefs, [], POOL_SIZE, true)

  assert.equal(pool.length, POOL_SIZE)
  const nameYearKeys = pool.map((t) => `${t.name.toLowerCase()}|${t.year}`)
  assert.equal(new Set(nameYearKeys).size, nameYearKeys.length, 'no two titles in the round should share a name+year')
})

test('dev/demo: reports shortOfTarget instead of silently under-filling once the catalogue itself is exhausted', () => {
  const { pool: allMock } = ensurePoolSize([], loosePrefs, loosePrefs, [], 1000, true)
  assert.ok(allMock.length < 1000, 'sanity check: the curated catalogue is finite')

  const { pool, shortOfTarget } = ensurePoolSize([], loosePrefs, loosePrefs, [], 1000, true)
  assert.equal(shortOfTarget, true)
  assert.equal(pool.length, allMock.length)
})

test('production (allowMockFallback=false): never uses MOCK_TITLES, even when the live pool is short or empty', () => {
  const { pool, paddedCount, usedMockFallback, shortOfTarget } = ensurePoolSize([], strictPrefs, strictPrefs, [], POOL_SIZE, false)

  assert.equal(pool.length, 0, 'no placeholder titles should be substituted in production')
  assert.equal(paddedCount, 0)
  assert.equal(usedMockFallback, false)
  assert.equal(shortOfTarget, true, 'a short pool must be reported, not disguised as a full one')
})

test('production (allowMockFallback=false): a full live pool passes through untouched', () => {
  const { pool: liveLikeTitles } = ensurePoolSize([], loosePrefs, loosePrefs, [], POOL_SIZE, true)
  const { pool, usedMockFallback, shortOfTarget } = ensurePoolSize(liveLikeTitles, loosePrefs, loosePrefs, [], POOL_SIZE, false)

  assert.equal(pool.length, POOL_SIZE)
  assert.equal(usedMockFallback, false)
  assert.equal(shortOfTarget, false)
  assert.deepEqual(
    pool.map((t) => t.id),
    liveLikeTitles.map((t) => t.id),
  )
})

test('production (allowMockFallback=false): a partially-short live pool is returned as-is, not padded', () => {
  const { pool: someLive } = ensurePoolSize([], loosePrefs, loosePrefs, [], 12, true)
  const { pool, paddedCount, usedMockFallback, shortOfTarget } = ensurePoolSize(someLive, loosePrefs, loosePrefs, [], POOL_SIZE, false)

  assert.equal(pool.length, 12, 'production keeps the honest (smaller) count instead of padding to POOL_SIZE')
  assert.equal(paddedCount, 0)
  assert.equal(usedMockFallback, false)
  assert.equal(shortOfTarget, true)
})
