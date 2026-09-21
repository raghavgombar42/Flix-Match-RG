import { supabase } from '../lib/supabaseClient'
import { MOCK_TITLES } from '../data/movies'
import type { PartnerPreferences, Title } from '../types'

/**
 * ------------------------------------------------------------------
 * TMDB — live, via a Supabase Edge Function proxy
 * ------------------------------------------------------------------
 * The TMDB Read Access Token must never reach the browser, so the actual
 * `api.themoviedb.org` calls happen server-side in
 * `supabase/functions/tmdb-pool/index.ts`. This module just invokes that
 * function and falls back to the local mock catalogue if the call fails
 * (offline, function not deployed, TMDB down, etc.) so swiping never
 * breaks the demo.
 *
 * Note: TMDB's `vote_average` (its own community score) is used as the
 * `imdbRating` field — TMDB has no public IMDb-score API. The two are
 * usually close but not identical; flagged here for anyone tightening
 * this up later.
 * ------------------------------------------------------------------
 */

const POOL_SIZE = 30

function matchesPreferences(title: Title, prefs: PartnerPreferences): boolean {
  if (prefs.contentType === 'movies' && title.type !== 'movie') return false
  if (title.imdbRating < prefs.minRating) return false

  const wantsAnyLanguage = prefs.languages.length === 0 || prefs.languages.includes('Any')
  if (!wantsAnyLanguage && !title.languages.some((lang) => prefs.languages.includes(lang))) {
    return false
  }

  const wantsAnyEra = prefs.eras.length === 0 || prefs.eras.includes('Any')
  if (!wantsAnyEra && !prefs.eras.includes(title.era)) {
    return false
  }

  return true
}

function moodScore(title: Title, prefsA: PartnerPreferences, prefsB: PartnerPreferences): number {
  const wantedMoods = new Set([...prefsA.moods, ...prefsB.moods])
  if (wantedMoods.size === 0) return 0
  return title.moodTags.reduce((score, tag) => (wantedMoods.has(tag) ? score + 1 : score), 0)
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items]
  let s = seed || 1
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function mockPool(prefsA: PartnerPreferences, prefsB: PartnerPreferences, excludeIds: string[]): Title[] {
  const excluded = new Set(excludeIds)
  const candidates = MOCK_TITLES.filter((title) => !excluded.has(title.id))

  const scored = candidates
    .map((title) => ({
      title,
      matches: matchesPreferences(title, prefsA) && matchesPreferences(title, prefsB),
      mood: moodScore(title, prefsA, prefsB),
    }))
    .sort((a, b) => Number(b.matches) - Number(a.matches) || b.mood - a.mood)

  const ranked = scored.map((entry) => entry.title)
  return ranked.length >= POOL_SIZE ? ranked.slice(0, POOL_SIZE) : ranked
}

export interface TitlePoolRequest {
  prefsA: PartnerPreferences
  prefsB: PartnerPreferences
  excludeIds?: string[]
  seed?: number
}

/** Live TMDB pool via the Edge Function, falling back to the local mock catalogue on any failure. */
export async function fetchTitlePool({ prefsA, prefsB, excludeIds = [], seed = 1 }: TitlePoolRequest): Promise<Title[]> {
  try {
    const { data, error } = await supabase.functions.invoke<{ titles: Title[] }>('tmdb-pool', {
      body: { prefsA, prefsB, excludeIds, poolSize: POOL_SIZE },
    })
    if (error) throw error
    if (data?.titles && data.titles.length > 0) return seededShuffle(data.titles, seed)
    // TMDB returned zero matches for this combo (very narrow filters) — mock catalogue as a backstop.
  } catch (err) {
    console.warn('[tmdbService] Live TMDB fetch failed, falling back to mock catalogue.', err)
  }
  return seededShuffle(mockPool(prefsA, prefsB, excludeIds), seed)
}

export function shuffleForPartner(titles: Title[], seed: number): Title[] {
  return seededShuffle(titles, seed)
}
