import { MOCK_TITLES } from '../data/movies.ts'
import type { PartnerPreferences, Title } from '../types.ts'

/**
 * Pure pool-shaping helpers, deliberately dependency-free (no Supabase client import)
 * so they can be unit tested directly with `node --test` — see poolPadding.test.ts.
 */

export function matchesPreferences(title: Title, prefs: PartnerPreferences): boolean {
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

export function moodScore(title: Title, prefsA: PartnerPreferences, prefsB: PartnerPreferences): number {
  const wantedMoods = new Set([...prefsA.moods, ...prefsB.moods])
  if (wantedMoods.size === 0) return 0
  return title.moodTags.reduce((score, tag) => (wantedMoods.has(tag) ? score + 1 : score), 0)
}

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items]
  let s = seed || 1
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Mock catalogue ranked by fit — best matches first, but every title is included
 *  (unlike the live TMDB path, this never hard-filters down to zero). */
export function rankMockCandidates(prefsA: PartnerPreferences, prefsB: PartnerPreferences, excludeIds: Set<string>): Title[] {
  return MOCK_TITLES.filter((title) => !excludeIds.has(title.id))
    .map((title) => ({
      title,
      matches: matchesPreferences(title, prefsA) && matchesPreferences(title, prefsB),
      mood: moodScore(title, prefsA, prefsB),
    }))
    .sort((a, b) => Number(b.matches) - Number(a.matches) || b.mood - a.mood)
    .map((entry) => entry.title)
}

export interface PoolPaddingResult {
  pool: Title[]
  paddedCount: number
  /** True only if the curated catalogue was used to fill this round — dev/demo only,
   *  see `allowMockFallback` below. Never true in a production build. */
  usedMockFallback: boolean
  /** True if the round has fewer than `poolSize` titles. With mock fallback allowed,
   *  this only happens once the curated catalogue itself is exhausted. With mock
   *  fallback disallowed (production), this can legitimately happen for very narrow
   *  preference combinations even after the edge function's own relaxation — the
   *  round is smaller, honestly, rather than padded with placeholder titles. */
  shortOfTarget: boolean
}

/**
 * Guarantees the product invariant "a normal round always has `poolSize` distinct
 * titles" in development/demo mode — see PRODUCT_REQUIREMENTS.md. `livePool` is
 * whatever the edge function (after its own server-side filter relaxation) managed
 * to find.
 *
 * `allowMockFallback` gates whether the curated local catalogue may be used to top
 * up a short live pool. The caller (tmdbService.ts) passes `import.meta.env.DEV` —
 * production never shows MOCK_TITLES, which are placeholder/demo data, not real
 * recommendations. In production a short live pool is returned as-is (deduped);
 * the edge function is the one responsible for maximizing real matches there.
 */
export function ensurePoolSize(
  livePool: Title[],
  prefsA: PartnerPreferences,
  prefsB: PartnerPreferences,
  excludeIds: string[],
  poolSize: number,
  allowMockFallback: boolean,
): PoolPaddingResult {
  // Dedupe the live pool defensively — by id (the edge function shouldn't emit
  // duplicate ids, but this invariant is cheap to enforce here too) and by
  // name+year, since TMDB occasionally catalogues the same real film under two
  // different ids, which id-based dedup alone would let through.
  const seenIds = new Set<string>()
  const seenNameYear = new Set<string>()
  const dedupedLive = livePool.filter((t) => {
    const nameYearKey = `${t.name.trim().toLowerCase()}|${t.year}`
    if (seenIds.has(t.id) || seenNameYear.has(nameYearKey)) return false
    seenIds.add(t.id)
    seenNameYear.add(nameYearKey)
    return true
  })

  if (dedupedLive.length >= poolSize) {
    return { pool: dedupedLive.slice(0, poolSize), paddedCount: 0, usedMockFallback: false, shortOfTarget: false }
  }

  if (!allowMockFallback) {
    return { pool: dedupedLive, paddedCount: 0, usedMockFallback: false, shortOfTarget: dedupedLive.length < poolSize }
  }

  const known = new Set([...excludeIds, ...dedupedLive.map((t) => t.id)])
  const padding = rankMockCandidates(prefsA, prefsB, known).filter(
    (t) => !seenNameYear.has(`${t.name.trim().toLowerCase()}|${t.year}`),
  )
  const needed = poolSize - dedupedLive.length
  const toAdd = padding.slice(0, needed)
  const pool = [...dedupedLive, ...toAdd]

  return { pool, paddedCount: toAdd.length, usedMockFallback: toAdd.length > 0, shortOfTarget: pool.length < poolSize }
}
