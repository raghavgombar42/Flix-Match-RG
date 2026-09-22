import { supabase } from '../lib/supabaseClient'
import { ensurePoolSize, seededShuffle } from './poolPadding.ts'
import type { PartnerPreferences, Title } from '../types'

/**
 * ------------------------------------------------------------------
 * TMDB — live, via a Supabase Edge Function proxy
 * ------------------------------------------------------------------
 * The TMDB Read Access Token must never reach the browser, so the actual
 * `api.themoviedb.org` calls happen server-side in
 * `supabase/functions/tmdb-pool/index.ts`. This module just invokes that
 * function. The edge function progressively relaxes overly-narrow filters
 * and casts an increasingly wide net across real TMDB data (see its own
 * comments) — that is the production fallback for a short round.
 *
 * MOCK_TITLES (the curated local catalogue, via `ensurePoolSize` in
 * `./poolPadding`) is a development/demo convenience only: it lets the app
 * work offline or with no TMDB token configured. `allowMockFallback` below
 * is tied to `import.meta.env.DEV`, so a production build never pads a
 * round — or backfills after a total TMDB failure — with placeholder
 * titles; it shows however many real titles it found.
 *
 * Note: TMDB's `vote_average` (its own community score) is used as the
 * `imdbRating` field — TMDB has no public IMDb-score API. The two are
 * usually close but not identical; flagged here for anyone tightening
 * this up later.
 * ------------------------------------------------------------------
 */

const POOL_SIZE = 30
const ALLOW_MOCK_FALLBACK = import.meta.env.DEV

export interface TitlePoolRequest {
  prefsA: PartnerPreferences
  prefsB: PartnerPreferences
  excludeIds?: string[]
  seed?: number
}

/** Live TMDB pool via the Edge Function. In dev/demo, a short or failed live result
 *  is padded (or entirely replaced) by the local curated catalogue so the app stays
 *  usable offline. In production that padding is disabled — see ALLOW_MOCK_FALLBACK
 *  — so the round reflects however many real titles the edge function's own
 *  progressive relaxation could find. */
export async function fetchTitlePool({ prefsA, prefsB, excludeIds = [], seed = 1 }: TitlePoolRequest): Promise<Title[]> {
  let livePool: Title[] = []
  try {
    const { data, error } = await supabase.functions.invoke<{ titles: Title[] }>('tmdb-pool', {
      body: { prefsA, prefsB, excludeIds, poolSize: POOL_SIZE },
    })
    if (error) throw error
    if (data?.titles) livePool = data.titles
  } catch (err) {
    console.warn('[tmdbService] Live TMDB fetch failed.', err)
  }

  const { pool, paddedCount, usedMockFallback, shortOfTarget } = ensurePoolSize(
    livePool,
    prefsA,
    prefsB,
    excludeIds,
    POOL_SIZE,
    ALLOW_MOCK_FALLBACK,
  )

  if (shortOfTarget) {
    if (ALLOW_MOCK_FALLBACK) {
      // Only reachable once the curated catalogue itself is exhausted (e.g. very
      // late in round 2, after both TMDB and the ~50-title mock catalogue are used up).
      console.error(
        `[tmdbService] Could not reach a full ${POOL_SIZE}-title round even after padding — only ${pool.length} distinct eligible titles were available.`,
      )
    } else {
      // Expected occasionally in production for very narrow combined preferences,
      // even after the edge function's own relaxation — the round is honestly
      // smaller rather than backfilled with placeholder titles.
      console.warn(
        `[tmdbService] Live TMDB returned only ${pool.length}/${POOL_SIZE} distinct titles for these filters after full relaxation — showing a smaller round instead of padding with placeholder titles.`,
      )
    }
  } else if (usedMockFallback) {
    console.info(
      `[tmdbService] Live pool only returned ${livePool.length}/${POOL_SIZE} eligible titles for these filters — padded with ${paddedCount} curated fallback titles (dev/demo only) to guarantee a full round.`,
    )
  }

  // Runtime assertion: in dev/demo, a normal round must never silently start with
  // fewer than POOL_SIZE distinct titles — the curated catalogue should always be
  // able to fill the gap, so falling short here means a real regression.
  if (shortOfTarget && ALLOW_MOCK_FALLBACK) {
    throw new Error(`[tmdbService] Pool invariant violated: expected ${POOL_SIZE} distinct titles, got ${pool.length}.`)
  }

  return seededShuffle(pool, seed)
}

export function shuffleForPartner(titles: Title[], seed: number): Title[] {
  return seededShuffle(titles, seed)
}
