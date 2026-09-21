import type { PartnerPreferences, Title } from '../types'

/**
 * ------------------------------------------------------------------
 * FUTURE INTEGRATION POINT — Claude / Gemini
 * ------------------------------------------------------------------
 * These functions currently return locally-computed placeholders.
 * In the real build, both should call a server-side endpoint (never
 * the model API directly from the browser) that:
 *   1. `generateSearchBrief` — sends both partners' structured
 *      preferences plus free-text mood notes to the model and gets
 *      back a refined search brief (genres, tone, keywords) used to
 *      query TMDB.
 *   2. `refinePoolForRoundTwo` — sends both partners' round-one
 *      right-swipe lists to the model and gets back a refined brief
 *      that leans into what they actually liked.
 * ------------------------------------------------------------------
 */

export interface SearchBrief {
  summary: string
  keywords: string[]
  toneNotes: string[]
}

function extractKeywords(note: string): string[] {
  return note
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 5)
}

/** Mock stand-in for an AI call that merges two preference profiles into one brief. */
export async function generateSearchBrief(prefsA: PartnerPreferences, prefsB: PartnerPreferences): Promise<SearchBrief> {
  await new Promise((resolve) => setTimeout(resolve, 700))

  const sharedMoods = prefsA.moods.filter((mood) => prefsB.moods.includes(mood))
  const allMoods = Array.from(new Set([...prefsA.moods, ...prefsB.moods]))
  const keywords = Array.from(new Set([...extractKeywords(prefsA.moodNote), ...extractKeywords(prefsB.moodNote)]))

  const moodPhrase = sharedMoods.length > 0 ? sharedMoods.join(' and ') : allMoods.join(' or ') || 'something for everyone'

  return {
    summary: `Looking for ${moodPhrase.toLowerCase()} titles that satisfy both partners' language, era, and rating bars.`,
    keywords,
    toneNotes: [prefsA.moodNote, prefsB.moodNote].filter(Boolean),
  }
}

/** Mock stand-in for an AI call that reads round-one right-swipes and steers round two. */
export async function refinePoolForRoundTwo(likedTitles: Title[]): Promise<SearchBrief> {
  await new Promise((resolve) => setTimeout(resolve, 700))

  const genreCounts = new Map<string, number>()
  likedTitles.forEach((title) => {
    title.genres.forEach((genre) => genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1))
  })
  const topGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre]) => genre)

  return {
    summary:
      topGenres.length > 0
        ? `Both partners leaned toward ${topGenres.join(', ')} in round one — round two doubles down on that.`
        : 'No strong signal from round one yet — round two widens the net slightly.',
    keywords: topGenres,
    toneNotes: [],
  }
}
