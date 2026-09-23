import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rankOverlap } from './overlapRanking.ts'
import type { PartnerPreferences, Title } from '../types.ts'

const prefs = (overrides: Partial<PartnerPreferences> = {}): PartnerPreferences => ({
  moods: ['Light & fun'],
  moodNote: '',
  languages: ['Any'],
  contentType: 'movies',
  minRating: 6,
  eras: ['Any'],
  ...overrides,
})

function title(overrides: Partial<Title> & Pick<Title, 'id' | 'name' | 'imdbRating'>): Title {
  return {
    year: 2020,
    type: 'movie',
    runtimeMinutes: 120,
    genres: ['Drama'],
    languages: ['English'],
    era: 'Recent (2021–2026)',
    moodTags: ['Other'],
    synopsis: '',
    posterSeed: overrides.id,
    ottAvailability: [],
    ...overrides,
  }
}

test('ranks a higher-rated mutual title above a lower-rated one', () => {
  const a = title({ id: 'a', name: 'A', imdbRating: 6.0 })
  const b = title({ id: 'b', name: 'B', imdbRating: 8.5 })

  const ranked = rankOverlap([a, b], prefs(), prefs())

  assert.equal(ranked[0].title.id, 'b')
  assert.ok(ranked[0].score > ranked[1].score)
})

test('boosts a title that matches a shared mood over an equally-rated one that does not', () => {
  const matches = title({ id: 'match', name: 'Match', imdbRating: 7.0, moodTags: ['Light & fun'] })
  const noMatch = title({ id: 'no-match', name: 'No Match', imdbRating: 7.0, moodTags: ['Other'] })

  const ranked = rankOverlap([noMatch, matches], prefs({ moods: ['Light & fun'] }), prefs({ moods: ['Light & fun'] }))

  assert.equal(ranked[0].title.id, 'match')
  assert.ok(ranked[0].reasons.some((r) => r.toLowerCase().includes('mood')))
})

test('every ranked entry explains itself with at least "liked by both" and a rating reason', () => {
  const t = title({ id: 'x', name: 'X', imdbRating: 7.2 })
  const [ranked] = rankOverlap([t], prefs(), prefs())

  assert.ok(ranked.reasons.includes('Liked by both of you'))
  assert.ok(ranked.reasons.some((r) => r.includes('7.2')))
})

test('returns an empty ranking for an empty overlap, never throws', () => {
  assert.deepEqual(rankOverlap([], prefs(), prefs()), [])
})
